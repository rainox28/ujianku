import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExam, findAccessibleExam, toFullExam, toPublicExam } from "@/lib/exam/store";

export const dynamic = "force-dynamic";

/** Starts a fresh attempt with the same questions and a new deadline. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const source = await findAccessibleExam(id, userId);
  if (!source) {
    return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  }
  // Retaking an unsubmitted exam would hand out a fresh deadline for the same questions.
  if (!source.submittedAt) {
    return NextResponse.json({ error: "Ujian ini belum dikumpulkan" }, { status: 409 });
  }

  const full = toFullExam(source);
  const exam = await createExam({
    userId: source.userId,
    jenjang: source.jenjang,
    kelas: source.kelas,
    semester: source.semester,
    mataPelajaran: source.mataPelajaran,
    soalPG: full.pilihanGanda,
    soalEssay: full.essay,
    retakeOfExamId: source.retakeOfExamId ?? source.id,
  });

  return NextResponse.json({ success: true, data: toPublicExam(exam) });
}
