// app/api/exams/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, examResults, exams } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db.query.examResults.findMany({
      where: eq(examResults.userId, session.user.id),
      with: {
        exam: true,
      },
      orderBy: [desc(examResults.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat" },
      { status: 500 }
    );
  }
}
