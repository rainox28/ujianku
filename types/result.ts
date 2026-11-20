import type { GeneratedSoalEssay, GeneratedSoalPG } from "@/lib/gemini";

// types/result.ts
export interface HasilPenilaianPG {
  nomor: number;
  jawabanSiswa: string | null;
  jawabanBenar: string;
  benar: boolean;
}

export interface RingkasanNilai {
  benarPG: number;
  salahPG: number;
  nilaiPG: number;
  nilaiEssay: number;
  nilaiTotal: number;
  status: "LULUS" | "TIDAK_LULUS";
}

export interface PembahasanPG {
  nomor: number;
  pembahasan: string;
  konsepTerkait: string;
  tips: string;
}

export interface PembahasanEssay {
  nomor: number;
  pembahasan: string;
  contohJawabanIdeal: string;
  konsepTerkait: string;
}

export interface HasilPenilaianEssay {
  nomor: number;
  nilai: number;
  feedback: string;
  konsepBenar?: string[];
  konsepKurang?: string[];
}

export interface ExamResult {
  examId: string;
  resultId: string;
  penilaian: {
    pilihanGanda: HasilPenilaianPG[];
    essay: HasilPenilaianEssay[];
    ringkasan: RingkasanNilai;
  };
  pembahasan: {
    pilihanGanda: PembahasanPG[];
    essay: PembahasanEssay[];
    saranBelajar: string[];
  };
  examData: {
    pilihanGanda: GeneratedSoalPG[];
    essay: GeneratedSoalEssay[];
    metadata: {
      jenjang: string;
      kelas: number;
      semester: number;
      mataPelajaran: string;
      tanggalGenerate: string;
      jumlahSoalPG?: number;
      jumlahSoalEssay?: number;
    };
  };
  jawabanUser: {
    pilihanGanda: Record<number, string>;
    essay: Record<number, string>;
  };
}