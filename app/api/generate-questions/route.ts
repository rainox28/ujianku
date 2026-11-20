import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExam, toPublicExam } from "@/lib/exam/store";
import { generateQuestions } from "@/lib/exam/generate";
import { LIMITS, limitCaller, rateLimit } from "@/lib/rate-limit";
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
    const { pilihanGanda, essay } = await generateQuestions({
      jenjang,
      kelas: Number(kelas),
      semester: Number(semester),
      namaMapel: mapelInfo.nama,
      jumlahPG: finalPGCount,
      jumlahEssay: finalEssayCount,
    });

    if (pilihanGanda.length < EXAM_CONFIG.MIN_SOAL_PG || essay.length < EXAM_CONFIG.MIN_SOAL_ESSAY) {
      return NextResponse.json(
        {
          error: `Hanya ${pilihanGanda.length} soal PG dan ${essay.length} soal essay yang berhasil dibuat. Coba lagi.`,
        },
        { status: 502 }
      );
    }

    const exam = await createExam({
      userId: session?.user?.id ?? null,
      jenjang,
      kelas: Number(kelas),
      semester: Number(semester),
      mataPelajaran: mapelInfo.nama,
      soalPG: pilihanGanda,
      soalEssay: essay,
    });

    // Answer keys stay in the database; the client only gets the questions.
    return NextResponse.json({ success: true, data: toPublicExam(exam) });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Gagal membuat soal. Coba lagi." }, { status: 500 });
  }
}
