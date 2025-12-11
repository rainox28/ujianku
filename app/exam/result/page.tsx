// app/exam/result/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  FileText,
  PenLine,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamResult } from "@/types/result";
import { EXAM_CONFIG } from "@/lib/constants";
import { ScoreCard } from "@/components/result/ScoreCard";
import { StatisticsCard } from "@/components/result/StatisticsCard";
import { PembahasanPG } from "@/components/result/PembahasanPG";
import { PembahasanEssay } from "@/components/result/PembahasanEssay";
import { LearningRecommendations } from "@/components/result/LearningRecommendations";
import { ResultActions } from "@/components/result/ResultActions";

type TabType = "overview" | "pg" | "essay";

export default function ExamResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [expandAllPG, setExpandAllPG] = useState(false);
  const [expandAllEssay, setExpandAllEssay] = useState(false);

  // Load result from sessionStorage
  useEffect(() => {
    const resultStr = sessionStorage.getItem("examResult");
    if (!resultStr) {
      router.replace("/exam/setup");
      return;
    }

    try {
      const data = JSON.parse(resultStr);
      setResult(data);
      setIsLoaded(true);
    } catch (e) {
      router.replace("/exam/setup");
    }
  }, [router]);

  // Handle retry - same exam
  const handleRetry = () => {
    sessionStorage.removeItem("examResult");
    sessionStorage.removeItem("examAnswers");
    router.push("/exam/start");
  };

  if (!isLoaded || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    );
  }

  const { penilaian, pembahasan, examData, jawabanUser } = result;
  const { ringkasan } = penilaian;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold gradient-text">Hasil Ujian</span>
            </div>

            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {[
              { id: "overview" as TabType, label: "Ringkasan", icon: null },
              { id: "pg" as TabType, label: "Pilihan Ganda", icon: FileText },
              { id: "essay" as TabType, label: "Essay", icon: PenLine },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Score & Stats */}
            <div className="lg:col-span-2 space-y-6">
              <ScoreCard
                ringkasan={ringkasan}
                mataPelajaran={examData.metadata.mataPelajaran}
                jenjang={examData.metadata.jenjang}
                kelas={examData.metadata.kelas}
              />

              <StatisticsCard
                benarPG={ringkasan.benarPG}
                salahPG={ringkasan.salahPG}
                totalPG={EXAM_CONFIG.TOTAL_SOAL_PG}
                essayScores={penilaian.essay.map((e) => e.nilai)}
              />

              <LearningRecommendations
                saranBelajar={pembahasan.saranBelajar || []}
              />
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              <ResultActions onRetry={handleRetry} />

              {/* Quick Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card p-6"
              >
                <h3 className="font-bold text-gray-900 mb-4">
                  Waktu Pengerjaan
                </h3>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Tanggal Ujian</p>
                  <p className="font-medium text-gray-900">
                    {new Date(
                      examData.metadata.tanggalGenerate
                    ).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Pilihan Ganda Tab */}
        {activeTab === "pg" && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-display text-2xl text-gray-900">
                  Pembahasan Pilihan Ganda
                </h2>
                <p className="text-gray-500">
                  {ringkasan.benarPG} benar dari {EXAM_CONFIG.TOTAL_SOAL_PG}{" "}
                  soal
                </p>
              </div>
              <button
                onClick={() => setExpandAllPG(!expandAllPG)}
                className="btn-secondary py-2 px-4 text-sm"
              >
                {expandAllPG ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Tutup Semua
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Buka Semua
                  </>
                )}
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["Semua", "Benar", "Salah"].map((filter) => (
                <button
                  key={filter}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {examData.pilihanGanda.map((soal, index) => {
                const hasil = penilaian.pilihanGanda[index];
                const pembahasanData = pembahasan.pilihanGanda[index];

                return (
                  <PembahasanPG
                    key={soal.nomor}
                    nomor={soal.nomor}
                    pertanyaan={soal.pertanyaan}
                    opsi={soal.opsi}
                    jawabanUser={jawabanUser.pilihanGanda[soal.nomor] || null}
                    jawabanBenar={soal.jawabanBenar}
                    benar={hasil?.benar || false}
                    pembahasan={pembahasanData?.pembahasan || ""}
                    konsepTerkait={pembahasanData?.konsepTerkait || ""}
                    tips={pembahasanData?.tips || ""}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Essay Tab */}
        {activeTab === "essay" && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-display text-2xl text-gray-900">
                  Pembahasan Essay
                </h2>
                <p className="text-gray-500">
                  Rata-rata nilai: {Math.round(ringkasan.nilaiEssay)}%
                </p>
              </div>
              <button
                onClick={() => setExpandAllEssay(!expandAllEssay)}
                className="btn-secondary py-2 px-4 text-sm"
              >
                {expandAllEssay ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Tutup Semua
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Buka Semua
                  </>
                )}
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {examData.essay.map((soal, index) => {
                const hasil = penilaian.essay[index];
                const pembahasanData = pembahasan.essay[index];

                return (
                  <PembahasanEssay
                    key={soal.nomor}
                    nomor={soal.nomor}
                    nomorUrut={EXAM_CONFIG.TOTAL_SOAL_PG + index + 1}
                    pertanyaan={soal.pertanyaan}
                    jawabanUser={jawabanUser.essay[soal.nomor] || ""}
                    nilai={hasil?.nilai || 0}
                    feedback={hasil?.feedback || ""}
                    pembahasan={pembahasanData?.pembahasan || ""}
                    contohJawabanIdeal={
                      pembahasanData?.contohJawabanIdeal || ""
                    }
                    konsepTerkait={pembahasanData?.konsepTerkait || ""}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 mt-12 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gray-500 text-sm">
            Hasil ujian ini digenerate dan dinilai oleh AI.
            <br />
            Gunakan sebagai referensi belajar dan terus tingkatkan kemampuanmu!
          </p>
        </div>
      </footer>
    </div>
  );
}
