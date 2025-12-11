// types/result.ts
export interface HasilPenilaianPG {
  nomor: number;
  jawabanSiswa: string | null;
  jawabanBenar: string;
  benar: boolean;
}

export interface HasilPenilaianEssay {
  nomor: number;
  nilai: number;
  feedback: string;
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

export interface ExamResult {
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
    pilihanGanda: any[];
    essay: any[];
    metadata: {
      jenjang: string;
      kelas: number;
      semester: number;
      mataPelajaran: string;
      tanggalGenerate: string;
    };
  };
  jawabanUser: {
    pilihanGanda: Record<number, string>;
    essay: Record<number, string>;
  };
}
