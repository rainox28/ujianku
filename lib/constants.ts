// lib/constants.ts
import { MataPelajaran, Jenjang } from "@/types";

export const MATA_PELAJARAN: MataPelajaran[] = [
  {
    id: "matematika",
    nama: "Matematika",
    icon: "📐",
    tersediaUntuk: ["SD", "SMP", "SMA"],
  },
  { id: "ipa", nama: "IPA", icon: "🔬", tersediaUntuk: ["SD", "SMP"] },
  { id: "ips", nama: "IPS", icon: "🌍", tersediaUntuk: ["SD", "SMP"] },
  {
    id: "bahasa-indonesia",
    nama: "Bahasa Indonesia",
    icon: "📖",
    tersediaUntuk: ["SD", "SMP", "SMA"],
  },
  {
    id: "bahasa-inggris",
    nama: "Bahasa Inggris",
    icon: "🇬🇧",
    tersediaUntuk: ["SD", "SMP", "SMA"],
  },
  { id: "pkn", nama: "PKN", icon: "🏛️", tersediaUntuk: ["SD", "SMP", "SMA"] },
  { id: "fisika", nama: "Fisika", icon: "⚛️", tersediaUntuk: ["SMA"] },
  { id: "kimia", nama: "Kimia", icon: "🧪", tersediaUntuk: ["SMA"] },
  { id: "biologi", nama: "Biologi", icon: "🧬", tersediaUntuk: ["SMA"] },
  { id: "sejarah", nama: "Sejarah", icon: "📜", tersediaUntuk: ["SMP", "SMA"] },
  { id: "geografi", nama: "Geografi", icon: "🗺️", tersediaUntuk: ["SMA"] },
  { id: "ekonomi", nama: "Ekonomi", icon: "💰", tersediaUntuk: ["SMA"] },
  { id: "sosiologi", nama: "Sosiologi", icon: "👥", tersediaUntuk: ["SMA"] },
  {
    id: "seni-budaya",
    nama: "Seni Budaya",
    icon: "🎨",
    tersediaUntuk: ["SD", "SMP", "SMA"],
  },
  { id: "pjok", nama: "PJOK", icon: "⚽", tersediaUntuk: ["SD", "SMP", "SMA"] },
];

export const KELAS_BY_JENJANG: Record<Jenjang, number[]> = {
  SD: [1, 2, 3, 4, 5, 6],
  SMP: [7, 8, 9],
  SMA: [10, 11, 12],
};

export const JENJANG_OPTIONS: {
  value: Jenjang;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    value: "SD",
    label: "SD",
    description: "Sekolah Dasar (Kelas 1-6)",
    icon: "🎒",
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "SMP",
    label: "SMP",
    description: "Sekolah Menengah Pertama (Kelas 7-9)",
    icon: "📚",
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "SMA",
    label: "SMA",
    description: "Sekolah Menengah Atas (Kelas 10-12)",
    icon: "🎓",
    color: "from-purple-500 to-indigo-500",
  },
];

export const EXAM_CONFIG = {
  // Configurable limits
  MIN_SOAL_PG: 10,
  MAX_SOAL_PG: 50,
  DEFAULT_SOAL_PG: 30,

  MIN_SOAL_ESSAY: 2,
  MAX_SOAL_ESSAY: 10,
  DEFAULT_SOAL_ESSAY: 5,

  // Time calculation
  DURASI_PER_SOAL_PG: 2, // 2 menit per soal PG
  DURASI_PER_SOAL_ESSAY: 8, // 8 menit per soal essay
  MIN_DURASI: 30, // minimal 30 menit
  MAX_DURASI: 180, // maksimal 3 jam

  // Shown on the landing page: 30 PG x 2 min + 5 essay x 8 min.
  DEFAULT_DURASI: 100, // 30 PG × 2 min + 5 Essay × 8 min = 100 min

  // Scoring
  PASSING_GRADE: 70,
  BOBOT_PG: 70,
  BOBOT_ESSAY: 30,

  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_FILE_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
};

// Helper function untuk hitung durasi dinamis
export function calculateDuration(
  jumlahPG: number,
  jumlahEssay: number
): number {
  const durasi =
    jumlahPG * EXAM_CONFIG.DURASI_PER_SOAL_PG +
    jumlahEssay * EXAM_CONFIG.DURASI_PER_SOAL_ESSAY;
  return Math.max(
    EXAM_CONFIG.MIN_DURASI,
    Math.min(durasi, EXAM_CONFIG.MAX_DURASI)
  );
}

export const STATUS_MESSAGES = {
  LULUS: {
    title: "Selamat! Kamu Lulus! 🎉",
    description: "Pertahankan prestasimu dan terus belajar!",
    color: "success",
  },
  TIDAK_LULUS: {
    title: "Belum Lulus",
    description: "Jangan menyerah! Pelajari pembahasannya dan coba lagi.",
    color: "danger",
  },
};
