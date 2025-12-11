// components/exam/SubmitModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, X, Send } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  progress: { answered: number; total: number; percentage: number };
  isSubmitting: boolean;
}

export function SubmitModal({
  isOpen,
  onClose,
  onConfirm,
  progress,
  isSubmitting,
}: Props) {
  const isComplete = progress.answered === progress.total;
  const unanswered = progress.total - progress.answered;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
          >
            <div className="card p-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isComplete ? "bg-success-100" : "bg-warning-100"
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-8 h-8 text-success-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-warning-600" />
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                {isComplete ? "Kumpulkan Ujian?" : "Yakin Kumpulkan?"}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-center mb-6">
                {isComplete ? (
                  "Semua soal sudah terjawab. Siap untuk mengumpulkan?"
                ) : (
                  <>
                    Masih ada{" "}
                    <span className="font-bold text-warning-600">
                      {unanswered} soal
                    </span>{" "}
                    yang belum dijawab. Yakin ingin mengumpulkan?
                  </>
                )}
              </p>

              {/* Progress */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-bold text-gray-900">
                    {progress.answered}/{progress.total} soal
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${
                      isComplete ? "!from-success-500 !to-success-600" : ""
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn-secondary flex-1"
                >
                  Kembali
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner" />
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
