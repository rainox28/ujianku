import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, examResults } from "@/lib/db";
import { toFullExam } from "@/lib/exam/store";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A past result with its review, in the same shape the submit endpoint returns. Owner only. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Hasil tidak ditemukan" }, { status: 404 });
  }

  const result = await db.query.examResults.findFirst({
    where: and(eq(examResults.id, id), eq(examResults.userId, session.user.id)),
    with: { exam: true },
  });
  if (!result) {
    return NextResponse.json({ error: "Hasil tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      examId: result.examId,
      resultId: result.id,
      penilaian: result.penilaianDetail,
      pembahasan: result.pembahasan,
      examData: toFullExam(result.exam),
      jawabanUser: { pilihanGanda: result.jawabanPG, essay: result.jawabanEssay },
    },
  });
}
