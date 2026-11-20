// hooks/useGenerateExam.ts
"use client";

import { useState, useCallback } from "react";
import type { PublicExam } from "@/lib/gemini";

interface ExamSetupData {
  jenjang: string;
  kelas: number;
  semester: number;
  mataPelajaran: string;
  jumlahSoalPG?: number; // NEW
  jumlahSoalEssay?: number; // NEW
  materiTambahan?: string;
}

interface UseGenerateExamReturn {
  isLoading: boolean;
  error: string | null;
  examData: PublicExam | null;
  retryAfter: number | null;
  generateExam: (data: ExamSetupData) => Promise<PublicExam | null>;
  reset: () => void;
}

export function useGenerateExam(): UseGenerateExamReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examData, setExamData] = useState<PublicExam | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const generateExam = useCallback(async (data: ExamSetupData) => {
    setIsLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      console.log("Starting parallel exam generation...");
      console.log(
        `Target: ${data.jumlahSoalPG || 30} PG + ${
          data.jumlahSoalEssay || 5
        } Essay`
      );

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRetryAfter(result.retryAfter || 60);
          throw new Error(
            result.error || "Quota API habis. Silakan tunggu dan coba lagi."
          );
        }
        throw new Error(result.error || "Gagal generate soal");
      }

      console.log("Exam generated successfully");
      console.log(
        `Result: ${result.data.pilihanGanda.length} PG + ${result.data.essay.length} Essay`
      );

      setExamData(result.data);
      return result.data;
    } catch (err: any) {
      console.error("Generate error:", err);
      const errorMessage = err.message || "Terjadi kesalahan";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setExamData(null);
    setRetryAfter(null);
  }, []);

  return {
    isLoading,
    error,
    examData,
    retryAfter,
    generateExam,
    reset,
  };
}
