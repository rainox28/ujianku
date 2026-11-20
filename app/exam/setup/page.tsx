// app/exam/setup/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  FileText,
  CheckCircle,
  Sparkles,
  GraduationCap,
  Calendar,
  BookMarked,
  Brain,
  Loader2,
  Settings,
  Clock,
} from "lucide-react";
import { Jenjang, Kelas, Semester, ExamSetup } from "@/types";
import {
  MATA_PELAJARAN,
  KELAS_BY_JENJANG,
  JENJANG_OPTIONS,
  EXAM_CONFIG,
  calculateDuration,
} from "@/lib/constants";
import { cn, getKelasSuffix, getSemesterLabel } from "@/lib/utils";
import { useGenerateExam } from "@/hooks/useGenerateExam";
import { QuestionCountSelector } from "@/components/exam/QuestionCountSelector";
import Image from "next/image";


// Mirrors the server pipeline in lib/exam/generate.ts; the server buffers PG by 1.5x in batches of 10.
function loaderSteps(jumlahSoalPG: number) {
  const batches = Math.ceil((jumlahSoalPG * 1.5) / 10);
  return [
    { icon: Brain, text: "Menyiapkan materi sesuai kurikulum..." },
    ...Array.from({ length: batches }, (_, i) => ({
      icon: FileText,
      text: `Membuat soal pilihan ganda (bagian ${i + 1} dari ${batches})...`,
    })),
    { icon: Sparkles, text: "Membuat soal essay..." },
    { icon: CheckCircle, text: "Memeriksa ulang kunci jawaban..." },
  ];
}

