"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Send,
  ChevronUp,
  Menu,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/hooks/useTimer";
import { useExamStore, SubmitError } from "@/hooks/useExamStore";
import { QuestionPG } from "@/components/exam/QuestionPG";
import { QuestionEssay } from "@/components/exam/QuestionEssay";
import { ExamNavigation } from "@/components/exam/ExamNavigation";
import { SubmitModal } from "@/components/exam/SubmitModal";
import { TimeUpModal } from "@/components/exam/TimeUpModal";
import Image from "next/image";

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

  const endsAt = examData ? new Date(examData.expiresAt).getTime() : null;
  const { formattedTime, isWarning, isDanger } = useTimer({
    endsAt,
    onTimeUp: handleTimeUp,
  });

  useEffect(() => {
    if (!loadExam()) {
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

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const result = await submitExam();
      if (result) {
        setShowSubmitModal(false);
        setShowTimeUpModal(false);
        window.location.href = "/exam/result";
      } else {
        throw new Error("Submit failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      if (error instanceof SubmitError && (error.status === 409 || error.status === 410)) {
        setSubmitError(`${error.message}. Silakan mulai ujian baru.`);
      } else {
        setSubmitError("Gagal mengirim. Coba lagi.");
      }
    }
  };

  // Submit on our own when time runs out; the server only accepts a short grace period after the deadline.
  const autoSubmittedRef = useRef(false);
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  useEffect(() => {
    if (showTimeUpModal && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleSubmitRef.current();
    }
  }, [showTimeUpModal]);

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

  // ✅ Show loading until exam is loaded
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Fixed */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Bar: Identity & Actions */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Left: Subject Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                  {examData.metadata.mataPelajaran}
                </p>
                <p className="text-xs text-gray-500 truncate hidden sm:block">
                  {examData.metadata.jenjang} Kelas {examData.metadata.kelas}
                </p>
              </div>
            </div>

            <Image
              src="/images/17.png"
              alt="Logo Ujian Digital AI"
              width={100}
              height={10}
            />

            {/* Center/Right: Timer & Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Timer Badge */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold transition-colors",
                  isDanger
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : isWarning
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-gray-100 text-gray-700 sm:bg-primary-50 sm:text-primary-600"
                )}
              >
                <Clock className="w-4 h-4" />
                <span className="text-base sm:text-lg tabular-nums">
                  {formattedTime}
                </span>
              </div>

              {/* Submit Button (Icon only on mobile) */}
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting}
                className="btn-primary p-2 sm:py-2 sm:px-4 text-sm h-9 w-9 sm:w-auto sm:h-auto flex items-center justify-center"
                title="Kumpulkan Jawaban"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline ml-2">Kumpulkan</span>
              </button>

              {/* Burger Menu */}
              <button
                onClick={() => setShowMobileNav(true)}
                className="lg:hidden p-2 -mr-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Bottom Bar: Progress Bar */}
          <div className="pb-0.5 sm:pb-2 -mt-1 sm:mt-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 tabular-nums w-8 text-right">
                {Math.round(progress.percentage)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-[5.5rem] sm:pt-32 pb-24 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-8 items-start">
            {/* Question Area */}
            <div className="flex-1 min-w-0">
              {/* Section Title */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded uppercase tracking-wider font-bold">
                      Bagian {currentSection === "pg" ? "1" : "2"}
                    </span>
                    {currentSection === "pg" ? "Pilihan Ganda" : "Essay"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentSection === "pg"
                      ? "Pilihlah satu jawaban yang paling tepat."
                      : "Jawablah pertanyaan berikut dengan jelas."}
                  </p>
                </div>
              </div>

              {/* Questions Render */}
              <div className="space-y-6 sm:space-y-8">
                {currentSection === "pg" ? (
                  <>
                    {examData.pilihanGanda.map((soal) => (
                      <div
                        key={soal.nomor}
                        className="scroll-mt-28"
                        id={`q-${soal.nomor}`}
                      >
                        <QuestionPG
                          soal={soal}
                          jawaban={jawabanPG[soal.nomor] || null}
                          onAnswer={(j) => setJawabanPG(soal.nomor, j)}
                        />
                      </div>
                    ))}

                    {/* Navigation Buttons (Bottom) */}
                    <div className="pt-8 mt-8 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setCurrentSection("essay");
                          scrollToTop();
                        }}
                        className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3 sm:py-2.5 text-base"
                      >
                        Lanjut ke Soal Essay
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {examData.essay.map((soal, i) => (
                      <div
                        key={soal.nomor}
                        className="scroll-mt-28"
                        id={`q-${soal.nomor}`}
                      >
                        <QuestionEssay
                          soal={soal}
                          jawaban={jawabanEssay[soal.nomor] || ""}
                          onAnswer={(j) => setJawabanEssay(soal.nomor, j)}
                          nomorUrut={examData.pilihanGanda.length + i + 1}
                        />
                      </div>
                    ))}

                    {/* Navigation Buttons (Bottom) */}
                    <div className="pt-8 mt-8 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
                      <button
                        onClick={() => {
                          setCurrentSection("pg");
                          scrollToTop();
                        }}
                        className="w-full sm:w-auto btn-secondary flex items-center justify-center gap-2 py-3 sm:py-2.5 text-base"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke PG
                      </button>

                      <button
                        onClick={() => setShowSubmitModal(true)}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3 sm:py-2.5 text-base shadow-lg shadow-primary-500/20"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        Kumpulkan Ujian
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Sidebar Navigation */}
            <div className="hidden lg:block w-72 flex-shrink-0 sticky top-32">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-primary-500 rounded-full" />
                  Navigasi Soal
                </h3>
                <ExamNavigation
                  totalPG={examData.pilihanGanda.length}
                  totalEssay={examData.essay.length}
                  jawabanPG={jawabanPG}
                  jawabanEssay={jawabanEssay}
                  currentSection={currentSection}
                  onSectionChange={setCurrentSection}
                  onNavigate={(type, nomor) => {
                    const el = document.getElementById(`q-${nomor}`);
                    if (el)
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <>
          <div
            onClick={() => setShowMobileNav(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          />
          <div className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold">
                  <Menu className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900">Daftar Soal</h3>
              </div>
              <button
                onClick={() => setShowMobileNav(false)}
                className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <ExamNavigation
                totalPG={examData.pilihanGanda.length}
                totalEssay={examData.essay.length}
                jawabanPG={jawabanPG}
                jawabanEssay={jawabanEssay}
                currentSection={currentSection}
                onSectionChange={(s) => {
                  setCurrentSection(s);
                  setShowMobileNav(false);
                  scrollToTop();
                }}
                onNavigate={(type, nomor) => {
                  setShowMobileNav(false);
                  const el = document.getElementById(`q-${nomor}`);
                  if (el)
                    setTimeout(
                      () =>
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        }),
                      100
                    );
                }}
              />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setShowMobileNav(false);
                  setShowSubmitModal(true);
                }}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Kumpulkan Ujian
              </button>
            </div>
          </div>
        </>
      )}

      {/* Scroll Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-4 sm:right-8 w-12 h-12 bg-white shadow-xl shadow-gray-200/50 border border-gray-100 rounded-full flex items-center justify-center z-30 text-primary-600 hover:bg-primary-50 transition-all hover:-translate-y-1"
        >
          <ChevronUp className="w-6 h-6" />
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

      {/* Error Toast */}
      {submitError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border-l-4 border-red-500 p-4 rounded-lg shadow-2xl z-[60] animate-in slide-in-from-top-4 fade-in">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="text-red-500 mt-0.5">⚠️</div>
              <div>
                <h4 className="font-bold text-gray-900">Terjadi Kesalahan</h4>
                <p className="text-sm text-gray-600 mt-1">{submitError}</p>
              </div>
            </div>
            <button
              onClick={() => setSubmitError(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
