// components/exam/QuestionPG.tsx
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
    <div id={`pg-${soal.nomor}`} className="scroll-mt-24">
      <div className="exam-paper-clean p-6 mb-4">
        {/* Question Header */}
        <div className="flex gap-4 mb-4">
          <span className="question-number flex-shrink-0">{soal.nomor}</span>
          <p className="text-gray-800 font-serif text-lg leading-relaxed">
            {soal.pertanyaan}
          </p>
        </div>

        {/* Options */}
        <div className="ml-12 space-y-2">
          {OPTIONS.map((opt) => {
            const isSelected = jawaban === opt;
            return (
              <label
                key={opt}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                  isSelected
                    ? "bg-primary-50 border-2 border-primary-400"
                    : "hover:bg-gray-50 border-2 border-transparent",
                  disabled && "cursor-not-allowed opacity-60"
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
                <span
                  className={cn(
                    "flex-shrink-0 mt-0.5",
                    isSelected ? "option-label-selected" : "option-label"
                  )}
                >
                  {opt}
                </span>
                <span className="text-gray-700 font-medium">
                  {soal.opsi[opt]}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
});
