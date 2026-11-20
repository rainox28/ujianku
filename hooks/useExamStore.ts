"use client";

import { useState, useCallback, useEffect } from "react";
import type { OpsiJawaban, PublicExam } from "@/lib/gemini";

type JawabanPG = Record<number, OpsiJawaban | null>;
type JawabanEssay = Record<number, string>;

interface ExamState {
  examData: PublicExam | null;
  jawabanPG: JawabanPG;
  jawabanEssay: JawabanEssay;
  currentSection: "pg" | "essay";
  isSubmitting: boolean;
  isSubmitted: boolean;
}

export class SubmitError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const STORAGE_KEY = "examAnswers";
const EXAM_DATA_KEY = "examData";

export function useExamStore() {
  const [state, setState] = useState<ExamState>({
    examData: null,
    jawabanPG: {},
    jawabanEssay: {},
    currentSection: "pg",
    isSubmitting: false,
    isSubmitted: false,
  });

  const loadExam = useCallback((): boolean => {
    const examDataStr = sessionStorage.getItem(EXAM_DATA_KEY);
    if (!examDataStr) return false;

    try {
      const examData: PublicExam = JSON.parse(examDataStr);
      if (!examData.examId || !examData.expiresAt) return false;

      let jawabanPG: JawabanPG = {};
      let jawabanEssay: JawabanEssay = {};
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
        if (saved?.examId === examData.examId) {
          jawabanPG = saved.jawabanPG || {};
          jawabanEssay = saved.jawabanEssay || {};
        } else if (saved) {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }

      setState((prev) => ({ ...prev, examData, jawabanPG, jawabanEssay }));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!state.examData) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        examId: state.examData.examId,
        jawabanPG: state.jawabanPG,
        jawabanEssay: state.jawabanEssay,
      })
    );
  }, [state.jawabanPG, state.jawabanEssay, state.examData]);

  const setJawabanPG = useCallback(
    (nomor: number, jawaban: OpsiJawaban) => {
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
      const res = await fetch(`/api/exams/${state.examData.examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jawabanPG: state.jawabanPG,
          jawabanEssay: state.jawabanEssay,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new SubmitError(body.error || "Gagal mengirim jawaban", res.status);
      }

      sessionStorage.setItem("examResult", JSON.stringify(body.data));
      setState((prev) => ({ ...prev, isSubmitting: false, isSubmitted: true }));
      return body.data;
    } catch (error) {
      setState((prev) => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [state.examData, state.jawabanPG, state.jawabanEssay]);

  const clearExam = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("examStartTime");
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
