import type { GenerationConfig } from "@google/generative-ai";
import { createGeminiClient, MODEL_CONFIG } from "@/lib/gemini";
import type { GeneratedSoalEssay, GeneratedSoalPG } from "@/lib/gemini";
import { parseAIJson } from "./ai-json";
import type { HasilEssay, HasilPG, Penilaian } from "./grading";

export interface PembahasanPGItem {
  nomor: number;
  pembahasan: string;
  konsepTerkait: string;
  tips: string;
}

export interface PembahasanEssayItem {
  nomor: number;
  pembahasan: string;
  contohJawabanIdeal: string;
  konsepTerkait: string;
}

export interface Pembahasan {
  pilihanGanda: PembahasanPGItem[];
  essay: PembahasanEssayItem[];
  saranBelajar: string[];
}

const PG_BATCH_SIZE = 5;

function asList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const inner = (data as Record<string, unknown> | null)?.[key];
  return Array.isArray(inner) ? (inner as T[]) : [];
}

function reviewModel() {
  return createGeminiClient().getGenerativeModel({
    model: MODEL_CONFIG.pembahasanGenerator.model,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    } as GenerationConfig,
  });
}

async function reviewPGBatch(soalBatch: GeneratedSoalPG[], hasilBatch: HasilPG[]) {
  try {
    const soalList = soalBatch
      .map((s, i) => {
        const tanda = hasilBatch[i]?.benar ? "✓" : "✗";
        return `${s.nomor}.[${tanda}] ${s.pertanyaan} → Jawaban: ${s.jawabanBenar}. ${s.opsi[s.jawabanBenar]}`;
      })
      .join("\n");

    const prompt = `Buat pembahasan singkat untuk soal-soal ini:
${soalList}

Output JSON array: [{"nomor":1,"pembahasan":"...","konsepTerkait":"...","tips":"..."}]`;

    const data = parseAIJson((await reviewModel().generateContent(prompt)).response.text());
    return asList<PembahasanPGItem>(data, "pilihanGanda");
  } catch (error) {
    console.error("[Review] PG batch failed, using fallback:", error);
    return soalBatch.map((s, i) => ({
      nomor: s.nomor,
      pembahasan: hasilBatch[i]?.benar
        ? `Benar! Jawaban ${s.jawabanBenar} tepat.`
        : `Jawaban yang benar adalah ${s.jawabanBenar}.`,
      konsepTerkait: "Pelajari materi terkait",
      tips: hasilBatch[i]?.benar ? "Bagus!" : "Pelajari lagi",
    }));
  }
}

async function reviewEssay(soalEssay: GeneratedSoalEssay[], hasilEssay: HasilEssay[]) {
  try {
    const soalList = soalEssay
      .map((s, i) => `${s.nomor}. [${hasilEssay[i]?.nilai || 0}/100] ${s.pertanyaan}`)
      .join("\n");

    const prompt = `Buat pembahasan singkat untuk essay:
${soalList}

Output JSON array: [{"nomor":1,"pembahasan":"...","contohJawabanIdeal":"...","konsepTerkait":"..."}]`;

    const data = parseAIJson((await reviewModel().generateContent(prompt)).response.text());
    return asList<PembahasanEssayItem>(data, "essay");
  } catch (error) {
    console.error("[Review] Essay review failed, using fallback:", error);
    return soalEssay.map((s) => ({
      nomor: s.nomor,
      pembahasan: "Perhatikan poin-poin penting dalam kunci jawaban",
      contohJawabanIdeal: s.kunciJawaban || "Lihat kunci jawaban",
      konsepTerkait: "Pahami konsep dasar",
    }));
  }
}

function saranBelajar(nilaiTotal: number): string[] {
  if (nilaiTotal >= 85) {
    return ["Hasil sangat baik! Pertahankan.", "Coba latihan soal yang lebih menantang."];
  }
  if (nilaiTotal >= 70) {
    return ["Hasil baik! Terus berlatih.", "Fokus pada konsep yang masih kurang."];
  }
  return ["Jangan menyerah!", "Pelajari kembali materi dasar.", "Latihan rutin setiap hari."];
}

export async function generateReview(
  soalPG: GeneratedSoalPG[],
  soalEssay: GeneratedSoalEssay[],
  penilaian: Penilaian
): Promise<Pembahasan> {
  const pgBatches: Promise<PembahasanPGItem[]>[] = [];
  for (let i = 0; i < soalPG.length; i += PG_BATCH_SIZE) {
    pgBatches.push(
      reviewPGBatch(
        soalPG.slice(i, i + PG_BATCH_SIZE),
        penilaian.pilihanGanda.slice(i, i + PG_BATCH_SIZE)
      )
    );
  }

  const [essayReview, ...pgResults] = await Promise.all([
    reviewEssay(soalEssay, penilaian.essay),
    ...pgBatches,
  ]);

  // Results are matched to questions by position, so pad and renumber to the exam's length.
  let pilihanGanda = pgResults.flat();
  while (pilihanGanda.length < soalPG.length) {
    const i = pilihanGanda.length;
    const benar = penilaian.pilihanGanda[i]?.benar;
    pilihanGanda.push({
      nomor: i + 1,
      pembahasan: benar ? "Jawaban benar!" : `Jawaban yang benar adalah ${soalPG[i]?.jawabanBenar}`,
      konsepTerkait: "Materi terkait",
      tips: benar ? "Bagus!" : "Pelajari lagi",
    });
  }

  let essay = essayReview;
  while (essay.length < soalEssay.length) {
    const i = essay.length;
    essay.push({
      nomor: i + 1,
      pembahasan: penilaian.essay[i]?.feedback || "Perhatikan poin penting",
      contohJawabanIdeal: soalEssay[i]?.kunciJawaban || "Lihat kunci",
      konsepTerkait: "Konsep dasar",
    });
  }

  pilihanGanda = pilihanGanda.slice(0, soalPG.length).map((p, i) => ({ ...p, nomor: i + 1 }));
  essay = essay.slice(0, soalEssay.length).map((e, i) => ({ ...e, nomor: i + 1 }));

  return { pilihanGanda, essay, saranBelajar: saranBelajar(penilaian.ringkasan.nilaiTotal) };
}
