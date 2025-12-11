// app/exam/start/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Send,
  ChevronUp,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EXAM_CONFIG } from "@/lib/constants";
import { useTimer } from "@/hooks/useTimer";
import { useExamStore } from "@/hooks/useExamStore";
import { QuestionPG } from "@/components/exam/QuestionPG";
import { QuestionEssay } from "@/components/exam/QuestionEssay";
import { ExamNavigation } from "@/components/exam/ExamNavigation";
import { SubmitModal } from "@/components/exam/SubmitModal";
import { TimeUpModal } from "@/components/exam/TimeUpModal";

export default function ExamStartPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    examData,
    jawabanPG,
    jawabanEssay,
    currentSection,
    isSubmitting,
    loadExam,
    setJawabanPG,
    setJawabanEssay,
    setCurrentSection,
    getProgress,
    submitExam,
  } = useExamStore();

  const handleTimeUp = useCallback(() => {
    setShowTimeUpModal(true);
  }, []);

  const { formattedTime, isWarning, isDanger } = useTimer({
    initialMinutes: EXAM_CONFIG.DURASI_MENIT,
    onTimeUp: handleTimeUp,
    autoStart: true,
  });

  useEffect(() => {
    const loaded = loadExam();
    if (!loaded) {
      router.replace("/exam/setup");
      return;
    }
    setIsLoaded(true);
  }, [loadExam, router]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ FIXED: Submit with hard redirect
  const handleSubmit = async () => {
    setSubmitError(null);

    try {
      console.log("Submitting exam...");
      const result = await submitExam();

      if (result) {
        console.log("Submit successful!");
        setShowSubmitModal(false);
        setShowTimeUpModal(false);

        // ✅ Hard redirect - more reliable than router.push
        window.location.href = "/exam/result";
      } else {
        throw new Error("Submit failed");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setSubmitError("Gagal mengirim. Coba lagi.");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting]);

  if (!isLoaded || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat soal...</p>
        </div>
      </div>
    );
  }

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-gray-900">
                  {examData.metadata.mataPelajaran}
                </p>
                <p className="text-xs text-gray-500">
                  {examData.metadata.jenjang} Kelas {examData.metadata.kelas}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold",
                isDanger
                  ? "bg-red-100 text-red-600"
                  : isWarning
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-primary-50 text-primary-600"
              )}
            >
              <Clock className="w-5 h-5" />
              <span className="text-xl">{formattedTime}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting}
                className="btn-primary py-2 px-4 text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Kumpulkan</span>
              </button>

              <button
                onClick={() => setShowMobileNav(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500">
                {progress.answered}/{progress.total}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-6">
            <div className="flex-1 max-w-4xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {currentSection === "pg" ? "Pilihan Ganda" : "Essay"}
                </h2>
                <p className="text-gray-500">
                  {currentSection === "pg"
                    ? `${examData.pilihanGanda.length} soal`
                    : `${examData.essay.length} soal`}
                </p>
              </div>

              {currentSection === "pg" ? (
                <div className="space-y-4">
                  {examData.pilihanGanda.map((soal) => (
                    <QuestionPG
                      key={soal.nomor}
                      soal={soal}
                      jawaban={jawabanPG[soal.nomor] || null}
                      onAnswer={(j) => setJawabanPG(soal.nomor, j)}
                    />
                  ))}
                  <div className="flex justify-center py-8">
                    <button
                      onClick={() => {
                        setCurrentSection("essay");
                        scrollToTop();
                      }}
                      className="btn-primary"
                    >
                      Lanjut ke Essay
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {examData.essay.map((soal, i) => (
                    <QuestionEssay
                      key={soal.nomor}
                      soal={soal}
                      jawaban={jawabanEssay[soal.nomor] || ""}
                      onAnswer={(j) => setJawabanEssay(soal.nomor, j)}
                      nomorUrut={examData.pilihanGanda.length + i + 1}
                    />
                  ))}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center py-8">
                    <button
                      onClick={() => {
                        setCurrentSection("pg");
                        scrollToTop();
                      }}
                      className="btn-secondary"
                    >
                      Kembali ke PG
                    </button>
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      disabled={isSubmitting}
                      className="btn-primary"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Kumpulkan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block w-64 flex-shrink-0">
              <ExamNavigation
                totalPG={examData.pilihanGanda.length}
                totalEssay={examData.essay.length}
                jawabanPG={jawabanPG}
                jawabanEssay={jawabanEssay}
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                onNavigate={() => {}}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      {showMobileNav && (
        <>
          <div
            onClick={() => setShowMobileNav(false)}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold">Navigasi</h3>
              <button onClick={() => setShowMobileNav(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ExamNavigation
                totalPG={examData.pilihanGanda.length}
                totalEssay={examData.essay.length}
                jawabanPG={jawabanPG}
                jawabanEssay={jawabanEssay}
                currentSection={currentSection}
                onSectionChange={(s) => {
                  setCurrentSection(s);
                  setShowMobileNav(false);
                }}
                onNavigate={() => setShowMobileNav(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* Scroll Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center z-30"
        >
          <ChevronUp className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* Modals */}
      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        progress={progress}
        isSubmitting={isSubmitting}
      />

      <TimeUpModal
        isOpen={showTimeUpModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Error */}
      {submitError && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between">
            <p className="text-red-800 font-medium">{submitError}</p>
            <button onClick={() => setSubmitError(null)}>
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
