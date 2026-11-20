import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserStats } from "@/lib/exam/stats";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ success: true, data: await getUserStats(session.user.id, 5) });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Gagal mengambil statistik" }, { status: 500 });
  }
}
