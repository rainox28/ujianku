import { randomInt } from "node:crypto";
import { SchemaType, type GenerationConfig, type Schema } from "@google/generative-ai";
import { createGeminiClient, MODEL_CONFIG } from "@/lib/gemini";
import type { GeneratedSoalEssay, GeneratedSoalPG, OpsiJawaban } from "@/lib/gemini";
import { createSoalEssayPrompt, createSoalPGBatchPrompt, PG_BATCH_FOCUS } from "@/lib/prompts";
import { parseAIJson } from "./ai-json";

const OPSI: OpsiJawaban[] = ["A", "B", "C", "D", "E"];
const PG_BATCH_SIZE = 10;
// Over-generate so validation and de-duplication still leave enough questions.
const PG_BUFFER = 1.5;

const pgSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      pertanyaan: { type: SchemaType.STRING },
      opsi: {
        type: SchemaType.OBJECT,
        properties: Object.fromEntries(OPSI.map((k) => [k, { type: SchemaType.STRING }])),
        required: OPSI,
      },
      jawabanBenar: { type: SchemaType.STRING, format: "enum", enum: OPSI },
    },
    required: ["pertanyaan", "opsi", "jawabanBenar"],
  },
};

const essaySchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      pertanyaan: { type: SchemaType.STRING },
      kunciJawaban: { type: SchemaType.STRING },
      poinPenilaian: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: ["pertanyaan", "kunciJawaban", "poinPenilaian"],
  },
};

// Thinking shares the maxOutputTokens budget, so the limit leaves room for both. With thinking
// off entirely, calculation questions came back with wrong answer keys.
const THINKING_BUDGET = 2048;
const VERIFY_THINKING_BUDGET = 4096;

function jsonModel(schema: Schema, maxOutputTokens: number, thinkingBudget = THINKING_BUDGET) {
  return createGeminiClient().getGenerativeModel({
    model: MODEL_CONFIG.soalGenerator.model,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: maxOutputTokens + thinkingBudget,
      responseMimeType: "application/json",
      responseSchema: schema,
      thinkingConfig: { thinkingBudget },
    } as GenerationConfig,
  });
}

async function generateJsonArray(
  label: string,
  schema: Schema,
  prompt: string,
  maxOutputTokens: number
): Promise<unknown[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await jsonModel(schema, maxOutputTokens).generateContent(prompt);
      const data = parseAIJson(result.response.text());
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error("Empty or non-array response");
    } catch (error) {
      console.error(`[${label}] attempt ${attempt} failed:`, error);
    }
  }
  return [];
}

