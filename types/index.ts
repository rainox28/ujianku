// types/index.ts
export type Jenjang = "SD" | "SMP" | "SMA";

export type KelasSD = 1 | 2 | 3 | 4 | 5 | 6;
export type KelasSMP = 7 | 8 | 9;
export type KelasSMA = 10 | 11 | 12;
export type Kelas = KelasSD | KelasSMP | KelasSMA;

export type Semester = 1 | 2;

export type OpsiJawaban = "A" | "B" | "C" | "D" | "E";

export interface MataPelajaran {
  id: string;
  nama: string;
  icon: string;
  tersediaUntuk: Jenjang[];
}

export interface ExamSetup {
  jenjang: Jenjang;
  kelas: Kelas;
  semester: Semester;
  mataPelajaran: string;
  uploadedFile?: File | null;
  uploadedFileUrl?: string;
}

export interface SoalPilihanGanda {
  id: number;
  nomor: number;
  tipe: "pg";
  pertanyaan: string;
  opsi: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  jawabanBenar: OpsiJawaban;
  pembahasan?: string;
}

export interface SoalEssay {
  id: number;
  nomor: number;
  tipe: "essay";
  pertanyaan: string;
  jawabanContoh?: string;
  poinPenilaian?: string[];
  pembahasan?: string;
}

export type Soal = SoalPilihanGanda | SoalEssay;

export interface JawabanUser {
  pilihanGanda: Record<number, OpsiJawaban | null>;
  essay: Record<number, string>;
}

export interface HasilPenilaianPG {
  nomor: number;
  jawabanUser: OpsiJawaban | null;
  jawabanBenar: OpsiJawaban;
  benar: boolean;
  pembahasan: string;
}

export interface HasilPenilaianEssay {
  nomor: number;
  jawabanUser: string;
  nilai: number;
  maxNilai: number;
  feedback: string;
  poinTerpenuhi: string[];
  poinKurang: string[];
}

export interface HasilUjian {
  nilaiPG: number;
  nilaiEssay: number;
  nilaiTotal: number;
  benar: number;
  salah: number;
  kosong: number;
  status: "LULUS" | "TIDAK_LULUS";
  waktuPengerjaan: number; // dalam detik
  pembahasan: {
    pilihanGanda: HasilPenilaianPG[];
    essay: HasilPenilaianEssay[];
  };
}

export interface ExamState {
  setup: ExamSetup;
  soalPG: SoalPilihanGanda[];
  soalEssay: SoalEssay[];
  jawaban: JawabanUser;
  waktuMulai: Date;
  waktuSelesai?: Date;
  hasil?: HasilUjian;
}
