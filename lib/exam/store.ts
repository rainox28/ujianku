import { and, eq, isNull } from "drizzle-orm";
import { db, exams, type Exam } from "@/lib/db";
import { calculateDuration } from "@/lib/constants";
import type {
  ExamMetadata,
  GeneratedExam,
  GeneratedSoalEssay,
  GeneratedSoalPG,
  PublicExam,
} from "@/lib/gemini";

// Covers network latency and the time-up modal between the deadline and the submit request.
export const SUBMIT_GRACE_MS = 2 * 60 * 1000;

export function toPublicExam(exam: Exam): PublicExam {
  const soalPG = exam.soalPG as GeneratedSoalPG[];
  const soalEssay = exam.soalEssay as GeneratedSoalEssay[];

  const metadata: ExamMetadata = {
    jenjang: exam.jenjang,
    kelas: exam.kelas,
    semester: exam.semester,
    mataPelajaran: exam.mataPelajaran,
    tanggalGenerate: exam.createdAt.toISOString(),
    jumlahSoalPG: soalPG.length,
    jumlahSoalEssay: soalEssay.length,
  };

  return {
    examId: exam.id,
    expiresAt: (exam.expiresAt ?? exam.createdAt).toISOString(),
    pilihanGanda: soalPG.map(({ nomor, pertanyaan, opsi }) => ({ nomor, pertanyaan, opsi })),
    essay: soalEssay.map(({ nomor, pertanyaan }) => ({ nomor, pertanyaan })),
    metadata,
  };
}

export function toFullExam(exam: Exam): GeneratedExam {
  const pub = toPublicExam(exam);
  return {
    pilihanGanda: exam.soalPG as GeneratedSoalPG[],
    essay: exam.soalEssay as GeneratedSoalEssay[],
    metadata: pub.metadata,
  };
}

export async function createExam(params: {
  userId: string | null;
  jenjang: string;
  kelas: number;
  semester: number;
  mataPelajaran: string;
  soalPG: GeneratedSoalPG[];
  soalEssay: GeneratedSoalEssay[];
  retakeOfExamId?: string;
}): Promise<Exam> {
  const durasiMenit = calculateDuration(params.soalPG.length, params.soalEssay.length);
  const expiresAt = new Date(Date.now() + durasiMenit * 60 * 1000);

  const [exam] = await db
    .insert(exams)
    .values({
      userId: params.userId,
      jenjang: params.jenjang,
      kelas: params.kelas,
      semester: params.semester,
      mataPelajaran: params.mataPelajaran,
      soalPG: params.soalPG,
      soalEssay: params.soalEssay,
      durasiMenit,
      expiresAt,
      retakeOfExamId: params.retakeOfExamId ?? null,
    })
    .returning();

  return exam;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guest exams are reachable by anyone holding the random exam id.
 * An exam created while signed in is reachable only by that user.
 */
export async function findAccessibleExam(
  examId: string,
  userId: string | null
): Promise<Exam | null> {
  if (!UUID_RE.test(examId)) return null;

  const exam = await db.query.exams.findFirst({ where: eq(exams.id, examId) });
  if (!exam) return null;
  if (exam.userId && exam.userId !== userId) return null;
  return exam;
}

/** Returns true only for the single request that wins the submit. */
export async function claimSubmission(examId: string): Promise<boolean> {
  const rows = await db
    .update(exams)
    .set({ submittedAt: new Date() })
    .where(and(eq(exams.id, examId), isNull(exams.submittedAt)))
    .returning({ id: exams.id });
  return rows.length === 1;
}

export async function releaseSubmission(examId: string): Promise<void> {
  await db.update(exams).set({ submittedAt: null }).where(eq(exams.id, examId));
}
