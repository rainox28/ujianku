// components/result/ScoreCard.tsx
"use client";

import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { RingkasanNilai } from "@/types/result";
import { EXAM_CONFIG } from "@/lib/constants";

interface Props {
  ringkasan: RingkasanNilai;
  mataPelajaran: string;
  jenjang: string;
  kelas: number;
  totalPG: number;
  totalEssay: number;
}

export function ScoreCard({
  ringkasan,
  mataPelajaran,
  jenjang,
  kelas,
  totalPG,
}: Props) {
  const isLulus = ringkasan.status === "LULUS";
  const scorePercentage = ringkasan.nilaiTotal;

  const getGrade = (score: number) => {
    if (score >= 90)
      return { grade: "A", label: "Sangat Baik", color: "text-success-600" };
    if (score >= 80)
      return { grade: "B", label: "Baik", color: "text-primary-600" };
    if (score >= 70)
      return { grade: "C", label: "Cukup", color: "text-warning-600" };
    if (score >= 60)
      return { grade: "D", label: "Kurang", color: "text-orange-600" };
    return { grade: "E", label: "Sangat Kurang", color: "text-danger-600" };
  };

  const gradeInfo = getGrade(scorePercentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header with gradient */}
      <div
        className={cn(
          "p-6 text-white",
          isLulus
            ? "bg-gradient-to-r from-success-500 to-emerald-600"
            : "bg-gradient-to-r from-danger-500 to-rose-600"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm font-medium">Hasil Ujian</p>
            <h2 className="text-xl font-bold">{mataPelajaran}</h2>
            <p className="text-white/80 text-sm">
              {jenjang} Kelas {kelas}
            </p>
          </div>
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              isLulus ? "bg-white/20" : "bg-white/20"
            )}
          >
            {isLulus ? (
              <Trophy className="w-8 h-8" />
            ) : (
              <Target className="w-8 h-8" />
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold",
            isLulus ? "bg-white/20" : "bg-white/20"
          )}
        >
          {isLulus ? (
            <>
              <Award className="w-5 h-5" />
              LULUS
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              PERLU BELAJAR LAGI
            </>
          )}
        </div>
      </div>

      {/* Score Display */}
      <div className="p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Circular Progress */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke={isLulus ? "#10b981" : "#ef4444"}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 440" }}
                animate={{
                  strokeDasharray: `${(scorePercentage / 100) * 440} 440`,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            {/* Score Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="stat-number text-4xl text-gray-900">
                {Math.round(scorePercentage)}
              </span>
              <span className="text-gray-500 text-sm">dari 100</span>
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="text-center mb-6">
          <span className={cn("text-5xl font-bold", gradeInfo.color)}>
            {gradeInfo.grade}
          </span>
          <p className="text-gray-600 mt-1">{gradeInfo.label}</p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Pilihan Ganda</p>
            <p className="text-2xl font-bold text-gray-900">
              {ringkasan.benarPG}/{totalPG}
            </p>
            <p className="text-sm text-gray-600">
              ({Math.round(ringkasan.nilaiPG)}%)
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Essay</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(ringkasan.nilaiEssay)}
            </p>
            <p className="text-sm text-gray-600">dari 100</p>
          </div>
        </div>

        {/* Passing Grade Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-500">
            Nilai Kelulusan (KKM):{" "}
            <span className="font-bold text-gray-900">
              {EXAM_CONFIG.PASSING_GRADE}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