function normalizeText(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function toPG(raw: unknown): GeneratedSoalPG | null {
  const q = raw as Partial<GeneratedSoalPG> | null;
  if (!q || typeof q.pertanyaan !== "string" || q.pertanyaan.trim().length < 10) return null;
  if (!q.jawabanBenar || !OPSI.includes(q.jawabanBenar)) return null;
  if (!q.opsi || typeof q.opsi !== "object") return null;

  const opsi = {} as Record<OpsiJawaban, string>;
  for (const k of OPSI) {
    const v = q.opsi[k];
    if (typeof v !== "string" || !v.trim()) return null;
    if (/^(opsi|pilihan|jawaban|option)\s*[a-e]?$/i.test(v.trim())) return null;
    opsi[k] = v.trim();
  }
  // Light normalisation only: "-4" and "4" are different options.
  const distinct = new Set(OPSI.map((k) => opsi[k].toLowerCase().replace(/\s+/g, " ")));
  if (distinct.size !== OPSI.length) return null;

  return { nomor: 0, pertanyaan: q.pertanyaan.trim(), opsi, jawabanBenar: q.jawabanBenar };
}

function toEssay(raw: unknown): GeneratedSoalEssay | null {
  const q = raw as Partial<GeneratedSoalEssay> | null;
  if (!q || typeof q.pertanyaan !== "string" || q.pertanyaan.trim().length < 15) return null;
  if (typeof q.kunciJawaban !== "string" || !q.kunciJawaban.trim()) return null;
  const poin = Array.isArray(q.poinPenilaian) ? q.poinPenilaian.map(String).filter(Boolean) : [];
  return {
    nomor: 0,
    pertanyaan: q.pertanyaan.trim(),
    kunciJawaban: q.kunciJawaban.trim(),
    poinPenilaian: poin.length ? poin : ["Pemahaman konsep", "Kelengkapan jawaban"],
  };
}

function wordSet(s: string) {
  return new Set(normalizeText(s).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / (a.size + b.size - shared);
}

/** Drops exact repeats and questions whose wording overlaps an earlier one almost entirely. */
export function dedupe<T extends { pertanyaan: string }>(items: T[], threshold = 0.8): T[] {
  const kept: { item: T; words: Set<string> }[] = [];
  for (const item of items) {
    const words = wordSet(item.pertanyaan);
    if (!kept.some((k) => jaccard(k.words, words) >= threshold)) kept.push({ item, words });
  }
  return kept.map((k) => k.item);
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Options such as "A dan B benar" or "semua benar" depend on their position and must not move.
const POSITIONAL_OPTION = /\b[A-E]\s*(dan|,|&|atau)\s*[A-E]\b|semua\s+(jawaban\s+)?(benar|salah)|tidak\s+ada\s+(jawaban\s+)?yang\s+benar|all of the above|none of the above/i;

/**
 * Re-letters options so the correct answers are spread evenly over A-E.
 * The model strongly favours some letters (C was 44% of keys, E under 3%).
 */
export function balanceAnswerKeys(questions: GeneratedSoalPG[]): GeneratedSoalPG[] {
  let targets: OpsiJawaban[] = [];
  return questions.map((q) => {
    if (OPSI.some((k) => POSITIONAL_OPTION.test(q.opsi[k]))) return q;

    if (targets.length === 0) targets = shuffled(OPSI);
    const target = targets.pop()!;

    const correct = q.opsi[q.jawabanBenar];
    const others = shuffled(OPSI.filter((k) => k !== q.jawabanBenar).map((k) => q.opsi[k]));
    const opsi = {} as Record<OpsiJawaban, string>;
    for (const k of OPSI) opsi[k] = k === target ? correct : others.pop()!;

    return { ...q, opsi, jawabanBenar: target };
  });
}

type Tagged = GeneratedSoalPG & { batch: number };

const verifySchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      i: { type: SchemaType.INTEGER },
      jawaban: { type: SchemaType.STRING, format: "enum", enum: [...OPSI, "X"] },
    },
    required: ["i", "jawaban"],
  },
};

/**
 * Has the model solve each question blind and keeps only those whose answer matches the key.
 * Spot checks found wrong keys on multi-step calculation questions even with thinking on.
 * If a verification call itself fails, that chunk is kept unverified rather than lost.
 */
async function verifyKeys(questions: Tagged[], jenjang: string, kelas: number): Promise<Tagged[]> {
  const chunks: Tagged[][] = [];
  for (let i = 0; i < questions.length; i += PG_BATCH_SIZE) {
    chunks.push(questions.slice(i, i + PG_BATCH_SIZE));
  }

  const results = await Promise.all(
    chunks.map(async (chunk, c) => {
      const list = chunk
        .map((q, i) => {
          const opsi = OPSI.map((k) => `${k}. ${q.opsi[k]}`).join("\n");
          return `[${i}] ${q.pertanyaan}\n${opsi}`;
        })
        .join("\n\n");
      const prompt = `Kerjakan soal pilihan ganda ${jenjang} kelas ${kelas} berikut dengan teliti. Hitung ulang setiap langkah.
Jawab dengan huruf opsi yang benar. Jawab "X" jika tidak ada opsi yang benar, lebih dari satu opsi benar, atau soalnya ambigu.

${list}

Output JSON array: [{"i":0,"jawaban":"A"}]`;

      try {
        const res = await jsonModel(verifySchema, 1024, VERIFY_THINKING_BUDGET).generateContent(prompt);
        const answers = parseAIJson(res.response.text()) as { i: number; jawaban: string }[];
        const byIndex = new Map(answers.map((a) => [a.i, a.jawaban]));
        const kept = chunk.filter((q, i) => byIndex.get(i) === q.jawabanBenar);
        if (kept.length < chunk.length) {
          console.log(`[Verify-${c + 1}] dropped ${chunk.length - kept.length}/${chunk.length}`);
        }
        return kept;
      } catch (error) {
        console.error(`[Verify-${c + 1}] failed, keeping chunk unverified:`, error);
        return chunk;
      }
    })
  );

  return results.flat();
}

