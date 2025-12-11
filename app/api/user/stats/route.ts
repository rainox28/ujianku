// app/api/user/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, examResults } from "@/lib/db";
import { eq, count, avg, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total exams
    const [totalExams] = await db
      .select({ count: count() })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    // Get average score
    const [avgScore] = await db
      .select({ avg: avg(examResults.nilaiTotal) })
      .from(examResults)
      .where(eq(examResults.userId, userId));

    // Get pass/fail count
    const [passCount] = await db
      .select({ count: count() })
      .from(examResults)
      .where(
        sql`${examResults.userId} = ${userId} AND ${examResults.status} = 'LULUS'`
      );

    // Get recent exams
    const recentExams = await db.query.examResults.findMany({
      where: eq(examResults.userId, userId),
      with: { exam: true },
      orderBy: [sql`${examResults.createdAt} DESC`],
      limit: 5,
    });

    // Get subject breakdown
    const subjectStats = await db
      .select({
        mataPelajaran: sql<string>`${examResults}.exam->>'mata_pelajaran'`,
        avgScore: avg(examResults.nilaiTotal),
        count: count(),
      })
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .groupBy(sql`${examResults}.exam->>'mata_pelajaran'`);

    return NextResponse.json({
      success: true,
      data: {
        totalExams: totalExams.count,
        averageScore: Math.round(Number(avgScore.avg) || 0),
        passCount: passCount.count,
        failCount: totalExams.count - passCount.count,
        passRate:
          totalExams.count > 0
            ? Math.round((passCount.count / totalExams.count) * 100)
            : 0,
        recentExams,
        subjectStats,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik" },
      { status: 500 }
    );
  }
}
