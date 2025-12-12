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
    // Try array
    const arrStart = clean.indexOf("[");
    const arrEnd = clean.lastIndexOf("]");
    if (arrStart !== -1 && arrEnd > arrStart) {
      return JSON.parse(clean.substring(arrStart, arrEnd + 1));
    }
    throw new Error("Cannot parse");
  }
}

// ✅ Generate pembahasan for batch of PG (5 at a time)
async function generatePGBatchReview(
  soalBatch: any[],
  hasilBatch: any[]
): Promise<any[]> {
  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_CONFIG.pembahasanGenerator.model,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
      },
    });

    const soalList = soalBatch
      .map((s, i) => {
        const h = hasilBatch[i];
        return `${s.nomor}.[${h?.benar ? "✓" : "✗"}] ${s.pertanyaan.substring(
          0,
          80
        )} → Jawaban: ${s.jawabanBenar}`;
      })
      .join("\n");

    const prompt = `Buat pembahasan singkat untuk soal-soal ini:
${soalList}

Output JSON array: [{"nomor":1,"pembahasan":"...","konsepTerkait":"...","tips":"..."}]`;

    const result = await model.generateContent(prompt);
    const data = parseJSON(result.response.text());
    return Array.isArray(data) ? data : data.pilihanGanda || [];
  } catch {
    // Fallback
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

// ✅ Generate pembahasan for essays
async function generateEssayReview(
  soalEssay: any[],
  hasilEssay: any[]
): Promise<any[]> {
  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({
      model: MODEL_CONFIG.pembahasanGenerator.model,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
      },
    });

    const soalList = soalEssay
      .map((s, i) => {
        const h = hasilEssay[i];
        return `${s.nomor}. [${h?.nilai || 0}/100] ${s.pertanyaan.substring(
          0,
          80
        )}`;
      })
      .join("\n");

    const prompt = `Buat pembahasan singkat untuk essay:
${soalList}

Output JSON array: [{"nomor":1,"pembahasan":"...","contohJawabanIdeal":"...","konsepTerkait":"..."}]`;

    const result = await model.generateContent(prompt);
    const data = parseJSON(result.response.text());
    return Array.isArray(data) ? data : data.essay || [];
  } catch {
    return soalEssay.map((s) => ({
      nomor: s.nomor,
      pembahasan: "Perhatikan poin-poin penting dalam kunci jawaban",
      contohJawabanIdeal: s.kunciJawaban || "Lihat kunci jawaban",
      konsepTerkait: "Pahami konsep dasar",
    }));
  }
}

// ✅ Generate learning recommendations
async function generateSaran(
  nilaiTotal: number,
  benarPG: number,
  totalPG: number
): Promise<string[]> {
  if (nilaiTotal >= 85) {
    return [
      "Hasil sangat baik! Pertahankan.",
      "Coba latihan soal yang lebih menantang.",
    ];
  } else if (nilaiTotal >= 70) {
    return [
      "Hasil baik! Terus berlatih.",
      "Fokus pada konsep yang masih kurang.",
    ];
  } else {
    return [
      "Jangan menyerah!",
      "Pelajari kembali materi dasar.",
      "Latihan rutin setiap hari.",
    ];
  }
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
    const startTime = Date.now();

    // ✅ Split PG into batches of 5 for parallel processing
    const pgBatches: Promise<any[]>[] = [];
    const batchSize = 5;

    for (let i = 0; i < totalPG; i += batchSize) {
      const soalBatch = soalPG.slice(i, i + batchSize);
      const hasilBatch =
        hasilPenilaian.pilihanGanda?.slice(i, i + batchSize) || [];
      pgBatches.push(generatePGBatchReview(soalBatch, hasilBatch));
    }

    // ✅ Run ALL in parallel: PG batches + Essay + Saran
    const [essayReview, saranBelajar, ...pgBatchResults] = await Promise.all([
      generateEssayReview(soalEssay, hasilPenilaian.essay || []),
      generateSaran(nilaiTotal, benarPG, totalPG),
      ...pgBatches,
    ]);

    // Combine PG results
    let pilihanGanda: any[] = [];
    for (const batch of pgBatchResults) {
      pilihanGanda = pilihanGanda.concat(batch);
    }

    // ✅ Fill missing and normalize
    while (pilihanGanda.length < totalPG) {
      const i = pilihanGanda.length;
      const benar = hasilPenilaian.pilihanGanda?.[i]?.benar;
      pilihanGanda.push({
        nomor: i + 1,
        pembahasan: benar
          ? "Jawaban benar!"
          : `Jawaban yang benar adalah ${soalPG[i]?.jawabanBenar}`,
        konsepTerkait: "Materi terkait",
        tips: benar ? "Bagus!" : "Pelajari lagi",
      });
    }

    let essay = essayReview;
    while (essay.length < totalEssay) {
      const i = essay.length;
      essay.push({
        nomor: i + 1,
        pembahasan:
          hasilPenilaian.essay?.[i]?.feedback || "Perhatikan poin penting",
        contohJawabanIdeal: soalEssay[i]?.kunciJawaban || "Lihat kunci",
        konsepTerkait: "Konsep dasar",
      });
    }

    // Normalize numbering
    pilihanGanda = pilihanGanda
      .slice(0, totalPG)
      .map((p, i) => ({ ...p, nomor: i + 1 }));
    essay = essay.slice(0, totalEssay).map((e, i) => ({ ...e, nomor: i + 1 }));

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Review] Complete in ${duration}s`);

    return NextResponse.json({
      success: true,
      data: { pilihanGanda, essay, saranBelajar },
    });
  } catch (error: any) {
    console.error("Review Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat pembahasan" },
      { status: 500 }
    );
  }
}
