// app/api/generate-review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient, MODEL_CONFIG } from "@/lib/gemini";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface RequestBody {
  soalPG: any[];
  soalEssay: any[];
  hasilPenilaian: any;
}

// Fallback jika AI gagal
function generateLocalReview(
  soalPG: any[],
  soalEssay: any[],
  hasilPenilaian: any
) {
  const pilihanGanda = soalPG.map((soal, index) => {
    const hasil = hasilPenilaian.pilihanGanda?.[index];
    const benar = hasil?.benar ?? false;
    return {
      nomor: soal.nomor,
      pembahasan: benar
        ? `Jawaban ${soal.jawabanBenar} benar.`
        : `Jawaban yang benar adalah ${soal.jawabanBenar}.`,
      konsepTerkait: "Pelajari materi terkait.",
      tips: benar ? "Bagus!" : "Latihan lagi.",
    };
  });

  const essay = soalEssay.map((soal) => ({
    nomor: soal.nomor,
    pembahasan: "Perhatikan struktur jawaban.",
    contohJawabanIdeal: soal.kunciJawaban || "Jawaban lengkap.",
    konsepTerkait: "Pahami konsep dasar.",
  }));

  const nilaiTotal = hasilPenilaian.ringkasan?.nilaiTotal ?? 0;
  return {
    pilihanGanda,
    essay,
    saranBelajar:
      nilaiTotal >= 70
        ? ["Hasil bagus!", "Terus berlatih."]
        : ["Pelajari kembali.", "Latihan rutin."],
  };
}

// Better JSON parser
function parseJSON(text: string): any {
  let clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Try direct parse
  try {
    return JSON.parse(clean);
  } catch (e) {}

  // Find JSON boundaries
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start !== -1 && end > start) {
    let jsonStr = clean.substring(start, end + 1);

    // Fix common issues
    jsonStr = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

    try {
      return JSON.parse(jsonStr);
    } catch (e) {}
  }

  throw new Error("Cannot parse JSON");
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { soalPG, soalEssay, hasilPenilaian } = body;

    if (!soalPG || !soalEssay || !hasilPenilaian) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const totalPG = soalPG.length;
    const totalEssay = soalEssay.length;
    const nilaiTotal = hasilPenilaian.ringkasan?.nilaiTotal ?? 0;
    const benarPG = hasilPenilaian.ringkasan?.benarPG ?? 0;

    console.log(`Generating AI review: ${totalPG} PG, ${totalEssay} Essay`);

    let result;

    try {
      const genAI = createGeminiClient();
      const model = genAI.getGenerativeModel({
        model: MODEL_CONFIG.pembahasanGenerator.model,
        generationConfig: {
          temperature: 0.5, // Lower = more consistent output
          topP: 0.8,
          maxOutputTokens: 8192,
        },
      });

      // ✅ CLEANER PROMPT - AI returns valid JSON
      const prompt = `Kamu guru profesional. Buat pembahasan singkat untuk setiap soal ujian.

DATA:
- Benar: ${benarPG}/${totalPG} PG
- Nilai: ${nilaiTotal}%

SOAL PG:
${soalPG
  .map((s, i) => {
    const hasil = hasilPenilaian.pilihanGanda?.[i];
    const status = hasil?.benar ? "BENAR" : "SALAH";
    return `${s.nomor}. [${status}] Jawaban: ${s.jawabanBenar}`;
  })
  .join("\n")}

SOAL ESSAY (${totalEssay} soal):
${soalEssay
  .map((s) => `${s.nomor}. ${s.pertanyaan.substring(0, 50)}...`)
  .join("\n")}

INSTRUKSI:
Buat pembahasan dalam format JSON. JANGAN gunakan markdown code block.
Setiap pembahasan maksimal 2 kalimat.

FORMAT JSON YANG DIINGINKAN:
{
  "pilihanGanda": [
    {"nomor": 1, "pembahasan": "Penjelasan singkat.", "konsepTerkait": "Konsep X", "tips": "Tips belajar"}
  ],
  "essay": [
    {"nomor": 1, "pembahasan": "Penjelasan.", "contohJawabanIdeal": "Contoh jawaban.", "konsepTerkait": "Konsep Y"}
  ],
  "saranBelajar": ["Saran 1", "Saran 2", "Saran 3"]
}

Buat tepat ${totalPG} item pilihanGanda dan ${totalEssay} item essay.
Output HANYA JSON, tanpa teks lain sebelum atau sesudahnya.`;

      console.log("Calling Gemini AI...");
      const startTime = Date.now();

      const aiResult = await model.generateContent(prompt);
      const response = await aiResult.response;
      const text = response.text();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`AI response in ${duration}s: ${text.length} chars`);

      result = parseJSON(text);
      console.log(
        `✅ AI review parsed: ${result.pilihanGanda?.length} PG, ${result.essay?.length} Essay`
      );
    } catch (aiError: any) {
      console.log(`❌ AI failed: ${aiError.message} - Using fallback`);
      result = generateLocalReview(soalPG, soalEssay, hasilPenilaian);
    }

    // Ensure complete data
    if (!result.pilihanGanda) result.pilihanGanda = [];
    if (!result.essay) result.essay = [];
    if (!result.saranBelajar) result.saranBelajar = [];

    // Fill missing items
    while (result.pilihanGanda.length < totalPG) {
      const i = result.pilihanGanda.length;
      const benar = hasilPenilaian.pilihanGanda?.[i]?.benar;
      result.pilihanGanda.push({
        nomor: i + 1,
        pembahasan: benar
          ? `Jawaban ${soalPG[i]?.jawabanBenar} benar.`
          : `Jawaban yang benar adalah ${soalPG[i]?.jawabanBenar}.`,
        konsepTerkait: "Materi terkait.",
        tips: benar ? "Bagus!" : "Pelajari lagi.",
      });
    }

    while (result.essay.length < totalEssay) {
      const i = result.essay.length;
      result.essay.push({
        nomor: i + 1,
        pembahasan: "Perhatikan struktur jawaban.",
        contohJawabanIdeal: soalEssay[i]?.kunciJawaban || "Jawaban lengkap.",
        konsepTerkait: "Konsep dasar.",
      });
    }

    if (result.saranBelajar.length === 0) {
      result.saranBelajar =
        nilaiTotal >= 70
          ? ["Pertahankan hasil bagus!", "Terus berlatih."]
          : ["Pelajari kembali materi.", "Latihan rutin.", "Jangan menyerah!"];
    }

    // Normalize numbering
    result.pilihanGanda = result.pilihanGanda
      .slice(0, totalPG)
      .map((p: any, i: number) => ({ ...p, nomor: i + 1 }));
    result.essay = result.essay
      .slice(0, totalEssay)
      .map((e: any, i: number) => ({ ...e, nomor: i + 1 }));

    console.log("Review complete ✓");
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Review Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat pembahasan" },
      { status: 500 }
    );
  }
}
