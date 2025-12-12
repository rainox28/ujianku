// components/exam/QuestionCountSelector.tsx
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, PenLine, Clock, Minus, Plus } from "lucide-react";
import { EXAM_CONFIG, calculateDuration } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  jumlahPG: number;
  jumlahEssay: number;
  onChangePG: (value: number) => void;
  onChangeEssay: (value: number) => void;
}

export function QuestionCountSelector({
  jumlahPG,
  jumlahEssay,
  onChangePG,
  onChangeEssay,
}: Props) {
  const estimatedDuration = useMemo(
    () => calculateDuration(jumlahPG, jumlahEssay),
    [jumlahPG, jumlahEssay]
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} jam ${mins > 0 ? `${mins} menit` : ""}`;
    }
    return `${mins} menit`;
  };

  return (
    <div className="space-y-6">
      {/* Pilihan Ganda Counter */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Soal Pilihan Ganda</h3>
            <p className="text-sm text-gray-500">
              Minimal {EXAM_CONFIG.MIN_SOAL_PG}, maksimal{" "}
              {EXAM_CONFIG.MAX_SOAL_PG} soal
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() =>
              onChangePG(Math.max(EXAM_CONFIG.MIN_SOAL_PG, jumlahPG - 5))
            }
            disabled={jumlahPG <= EXAM_CONFIG.MIN_SOAL_PG}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
              jumlahPG <= EXAM_CONFIG.MIN_SOAL_PG
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="w-24 text-center">
            <input
              type="number"
              value={jumlahPG}
              onChange={(e) => {
                const val = parseInt(e.target.value) || EXAM_CONFIG.MIN_SOAL_PG;
                onChangePG(
                  Math.max(
                    EXAM_CONFIG.MIN_SOAL_PG,
                    Math.min(EXAM_CONFIG.MAX_SOAL_PG, val)
                  )
                );
              }}
              className="w-full text-center text-3xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
              min={EXAM_CONFIG.MIN_SOAL_PG}
              max={EXAM_CONFIG.MAX_SOAL_PG}
            />
            <p className="text-sm text-gray-500">soal</p>
          </div>

          <button
            onClick={() =>
              onChangePG(Math.min(EXAM_CONFIG.MAX_SOAL_PG, jumlahPG + 5))
            }
            disabled={jumlahPG >= EXAM_CONFIG.MAX_SOAL_PG}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
              jumlahPG >= EXAM_CONFIG.MAX_SOAL_PG
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-primary-100 text-primary-600 hover:bg-primary-200"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex justify-center gap-2 mt-4">
          {[10, 15, 20, 25, 30].map((num) => (
            <button
              key={num}
              onClick={() => onChangePG(num)}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                jumlahPG === num
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Essay Counter */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <PenLine className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Soal Essay</h3>
            <p className="text-sm text-gray-500">
              Minimal {EXAM_CONFIG.MIN_SOAL_ESSAY}, maksimal{" "}
              {EXAM_CONFIG.MAX_SOAL_ESSAY} soal
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() =>
              onChangeEssay(
                Math.max(EXAM_CONFIG.MIN_SOAL_ESSAY, jumlahEssay - 1)
              )
            }
            disabled={jumlahEssay <= EXAM_CONFIG.MIN_SOAL_ESSAY}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
              jumlahEssay <= EXAM_CONFIG.MIN_SOAL_ESSAY
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="w-24 text-center">
            <input
              type="number"
              value={jumlahEssay}
              onChange={(e) => {
                const val =
                  parseInt(e.target.value) || EXAM_CONFIG.MIN_SOAL_ESSAY;
                onChangeEssay(
                  Math.max(
                    EXAM_CONFIG.MIN_SOAL_ESSAY,
                    Math.min(EXAM_CONFIG.MAX_SOAL_ESSAY, val)
                  )
                );
              }}
              className="w-full text-center text-3xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
              min={EXAM_CONFIG.MIN_SOAL_ESSAY}
              max={EXAM_CONFIG.MAX_SOAL_ESSAY}
            />
            <p className="text-sm text-gray-500">soal</p>
          </div>

          <button
            onClick={() =>
              onChangeEssay(
                Math.min(EXAM_CONFIG.MAX_SOAL_ESSAY, jumlahEssay + 1)
              )
            }
            disabled={jumlahEssay >= EXAM_CONFIG.MAX_SOAL_ESSAY}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
              jumlahEssay >= EXAM_CONFIG.MAX_SOAL_ESSAY
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex justify-center gap-2 mt-4">
          {[2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              onClick={() => onChangeEssay(num)}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                jumlahEssay === num
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Duration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-800">Estimasi Waktu Pengerjaan</p>
            <p className="text-xl font-bold text-amber-900">
              {formatDuration(estimatedDuration)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Soal</span>
          <span className="font-bold text-gray-900">
            {jumlahPG + jumlahEssay} soal
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Bobot Nilai</span>
          <span className="font-medium text-gray-900">
            PG {EXAM_CONFIG.BOBOT_PG}% + Essay {EXAM_CONFIG.BOBOT_ESSAY}%
          </span>
        </div>
      </div>
    </div>
  );
}
