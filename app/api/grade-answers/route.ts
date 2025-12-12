// app/api/grade-answers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient, MODEL_CONFIG } from "@/lib/gemini";
import { EXAM_CONFIG } from "@/lib/constants";

export const maxDuration = 60; // Increased for AI grading
export const dynamic = "force-dynamic";

interface RequestBody {
  soalPG: any[];
  soalEssay: any[];
  jawabanPG: Record<number, string>;
  jawabanEssay: Record<number, string>;
}

// ✅ Semantic Essay Grading Prompt
function createSemanticGradingPrompt(
  soalEssay: any[],
  jawabanEssay: Record<number, string>
): string {
  const soalJawabanList = soalEssay
    .map((soal) => {
      const jawaban = jawabanEssay[soal.nomor] || "";
      return `
---
SOAL ${soal.nomor}:
Pertanyaan: ${soal.pertanyaan}

Kunci Jawaban (Konsep yang harus ada):
${soal.kunciJawaban}

${
  soal.poinPenilaian
    ? `Poin Penilaian:\n${soal.poinPenilaian
        .map((p: string, i: number) => `${i + 1}. ${p}`)
        .join("\n")}`
    : ""
}

Jawaban Siswa:
"${jawaban || "(tidak dijawab)"}"
---`;
    })
    .join("\n");

  return `Kamu adalah guru profesional yang menilai jawaban essay siswa dengan ADIL dan OBJEKTIF.

## PRINSIP PENILAIAN PENTING:

1. **NILAI BERDASARKAN MAKNA, BUKAN FORMAT**
   - Jika konsep/jawaban BENAR tapi format berbeda = TETAP NILAI TINGGI
   - Contoh: "Senin, Selasa, Rabu" SAMA BENARNYA dengan "Nama-nama hari adalah Senin, Selasa, dan Rabu"
   
2. **FLEKSIBILITAS FORMAT**
   - Daftar dengan koma (a, b, c) = sama dengan daftar bernomor (1. a, 2. b, 3. c)
   - Jawaban singkat tapi lengkap = sama baiknya dengan jawaban panjang berulang
   - Tidak perlu kalimat pembuka/penutup formal
   
3. **FOKUS PADA SUBSTANSI**
   - Apakah konsep kunci terjawab?
   - Apakah informasi yang diberikan benar?
   - Apakah tidak ada informasi yang salah?

4. **JANGAN MENGURANGI NILAI KARENA:**
   - Format penulisan berbeda
   - Tidak ada kalimat pembuka/penutup
   - Urutan penyebutan berbeda
   - Gaya bahasa kasual tapi benar

## SKALA NILAI:
- 90-100: Semua konsep kunci terjawab dengan benar
- 80-89: Hampir semua konsep benar, kekurangan minor
- 70-79: Sebagian besar konsep benar
- 60-69: Konsep dasar benar tapi kurang lengkap
- 50-59: Beberapa konsep benar, banyak yang kurang
- 30-49: Sedikit yang benar
- 0-29: Tidak menjawab atau jawaban tidak relevan

## SOAL DAN JAWABAN SISWA:
${soalJawabanList}

## OUTPUT FORMAT (JSON saja, tanpa markdown):
{
  "essay": [
    {
      "nomor": 1,
      "nilai": 85,
      "feedback": "Feedback yang konstruktif dan spesifik",
      "konsepBenar": ["konsep 1 yang sudah benar", "konsep 2"],
      "konsepKurang": ["konsep yang perlu ditambahkan (jika ada)"]
    }
  ]
}

PENTING:
- Buat feedback yang POSITIF dan MEMBANGUN
- Jika jawaban benar tapi format beda, APRESIASI jawabannya
- Sebutkan apa yang SUDAH BENAR sebelum yang kurang
- Output HANYA JSON, tanpa teks lain`;
}

// ✅ Parse AI response
function parseAIResponse(text: string): any {
  let clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {}

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    let jsonStr = clean.substring(firstBrace, lastBrace + 1);
    jsonStr = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    return JSON.parse(jsonStr);
  }

  throw new Error("Cannot parse JSON");
}

// ✅ Fallback grading (improved from length-based)
function fallbackEssayGrading(
  soalEssay: any[],
  jawabanEssay: Record<number, string>
) {
  return soalEssay.map((soal) => {
    const jawaban = (jawabanEssay[soal.nomor] || "").trim();

    if (!jawaban) {
      return {
        nomor: soal.nomor,
        nilai: 0,
        feedback: "Tidak dijawab. Coba jawab dengan pemahaman kamu sendiri.",
        konsepBenar: [],
        konsepKurang: ["Belum ada jawaban"],
      };
    }

    // Simple keyword matching as fallback
    const kunciLower = (soal.kunciJawaban || "").toLowerCase();
    const jawabanLower = jawaban.toLowerCase();

    // Extract keywords from kunci jawaban
    const keywords = kunciLower
      .split(/[,.\s]+/)
      .filter((w: string) => w.length > 3)
      .slice(0, 10);

    // Count matching keywords
    let matchCount = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      if (jawabanLower.includes(keyword)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }

    // Calculate score based on keyword match ratio
    const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;
    let nilai = Math.round(matchRatio * 100);

    // Bonus for longer answers (but capped)
    if (jawaban.length > 50 && nilai < 100) {
      nilai = Math.min(100, nilai + 10);
    }

    // Minimum score if answered
    nilai = Math.max(30, nilai);

    let feedback = "";
    if (nilai >= 80) {
      feedback = "Jawaban sudah baik dan mencakup poin-poin penting.";
    } else if (nilai >= 60) {
      feedback =
        "Jawaban cukup baik, namun bisa ditambahkan beberapa poin lagi.";
    } else {
      feedback = "Jawaban perlu dilengkapi dengan lebih banyak penjelasan.";
    }

    return {
      nomor: soal.nomor,
      nilai,
      feedback,
      konsepBenar: matchedKeywords.slice(0, 3),
      konsepKurang: [],
    };
  });
}

