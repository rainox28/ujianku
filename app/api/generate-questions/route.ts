// app/api/generate-questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient, MODEL_CONFIG } from "@/lib/gemini";
import { auth } from "@/lib/auth";
import { createExam, toPublicExam } from "@/lib/exam/store";
import { LIMITS, limitCaller, rateLimit } from "@/lib/rate-limit";
import { createSoalPGBatchPrompt, createSoalEssayPrompt } from "@/lib/prompts";
import { MATA_PELAJARAN, EXAM_CONFIG, KELAS_BY_JENJANG } from "@/lib/constants";
import type { Jenjang } from "@/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

interface RequestBody {
  jenjang: string;
  kelas: number;
  semester: number;
  mataPelajaran: string;
  jumlahSoalPG?: number;
  jumlahSoalEssay?: number;
}

// ✅ IMPROVED JSON Parser - Handle more edge cases
function parseAIResponse(text: string): any {
  // Log raw response for debugging (first 500 chars)
  console.log("[Parse] Raw response preview:", text.substring(0, 300));

  // Step 1: Clean markdown and whitespace
  let clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .replace(/^\s*[\r\n]+/gm, "") // Remove empty lines
    .trim();

  // Step 2: Try direct parse
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.log("[Parse] Direct parse failed, cleaning...");
  }

  // Step 3: Find JSON boundaries
  const firstBracket = clean.indexOf("[");
  const lastBracket = clean.lastIndexOf("]");
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  let jsonStr = "";

  // Prefer array format
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    jsonStr = clean.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = clean.substring(firstBrace, lastBrace + 1);
  } else {
    throw new Error("No JSON structure found");
  }

  // Step 4: Aggressive cleanup
  jsonStr = jsonStr
    // Fix trailing commas
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    // Fix newlines in strings
    .replace(/\n/g, " ")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    // Fix unescaped quotes in strings (common AI error)
    .replace(/([^\\])(")(.*?)([^\\])(")/g, (match, p1, p2, p3, p4, p5) => {
      // This is a simplification - might need more sophisticated handling
      return match;
    })
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, " ")
    // Fix multiple spaces
    .replace(/\s+/g, " ");

  // Step 5: Try parse again
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log("[Parse] Cleaned parse failed, trying recovery...");
  }

  // Step 6: Try to extract individual objects (last resort for arrays)
  if (jsonStr.startsWith("[")) {
    try {
      const objects: any[] = [];
      const regex = /\{[^{}]*\}/g;
      let match;

      while ((match = regex.exec(jsonStr)) !== null) {
        try {
          const obj = JSON.parse(match[0]);
          if (obj.nomor && obj.pertanyaan) {
            objects.push(obj);
          }
        } catch {}
      }

      if (objects.length > 0) {
        console.log(`[Parse] Recovered ${objects.length} objects`);
        return objects;
      }
    } catch {}
  }

  throw new Error("Cannot parse JSON after all attempts");
}

// ✅ IMPROVED Validation - Accept more question types
function validatePGQuestion(q: any): { valid: boolean; reason?: string } {
  if (!q?.pertanyaan || !q?.opsi || !q?.jawabanBenar) {
    return { valid: false, reason: "Missing required fields" };
  }
  if (!q.opsi.A || !q.opsi.B || !q.opsi.C || !q.opsi.D || !q.opsi.E) {
    return { valid: false, reason: "Incomplete options" };
  }
  if (!['A', 'B', 'C', 'D', 'E'].includes(q.jawabanBenar)) {
    return { valid: false, reason: "Invalid answer key" };
  }
  
  const p = q.pertanyaan.trim();
  if (p.length < 10) {
    return { valid: false, reason: "Question too short" };
  }
  
  // ✅ Check for various question types
  const hasQuestionMark = p.includes('?');
  
  // Traditional question words (Indonesian & English)
  const hasQuestionWord = /\b(apa|siapa|kapan|dimana|di mana|mengapa|bagaimana|berapa|manakah|what|who|when|where|why|how|which)\b/i.test(p);
  
  // Command/instruction words
  const hasCommandWord = /\b(sebutkan|jelaskan|tuliskan|tentukan|hitunglah|pilihlah|lengkapi|choose|select|identify|determine|find|complete|fill)\b/i.test(p);
  
  // Statement questions (adalah/merupakan/termasuk patterns)
  const hasStatementQuestion = /\b(adalah|merupakan|termasuk|yang benar|yang tepat|yang salah|yang bukan|kecuali|the correct|the right|the wrong|except)\b/i.test(p);
  
  // ✅ NEW: Fill-in-the-blank patterns (underscores, blanks, dots)
  const hasFillBlank = /_{2,}|\.{3,}|\(\s*\.\.\.\s*\)|\[\s*\.\.\.\s*\]|<blank>|\(blank\)/i.test(p);
  
  // ✅ NEW: Conditional/completion sentence patterns
  const hasCompletionPattern = /\b(if|when|after|before|because|although|complete the|lengkapi kalimat|fill in)\b/i.test(p);
  
  // ✅ Valid if ANY of these patterns exist
  const isValidQuestion = hasQuestionMark || 
                          hasQuestionWord || 
                          hasCommandWord || 
                          hasStatementQuestion || 
                          hasFillBlank || 
                          hasCompletionPattern;
  
  if (!isValidQuestion) {
    return { valid: false, reason: "No question indicator" };
  }

  // Check for placeholder/dummy content
  const opsiValues = Object.values(q.opsi) as string[];
  for (const opsi of opsiValues) {
    const cleaned = opsi.toString().trim().toLowerCase();
    if (cleaned.length < 1 || /^(opsi|pilihan|jawaban|option)\s*[a-e]?$/i.test(cleaned)) {
      return { valid: false, reason: "Placeholder option" };
    }
  }

  return { valid: true };
}

