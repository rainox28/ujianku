// components/result/PembahasanEssay.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  BookOpen,
  Lightbulb,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  nomor: number;
  nomorUrut: number;
  pertanyaan: string;
  jawabanUser: string;
  nilai: number;
  feedback: string;
  pembahasan: string;
  contohJawabanIdeal: string;
  konsepTerkait: string;
  konsepBenar?: string[]; // NEW
  konsepKurang?: string[]; // NEW
}

export function PembahasanEssay({
  nomorUrut,
  pertanyaan,
  jawabanUser,
  nilai,
  feedback,
  pembahasan,
  contohJawabanIdeal,
  konsepTerkait,
  konsepBenar = [],
  konsepKurang = [],
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success-600 bg-success-100";
    if (score >= 60) return "text-warning-600 bg-warning-100";
    return "text-danger-600 bg-danger-100";
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return "border-l-success-500";
    if (score >= 60) return "border-l-warning-500";
    return "border-l-danger-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Sangat Baik! 🌟";
    if (score >= 80) return "Baik 👍";
    if (score >= 70) return "Cukup Baik";
    if (score >= 60) return "Cukup";
    if (score >= 50) return "Perlu Perbaikan";
    return "Perlu Belajar Lagi";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("card overflow-hidden border-l-4", getScoreBorder(nilai))}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Score Badge */}
        <div
          className={cn(
            "flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center",
            getScoreColor(nilai)
          )}
        >
          <span className="text-2xl font-bold">{nilai}</span>
          <span className="text-xs opacity-75">/ 100</span>
        </div>

        {/* Question Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="question-number text-xs bg-primary-100 text-primary-700">
              {nomorUrut}
            </span>
            <span className="badge-primary text-xs">Essay</span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                nilai >= 80
                  ? "bg-success-100 text-success-700"
                  : nilai >= 60
                  ? "bg-warning-100 text-warning-700"
                  : "bg-danger-100 text-danger-700"
              )}
            >
              {getScoreLabel(nilai)}
            </span>
          </div>
          <p className="text-gray-800 font-medium line-clamp-2">{pertanyaan}</p>

          {/* Quick Feedback */}
          <p className="text-sm text-gray-500 mt-2 line-clamp-1">{feedback}</p>
        </div>

        {/* Expand Icon */}
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 space-y-4">
              {/* User Answer */}
              <div className="pt-4">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                  Jawabanmu
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 font-serif text-gray-700 leading-relaxed">
                  {jawabanUser || (
                    <span className="text-gray-400 italic">Tidak dijawab</span>
                  )}
                </div>
              </div>

              {/* Konsep yang benar */}
              {konsepBenar && konsepBenar.length > 0 && (
                <div className="bg-success-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-success-600" />
                    <h4 className="font-bold text-success-900">
                      Yang Sudah Benar
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {konsepBenar.map((konsep, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-success-800"
                      >
                        <span className="text-success-500 mt-1">✓</span>
                        <span>{konsep}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Konsep yang kurang */}
              {konsepKurang && konsepKurang.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-amber-900">
                      Yang Perlu Ditambahkan
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {konsepKurang.map((konsep, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-amber-800"
                      >
                        <span className="text-amber-500 mt-1">→</span>
                        <span>{konsep}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Feedback */}
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-primary-600" />
                  <h4 className="font-bold text-primary-900">Feedback AI</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{feedback}</p>
              </div>

              {/* Pembahasan */}
              {pembahasan && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Pembahasan</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{pembahasan}</p>
                </div>
              )}

              {/* Contoh Jawaban Ideal */}
              {contohJawabanIdeal && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <h4 className="font-bold text-emerald-900">
                      Contoh Jawaban Ideal
                    </h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-serif">
                    {contohJawabanIdeal}
                  </p>
                </div>
              )}

              {/* Konsep Terkait */}
              {konsepTerkait && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-gray-600" />
                    <h4 className="font-bold text-gray-900">Konsep Terkait</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {konsepTerkait}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
