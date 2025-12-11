// app/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowRight,
  FileText,
  Trophy,
  Users,
  Zap,
  Upload,
  BarChart3,
  Shield,
  Smartphone,
} from "lucide-react";
import { EXAM_CONFIG } from "@/lib/constants";
import { Caveat } from "next/font/google";
import Image from "next/image";

// Inisialisasi font unik
const handwritten = Caveat({
  subsets: ["latin"],
  weight: ["700"], // Kita ambil yang tebal agar terbaca jelas
  variable: "--font-handwritten",
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Cari bagian array ini di dalam component
const features = [
  {
    icon: Brain,
    title: "AI Pembuat Soal",
    description: "Soal dibuat otomatis oleh AI berdasarkan kelas...",
    // Hapus 'color' gradient yang lama jika tidak dipakai di tempat lain
    // Ganti dengan class text solid
    iconColor: "text-purple-600", 
    bgColor: "bg-purple-50",
  },
  {
    icon: Upload,
    title: "Upload Materi",
    description: "Upload PDF, DOCX, atau PPT sebagai referensi...",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Clock,
    title: "Timer Real-time",
    description: "Timer 90 menit yang berjalan real-time...",
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: CheckCircle,
    title: "Penilaian Otomatis",
    description: "Jawaban dinilai otomatis oleh AI...",
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: BookOpen,
    title: "Pembahasan Lengkap",
    description: "Setiap soal disertai pembahasan detail...",
    iconColor: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    icon: BarChart3,
    title: "Hasil Instan",
    description: "Lihat nilai dan status kelulusan langsung...",
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {/* <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-display font-extrabold gradient-text">
                UjianKu
              </span> */}
              <Image
                src="/images/17.png"
                alt="Logo Ujian Digital AI"
                width={120}
                height={10}
              />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#fitur" className="nav-link">
                Fitur
              </a>
              <a href="#cara-kerja" className="nav-link">
                Cara Kerja
              </a>
              <a href="#jenjang" className="nav-link">
                Jenjang
              </a>
            </div>
            <Link href="/exam/setup" className="btn-primary text-sm">
              Mulai Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Badge */}
            {/* <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-heading font-medium mb-8 border border-primary-100"
            >
              <Sparkles className="w-4 h-4" />
              Platform Ujian Berbasis AI
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            </motion.div> */}

            <Image
              src="/images/17.png"
              alt="Logo Ujian Digital AI"
              width={250}
              height={10}
              className="mx-auto"
            />

            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              className="relative text-display text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.15] tracking-tight"
            >
              Ujian Digital yang{" "}
              <span className="relative inline-block whitespace-nowrap">
                {/* Text dengan Font Unik */}
                <span
                  className={`${handwritten.className} text-primary-600 text-5xl sm:text-6xl lg:text-8xl relative z-10 -rotate-2 inline-block`}
                >
                  Cerdas{" "}
                </span>

                {/* Dekorasi Coretan/Underline di bawah kata Cerdas */}
                <svg
                  className="absolute -bottom-2 w-full h-3 text-accent-400 -z-0 opacity-70"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                  />
                </svg>
              </span>
              <br className="hidden sm:block" /> untuk{" "}
              <span className="relative inline-block whitespace-nowrap mx-2">
                {/* Background Shape yang dimiringkan */}
                <span className="absolute inset-0 -skew-y-2 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/30 transform transition-transform group-hover:skew-y-0" />

                {/* Text Generasi Modern */}
                <span className="relative px-4 py-1 text-white text-3xl sm:text-4xl lg:text-6xl italic font-serif tracking-wide">
                  Generasi Modern
                </span>
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 font-body leading-relaxed"
            >
              Buat soal, kerjakan ujian, dan dapatkan pembahasan instan — semua
              didukung{" "}
              <span className="font-semibold text-primary-600">
                Kecerdasan Buatan
              </span>
              . Cocok untuk siswa SD, SMP, dan SMA yang ingin belajar lebih
              efektif.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/exam/setup"
                className="btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-500/30"
              >
                <Zap className="w-5 h-5" />
                Mulai Ujian Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#cara-kerja" className="btn-secondary text-lg px-8 py-4">
                <span>Lihat Cara Kerja</span>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mt-16"
            >
              {[
                { value: "35", label: "Soal per Ujian" },
                { value: "90", label: "Menit Durasi" },
                { value: "< 5s", label: "Generate AI" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="stat-number gradient-text">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image - Exam Paper Preview */}
          <motion.div
            className="mt-16 sm:mt-20 relative px-4 sm:px-0"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Gradient overlay for fade effect at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />

            {/* Decorative elements (Background Blobs) */}
            <div className="absolute -top-6 -left-6 sm:-top-10 sm:-left-10 w-32 h-32 sm:w-40 sm:h-40 bg-primary-200 rounded-full blur-3xl opacity-40" />
            <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 w-48 h-48 sm:w-60 sm:h-60 bg-accent-200 rounded-full blur-3xl opacity-40" />

            {/* Paper Container */}
            <div className="exam-paper-clean max-w-4xl mx-auto p-5 sm:p-12 relative shadow-2xl shadow-primary-900/5 border border-gray-100/80 bg-white/80 backdrop-blur-sm">
              {/* Header Exam */}
              <div className="border-b-2 border-gray-100 pb-5 mb-5 sm:pb-6 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-gray-800 leading-tight">
                      UJIAN AKHIR SEMESTER
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 mt-1 font-body flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">
                        SMA
                      </span>
                      Matematika - Kelas 10
                    </p>
                  </div>

                  {/* Timer Badge */}
                  <div className="flex items-center gap-3 bg-primary-50 px-3 py-2 sm:px-4 sm:py-2 rounded-xl w-full sm:w-auto border border-primary-100">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Clock className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-heading uppercase tracking-wider font-bold">
                        Sisa Waktu
                      </div>
                      <div className="timer-display text-primary-700 text-base sm:text-lg leading-none">
                        89:45
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Question Area */}
              <div className="space-y-6">
                <div className="p-4 sm:p-6 bg-gray-50/80 rounded-2xl border border-gray-100">
                  <div className="flex gap-3 sm:gap-5">
                    {/* Number Badge */}
                    <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-sm sm:text-base font-bold text-primary-600 font-mono border border-gray-100">
                      1
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Question Text */}
                      <p className="text-gray-800 mb-5 font-serif text-base sm:text-lg leading-relaxed">
                        Jika diketahui fungsi{" "}
                        <span className="font-mono bg-white px-1 rounded border border-gray-200 text-sm">
                          f(x) = 2x² + 3x - 5
                        </span>
                        , maka nilai dari{" "}
                        <span className="font-mono bg-white px-1 rounded border border-gray-200 text-sm">
                          f(-2)
                        </span>{" "}
                        adalah...
                      </p>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "A", text: "-3", selected: true },
                          { label: "B", text: "-1", selected: false },
                          { label: "C", text: "1", selected: false },
                          { label: "D", text: "3", selected: false },
                          { label: "E", text: "5", selected: false },
                        ].map((opt, i) => (
                          <div
                            key={i}
                            className={`
                    group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-default select-none
                    ${
                      opt.selected
                        ? "bg-white border-primary-500 shadow-md shadow-primary-500/10 scale-[1.02]"
                        : "bg-white border-transparent hover:border-gray-200 shadow-sm opacity-80"
                    }
                  `}
                          >
                            <span
                              className={`
                      w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors
                      ${
                        opt.selected
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }
                    `}
                            >
                              {opt.label}
                            </span>
                            <span
                              className={`font-medium ${
                                opt.selected
                                  ? "text-primary-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {opt.text}
                            </span>

                            {/* Checkmark for selected */}
                            {opt.selected && (
                              <div className="ml-auto text-primary-600">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-primary mb-4">
              <Sparkles className="w-3 h-3" />
              Fitur Lengkap
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-balance">
              Fitur <span className="gradient-text-animated">Unggulan</span>
            </h2>
            <p className="section-subtitle">
              Semua yang kamu butuhkan untuk pengalaman ujian digital terbaik
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Ganti bagian .map() kamu dengan ini */}
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="card-hover p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Container Icon */}
                <div className={`feature-icon ${feature.bgColor} mb-4`}>
                  {/* Icon Render */}
                  <feature.icon
                    // Gunakan class warna solid
                    className={`w-7 h-7 ${feature.iconColor}`}
                    // Hapus style color: transparent dan backgroundClip
                  />
                </div>
                <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-body leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Additional Features Row */}
          <motion.div
            className="mt-12 grid sm:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { icon: Smartphone, text: "Mobile-First Design" },
              { icon: Shield, text: "Data Tersimpan Aman" },
              { icon: Zap, text: "Super Cepat & Ringan" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary-600" />
                </div>
                <span className="font-heading font-medium text-gray-700">
                  {item.text}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="cara-kerja" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-accent mb-4">
              <ArrowRight className="w-3 h-3" />
              Mudah & Cepat
            </span>
            <h2 className="section-title">
              Cara <span className="gradient-text">Kerja</span>
            </h2>
            <p className="section-subtitle">
              Hanya 4 langkah mudah untuk memulai ujian
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                step: "01",
                title: "Pilih Jenjang",
                description:
                  "Pilih SD, SMP, atau SMA sesuai tingkat pendidikanmu",
                icon: Users,
                color: "from-blue-500 to-cyan-500",
              },
              {
                step: "02",
                title: "Atur Ujian",
                description:
                  "Pilih kelas, semester, dan mata pelajaran yang ingin diujikan",
                icon: FileText,
                color: "from-purple-500 to-indigo-500",
              },
              {
                step: "03",
                title: "Kerjakan Soal",
                description: `AI membuat ${
                  EXAM_CONFIG.TOTAL_SOAL_PG + EXAM_CONFIG.TOTAL_SOAL_ESSAY
                } soal dan kamu mengerjakan dalam ${
                  EXAM_CONFIG.DURASI_MENIT
                } menit`,
                icon: Brain,
                color: "from-pink-500 to-rose-500",
              },
              {
                step: "04",
                title: "Lihat Hasil",
                description:
                  "Dapatkan nilai dan pembahasan lengkap secara instan",
                icon: Trophy,
                color: "from-amber-500 to-orange-500",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-14 left-[60%] w-[80%] h-0.5">
                    <div className="h-full bg-gradient-to-r from-gray-300 to-transparent" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full" />
                  </div>
                )}

                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div
                      className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${item.color} opacity-10 absolute inset-0`}
                    />
                    <div className="w-28 h-28 rounded-3xl bg-white border border-gray-100 shadow-lg flex items-center justify-center relative">
                      <item.icon className="w-12 h-12 text-gray-700" />
                    </div>
                    <div className="absolute -top-3 -right-3 step-number shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm font-body leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Jenjang Section */}
      <section
        id="jenjang"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-success mb-4">
              <CheckCircle className="w-3 h-3" />
              Semua Tingkatan
            </span>
            <h2 className="section-title">
              Untuk Semua <span className="gradient-text">Jenjang</span>
            </h2>
            <p className="section-subtitle">
              Dari SD hingga SMA, semua mata pelajaran tersedia
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                jenjang: "SD",
                fullName: "Sekolah Dasar",
                kelas: "Kelas 1 - 6",
                pelajaran: [
                  "Matematika",
                  "IPA",
                  "IPS",
                  "B. Indonesia",
                  "B. Inggris",
                  "PKN",
                ],
                icon: "🎒",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
              },
              {
                jenjang: "SMP",
                fullName: "Sekolah Menengah Pertama",
                kelas: "Kelas 7 - 9",
                pelajaran: [
                  "Matematika",
                  "IPA",
                  "IPS",
                  "B. Indonesia",
                  "B. Inggris",
                  "PKN",
                  "Sejarah",
                ],
                icon: "📚",
                color: "from-blue-500 to-cyan-500",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
              },
              {
                jenjang: "SMA",
                fullName: "Sekolah Menengah Atas",
                kelas: "Kelas 10 - 12",
                pelajaran: [
                  "Matematika",
                  "Fisika",
                  "Kimia",
                  "Biologi",
                  "Ekonomi",
                  "Geografi",
                  "Sosiologi",
                ],
                icon: "🎓",
                color: "from-purple-500 to-indigo-500",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="card overflow-hidden group hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center text-3xl`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-gray-900">
                        {item.jenjang}
                      </h3>
                      <p className="text-sm text-gray-500 font-body">
                        {item.fullName}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 ${item.bgColor} ${item.borderColor} border rounded-full text-sm font-heading font-medium mb-4`}
                  >
                    {item.kelas}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.pelajaran.map((p, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-body hover:bg-gray-200 transition-colors cursor-default"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative rounded-3xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800" />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/20 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white/90 text-sm font-heading mb-6">
                <Sparkles className="w-4 h-4" />
                100% Gratis
              </div>

              <h2 className="text-display text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
                Siap Memulai Ujian?
              </h2>
              <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto font-body">
                Tidak perlu daftar. Langsung pilih materi dan mulai kerjakan
                ujian sekarang! AI kami siap membuat soal khusus untukmu.
              </p>

              <Link
                href="/exam/setup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-heading font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 hover:-translate-y-0.5 shadow-xl shadow-black/20"
              >
                <Zap className="w-5 h-5" />
                Mulai Ujian Sekarang
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/20">
                {[
                  {
                    value: `${EXAM_CONFIG.TOTAL_SOAL_PG}+${EXAM_CONFIG.TOTAL_SOAL_ESSAY}`,
                    label: "Soal",
                  },
                  { value: `${EXAM_CONFIG.DURASI_MENIT}m`, label: "Durasi" },
                  { value: "AI", label: "Powered" },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-display font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-primary-200 font-heading">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {/* <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-display font-extrabold gradient-text">
                  UjianKu
                </span>
                <p className="text-xs text-gray-500 font-body">
                  Platform Ujian Berbasis AI
                </p>
              </div> */}
              <Image
                src="/images/17.png"
                alt="Logo Ujian Digital AI"
                width={100}
                height={10}
              />
            </div>

            <div className="flex items-center gap-6 text-sm font-heading">
              <a
                href="#fitur"
                className="text-gray-500 hover:text-primary-600 transition-colors"
              >
                Fitur
              </a>
              <a
                href="#cara-kerja"
                className="text-gray-500 hover:text-primary-600 transition-colors"
              >
                Cara Kerja
              </a>
              <a
                href="#jenjang"
                className="text-gray-500 hover:text-primary-600 transition-colors"
              >
                Jenjang
              </a>
            </div>

            <p className="text-gray-400 text-sm font-body">
              © 2024 UjianKu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
