"use client";

import { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { PublicSoalEssay } from "@/lib/gemini";

interface Props {
  soal: PublicSoalEssay;
  jawaban: string;
  onAnswer: (jawaban: string) => void;
  disabled?: boolean;
  nomorUrut: number;
}

export const QuestionEssay = memo(function QuestionEssay({
  soal,
  jawaban,
  onAnswer,
  disabled = false,
  nomorUrut,
}: Props) {
  const [localValue, setLocalValue] = useState(jawaban);
  const [charCount, setCharCount] = useState(jawaban.length);

  // Debounce update agar tidak render ulang terlalu sering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== jawaban) {
        onAnswer(localValue);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localValue, jawaban, onAnswer]);

  useEffect(() => {
    setLocalValue(jawaban);
    setCharCount(jawaban.length);
  }, [jawaban]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    setCharCount(value.length);
  };

  return (
    <div id={`essay-${soal.nomor}`} className="scroll-mt-32 sm:scroll-mt-24">
      <div className="exam-paper-clean p-4 sm:p-8 mb-6 shadow-sm border-gray-200">
        {/* Question Header */}
        <div className="flex gap-3 sm:gap-5 mb-4">
          <span className="question-number flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base mt-1 bg-primary-100 text-primary-700">
            {nomorUrut}
          </span>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mb-2 border border-blue-100">
              Essay
            </span>
            <p className="text-gray-900 font-serif text-lg sm:text-xl leading-relaxed tracking-wide">
              {soal.pertanyaan}
            </p>
          </div>
        </div>

        {/* Answer Area */}
        {/* Mobile: Full Width, Desktop: Indented */}
        <div className="w-full sm:pl-14 mt-2 sm:mt-0">
          <div className="relative">
            <textarea
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              placeholder="Ketuk di sini untuk mulai menulis jawaban..."
              // text-base preventing iOS zoom on focus
              className={cn(
                "w-full min-h-[250px] p-4 sm:p-5 rounded-xl border-2",
                "focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10",
                "outline-none transition-all duration-200 resize-y",
                "font-serif text-base sm:text-lg text-gray-800 leading-relaxed",
                "placeholder:text-gray-400 placeholder:font-sans",
                // Background garis-garis kertas
                "bg-[linear-gradient(transparent_1.9rem,#f0f0f0_2rem)] bg-[length:100%_2rem] leading-[2rem]",
                "bg-white",
                disabled && "bg-gray-50 cursor-not-allowed opacity-70"
              )}
              style={{
                lineHeight: "2rem", // Mencocokkan dengan background garis
              }}
            />
            {/* Corner Indicator */}
            {!disabled && (
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-50">
                <svg
                  className="w-4 h-4 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-3 text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">
              {charCount} karakter ditulis
            </span>
            <div
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                charCount >= 100 ? "text-emerald-600" : "text-amber-600"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  charCount >= 100 ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
              {charCount >= 100
                ? "Panjang jawaban cukup baik"
                : "Disarankan minimal 100 karakter"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