function validateEssayQuestion(q: any): { valid: boolean; reason?: string } {
  if (!q?.pertanyaan || !q?.kunciJawaban) {
    return { valid: false, reason: "Missing required fields" };
  }
  if (q.pertanyaan.length < 15) {
    return { valid: false, reason: "Question too short" };
  }
  return { valid: true };
}

// ✅ Generate PG batch with single retry
async function generatePGBatch(params: {
  jenjang: string;
  kelas: number;
  semester: number;
  namaMapel: string;
  batchNumber: number;
  jumlahSoal: number;
  startNomor: number;
}): Promise<any[]> {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const genAI = createGeminiClient();
      const model = genAI.getGenerativeModel({
        model: MODEL_CONFIG.soalGenerator.model,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 4096,
        },
      });

      const prompt = createSoalPGBatchPrompt(params);

      console.log(`[PG-${params.batchNumber}] Attempt ${attempt}...`);
      const startTime = Date.now();

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      console.log(
        `[PG-${params.batchNumber}] Response in ${(
          (Date.now() - startTime) /
          1000
        ).toFixed(1)}s`
      );

      const data = parseAIResponse(text);
      const questions = Array.isArray(data) ? data : data.pilihanGanda || [];

      if (questions.length === 0) {
        throw new Error("No questions parsed");
      }

      return questions.map((q: any, i: number) => ({
        ...q,
        nomor: params.startNomor + i,
      }));
    } catch (error: any) {
      console.error(
        `[PG-${params.batchNumber}] Attempt ${attempt} failed:`,
        error.message
      );
      if (attempt === maxAttempts) {
        return []; // Return empty, don't throw
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return [];
}

// ✅ Generate Essay with fallback to individual generation
async function generateEssay(params: {
  jenjang: string;
  kelas: number;
  semester: number;
  namaMapel: string;
  jumlahSoal: number;
}): Promise<any[]> {
  // Try batch generation first
  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_CONFIG.soalGenerator.model,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });

    const prompt = createSoalEssayPrompt(params);

    console.log(`[Essay] Generating ${params.jumlahSoal} questions...`);
    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log(
      `[Essay] Response in ${((Date.now() - startTime) / 1000).toFixed(1)}s`
    );

    const data = parseAIResponse(text);
    const questions = Array.isArray(data) ? data : data.essay || [];

    if (questions.length >= params.jumlahSoal - 1) {
      return questions.map((q: any, i: number) => ({
        ...q,
        nomor: i + 1,
        poinPenilaian: q.poinPenilaian || [
          "Pemahaman konsep",
          "Kelengkapan jawaban",
        ],
      }));
    }

    throw new Error(`Only got ${questions.length} questions`);
  } catch (error: any) {
    console.error(`[Essay] Batch failed:`, error.message);
  }

  // ✅ Fallback: Generate one by one
  console.log(`[Essay] Trying individual generation...`);
  const results: any[] = [];

  for (let i = 0; i < params.jumlahSoal; i++) {
    try {
      const genAI = createGeminiClient();
      const model = genAI.getGenerativeModel({
        model: MODEL_CONFIG.soalGenerator.model,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const prompt = `Buat 1 soal essay ${params.namaMapel} untuk ${
        params.jenjang
      } kelas ${params.kelas}.

Output JSON: {"nomor":${
        i + 1
      },"pertanyaan":"...","kunciJawaban":"...","poinPenilaian":["...",".."]}

Hanya output JSON, tanpa teks lain.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = parseAIResponse(text);

      const q = Array.isArray(data) ? data[0] : data;
      if (q?.pertanyaan && q?.kunciJawaban) {
        results.push({
          nomor: i + 1,
          pertanyaan: q.pertanyaan,
          kunciJawaban: q.kunciJawaban,
          poinPenilaian: q.poinPenilaian || [
            "Pemahaman konsep",
            "Kelengkapan jawaban",
          ],
        });
        console.log(`[Essay] Got question ${i + 1}`);
      }
    } catch (e: any) {
      console.error(`[Essay] Question ${i + 1} failed:`, e.message);
    }
  }

  return results;
}

// ✅ Fallback essay generator (no AI)
function generateFallbackEssay(params: {
  namaMapel: string;
  jenjang: string;
  kelas: number;
  jumlahSoal: number;
}): any[] {
  const templates = [
    {
      pertanyaan: `Jelaskan pengertian dan contoh penerapan konsep dasar ${params.namaMapel} dalam kehidupan sehari-hari!`,
      kunciJawaban: `Pengertian konsep dasar, contoh penerapan nyata, dan manfaatnya`,
    },
    {
      pertanyaan: `Sebutkan dan jelaskan minimal 3 komponen penting dalam ${params.namaMapel}!`,
      kunciJawaban: `Menyebutkan 3 komponen, menjelaskan fungsi masing-masing`,
    },
    {
      pertanyaan: `Bagaimana cara menerapkan pengetahuan ${params.namaMapel} untuk menyelesaikan masalah di lingkungan sekitar?`,
      kunciJawaban: `Identifikasi masalah, penerapan konsep, solusi yang ditawarkan`,
    },
    {
      pertanyaan: `Bandingkan dan berikan analisis tentang dua konsep utama dalam ${params.namaMapel}!`,
      kunciJawaban: `Persamaan, perbedaan, dan analisis kelebihan/kekurangan`,
    },
    {
      pertanyaan: `Uraikan proses atau tahapan penting yang harus dipahami dalam mempelajari ${params.namaMapel}!`,
      kunciJawaban: `Tahapan lengkap, penjelasan setiap tahap, hasil akhir yang diharapkan`,
    },
  ];

  return templates.slice(0, params.jumlahSoal).map((t, i) => ({
    nomor: i + 1,
    pertanyaan: t.pertanyaan,
    kunciJawaban: t.kunciJawaban,
    poinPenilaian: [
      "Pemahaman konsep",
      "Kelengkapan jawaban",
      "Penggunaan bahasa yang baik",
    ],
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      jenjang,
      kelas,
      semester,
      mataPelajaran,
      jumlahSoalPG = EXAM_CONFIG.DEFAULT_SOAL_PG,
      jumlahSoalEssay = EXAM_CONFIG.DEFAULT_SOAL_ESSAY,
    } = body;

    if (!jenjang || !kelas || !semester || !mataPelajaran) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const kelasValid = KELAS_BY_JENJANG[jenjang as Jenjang]?.includes(Number(kelas));
    if (!kelasValid || ![1, 2].includes(Number(semester))) {
      return NextResponse.json(
        { error: "Jenjang, kelas, atau semester tidak valid" },
        { status: 400 }
      );
    }

    const mapelInfo = MATA_PELAJARAN.find(
      (m) => m.id === mataPelajaran && m.tersediaUntuk.includes(jenjang as Jenjang)
    );
    if (!mapelInfo) {
      return NextResponse.json(
        { error: "Mata pelajaran tidak valid" },
        { status: 400 }
      );
    }

    const session = await auth();
    const limited =
      (await limitCaller(request, "generate", session?.user?.id)) ??
      (await rateLimit("generate:global", LIMITS.generateGlobal));
    if (limited) return limited;

    const finalPGCount = Math.max(
      EXAM_CONFIG.MIN_SOAL_PG,
      Math.min(EXAM_CONFIG.MAX_SOAL_PG, Number(jumlahSoalPG) || EXAM_CONFIG.DEFAULT_SOAL_PG)
    );
    const finalEssayCount = Math.max(
      EXAM_CONFIG.MIN_SOAL_ESSAY,
      Math.min(EXAM_CONFIG.MAX_SOAL_ESSAY, Number(jumlahSoalEssay) || EXAM_CONFIG.DEFAULT_SOAL_ESSAY)
    );

    console.log(`\n${"=".repeat(50)}`);
    console.log(`Generating: ${jenjang} Kelas ${kelas} - ${mapelInfo.nama}`);
    console.log(`Target: ${finalPGCount} PG + ${finalEssayCount} Essay`);
    console.log(`${"=".repeat(50)}\n`);

    const startTime = Date.now();

    // ✅ Calculate buffer based on target (minimum 30% extra)
    const bufferMultiplier = 1.5; // 50% extra
    const targetWithBuffer = Math.ceil(finalPGCount * bufferMultiplier);

    // ✅ Split PG into smaller batches (max 10 per batch)
    const batchSize = 10;
    const pgBatches: Promise<any[]>[] = [];

  let remaining = targetWithBuffer;
    let startNomor = 1;
    let batchNum = 1;

    while (remaining > 0) {
      const count = Math.min(batchSize, remaining);
      pgBatches.push(
        generatePGBatch({
          jenjang,
          kelas,
          semester,
          namaMapel: mapelInfo.nama,
          batchNumber: batchNum,
          jumlahSoal: count,
          startNomor,
        })
      );
      remaining -= count;
      startNomor += count;
      batchNum++;
    }

    // ✅ Run PG and Essay in parallel
    console.log(
      `🚀 Starting ${pgBatches.length} PG batches + Essay generation`
    );

    const essayPromise = generateEssay({
      jenjang,
      kelas,
      semester,
      namaMapel: mapelInfo.nama,
      jumlahSoal: finalEssayCount,
    });

    const [essayResults, ...pgBatchResults] = await Promise.all([
      essayPromise,
      ...pgBatches,
    ]);

    // Combine and validate PG
    let allPG: any[] = [];
    let invalidPG = 0;

    for (const batch of pgBatchResults) {
      for (const q of batch) {
        const v = validatePGQuestion(q);
        if (v.valid) {
          allPG.push(q);
        } else {
          invalidPG++;
          console.log(
            `❌ Invalid PG: ${v.reason} - "${q.pertanyaan?.substring(
              0,
              50
            )}..."`
          );
        }
      }
    }

    // Validate Essay
    let allEssay: any[] = [];
    for (const q of essayResults) {
      const v = validateEssayQuestion(q);
      if (v.valid) {
        allEssay.push(q);
      } else {
        console.log(`❌ Invalid Essay: ${v.reason}`);
      }
    }

    // ✅ Use fallback if essay failed
    if (allEssay.length < finalEssayCount) {
      console.log(
        `[Essay] Using fallback generator (got ${allEssay.length}/${finalEssayCount})`
      );
      const fallback = generateFallbackEssay({
        namaMapel: mapelInfo.nama,
        jenjang,
        kelas,
        jumlahSoal: finalEssayCount - allEssay.length,
      });
      // Renumber fallback
      fallback.forEach((q, i) => {
        q.nomor = allEssay.length + i + 1;
      });
      allEssay = [...allEssay, ...fallback];
    }

    // Final selection
    const validPG = allPG
      .slice(0, finalPGCount)
      .map((q, i) => ({ ...q, nomor: i + 1 }));
    const validEssay = allEssay
      .slice(0, finalEssayCount)
      .map((q, i) => ({ ...q, nomor: i + 1 }));

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ Complete in ${totalDuration}s`);
    console.log(
      `   PG: ${validPG.length}/${finalPGCount} (${invalidPG} invalid)`
    );
    console.log(`   Essay: ${validEssay.length}/${finalEssayCount}`);
    console.log(`${"=".repeat(50)}\n`);

    // Check minimum requirements
    if (validPG.length < EXAM_CONFIG.MIN_SOAL_PG) {
      return NextResponse.json(
        {
          error: `Hanya ${validPG.length} soal PG berhasil dibuat. Coba lagi.`,
        },
        { status: 500 }
      );
    }

    const exam = await createExam({
      userId: session?.user?.id ?? null,
      jenjang,
      kelas: Number(kelas),
      semester: Number(semester),
      mataPelajaran: mapelInfo.nama,
      soalPG: validPG,
      soalEssay: validEssay,
    });

    // Answer keys stay in the database; the client only gets the questions.
    return NextResponse.json({ success: true, data: toPublicExam(exam) });
  } catch (error: any) {
    console.error("Generate Error:", error);
    return NextResponse.json(
      { error: `Gagal membuat soal: ${error.message}` },
      { status: 500 }
    );
  }
}
