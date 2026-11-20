export type Jenjang = "SD" | "SMP" | "SMA";

export type KelasSD = 1 | 2 | 3 | 4 | 5 | 6;
export type KelasSMP = 7 | 8 | 9;
export type KelasSMA = 10 | 11 | 12;
export type Kelas = KelasSD | KelasSMP | KelasSMA;

export type Semester = 1 | 2;

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
  jumlahSoalPG: number;
  jumlahSoalEssay: number;
}
