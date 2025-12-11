// app/api/generate-questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient, MODEL_CONFIG, GeneratedExam } from "@/lib/gemini";
import { createSoalGeneratorPrompt } from "@/lib/prompts";
import { MATA_PELAJARAN, EXAM_CONFIG } from "@/lib/constants";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

interface RequestBody {
  jenjang: string;
  kelas: number;
  semester: number;
  mataPelajaran: string;
  materiTambahan?: string;
}

// ✅ Better JSON parser
function parseAIResponse(text: string): any {
  // Step 1: Clean markdown
  let clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Step 2: Try direct parse
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.log("Direct parse failed, trying to extract JSON...");
  }

  // Step 3: Find JSON object
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in response");
  }

  let jsonStr = clean.substring(firstBrace, lastBrace + 1);

  // Step 4: Fix common JSON issues
  jsonStr = jsonStr
    .replace(/,\s*}/g, "}") // trailing comma before }
    .replace(/,\s*]/g, "]") // trailing comma before ]
    .replace(/\n/g, " ") // newlines
    .replace(/\r/g, "") // carriage returns
    .replace(/\t/g, " "); // tabs

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log("Fixed JSON parse failed");
    throw new Error("Cannot parse JSON response");
  }
}

// ✅ Validate exam structure
function validateExam(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: "Data kosong" };
  }

  if (!data.pilihanGanda || !Array.isArray(data.pilihanGanda)) {
    return { valid: false, error: "pilihanGanda tidak valid" };
  }

  if (!data.essay || !Array.isArray(data.essay)) {
    return { valid: false, error: "essay tidak valid" };
  }

  if (data.pilihanGanda.length < 5) {
    return { valid: false, error: `Hanya ${data.pilihanGanda.length} soal PG` };
  }

  if (data.essay.length < 1) {
    return { valid: false, error: `Hanya ${data.essay.length} soal essay` };
  }

  // Validate first PG question structure
  const firstPG = data.pilihanGanda[0];
  if (!firstPG.pertanyaan || !firstPG.opsi || !firstPG.jawabanBenar) {
    return { valid: false, error: "Struktur soal PG tidak valid" };
  }

  // Check if it's a real question (not placeholder)
  if (
    firstPG.pertanyaan.includes("Pilihan A") ||
    firstPG.opsi?.A === "Pilihan A"
  ) {
    return { valid: false, error: "Soal terdeteksi sebagai placeholder" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { jenjang, kelas, semester, mataPelajaran } = body;

    if (!jenjang || !kelas || !semester || !mataPelajaran) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const mapelInfo = MATA_PELAJARAN.find((m) => m.id === mataPelajaran);
    if (!mapelInfo) {
      return NextResponse.json(
        { error: "Mata pelajaran tidak valid" },
        { status: 400 }
      );
    }

    console.log(`Generating: ${jenjang} Kelas ${kelas} - ${mapelInfo.nama}`);

    // Build prompt
    const prompt = createSoalGeneratorPrompt({
      jenjang,
      kelas,
      semester,
      mataPelajaran,
      namaMapel: mapelInfo.nama,
    });

    // ✅ Try up to 2 times
    let lastError = "";

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Attempt ${attempt}...`);

        const genAI = createGeminiClient();
        const model = genAI.getGenerativeModel({
          model: MODEL_CONFIG.soalGenerator.model,
          generationConfig: MODEL_CONFIG.soalGenerator.generationConfig,
        });

        const startTime = Date.now();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`Response in ${duration}s: ${text.length} chars`);

        if (text.length < 500) {
          throw new Error("Response terlalu pendek");
        }

        // Parse JSON
        const examData = parseAIResponse(text);

        // Validate
        const validation = validateExam(examData);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Normalize numbering
        examData.pilihanGanda = examData.pilihanGanda
          .slice(0, EXAM_CONFIG.TOTAL_SOAL_PG)
          .map((q: any, i: number) => ({ ...q, nomor: i + 1 }));

        examData.essay = examData.essay
          .slice(0, EXAM_CONFIG.TOTAL_SOAL_ESSAY)
          .map((q: any, i: number) => ({ ...q, nomor: i + 1 }));

        // Build final exam
        const finalExam: GeneratedExam = {
          pilihanGanda: examData.pilihanGanda,
          essay: examData.essay,
          metadata: {
            jenjang,
            kelas,
            semester,
            mataPelajaran: mapelInfo.nama,
            tanggalGenerate: new Date().toISOString(),
          },
        };

        console.log(
          `✅ Success: ${finalExam.pilihanGanda.length} PG, ${finalExam.essay.length} Essay`
        );

        return NextResponse.json({ success: true, data: finalExam });
      } catch (attemptError: any) {
        lastError = attemptError.message;
        console.log(`❌ Attempt ${attempt} failed: ${lastError}`);

        if (attempt < 2) {
          // Wait before retry
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    // ✅ All attempts failed - return error (NO DUMMY FALLBACK)
    console.error("All attempts failed:", lastError);
    return NextResponse.json(
      { error: `Gagal membuat soal: ${lastError}. Silakan coba lagi.` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Generate Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