function GeneratingLoader({ step, jumlahSoalPG }: { step: number; jumlahSoalPG: number }) {
  const displaySteps = loaderSteps(jumlahSoalPG);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Animated Brain */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 relative"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-25" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
            <Brain className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Menyiapkan Soal Ujianmu
        </h2>
        <p className="text-gray-600 mb-8">
          Biasanya butuh 30-40 detik. Jangan tutup halaman ini.
        </p>

        {/* Progress Steps */}
        <div className="space-y-3 text-left">
          {displaySteps.map((s, index) => {
            const Icon = s.icon;
            const isActive = index === step;
            const isComplete = index < step;

            return (
              <motion.div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  isActive && "bg-primary-50 border border-primary-200",
                  isComplete && "bg-green-50 border border-green-200",
                  !isActive && !isComplete && "bg-gray-50"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isActive && "bg-primary-500 text-white",
                    isComplete && "bg-green-500 text-white",
                    !isActive && !isComplete && "bg-gray-200 text-gray-400"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium flex-1",
                    isActive && "text-primary-700",
                    isComplete && "text-green-700",
                    !isActive && !isComplete && "text-gray-400"
                  )}
                >
                  {s.text}
                </span>
                {isActive && (
                  <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ✅ Error Component
function ErrorDisplay({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="card p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Gagal Generate Soal
        </h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onRetry} className="btn-primary">
            Coba Lagi
          </button>
          <Link href="/" className="btn-secondary">
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ExamSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [generatingStep, setGeneratingStep] = useState(0);
  const TOTAL_STEPS = 5; // Now 5 steps instead of 4

  const [formData, setFormData] = useState<ExamSetup>({
    jenjang: "SMP",
    kelas: 7,
    semester: 1,
    mataPelajaran: "",
    jumlahSoalPG: EXAM_CONFIG.DEFAULT_SOAL_PG,
    jumlahSoalEssay: EXAM_CONFIG.DEFAULT_SOAL_ESSAY,
    uploadedFile: null,
  });

  const { isLoading, error, generateExam, reset } = useGenerateExam();
  const { status: authStatus } = useSession();

  const [material, setMaterial] = useState<{ id: string; name: string; chars: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const availableMapel = MATA_PELAJARAN.filter((m) =>
    m.tersediaUntuk.includes(formData.jenjang)
  );

  const estimatedDuration = calculateDuration(
    formData.jumlahSoalPG,
    formData.jumlahSoalEssay
  );

  const handleJenjangChange = (jenjang: Jenjang) => {
    const defaultKelas = KELAS_BY_JENJANG[jenjang][0] as Kelas;
    setFormData((prev) => ({
      ...prev,
      jenjang,
      kelas: defaultKelas,
      mataPelajaran: "",
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    if (!EXAM_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError("Format file tidak didukung. Gunakan PDF, DOCX, atau PPTX.");
      return;
    }
    if (file.size > EXAM_CONFIG.MAX_FILE_SIZE) {
      setUploadError("Ukuran file maksimal 10MB.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upload gagal. Coba lagi.");
      setMaterial({ id: json.data.materialId, name: json.data.fileName, chars: json.data.charCount });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setMaterial(null);
    setUploadError(null);
  };

  const handleSubmit = async () => {
    if (!formData.mataPelajaran) {
      setSetupError("Pilih mata pelajaran terlebih dahulu");
      return;
    }

    // Clear old data
    sessionStorage.removeItem("examData");
    sessionStorage.removeItem("examAnswers");
    sessionStorage.removeItem("examResult");
    sessionStorage.removeItem("examStartTime");
    sessionStorage.removeItem("examSetup");

    setSetupError(null);
    setGeneratingStep(0);

    const totalLoadingSteps = loaderSteps(formData.jumlahSoalPG).length;

    const stepInterval = setInterval(() => {
      setGeneratingStep((prev) =>
        prev < totalLoadingSteps - 1 ? prev + 1 : prev
      );
    }, 4000);

    try {
      const result = await generateExam({
        jenjang: formData.jenjang,
        kelas: formData.kelas,
        semester: formData.semester,
        mataPelajaran: formData.mataPelajaran,
        jumlahSoalPG: formData.jumlahSoalPG,
        jumlahSoalEssay: formData.jumlahSoalEssay,
        materialId: material?.id,
      });

      clearInterval(stepInterval);

      if (result) {
        sessionStorage.setItem("examData", JSON.stringify(result));
        sessionStorage.setItem(
          "examSetup",
          JSON.stringify({
            jenjang: formData.jenjang,
            kelas: formData.kelas,
            semester: formData.semester,
            mataPelajaran: formData.mataPelajaran,
            jumlahSoalPG: formData.jumlahSoalPG,
            jumlahSoalEssay: formData.jumlahSoalEssay,
            durasi: estimatedDuration,
          })
        );

        window.location.href = "/exam/start";
      }
    } catch (err) {
      clearInterval(stepInterval);
      setGeneratingStep(0);
    }
  };

  const handleRetry = () => {
    reset();
    setGeneratingStep(0);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!formData.jenjang;
      case 2:
        return !!formData.kelas && !!formData.semester;
      case 3:
        return !!formData.mataPelajaran;
      case 4:
        return (
          formData.jumlahSoalPG >= EXAM_CONFIG.MIN_SOAL_PG &&
          formData.jumlahSoalEssay >= EXAM_CONFIG.MIN_SOAL_ESSAY
        );
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Show Loading Screen
  if (isLoading) {
    return <GeneratingLoader step={generatingStep} jumlahSoalPG={formData.jumlahSoalPG} />;
  }

  // Show Error Screen
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} jam ${mins > 0 ? `${mins} menit` : ""}`;
    }
    return `${mins} menit`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
            <div className="flex items-center gap-2">
              <Image
                src="/images/17.png"
                alt="Logo Ujian Digital AI"
                width={100}
                height={10}
              />
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Langkah {step} dari {TOTAL_STEPS}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((step / TOTAL_STEPS) * 100)}% selesai
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Pilih Jenjang */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                  <GraduationCap className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Pilih Jenjang Pendidikan
                </h1>
                <p className="text-gray-600">
                  Pilih jenjang sekolah sesuai tingkat pendidikanmu
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {JENJANG_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleJenjangChange(option.value)}
                    className={cn(
                      "card p-6 text-left transition-all duration-200 hover:shadow-lg",
                      formData.jenjang === option.value
                        ? "ring-2 ring-primary-500 bg-primary-50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold gradient-text">
                        {option.label}
                      </span>
                      {formData.jenjang === option.value && (
                        <CheckCircle className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Pilih Kelas & Semester */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Pilih Kelas & Semester
                </h1>
                <p className="text-gray-600">
                  Tentukan kelas dan semester yang ingin diujikan
                </p>
              </div>

              <div className="space-y-6">
                {/* Kelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Kelas
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {KELAS_BY_JENJANG[formData.jenjang].map((kelas) => (
                      <button
                        key={kelas}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            kelas: kelas as Kelas,
                          }))
                        }
                        className={cn(
                          "py-3 px-4 rounded-xl font-semibold transition-all duration-200",
                          formData.kelas === kelas
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                            : "bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300"
                        )}
                      >
                        {kelas}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Semester
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((sem) => (
                      <button
                        key={sem}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            semester: sem as Semester,
                          }))
                        }
                        className={cn(
                          "py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                          formData.semester === sem
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                            : "bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300"
                        )}
                      >
                        <span>Semester {sem}</span>
                        <span className="text-sm opacity-80">
                          ({sem === 1 ? "Ganjil" : "Genap"})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Pilih Mata Pelajaran */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                  <BookMarked className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Pilih Mata Pelajaran
                </h1>
                <p className="text-gray-600">
                  Pilih mata pelajaran yang ingin kamu ujikan
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availableMapel.map((mapel) => (
                  <button
                    key={mapel.id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        mataPelajaran: mapel.id,
                      }))
                    }
                    className={cn(
                      "card p-4 text-left transition-all duration-200 hover:shadow-lg",
                      formData.mataPelajaran === mapel.id
                        ? "ring-2 ring-primary-500 bg-primary-50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mapel.icon}</span>
                      <span className="font-medium text-gray-900">
                        {mapel.nama}
                      </span>
                      {formData.mataPelajaran === mapel.id && (
                        <CheckCircle className="w-5 h-5 text-primary-600 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Pilih Jumlah Soal (NEW) */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                  <Settings className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Atur Jumlah Soal
                </h1>
                <p className="text-gray-600">
                  Tentukan berapa banyak soal yang ingin kamu kerjakan
                </p>
              </div>

              <QuestionCountSelector
                jumlahPG={formData.jumlahSoalPG}
                jumlahEssay={formData.jumlahSoalEssay}
                onChangePG={(value) =>
                  setFormData((prev) => ({ ...prev, jumlahSoalPG: value }))
                }
                onChangeEssay={(value) =>
                  setFormData((prev) => ({ ...prev, jumlahSoalEssay: value }))
                }
              />
            </motion.div>
          )}

          {/* Step 5: Upload Materi & Konfirmasi */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Siap Memulai Ujian!
                </h1>
                <p className="text-gray-600">
                  Upload materi (opsional) dan konfirmasi pilihan kamu
                </p>
              </div>

              <div className="space-y-6">
                {/* Summary */}
                <div className="card p-6 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Ringkasan Ujian
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Jenjang & Kelas</p>
                        <p className="font-medium text-gray-900">
                          {formData.jenjang} - {getKelasSuffix(formData.kelas)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Semester</p>
                        <p className="font-medium text-gray-900">
                          {getSemesterLabel(formData.semester)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookMarked className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mata Pelajaran</p>
                        <p className="font-medium text-gray-900">
                          {
                            availableMapel.find(
                              (m) => m.id === formData.mataPelajaran
                            )?.nama
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Jumlah Soal</p>
                        <p className="font-medium text-gray-900">
                          {formData.jumlahSoalPG} PG +{" "}
                          {formData.jumlahSoalEssay} Essay
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Waktu Pengerjaan
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatDuration(estimatedDuration)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Upload Materi Referensi
                    </h3>
                    <span className="text-xs bg-green-200 text-green-600 px-2 py-1 rounded-full">
                      Opsional
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload file materi (PDF, DOCX, PPTX) agar soal lebih
                    relevan.
                  </p>

                  {authStatus === "unauthenticated" ? (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
                      <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                        Masuk
                      </Link>{" "}
                      atau{" "}
                      <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                        daftar
                      </Link>{" "}
                      untuk upload materi. Tanpa materi, soal dibuat dari kurikulum.
                    </div>
                  ) : material ? (
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{material.name}</p>
                        <p className="text-sm text-gray-500">
                          {material.chars.toLocaleString("id-ID")} karakter dibaca. Soal dibuat dari materi ini.
                        </p>
                      </div>
                      <button
                        onClick={removeFile}
                        aria-label="Hapus materi"
                        className="p-2 hover:bg-green-100 rounded-lg"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all">
                      {uploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                          <p className="text-sm text-gray-500">Membaca file...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold text-primary-600">Klik untuk upload</span>
                          </p>
                          <p className="text-xs text-gray-400">PDF, DOCX, atau PPTX (Max 10MB)</p>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.pptx"
                        disabled={uploading || authStatus === "loading"}
                        onChange={handleFileUpload}
                      />
                    </label>
                  )}
                  {uploadError && (
                    <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {uploadError}
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl text-sm">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">
                      Soal dibuat lalu dicek ulang kunci jawabannya
                    </p>
                    <p className="text-blue-700">
                      Proses ini butuh sekitar 30-40 detik. Jangan tutup halaman selama soal dibuat.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {setupError && (
          <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {setupError}
          </p>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
          <button
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            className={cn("btn-secondary", step === 1 && "invisible")}
          >
            <ArrowLeft className="w-5 h-5" />
            Sebelumnya
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((prev) => Math.min(TOTAL_STEPS, prev + 1))}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Selanjutnya
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary"
            >
              <Sparkles className="w-5 h-5" />
              Mulai Ujian
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
