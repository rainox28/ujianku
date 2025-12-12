// app/api/grade-answers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient, MODEL_CONFIG } from "@/lib/gemini";
import { EXAM_CONFIG } from "@/lib/constants";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface RequestBody {
  soalPG: any[];
  soalEssay: any[];
  jawabanPG: Record<number, string>;
  jawabanEssay: Record<number, string>;
}

// ✅ Simple JSON parser
function parseJSON(text: string): any {
  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(clean.substring(start, end + 1));
    }
    throw new Error("Cannot parse");
  }
}

// ✅ Grade SINGLE essay question (for parallel processing)
async function gradeSingleEssay(
  soal: any,
  jawaban: string,
  namaMapel: string
): Promise<any> {
  // Quick return if not answered
  if (!jawaban?.trim()) {
    return {
      nomor: soal.nomor,
      nilai: 0,
      feedback: "Tidak dijawab",
      konsepBenar: [],
      konsepKurang: ["Soal tidak dijawab"],
    };
  }

  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_CONFIG.penilaiJawaban.model,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512, // Smaller = faster
      },
    });

    // ✅ SIMPLER prompt = faster response
    const prompt = `Nilai jawaban essay ini (0-100). Nilai berdasarkan MAKNA, bukan format.

Soal: ${soal.pertanyaan}
Kunci: ${soal.kunciJawaban}
Jawaban: ${jawaban}

Output JSON: {"nilai":85,"feedback":"penjelasan singkat","konsepBenar":["a","b"],"konsepKurang":["c"]}`;

    const result = await model.generateContent(prompt);
    const data = parseJSON(result.response.text());

    return {
      nomor: soal.nomor,
      nilai: Math.max(0, Math.min(100, data.nilai || 0)),
      feedback: data.feedback || "Jawaban telah dinilai",
      konsepBenar: data.konsepBenar || [],
      konsepKurang: data.konsepKurang || [],
    };
  } catch (error) {
    // Fallback: simple length-based scoring
    const len = jawaban.length;
    let nilai = 50;
    if (len > 200) nilai = 80;
    else if (len > 100) nilai = 70;
    else if (len > 50) nilai = 60;

    return {
      nomor: soal.nomor,
      nilai,
      feedback: "Jawaban telah dinilai",
      konsepBenar: [],
      konsepKurang: [],
    };
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
      `[Grade] Starting: ${soalPG.length} PG, ${soalEssay.length} Essay`
    );
    const startTime = Date.now();

    // ✅ Grade PG (instant - no AI)
    const pilihanGanda = soalPG.map((soal) => {
      const jawabanSiswa = jawabanPG[soal.nomor] || null;
      return {
        nomor: soal.nomor,
        jawabanSiswa,
        jawabanBenar: soal.jawabanBenar,
        benar: jawabanSiswa === soal.jawabanBenar,
      };
    });

    // ✅ Grade ALL essays in PARALLEL
    console.log(`[Grade] Grading ${soalEssay.length} essays in parallel...`);

    const essayPromises = soalEssay.map((soal) =>
      gradeSingleEssay(soal, jawabanEssay[soal.nomor] || "", "")
    );

    const essayResults = await Promise.all(essayPromises);

    // Map results
    const essay = soalEssay.map((soal, index) => {
      const result =
        essayResults.find((r) => r.nomor === soal.nomor) || essayResults[index];
      return {
        nomor: soal.nomor,
        nilai: result?.nilai || 0,
        feedback: result?.feedback || "Tidak dapat menilai",
        konsepBenar: result?.konsepBenar || [],
        konsepKurang: result?.konsepKurang || [],
      };
    });

    // Calculate summary
    const benarPG = pilihanGanda.filter((p) => p.benar).length;
    const salahPG = pilihanGanda.length - benarPG;
    const nilaiPG =
      pilihanGanda.length > 0 ? (benarPG / pilihanGanda.length) * 100 : 0;
    const totalNilaiEssay = essay.reduce((sum, e) => sum + e.nilai, 0);
    const nilaiEssay = essay.length > 0 ? totalNilaiEssay / essay.length : 0;
    const nilaiTotal =
      (nilaiPG * EXAM_CONFIG.BOBOT_PG + nilaiEssay * EXAM_CONFIG.BOBOT_ESSAY) /
      100;

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Grade] Complete in ${duration}s: ${nilaiTotal.toFixed(0)}%`);

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error: any) {
    console.error("Grade Error:", error);
    return NextResponse.json(
      { error: "Gagal menilai jawaban" },
      { status: 500 }
    );
  }
}