/**
 * Takes questions round-robin from each batch so later batches (the harder ones) are not
 * always the ones cut, then restores batch order so topics stay grouped.
 */
function pickAcrossBatches(unique: Tagged[], count: number): GeneratedSoalPG[] {
  const batches = new Map<number, Tagged[]>();
  for (const q of unique) batches.set(q.batch, [...(batches.get(q.batch) ?? []), q]);

  const picked = new Set<Tagged>();
  for (let round = 0; picked.size < count; round++) {
    const before = picked.size;
    for (const list of batches.values()) {
      if (picked.size < count && list[round]) picked.add(list[round]);
    }
    if (picked.size === before) break;
  }
  return unique.filter((q) => picked.has(q)).map(({ nomor, pertanyaan, opsi, jawabanBenar }) => ({ nomor, pertanyaan, opsi, jawabanBenar }));
}

interface GenerateParams {
  jenjang: string;
  kelas: number;
  semester: number;
  namaMapel: string;
  jumlahPG: number;
  jumlahEssay: number;
}

export async function generateQuestions(params: GenerateParams) {
  const base = {
    jenjang: params.jenjang,
    kelas: params.kelas,
    semester: params.semester,
    namaMapel: params.namaMapel,
  };

  const target = Math.ceil(params.jumlahPG * PG_BUFFER);
  const batchCount = Math.ceil(target / PG_BATCH_SIZE);
  const pgBatches = Array.from({ length: batchCount }, (_, i) => {
    const jumlahSoal = Math.min(PG_BATCH_SIZE, target - i * PG_BATCH_SIZE);
    const prompt = createSoalPGBatchPrompt({
      ...base,
      jumlahSoal,
      batchIndex: i,
      batchCount,
      fokus: PG_BATCH_FOCUS[i % PG_BATCH_FOCUS.length],
    });
    return generateJsonArray(`PG-${i + 1}`, pgSchema, prompt, 8192);
  });

  const essayPrompt = createSoalEssayPrompt({
    ...base,
    jumlahSoal: params.jumlahEssay + 1,
  });

  const [essayRaw, ...pgRaw] = await Promise.all([
    generateJsonArray("Essay", essaySchema, essayPrompt, 4096),
    ...pgBatches,
  ]);

  const parsedPG: Tagged[] = pgRaw.flatMap((batch, i) =>
    batch
      .map(toPG)
      .filter((q): q is GeneratedSoalPG => q !== null)
      .map((q) => ({ ...q, batch: i }))
  );
  const uniquePG = dedupe(parsedPG);
  const verifiedPG = await verifyKeys(uniquePG, params.jenjang, params.kelas);
  const pilihanGanda = balanceAnswerKeys(pickAcrossBatches(verifiedPG, params.jumlahPG)).map(
    (q, i) => ({ ...q, nomor: i + 1 })
  );

  const parsedEssay = essayRaw.map(toEssay).filter((q): q is GeneratedSoalEssay => q !== null);
  const essay = dedupe(parsedEssay)
    .slice(0, params.jumlahEssay)
    .map((q, i) => ({ ...q, nomor: i + 1 }));

  console.log(
    `[Generate] ${params.namaMapel}: PG ${pilihanGanda.length}/${params.jumlahPG} ` +
      `(raw ${pgRaw.flat().length}, valid ${parsedPG.length}, unique ${uniquePG.length}, ` +
      `verified ${verifiedPG.length}), ` +
      `Essay ${essay.length}/${params.jumlahEssay}`
  );

  return { pilihanGanda, essay };
}
