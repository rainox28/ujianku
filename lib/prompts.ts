// lib/prompts.ts - UPDATE SEMUA

import { EXAM_CONFIG } from "./constants";

interface BasePromptParams {
  jenjang: string;
  kelas: number;
  semester: number;
  namaMapel: string;
}

interface PGBatchParams extends BasePromptParams {
  batchNumber: number;
  jumlahSoal: number;
  startNomor: number;
}

interface EssayParams extends BasePromptParams {
  jumlahSoal: number;
}

// ✅ SIMPLIFIED PG Prompt - Fokus pada output yang benar
export function createSoalPGBatchPrompt(params: PGBatchParams): string {
  const { jenjang, kelas, semester, namaMapel, jumlahSoal, startNomor } =
    params;

  return `Buat ${jumlahSoal} soal pilihan ganda ${namaMapel} untuk ${jenjang} kelas ${kelas} semester ${semester}.

ATURAN:
- Setiap soal HARUS punya pertanyaan jelas (ada tanda ? atau kata tanya)
- 5 opsi (A-E) yang masuk akal
- Jawaban benar salah satu dari A/B/C/D/E
- Bahasa Indonesia baku

CONTOH FORMAT:
[{"nomor":1,"pertanyaan":"Apa ibu kota Indonesia?","opsi":{"A":"Jakarta","B":"Bandung","C":"Surabaya","D":"Medan","E":"Makassar"},"jawabanBenar":"A"}]

Buat ${jumlahSoal} soal mulai nomor ${startNomor}. Output HANYA JSON array, tanpa teks lain.`;
}

// ✅ SIMPLIFIED Essay Prompt - Lebih pendek, lebih jelas
export function createSoalEssayPrompt(params: EssayParams): string {
  const { jenjang, kelas, semester, namaMapel, jumlahSoal } = params;

  return `Buat ${jumlahSoal} soal essay ${namaMapel} untuk ${jenjang} kelas ${kelas} semester ${semester}.

ATURAN:
- Pertanyaan jelas yang butuh penjelasan
- Kunci jawaban berisi poin-poin penting (bukan format exact)

FORMAT JSON:
[{"nomor":1,"pertanyaan":"Jelaskan proses fotosintesis!","kunciJawaban":"Proses pembuatan makanan oleh tumbuhan menggunakan cahaya matahari, air, dan CO2 menghasilkan glukosa dan O2","poinPenilaian":["Menyebutkan bahan","Menyebutkan hasil","Menjelaskan proses"]}]

Buat ${jumlahSoal} soal. Output HANYA JSON array.`;
}

// Keep for backward compatibility
export function createSoalGeneratorPrompt(params: {
  jenjang: string;
  kelas: number;
  semester: number;
  mataPelajaran: string;
  namaMapel: string;
  materiTambahan?: string;
}): string {
  return createSoalPGBatchPrompt({
    ...params,
    batchNumber: 1,
    jumlahSoal: EXAM_CONFIG.DEFAULT_SOAL_PG,
    startNomor: 1,
  });
}
