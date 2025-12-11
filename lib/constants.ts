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
  TOTAL_SOAL_PG: 30,
  TOTAL_SOAL_ESSAY: 5,
  DURASI_MENIT: 90,
  PASSING_GRADE: 70,
  BOBOT_PG: 70, // 70% dari total nilai
  BOBOT_ESSAY: 30, // 30% dari total nilai
  NILAI_PER_SOAL_PG: 70 / 30, // ~2.33 per soal
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
};

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
