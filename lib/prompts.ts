interface BasePromptParams {
  jenjang: string;
  kelas: number;
  semester: number;
  namaMapel: string;
}

interface PGBatchParams extends BasePromptParams {
  jumlahSoal: number;
  batchIndex: number;
  batchCount: number;
  fokus: string;
}

interface EssayParams extends BasePromptParams {
  jumlahSoal: number;
}

/**
 * Batches run in parallel and cannot see each other, so each one gets a different slice of the
 * semester and a different kind of question to keep them from writing the same items.
 */
export const PG_BATCH_FOCUS = [
  "pemahaman konsep dan definisi",
  "penerapan dan perhitungan",
  "soal cerita dalam konteks kehidupan sehari-hari",
  "analisis, perbandingan, dan hubungan antar konsep",
  "penalaran tingkat tinggi (HOTS) dan evaluasi",
];

export function createSoalPGBatchPrompt(params: PGBatchParams): string {
  const { jenjang, kelas, semester, namaMapel, jumlahSoal, batchIndex, batchCount, fokus } =
    params;

  const bagian =
    batchCount > 1
      ? `Bagi materi ${namaMapel} semester ${semester} kurikulum Merdeka menjadi ${batchCount} bagian berurutan. Buat soal HANYA dari bagian ke-${batchIndex + 1}.`
      : `Sebar soal ke seluruh materi ${namaMapel} semester ${semester} kurikulum Merdeka.`;

  return `Kamu guru ${namaMapel} berpengalaman. Buat ${jumlahSoal} soal pilihan ganda untuk siswa ${jenjang} kelas ${kelas}.

${bagian}
Jenis soal: ${fokus}.

ATURAN:
- Setiap soal membahas topik atau kasus yang berbeda; jangan mengulang soal yang mirip.
- Sesuaikan tingkat bahasa dan kesulitan dengan ${jenjang} kelas ${kelas}.
- 5 opsi (A-E), tepat satu yang benar, semua pengecoh masuk akal dan berbeda satu sama lain.
- Jangan gunakan opsi yang merujuk opsi lain ("A dan B benar", "semua benar", "tidak ada yang benar").
- Pastikan kunci jawaban benar-benar tepat. Untuk soal hitungan, periksa ulang hasilnya.
- Bahasa Indonesia baku${namaMapel === "Bahasa Inggris" ? " untuk instruksi; isi soal boleh berbahasa Inggris" : ""}.`;
}

export function createSoalEssayPrompt(params: EssayParams): string {
  const { jenjang, kelas, semester, namaMapel, jumlahSoal } = params;

  return `Kamu guru ${namaMapel} berpengalaman. Buat ${jumlahSoal} soal essay untuk siswa ${jenjang} kelas ${kelas}, materi semester ${semester} kurikulum Merdeka.

ATURAN:
- Setiap soal dari topik yang berbeda dan menuntut penjelasan, bukan jawaban satu kata.
- kunciJawaban berisi poin-poin inti yang harus ada di jawaban siswa.
- poinPenilaian berisi 2-4 kriteria penilaian yang spesifik untuk soal tersebut.
- Bahasa Indonesia baku.`;
}
