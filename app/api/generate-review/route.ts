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

// Better JSON parser
function parseJSON(text: string): any {
  let clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {}

  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start !== -1 && end > start) {
    let jsonStr = clean.substring(start, end + 1);
    jsonStr = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    return JSON.parse(jsonStr);
  }

  throw new Error("Cannot parse JSON");
}

// Fallback review generator
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
        ? `Jawaban ${soal.jawabanBenar} adalah benar. ${
            soal.opsi[soal.jawabanBenar]
          }.`
        : `Jawaban yang benar adalah ${soal.jawabanBenar}: ${
            soal.opsi[soal.jawabanBenar]
          }.`,
      konsepTerkait: "Pelajari materi terkait di buku paket.",
      tips: benar ? "Pertahankan pemahamanmu!" : "Pelajari lagi konsep ini.",
    };
  });

  const essay = soalEssay.map((soal, index) => {
    const hasil = hasilPenilaian.essay?.[index];
    return {
      nomor: soal.nomor,
      pembahasan:
        hasil?.feedback || "Perhatikan poin-poin penting dalam jawaban.",
      contohJawabanIdeal: soal.kunciJawaban || "Lihat kunci jawaban di buku.",
      konsepTerkait: "Pahami konsep dasar materi ini.",
    };
  });

  const nilaiTotal = hasilPenilaian.ringkasan?.nilaiTotal ?? 0;
  const benarPG = hasilPenilaian.ringkasan?.benarPG ?? 0;
  const totalPG = soalPG.length;

  let saranBelajar = [];
  if (nilaiTotal >= 85) {
    saranBelajar = [
      "Hasil yang sangat baik! Pertahankan cara belajarmu.",
      "Coba tantang diri dengan soal-soal yang lebih sulit.",
      "Bantu teman yang kesulitan untuk memperdalam pemahamanmu.",
    ];
  } else if (nilaiTotal >= 70) {
    saranBelajar = [
      "Hasil yang baik! Masih ada ruang untuk peningkatan.",
      "Fokus pada konsep yang masih kurang dikuasai.",
      "Latihan soal secara rutin untuk memperkuat pemahaman.",
    ];
  } else {
    saranBelajar = [
      "Jangan menyerah! Setiap kesalahan adalah kesempatan belajar.",
      "Pelajari kembali materi dari dasar.",
      "Minta bantuan guru atau teman untuk menjelaskan konsep yang sulit.",
      "Buat jadwal belajar rutin dan konsisten.",
    ];
  }

  return { pilihanGanda, essay, saranBelajar };
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

    console.log(`[Review] Generating: ${totalPG} PG, ${totalEssay} Essay`);

    let result;

    try {
      const genAI = createGeminiClient();
      const model = genAI.getGenerativeModel({
        model: MODEL_CONFIG.pembahasanGenerator.model,
        generationConfig: {
          temperature: 0.5,
          topP: 0.8,
          maxOutputTokens: 8192,
        },
      });

      const prompt = `Kamu guru profesional yang membuat pembahasan ujian yang KONSTRUKTIF dan MEMOTIVASI.

## DATA HASIL UJIAN:
- Benar PG: ${benarPG}/${totalPG}
- Nilai Total: ${nilaiTotal}%
- Status: ${nilaiTotal >= 70 ? "LULUS" : "BELUM LULUS"}

## SOAL PILIHAN GANDA:
${soalPG
  .map((s, i) => {
    const hasil = hasilPenilaian.pilihanGanda?.[i];
    const status = hasil?.benar ? "✓ BENAR" : "✗ SALAH";
    const jawabanSiswa = hasil?.jawabanSiswa || "-";
    return `${s.nomor}. [${status}] Siswa: ${jawabanSiswa}, Benar: ${
      s.jawabanBenar
    }
   Soal: ${s.pertanyaan.substring(0, 80)}...`;
  })
  .join("\n")}

## SOAL ESSAY:
${soalEssay
  .map((s, i) => {
    const hasil = hasilPenilaian.essay?.[i];
    return `${s.nomor}. Nilai: ${hasil?.nilai || 0}/100
   Soal: ${s.pertanyaan.substring(0, 80)}...
   Feedback: ${hasil?.feedback || "-"}`;
  })
  .join("\n")}

## INSTRUKSI:
Buat pembahasan yang:
1. POSITIF - mulai dengan apa yang sudah baik
2. KONSTRUKTIF - saran perbaikan yang spesifik
3. MEMOTIVASI - dorong siswa untuk terus belajar
4. SINGKAT - maksimal 2-3 kalimat per pembahasan

## OUTPUT JSON (tanpa markdown):
{
  "pilihanGanda": [
    {
      "nomor": 1,
      "pembahasan": "Penjelasan mengapa jawaban benar/salah",
      "konsepTerkait": "Konsep yang perlu dipahami",
      "tips": "Tips singkat untuk mengingat"
    }
  ],
  "essay": [
    {
      "nomor": 1,
      "pembahasan": "Analisis jawaban siswa",
      "contohJawabanIdeal": "Contoh jawaban yang baik",
      "konsepTerkait": "Konsep penting"
    }
  ],
  "saranBelajar": [
    "Saran 1 yang spesifik",
    "Saran 2 yang actionable",
    "Saran 3 yang memotivasi"
  ]
}

Buat tepat ${totalPG} pembahasan PG dan ${totalEssay} pembahasan essay.
Output HANYA JSON, tanpa teks lain.`;

      console.log("[Review] Calling Gemini AI...");
      const startTime = Date.now();

      const aiResult = await model.generateContent(prompt);
      const response = await aiResult.response;
      const text = response.text();

      console.log(
        `[Review] Done in ${((Date.now() - startTime) / 1000).toFixed(1)}s`
      );

      result = parseJSON(text);
    } catch (aiError: any) {
      console.log(`[Review] AI failed: ${aiError.message} - Using fallback`);
      result = generateLocalReview(soalPG, soalEssay, hasilPenilaian);
    }

    // Ensure complete data
    if (!result.pilihanGanda) result.pilihanGanda = [];
    if (!result.essay) result.essay = [];
    if (!result.saranBelajar) result.saranBelajar = [];

    // Fill missing PG
    while (result.pilihanGanda.length < totalPG) {
      const i = result.pilihanGanda.length;
      const benar = hasilPenilaian.pilihanGanda?.[i]?.benar;
      const soal = soalPG[i];
      result.pilihanGanda.push({
        nomor: i + 1,
        pembahasan: benar
          ? `Benar! Jawaban ${soal?.jawabanBenar} tepat.`
          : `Jawaban yang benar adalah ${soal?.jawabanBenar}.`,
        konsepTerkait: "Pelajari materi terkait.",
        tips: benar ? "Bagus!" : "Pelajari lagi.",
      });
    }

    // Fill missing Essay
    while (result.essay.length < totalEssay) {
      const i = result.essay.length;
      const soal = soalEssay[i];
      const hasil = hasilPenilaian.essay?.[i];
      result.essay.push({
        nomor: i + 1,
        pembahasan: hasil?.feedback || "Perhatikan poin-poin penting.",
        contohJawabanIdeal: soal?.kunciJawaban || "Lihat kunci jawaban.",
        konsepTerkait: "Pahami konsep dasar.",
      });
    }

    // Fill missing saran
    if (result.saranBelajar.length === 0) {
      result.saranBelajar =
        nilaiTotal >= 70
          ? [
              "Hasil bagus! Pertahankan.",
              "Terus berlatih.",
              "Bantu teman belajar.",
            ]
          : ["Jangan menyerah!", "Pelajari kembali materi.", "Latihan rutin."];
    }

    // Normalize numbering
    result.pilihanGanda = result.pilihanGanda
      .slice(0, totalPG)
      .map((p: any, i: number) => ({ ...p, nomor: i + 1 }));
    result.essay = result.essay
      .slice(0, totalEssay)
      .map((e: any, i: number) => ({ ...e, nomor: i + 1 }));

    console.log("[Review] Complete ✓");
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Review Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat pembahasan" },
      { status: 500 }
    );
  }
}
