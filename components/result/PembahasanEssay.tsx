// components/result/PembahasanEssay.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, Lightbulb, Star } from "lucide-react";
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
}

export function PembahasanEssay({
  nomor,
  nomorUrut,
  pertanyaan,
  jawabanUser,
  nilai,
  feedback,
  pembahasan,
  contohJawabanIdeal,
  konsepTerkait,
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
            "flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center",
            getScoreColor(nilai)
          )}
        >
          <span className="text-xl font-bold">{nilai}</span>
          <span className="text-xs">/ 100</span>
        </div>

        {/* Question Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="question-number text-xs bg-primary-100 text-primary-700">
              {nomorUrut}
            </span>
            <span className="badge-primary text-xs">Essay</span>
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

              {/* AI Feedback */}
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-primary-600" />
                  <h4 className="font-bold text-primary-900">Feedback AI</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{feedback}</p>
              </div>

              {/* Pembahasan */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">Pembahasan</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{pembahasan}</p>
              </div>

              {/* Contoh Jawaban Ideal */}
              <div className="bg-success-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <h4 className="font-bold text-success-900">
                    Contoh Jawaban Ideal
                  </h4>
                </div>
                <p className="text-gray-700 leading-relaxed font-serif">
                  {contohJawabanIdeal}
                </p>
              </div>

              {/* Konsep Terkait */}
              {konsepTerkait && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-amber-900">Konsep Terkait</h4>
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
