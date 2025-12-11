// components/result/PembahasanPG.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  nomor: number;
  pertanyaan: string;
  opsi: Record<string, string>;
  jawabanUser: string | null;
  jawabanBenar: string;
  benar: boolean;
  pembahasan: string;
  konsepTerkait: string;
  tips: string;
}

export function PembahasanPG({
  nomor,
  pertanyaan,
  opsi,
  jawabanUser,
  jawabanBenar,
  benar,
  pembahasan,
  konsepTerkait,
  tips,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card overflow-hidden",
        benar
          ? "border-l-4 border-l-success-500"
          : "border-l-4 border-l-danger-500"
      )}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Status Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            benar ? "bg-success-100" : "bg-danger-100"
          )}
        >
          {benar ? (
            <CheckCircle className="w-5 h-5 text-success-600" />
          ) : (
            <XCircle className="w-5 h-5 text-danger-600" />
          )}
        </div>

        {/* Question Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="question-number text-xs">{nomor}</span>
            <span
              className={cn(
                "badge text-xs",
                benar ? "badge-success" : "badge-danger"
              )}
            >
              {benar ? "Benar" : "Salah"}
            </span>
          </div>
          <p className="text-gray-800 font-medium line-clamp-2">{pertanyaan}</p>

          {/* Quick Answer Info */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-gray-500">
              Jawaban kamu:{" "}
              <span
                className={cn(
                  "font-bold",
                  benar ? "text-success-600" : "text-danger-600"
                )}
              >
                {jawabanUser || "-"}
              </span>
            </span>
            {!benar && (
              <span className="text-gray-500">
                Jawaban benar:{" "}
                <span className="font-bold text-success-600">
                  {jawabanBenar}
                </span>
              </span>
            )}
          </div>
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
            <div className="px-4 pb-4 border-t border-gray-100">
              {/* All Options */}
              <div className="py-4 space-y-2">
                {Object.entries(opsi).map(([key, value]) => {
                  const isUserAnswer = jawabanUser === key;
                  const isCorrect = jawabanBenar === key;

                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg",
                        isCorrect && "bg-success-50 border border-success-200",
                        isUserAnswer &&
                          !isCorrect &&
                          "bg-danger-50 border border-danger-200",
                        !isCorrect && !isUserAnswer && "bg-gray-50"
                      )}
                    >
                      <span
                        className={cn(
                          "option-label flex-shrink-0",
                          isCorrect &&
                            "!border-success-500 !bg-success-500 !text-white",
                          isUserAnswer &&
                            !isCorrect &&
                            "!border-danger-500 !bg-danger-500 !text-white"
                        )}
                      >
                        {key}
                      </span>
                      <span className="text-gray-700">{value}</span>
                      {isCorrect && (
                        <CheckCircle className="w-5 h-5 text-success-600 ml-auto flex-shrink-0" />
                      )}
                      {isUserAnswer && !isCorrect && (
                        <XCircle className="w-5 h-5 text-danger-600 ml-auto flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pembahasan */}
              <div className="space-y-4">
                {/* Main Explanation */}
                <div className="bg-primary-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                    <h4 className="font-bold text-primary-900">Pembahasan</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{pembahasan}</p>
                </div>

                {/* Konsep Terkait */}
                {konsepTerkait && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-blue-900">
                        Konsep Terkait
                      </h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {konsepTerkait}
                    </p>
                  </div>
                )}

                {/* Tips */}
                {tips && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💡</span>
                      <h4 className="font-bold text-amber-900">Tips Belajar</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{tips}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
