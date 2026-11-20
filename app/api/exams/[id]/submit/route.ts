import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { limitCaller } from "@/lib/rate-limit";
import { db, examResults } from "@/lib/db";
import { gradeExam, sanitizeAnswers } from "@/lib/exam/grading";
import { generateReview } from "@/lib/exam/review";
import {
  SUBMIT_GRACE_MS,
  claimSubmission,
  findAccessibleExam,
  releaseSubmission,
  toFullExam,
} from "@/lib/exam/store";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const receivedAt = Date.now();
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const limited = await limitCaller(request, "submit", userId);
  if (limited) return limited;

  const exam = await findAccessibleExam(id, userId);
  if (!exam) {
    return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  }

  if (exam.expiresAt && receivedAt > exam.expiresAt.getTime() + SUBMIT_GRACE_MS) {
    return NextResponse.json({ error: "Waktu ujian sudah habis" }, { status: 410 });
  }

  let body: { jawabanPG?: unknown; jawabanEssay?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data jawaban tidak valid" }, { status: 400 });
  }

  if (!(await claimSubmission(exam.id))) {
    return NextResponse.json({ error: "Ujian ini sudah dikumpulkan" }, { status: 409 });
  }

  try {
    const full = toFullExam(exam);
    const { jawabanPG, jawabanEssay } = sanitizeAnswers(body, full.pilihanGanda, full.essay);

    const penilaian = await gradeExam(full.pilihanGanda, full.essay, jawabanPG, jawabanEssay);
    const pembahasan = await generateReview(full.pilihanGanda, full.essay, penilaian);

    const waktuSelesai = new Date(receivedAt);
    const [result] = await db
      .insert(examResults)
      .values({
        examId: exam.id,
        userId: exam.userId,
        jawabanPG,
        jawabanEssay,
        nilaiPG: penilaian.ringkasan.nilaiPG,
        nilaiEssay: penilaian.ringkasan.nilaiEssay,
        nilaiTotal: penilaian.ringkasan.nilaiTotal,
        benarPG: penilaian.ringkasan.benarPG,
        salahPG: penilaian.ringkasan.salahPG,
        status: penilaian.ringkasan.status,
        penilaianDetail: penilaian,
        pembahasan,
        waktuMulai: exam.createdAt,
        waktuSelesai,
        durasiMenit: Math.round((waktuSelesai.getTime() - exam.createdAt.getTime()) / 60000),
      })
      .returning({ id: examResults.id });

    return NextResponse.json({
      success: true,
      data: {
        examId: exam.id,
        resultId: result.id,
        penilaian,
        pembahasan,
        examData: full,
        jawabanUser: { pilihanGanda: jawabanPG, essay: jawabanEssay },
      },
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    // Let the student retry; nothing was stored.
    await releaseSubmission(exam.id).catch(() => {});
    return NextResponse.json({ error: "Gagal menilai jawaban" }, { status: 500 });
  }
}
