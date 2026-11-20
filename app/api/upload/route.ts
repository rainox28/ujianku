import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, materials } from "@/lib/db";
import { EXAM_CONFIG } from "@/lib/constants";
import { MaterialError, extractMaterialText } from "@/lib/exam/material";
import { limitCaller } from "@/lib/rate-limit";

export const maxDuration = 60;

/** Reads a study file, keeps only its text, and returns an id the exam generator can use. */
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Silakan login untuk upload materi" }, { status: 401 });
  }
  const limited = await limitCaller(request, "upload", userId);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    if (file.size > EXAM_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 413 });
    }

    const textContent = await extractMaterialText(file);
    const fileName = file.name.slice(0, 200);

    const [material] = await db
      .insert(materials)
      .values({ userId, fileName, textContent, charCount: textContent.length })
      .returning({ id: materials.id });

    return NextResponse.json({
      success: true,
      data: { materialId: material.id, fileName, charCount: textContent.length },
    });
  } catch (error) {
    if (error instanceof MaterialError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload gagal. Coba lagi." }, { status: 500 });
  }
}
