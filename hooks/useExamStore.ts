// hooks/useExamStore.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { GeneratedExam } from "@/lib/gemini";

type JawabanPG = Record<number, "A" | "B" | "C" | "D" | "E" | null>;
type JawabanEssay = Record<number, string>;

interface ExamState {
  examData: GeneratedExam | null;
  jawabanPG: JawabanPG;
  jawabanEssay: JawabanEssay;
  currentSection: "pg" | "essay";
  isSubmitting: boolean;
  isSubmitted: boolean;
  examStartTime: string | null;
}

const STORAGE_KEY = "examAnswers";
const START_TIME_KEY = "examStartTime";
const EXAM_DATA_KEY = "examData";

export function useExamStore() {
  const [state, setState] = useState<ExamState>({
    examData: null,
    jawabanPG: {},
    jawabanEssay: {},
    currentSection: "pg",
    isSubmitting: false,
    isSubmitted: false,
    examStartTime: null,
  });

  // ✅ Load exam and check if answers match current exam
  const loadExam = useCallback((): boolean => {
    const examDataStr = sessionStorage.getItem(EXAM_DATA_KEY);
    if (!examDataStr) return false;

    try {
      const examData = JSON.parse(examDataStr);

      // Get start time
      let startTime = sessionStorage.getItem(START_TIME_KEY);
      if (!startTime) {
        startTime = new Date().toISOString();
        sessionStorage.setItem(START_TIME_KEY, startTime);
      }

      // ✅ Load saved answers ONLY if they exist
      const savedAnswers = sessionStorage.getItem(STORAGE_KEY);
      let jawabanPG: JawabanPG = {};
      let jawabanEssay: JawabanEssay = {};

      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);

          // ✅ Validate that answers match current exam
          // Check if the number of PG questions matches
          const savedPGCount = Object.keys(parsed.jawabanPG || {}).length;
          const examPGCount = examData.pilihanGanda?.length || 0;

          // Only use saved answers if they seem to match current exam
          // Simple check: if saved answers exist and exam has same question count
          if (savedPGCount > 0 && savedPGCount <= examPGCount) {
            // Additional check: verify the saved answers are for THIS exam
            // by checking if exam was generated at the same time as start time
            const examGeneratedAt = examData.metadata?.tanggalGenerate;
            if (examGeneratedAt && startTime) {
              const examTime = new Date(examGeneratedAt).getTime();
              const startTimeMs = new Date(startTime).getTime();

              // If exam was generated within 5 minutes of start time, use saved answers
              if (Math.abs(examTime - startTimeMs) < 5 * 60 * 1000) {
                jawabanPG = parsed.jawabanPG || {};
                jawabanEssay = parsed.jawabanEssay || {};
              } else {
                // Different exam, clear old answers
                console.log("Different exam detected, clearing old answers");
                sessionStorage.removeItem(STORAGE_KEY);
              }
            }
          }
        } catch (e) {
          console.log("Failed to parse saved answers");
        }
      }

      setState((prev) => ({
        ...prev,
        examData,
        examStartTime: startTime,
        jawabanPG,
        jawabanEssay,
      }));

      return true;
    } catch (e) {
      return false;
    }
  }, []);

  // Auto-save answers when they change
  useEffect(() => {
    if (
      state.examData &&
      (Object.keys(state.jawabanPG).length > 0 ||
        Object.keys(state.jawabanEssay).length > 0)
    ) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          jawabanPG: state.jawabanPG,
          jawabanEssay: state.jawabanEssay,
        })
      );
    }
  }, [state.jawabanPG, state.jawabanEssay, state.examData]);

  const setJawabanPG = useCallback(
    (nomor: number, jawaban: "A" | "B" | "C" | "D" | "E") => {
      setState((prev) => ({
        ...prev,
        jawabanPG: { ...prev.jawabanPG, [nomor]: jawaban },
      }));
    },
    []
  );

  const setJawabanEssay = useCallback((nomor: number, jawaban: string) => {
    setState((prev) => ({
      ...prev,
      jawabanEssay: { ...prev.jawabanEssay, [nomor]: jawaban },
    }));
  }, []);

  const setCurrentSection = useCallback((section: "pg" | "essay") => {
    setState((prev) => ({ ...prev, currentSection: section }));
  }, []);

  const getProgress = useCallback(() => {
    const totalPG = state.examData?.pilihanGanda.length || 0;
    const totalEssay = state.examData?.essay.length || 0;
    const total = totalPG + totalEssay;

    const answeredPG = Object.values(state.jawabanPG).filter(
      (v) => v !== null
    ).length;
    const answeredEssay = Object.values(state.jawabanEssay).filter((v) =>
      v?.trim()
    ).length;
    const answered = answeredPG + answeredEssay;

    return {
      answered,
      total,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }, [state.examData, state.jawabanPG, state.jawabanEssay]);

  const getProgressPG = useCallback(() => {
    const total = state.examData?.pilihanGanda.length || 0;
    const answered = Object.values(state.jawabanPG).filter(
      (v) => v !== null
    ).length;
    return { answered, total };
  }, [state.examData, state.jawabanPG]);

  const getProgressEssay = useCallback(() => {
    const total = state.examData?.essay.length || 0;
    const answered = Object.values(state.jawabanEssay).filter((v) =>
      v?.trim()
    ).length;
    return { answered, total };
  }, [state.examData, state.jawabanEssay]);

  const submitExam = useCallback(async () => {
  if (!state.examData) return null;

  setState((prev) => ({ ...prev, isSubmitting: true }));

  try {
    console.log("Submitting exam...");
    const startTime = Date.now();

    // ✅ Run Grade and Review in parallel where possible
    // First, do quick grading
    const gradeRes = await fetch("/api/grade-answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soalPG: state.examData.pilihanGanda,
        soalEssay: state.examData.essay,
        jawabanPG: state.jawabanPG,
        jawabanEssay: state.jawabanEssay,
      }),
    });

    if (!gradeRes.ok) throw new Error("Grading failed");
    const gradeData = await gradeRes.json();
    
    console.log(`Graded in ${((Date.now() - startTime) / 1000).toFixed(1)}s:`, gradeData.data.ringkasan);

    // ✅ Start review (runs while we prepare result)
    const reviewPromise = fetch("/api/generate-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soalPG: state.examData.pilihanGanda,
        soalEssay: state.examData.essay,
        hasilPenilaian: gradeData.data,
      }),
    });

    // Wait for review
    const reviewRes = await reviewPromise;
    if (!reviewRes.ok) throw new Error("Review failed");
    const reviewData = await reviewRes.json();
    
    console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    const finalResult = {
      penilaian: gradeData.data,
      pembahasan: reviewData.data,
      examData: state.examData,
      jawabanUser: {
        pilihanGanda: state.jawabanPG,
        essay: state.jawabanEssay,
      },
    };

    sessionStorage.setItem("examResult", JSON.stringify(finalResult));

    // Save to DB (non-blocking)
    fetch("/api/exams/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examData: state.examData,
        jawabanPG: state.jawabanPG,
        jawabanEssay: state.jawabanEssay,
        penilaian: gradeData.data,
        pembahasan: reviewData.data,
        waktuMulai: state.examStartTime,
        waktuSelesai: new Date().toISOString(),
      }),
    }).catch(console.warn);

    setState((prev) => ({ ...prev, isSubmitting: false, isSubmitted: true }));

    return finalResult;
  } catch (error) {
    console.error("Submit error:", error);
    setState((prev) => ({ ...prev, isSubmitting: false }));
    throw error;
  }
}, [state.examData, state.jawabanPG, state.jawabanEssay, state.examStartTime]);

  const clearExam = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(START_TIME_KEY);
    sessionStorage.removeItem(EXAM_DATA_KEY);
    sessionStorage.removeItem("examSetup");
    sessionStorage.removeItem("examResult");

    setState({
      examData: null,
      jawabanPG: {},
      jawabanEssay: {},
      currentSection: "pg",
      isSubmitting: false,
      isSubmitted: false,
      examStartTime: null,
    });
  }, []);

  return {
    ...state,
    loadExam,
    setJawabanPG,
    setJawabanEssay,
    setCurrentSection,
    getProgress,
    getProgressPG,
    getProgressEssay,
    submitExam,
    clearExam,
  };
}
