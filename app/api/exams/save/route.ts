// app/api/exams/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, exams, examResults } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      examData,
      jawabanPG,
      jawabanEssay,
      penilaian,
      pembahasan,
      waktuMulai,
      waktuSelesai,
    } = body;

    // Create exam record
    const [exam] = await db
      .insert(exams)
      .values({
        userId: session?.user?.id || null,
        jenjang: examData.metadata.jenjang,
        kelas: examData.metadata.kelas,
        semester: examData.metadata.semester,
        mataPelajaran: examData.metadata.mataPelajaran,
        soalPG: examData.pilihanGanda,
        soalEssay: examData.essay,
        uploadedFileUrl: body.uploadedFileUrl || null,
      })
      .returning();

    // Calculate duration
    const durasiMenit =
      waktuMulai && waktuSelesai
        ? Math.round(
            (new Date(waktuSelesai).getTime() -
              new Date(waktuMulai).getTime()) /
              60000
          )
        : null;

    // Create result record
    const [result] = await db
      .insert(examResults)
      .values({
        examId: exam.id,
        userId: session?.user?.id || null,
        jawabanPG,
        jawabanEssay,
        nilaiPG: penilaian.ringkasan.nilaiPG,
        nilaiEssay: penilaian.ringkasan.nilaiEssay,
        nilaiTotal: penilaian.ringkasan.nilaiTotal,
        benarPG: penilaian.ringkasan.benarPG,
        salahPG: penilaian.ringkasan.salahPG,
        status: penilaian.ringkasan.status,
        penilaianDetail: penilaian,
        pembahasan,
        waktuMulai: waktuMulai ? new Date(waktuMulai) : null,
        waktuSelesai: waktuSelesai ? new Date(waktuSelesai) : null,
        durasiMenit,
      })
      .returning();

    return NextResponse.json({
      success: true,
      examId: exam.id,
      resultId: result.id,
    });
  } catch (error) {
    console.error("Save exam error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan hasil ujian" },
      { status: 500 }
    );
  }
}
