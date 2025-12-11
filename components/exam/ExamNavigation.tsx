// components/exam/ExamNavigation.tsx
"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { FileText, PenLine } from "lucide-react";

interface Props {
  totalPG: number;
  totalEssay: number;
  jawabanPG: Record<number, string | null>;
  jawabanEssay: Record<number, string>;
  currentSection: "pg" | "essay";
  onSectionChange: (section: "pg" | "essay") => void;
  onNavigate: (type: "pg" | "essay", nomor: number) => void;
}

export const ExamNavigation = memo(function ExamNavigation({
  totalPG,
  totalEssay,
  jawabanPG,
  jawabanEssay,
  currentSection,
  onSectionChange,
  onNavigate,
}: Props) {
  const scrollToQuestion = (type: "pg" | "essay", nomor: number) => {
    const id = type === "pg" ? `pg-${nomor}` : `essay-${nomor}`;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onNavigate(type, nomor);
  };

  return (
    <div className="card p-4 sticky top-24">
      {/* Section Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onSectionChange("pg")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-all",
            currentSection === "pg"
              ? "bg-primary-100 text-primary-700"
              : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <FileText className="w-4 h-4" />
          PG
        </button>
        <button
          onClick={() => onSectionChange("essay")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-all",
            currentSection === "essay"
              ? "bg-primary-100 text-primary-700"
              : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <PenLine className="w-4 h-4" />
          Essay
        </button>
      </div>

      {/* Pilihan Ganda Navigation */}
      {currentSection === "pg" && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">
            Pilihan Ganda ({Object.values(jawabanPG).filter((v) => v).length}/
            {totalPG})
          </p>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalPG }, (_, i) => i + 1).map((nomor) => {
              const isAnswered =
                jawabanPG[nomor] !== null && jawabanPG[nomor] !== undefined;
              return (
                <button
                  key={nomor}
                  onClick={() => scrollToQuestion("pg", nomor)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-sm font-semibold transition-all",
                    isAnswered
                      ? "bg-success-500 text-white hover:bg-success-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {nomor}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Essay Navigation */}
      {currentSection === "essay" && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">
            Essay (
            {Object.values(jawabanEssay).filter((v) => v && v.trim()).length}/
            {totalEssay})
          </p>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalEssay }, (_, i) => i + 1).map(
              (nomor) => {
                const isAnswered =
                  jawabanEssay[nomor] && jawabanEssay[nomor].trim() !== "";
                return (
                  <button
                    key={nomor}
                    onClick={() => scrollToQuestion("essay", nomor)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-semibold transition-all",
                      isAnswered
                        ? "bg-success-500 text-white hover:bg-success-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {nomor}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success-500" />
            <span className="text-gray-600">Terjawab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100" />
            <span className="text-gray-600">Belum</span>
          </div>
        </div>
      </div>
    </div>
  );
});
