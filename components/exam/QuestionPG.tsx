"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { GeneratedSoalPG } from "@/lib/gemini";

interface Props {
  soal: GeneratedSoalPG;
  jawaban: "A" | "B" | "C" | "D" | "E" | null;
  onAnswer: (jawaban: "A" | "B" | "C" | "D" | "E") => void;
  disabled?: boolean;
}

const OPTIONS = ["A", "B", "C", "D", "E"] as const;

export const QuestionPG = memo(function QuestionPG({
  soal,
  jawaban,
  onAnswer,
  disabled = false,
}: Props) {
  return (
    <div id={`pg-${soal.nomor}`} className="scroll-mt-32 sm:scroll-mt-24">
      <div className="exam-paper-clean p-4 sm:p-8 mb-6 shadow-sm border-gray-200">
        {/* Question Header */}
        <div className="flex gap-3 sm:gap-5 mb-6">
          <span className="question-number flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base mt-1">
            {soal.nomor}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-serif text-lg sm:text-xl leading-relaxed tracking-wide">
              {soal.pertanyaan}
            </p>
          </div>
        </div>

        {/* Options */}
        {/* Mobile: Full width, Desktop: Indented */}
        <div className="w-full sm:pl-14 space-y-3 sm:space-y-4">
          {OPTIONS.map((opt) => {
            const isSelected = jawaban === opt;
            return (
              <label
                key={opt}
                className={cn(
                  "relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 select-none active:scale-[0.99]",
                  isSelected
                    ? "bg-primary-50 border-primary-500 shadow-sm"
                    : "bg-white border-gray-100 hover:border-primary-200 hover:bg-gray-50",
                  disabled && "cursor-not-allowed opacity-60 grayscale"
                )}
              >
                <input
                  type="radio"
                  name={`pg-${soal.nomor}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => !disabled && onAnswer(opt)}
                  disabled={disabled}
                  className="sr-only"
                />

                {/* Circle Label (A, B, C...) */}
                <span
                  className={cn(
                    "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isSelected
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600"
                  )}
                >
                  {opt}
                </span>

                {/* Text Jawaban */}
                <span
                  className={cn(
                    "flex-1 text-base sm:text-lg font-medium leading-relaxed mt-0.5",
                    isSelected ? "text-primary-900" : "text-gray-700"
                  )}
                >
                  {soal.opsi[opt]}
                </span>

                {/* Checkmark Icon (Visual Feedback) */}
                {isSelected && (
                  <div className="absolute right-3 top-3 sm:right-4 sm:top-4 text-primary-600">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
});
