import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { EXAM_CONFIG } from "@/lib/constants";
import { limitCaller } from "@/lib/rate-limit";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const limited = await limitCaller(request, "upload", userId);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!EXAM_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan PDF, DOCX, atau PPTX." },
        { status: 415 }
      );
    }
    if (file.size > EXAM_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 413 });
    }

    const response = await utapi.uploadFiles(file);
    if (response.error) {
      return NextResponse.json({ error: response.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: response.data.ufsUrl,
      name: response.data.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
