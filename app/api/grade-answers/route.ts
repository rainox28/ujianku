// app/api/grade-answers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EXAM_CONFIG } from "@/lib/constants";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface RequestBody {
  soalPG: any[];
  soalEssay: any[];
  jawabanPG: Record<number, string>;
  jawabanEssay: Record<number, string>;
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

    console.log(`Grading: ${soalPG.length} PG, ${soalEssay.length} Essay`);

    // ✅ Direct local grading - NO AI (fast!)
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

    const essay = soalEssay.map((soal) => {
      const jawaban = jawabanEssay[soal.nomor] || "";
      let nilai = 0;
      let feedback = "Tidak dijawab";

      if (jawaban.trim()) {
        const len = jawaban.length;
        if (len > 300) {
          nilai = 90;
          feedback = "Jawaban sangat lengkap dan detail. Excellent!";
        } else if (len > 200) {
          nilai = 85;
          feedback = "Jawaban lengkap dan terstruktur dengan baik.";
        } else if (len > 100) {
          nilai = 75;
          feedback =
            "Jawaban cukup baik, bisa ditambahkan penjelasan lebih detail.";
        } else if (len > 50) {
          nilai = 65;
          feedback = "Jawaban kurang lengkap, perlu penjelasan lebih lanjut.";
        } else if (len > 20) {
          nilai = 55;
          feedback = "Jawaban terlalu singkat, perlu dikembangkan.";
        } else {
          nilai = 40;
          feedback =
            "Jawaban minimal, perlu penjelasan yang lebih komprehensif.";
        }
      }

      return { nomor: soal.nomor, nilai, feedback };
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
      `Grade complete: ${result.ringkasan.nilaiTotal}% - ${result.ringkasan.status}`
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
