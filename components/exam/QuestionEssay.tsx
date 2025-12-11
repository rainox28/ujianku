// components/exam/QuestionEssay.tsx
"use client";

import { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GeneratedSoalEssay } from "@/lib/gemini";

interface Props {
  soal: GeneratedSoalEssay;
  jawaban: string;
  onAnswer: (jawaban: string) => void;
  disabled?: boolean;
  nomorUrut: number; // Nomor urut setelah PG (31, 32, dst)
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

  // Debounce update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== jawaban) {
        onAnswer(localValue);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localValue, jawaban, onAnswer]);

  // Sync from parent
  useEffect(() => {
    setLocalValue(jawaban);
    setCharCount(jawaban.length);
  }, [jawaban]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    setCharCount(value.length);
  };

  return (
    <div id={`essay-${soal.nomor}`} className="scroll-mt-24">
      <div className="exam-paper-clean p-6 mb-4">
        {/* Question Header */}
        <div className="flex gap-4 mb-4">
          <span className="question-number flex-shrink-0 bg-primary-100 text-primary-700">
            {nomorUrut}
          </span>
          <div>
            <span className="badge-primary text-xs mb-2">Essay</span>
            <p className="text-gray-800 font-serif text-lg leading-relaxed mt-2">
              {soal.pertanyaan}
            </p>
          </div>
        </div>

        {/* Answer Area */}
        <div className="ml-12">
          <textarea
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            placeholder="Tulis jawabanmu di sini..."
            className={cn(
              "w-full min-h-[200px] p-4 rounded-xl border-2 border-gray-200",
              "focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10",
              "outline-none transition-all duration-200 resize-y",
              "font-serif text-gray-800 leading-relaxed",
              "placeholder:text-gray-400 placeholder:font-sans",
              disabled && "bg-gray-50 cursor-not-allowed"
            )}
          />
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-400">
              {charCount > 0 ? `${charCount} karakter` : "Belum ada jawaban"}
            </span>
            <span
              className={cn(
                "font-medium",
                charCount >= 100 ? "text-success-600" : "text-gray-400"
              )}
            >
              {charCount >= 100 ? "✓ Jawaban cukup" : "Min. 100 karakter"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
