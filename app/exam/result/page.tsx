// app/exam/result/page.tsx - Full updated file
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
import { ScoreCard } from "@/components/result/ScoreCard";
import { StatisticsCard } from "@/components/result/StatisticsCard";
import { PembahasanPG } from "@/components/result/PembahasanPG";
import { PembahasanEssay } from "@/components/result/PembahasanEssay";
import { LearningRecommendations } from "@/components/result/LearningRecommendations";
import { ResultActions } from "@/components/result/ResultActions";
import Image from "next/image";

type TabType = "overview" | "pg" | "essay";

export default function ExamResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [expandAllPG, setExpandAllPG] = useState(false);
  const [expandAllEssay, setExpandAllEssay] = useState(false);

  // A fresh submit is in sessionStorage; a past result is fetched by ?id= from the dashboard.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");

    if (id) {
      fetch(`/api/results/${encodeURIComponent(id)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("not found");
          setResult((await res.json()).data);
          setIsLoaded(true);
        })
        .catch(() => router.replace("/dashboard"));
      return;
    }

    const resultStr = sessionStorage.getItem("examResult");
    if (!resultStr) {
      router.replace("/exam/setup");
      return;
    }

    try {
      setResult(JSON.parse(resultStr));
      setIsLoaded(true);
    } catch {
      router.replace("/exam/setup");
    }
  }, [router]);

  // A submitted exam is locked, so a retry starts a new attempt with the same questions.
  const handleRetry = async () => {
    if (!result?.examId) {
      router.push("/exam/setup");
      return;
    }
    try {
      const res = await fetch(`/api/exams/${result.examId}/retake`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      sessionStorage.setItem("examData", JSON.stringify(body.data));
      sessionStorage.removeItem("examResult");
      sessionStorage.removeItem("examAnswers");
      window.location.href = "/exam/start";
    } catch (e) {
      console.error("Retake error:", e);
      router.push("/exam/setup");
    }
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
  
  // ✅ Get actual counts from exam data
  const totalPG = examData.pilihanGanda.length;
  const totalEssay = examData.essay.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-20">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            <div className="flex items-center gap-2 w-full justify-center">
              <span className="font-bold gradient-text flex items-center gap-2">Hasil 
                <Image
                  src="/images/17.png"
                  alt="Logo Ujian Digital AI"
                  width={100}
                  height={10}
                />
              </span>
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
                totalPG={totalPG}        // ✅ Pass actual count
                totalEssay={totalEssay}  // ✅ Pass actual count
              />

              <StatisticsCard
                benarPG={ringkasan.benarPG}
                salahPG={ringkasan.salahPG}
                totalPG={totalPG}  // ✅ Use actual count
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
                  Info Ujian
                </h3>
                <div className="space-y-3">
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
                  <div className="text-center pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Jumlah Soal</p>
                    <p className="font-medium text-gray-900">
                      {totalPG} PG + {totalEssay} Essay
                    </p>
                  </div>
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
                  {ringkasan.benarPG} benar dari {totalPG} soal  {/* ✅ FIX */}
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
                    nomorUrut={totalPG + index + 1} 
                    pertanyaan={soal.pertanyaan}
                    jawabanUser={jawabanUser.essay[soal.nomor] || ""}
                    nilai={hasil?.nilai || 0}
                    feedback={hasil?.feedback || ""}
                    pembahasan={pembahasanData?.pembahasan || ""}
                    contohJawabanIdeal={
                      pembahasanData?.contohJawabanIdeal || soal.kunciJawaban || ""
                    }
                    konsepTerkait={pembahasanData?.konsepTerkait || ""}
                    konsepBenar={hasil?.konsepBenar || []}
                    konsepKurang={hasil?.konsepKurang || []}
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