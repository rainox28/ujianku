// lib/prompts.ts
import { EXAM_CONFIG } from "./constants";

interface PromptParams {
  jenjang: string;
  kelas: number;
  semester: number;
  mataPelajaran: string;
  namaMapel: string;
  materiTambahan?: string;
}

export function createSoalGeneratorPrompt(params: PromptParams): string {
  const { jenjang, kelas, semester, namaMapel } = params;

  return `Kamu adalah guru ${namaMapel} profesional di Indonesia. Buatkan soal ujian berkualitas tinggi.

INFORMASI UJIAN:
- Mata Pelajaran: ${namaMapel}
- Jenjang: ${jenjang}
- Kelas: ${kelas}
- Semester: ${semester}

TUGAS:
Buat ${EXAM_CONFIG.TOTAL_SOAL_PG} soal PILIHAN GANDA dan ${EXAM_CONFIG.TOTAL_SOAL_ESSAY} soal ESSAY.

KRITERIA SOAL:
1. Sesuai kurikulum ${jenjang} kelas ${kelas} semester ${semester}
2. Bahasa Indonesia yang baik dan benar
3. Soal jelas dan tidak ambigu
4. Tingkat kesulitan bervariasi (mudah, sedang, sulit)
5. Untuk PG: semua opsi (A-E) harus masuk akal, bukan jawaban yang jelas salah

FORMAT OUTPUT - JSON SAJA (tanpa markdown code block):
{
  "pilihanGanda": [
    {
      "nomor": 1,
      "pertanyaan": "Tuliskan pertanyaan yang jelas dan spesifik di sini",
      "opsi": {
        "A": "Opsi jawaban A yang masuk akal",
        "B": "Opsi jawaban B yang masuk akal",
        "C": "Opsi jawaban C yang masuk akal",
        "D": "Opsi jawaban D yang masuk akal",
        "E": "Opsi jawaban E yang masuk akal"
      },
      "jawabanBenar": "A"
    }
  ],
  "essay": [
    {
      "nomor": 1,
      "pertanyaan": "Tuliskan pertanyaan essay yang membutuhkan penjelasan",
      "kunciJawaban": "Poin-poin penting yang harus ada dalam jawaban",
      "poinPenilaian": ["Poin penilaian 1", "Poin penilaian 2"]
    }
  ]
}

PENTING:
- Output HANYA JSON valid, tidak ada teks lain sebelum atau sesudahnya
- JANGAN gunakan markdown code block (\`\`\`json)
- Buat TEPAT ${EXAM_CONFIG.TOTAL_SOAL_PG} soal pilihan ganda
- Buat TEPAT ${EXAM_CONFIG.TOTAL_SOAL_ESSAY} soal essay
- Setiap soal harus berkualitas dan sesuai materi ${namaMapel} kelas ${kelas}`;
}

export function createPenilaianPrompt(
  soalPG: any[],
  soalEssay: any[],
  jawabanPG: Record<number, string>,
  jawabanEssay: Record<number, string>
): string {
  const pgSummary = soalPG.map((s) => `${s.nomor}:${s.jawabanBenar}`).join(",");
  const pgAnswers = Object.entries(jawabanPG)
    .map(([k, v]) => `${k}:${v || "-"}`)
    .join(",");

  return `Nilai ujian. Output JSON saja.

Kunci PG: ${pgSummary}
Jawaban siswa: ${pgAnswers}
Jumlah essay: ${soalEssay.length}

Format:
{"pilihanGanda":[{"nomor":1,"jawabanSiswa":"A","jawabanBenar":"B","benar":false}],"essay":[{"nomor":1,"nilai":75,"feedback":"..."}],"ringkasan":{"benarPG":5,"salahPG":5,"nilaiPG":50,"nilaiEssay":75,"nilaiTotal":60,"status":"TIDAK_LULUS"}}`;
}

export function createPembahasanPrompt(
  soalPG: any[],
  soalEssay: any[],
  hasilPenilaian: any
): string {
  const totalPG = soalPG.length;
  const totalEssay = soalEssay.length;
  const benarPG = hasilPenilaian.ringkasan?.benarPG ?? 0;
  const nilaiTotal = hasilPenilaian.ringkasan?.nilaiTotal ?? 0;

  return `Kamu guru profesional. Buat pembahasan ujian dalam Bahasa Indonesia.

DATA:
- Benar: ${benarPG}/${totalPG} PG
- Nilai: ${nilaiTotal}%

SOAL PG:
${soalPG
  .map((s, i) => {
    const hasil = hasilPenilaian.pilihanGanda?.[i];
    const status = hasil?.benar ? "BENAR" : "SALAH";
    return `${s.nomor}. [${status}] Jawaban: ${s.jawabanBenar}`;
  })
  .join("\n")}

SOAL ESSAY (${totalEssay} soal):
${soalEssay
  .map((s) => `${s.nomor}. ${s.pertanyaan.substring(0, 60)}...`)
  .join("\n")}

OUTPUT JSON (tanpa markdown):
{
  "pilihanGanda": [
    {"nomor": 1, "pembahasan": "Penjelasan 1-2 kalimat.", "konsepTerkait": "Konsep", "tips": "Tips"}
  ],
  "essay": [
    {"nomor": 1, "pembahasan": "Penjelasan.", "contohJawabanIdeal": "Contoh.", "konsepTerkait": "Konsep"}
  ],
  "saranBelajar": ["Saran 1", "Saran 2", "Saran 3"]
}

Buat tepat ${totalPG} pembahasan PG dan ${totalEssay} pembahasan essay.
Output HANYA JSON, tanpa teks lain.`;
}