// ✅ AI-based semantic grading
async function gradeEssayWithAI(
  soalEssay: any[],
  jawabanEssay: Record<number, string>
): Promise<any[]> {
  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_CONFIG.penilaiJawaban.model,
      generationConfig: {
        temperature: 0.3, // Low temperature for consistent grading
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    });

    const prompt = createSemanticGradingPrompt(soalEssay, jawabanEssay);

    console.log("[Grade] Starting AI semantic grading...");
    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(
      `[Grade] AI grading done in ${((Date.now() - startTime) / 1000).toFixed(
        1
      )}s`
    );

    const parsed = parseAIResponse(text);

    if (!parsed.essay || !Array.isArray(parsed.essay)) {
      throw new Error("Invalid AI response structure");
    }

    // Validate and normalize scores
    return parsed.essay.map((e: any, i: number) => ({
      nomor: e.nomor || soalEssay[i]?.nomor || i + 1,
      nilai: Math.max(0, Math.min(100, e.nilai || 0)),
      feedback: e.feedback || "Tidak ada feedback",
      konsepBenar: e.konsepBenar || [],
      konsepKurang: e.konsepKurang || [],
    }));
  } catch (error: any) {
    console.error("[Grade] AI grading failed:", error.message);
    console.log("[Grade] Using fallback grading...");
    return fallbackEssayGrading(soalEssay, jawabanEssay);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { soalPG, soalEssay, jawabanPG, jawabanEssay } = body;

    if (!soalPG || !soalEssay) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    console.log(
      `\n[Grade] Starting: ${soalPG.length} PG, ${soalEssay.length} Essay`
    );

    // ✅ Grade PG (exact match - fast, no AI needed)
    const pilihanGanda = soalPG.map((soal) => {
      const jawabanSiswa = jawabanPG[soal.nomor] || null;
      const benar = jawabanSiswa === soal.jawabanBenar;
      return {
        nomor: soal.nomor,
        jawabanSiswa,
        jawabanBenar: soal.jawabanBenar,
        benar,
      };
    });

    // ✅ Grade Essay with AI semantic analysis
    const essayGraded = await gradeEssayWithAI(soalEssay, jawabanEssay);

    // Ensure we have results for all essays
    const essay = soalEssay.map((soal, index) => {
      const graded =
        essayGraded.find((e) => e.nomor === soal.nomor) || essayGraded[index];
      return {
        nomor: soal.nomor,
        nilai: graded?.nilai || 0,
        feedback: graded?.feedback || "Tidak dapat menilai",
        konsepBenar: graded?.konsepBenar || [],
        konsepKurang: graded?.konsepKurang || [],
      };
    });

    // Calculate summary
    const benarPG = pilihanGanda.filter((p) => p.benar).length;
    const salahPG = pilihanGanda.length - benarPG;
    const nilaiPG =
      pilihanGanda.length > 0 ? (benarPG / pilihanGanda.length) * 100 : 0;

    const totalNilaiEssay = essay.reduce((sum, e) => sum + e.nilai, 0);
    const nilaiEssay = essay.length > 0 ? totalNilaiEssay / essay.length : 0;

    // Weighted total score
    const nilaiTotal =
      (nilaiPG * EXAM_CONFIG.BOBOT_PG + nilaiEssay * EXAM_CONFIG.BOBOT_ESSAY) /
      100;

    const result = {
      pilihanGanda,
      essay,
      ringkasan: {
        benarPG,
        salahPG,
        nilaiPG: Math.round(nilaiPG * 100) / 100,
        nilaiEssay: Math.round(nilaiEssay * 100) / 100,
        nilaiTotal: Math.round(nilaiTotal * 100) / 100,
        status:
          nilaiTotal >= EXAM_CONFIG.PASSING_GRADE ? "LULUS" : "TIDAK_LULUS",
      },
    };

    console.log(
      `[Grade] Complete: ${result.ringkasan.nilaiTotal}% - ${result.ringkasan.status}`
    );
    console.log(
      `[Grade] Essay scores: ${essay.map((e) => e.nilai).join(", ")}`
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Grade Error:", error);
    return NextResponse.json(
      { error: "Gagal menilai jawaban" },
      { status: 500 }
    );
  }
}
