// components/exam/GeneratingLoader.tsx
"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, FileText, CheckCircle } from "lucide-react";

const steps = [
  { icon: Brain, text: "AI sedang menganalisis kurikulum..." },
  { icon: FileText, text: "Membuat soal pilihan ganda..." },
  { icon: Sparkles, text: "Membuat soal essay..." },
  { icon: CheckCircle, text: "Memvalidasi soal..." },
];

interface Props {
  currentStep?: number;
}

export function GeneratingLoader({ currentStep = 0 }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Animated Brain */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 relative"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-25" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
            <Brain className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <h2 className="text-display text-2xl sm:text-3xl text-gray-900 mb-4">
          AI Sedang Bekerja
        </h2>
        <p className="text-gray-600 mb-8">
          Membuat soal ujian khusus untuk kamu...
        </p>

        {/* Progress Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <motion.div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-50 border border-primary-200"
                    : isComplete
                    ? "bg-success-50 border border-success-200"
                    : "bg-gray-50"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive
                      ? "bg-primary-500 text-white"
                      : isComplete
                      ? "bg-success-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-primary-700"
                      : isComplete
                      ? "text-success-700"
                      : "text-gray-400"
                  }`}
                >
                  {step.text}
                </span>
                {isActive && (
                  <motion.div
                    className="ml-auto"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Fun Fact */}
        <motion.p
          className="mt-8 text-sm text-gray-500 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          💡 Tahukah kamu? AI kami bisa membuat ratusan variasi soal yang unik!
        </motion.p>
      </div>
    </div>
  );
}
