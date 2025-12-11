// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export function formatTimeVerbose(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} detik`;
  if (secs === 0) return `${mins} menit`;
  return `${mins} menit ${secs} detik`;
}

export function getKelasSuffix(kelas: number): string {
  return `Kelas ${kelas}`;
}

export function getSemesterLabel(semester: 1 | 2): string {
  return `Semester ${semester} (${semester === 1 ? "Ganjil" : "Genap"})`;
}

export function getGradeColor(nilai: number): string {
  if (nilai >= 90) return "text-success-600";
  if (nilai >= 80) return "text-primary-600";
  if (nilai >= 70) return "text-warning-600";
  return "text-danger-600";
}

export function getGradeBadge(nilai: number): { label: string; color: string } {
  if (nilai >= 90) return { label: "A", color: "badge-success" };
  if (nilai >= 80) return { label: "B", color: "badge-primary" };
  if (nilai >= 70) return { label: "C", color: "badge-warning" };
  if (nilai >= 60) return { label: "D", color: "badge-warning" };
  return { label: "E", color: "badge-danger" };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
