// components/exam/TimeUpModal.tsx
"use client";

import { motion } from "framer-motion";
import { Clock, Send } from "lucide-react";

interface Props {
  isOpen: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function TimeUpModal({ isOpen, onSubmit, isSubmitting }: Props) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - tidak bisa ditutup */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
      >
        <div className="card p-8 text-center">
          {/* Animated Clock */}
          <motion.div
            className="w-20 h-20 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            <Clock className="w-10 h-10 text-danger-600" />
          </motion.div>

          <h3 className="text-display text-2xl text-gray-900 mb-2">
            Waktu Habis!
          </h3>
          <p className="text-gray-600 mb-8">
            Waktu ujian telah berakhir. Jawaban kamu akan dikumpulkan secara
            otomatis.
          </p>

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="btn-primary w-full py-4"
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" />
                Mengumpulkan Jawaban...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Kumpulkan Sekarang
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
