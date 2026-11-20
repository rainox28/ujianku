import { avg, count, desc, eq, and } from "drizzle-orm";
import { db, examResults, exams } from "@/lib/db";

export interface UserStats {
  totalExams: number;
  averageScore: number;
  passCount: number;
  failCount: number;
  passRate: number;
  subjectStats: { mataPelajaran: string; avgScore: number; count: number }[];
  recent: {
    resultId: string;
    mataPelajaran: string;
    jenjang: string;
    kelas: number;
    nilaiTotal: number;
    status: string;
    createdAt: Date;
  }[];
}

export async function getUserStats(userId: string, recentLimit = 20): Promise<UserStats> {
  const [[totals], [passed], subjects, recent] = await Promise.all([
    db
      .select({ count: count(), avg: avg(examResults.nilaiTotal) })
      .from(examResults)
      .where(eq(examResults.userId, userId)),
    db
      .select({ count: count() })
      .from(examResults)
      .where(and(eq(examResults.userId, userId), eq(examResults.status, "LULUS"))),
    db
      .select({
        mataPelajaran: exams.mataPelajaran,
        avgScore: avg(examResults.nilaiTotal),
        count: count(),
      })
      .from(examResults)
      .innerJoin(exams, eq(examResults.examId, exams.id))
      .where(eq(examResults.userId, userId))
      .groupBy(exams.mataPelajaran)
      .orderBy(desc(count())),
    db
      .select({
        resultId: examResults.id,
        mataPelajaran: exams.mataPelajaran,
        jenjang: exams.jenjang,
        kelas: exams.kelas,
        nilaiTotal: examResults.nilaiTotal,
        status: examResults.status,
        createdAt: examResults.createdAt,
      })
      .from(examResults)
      .innerJoin(exams, eq(examResults.examId, exams.id))
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.createdAt))
      .limit(recentLimit),
  ]);

  const total = totals.count;
  return {
    totalExams: total,
    averageScore: Math.round(Number(totals.avg) || 0),
    passCount: passed.count,
    failCount: total - passed.count,
    passRate: total > 0 ? Math.round((passed.count / total) * 100) : 0,
    subjectStats: subjects.map((s) => ({
      mataPelajaran: s.mataPelajaran,
      avgScore: Math.round(Number(s.avgScore) || 0),
      count: s.count,
    })),
    recent,
  };
}
