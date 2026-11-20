// components/result/ResultActions.tsx
"use client";

import { motion } from "framer-motion";
import { RefreshCw, Home, Download, Share2 } from "lucide-react";
import Link from "next/link";

interface Props {
  onRetry: () => void;
}

export function ResultActions({ onRetry }: Props) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hasil Ujian UjianKu",
          text: "Lihat hasil ujian saya di UjianKu!",
          url: window.location.href,
        });
      } catch {
        // The user dismissed the share sheet.
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link disalin ke clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card p-6"
    >
      <h3 className="font-bold text-gray-900 mb-4">Apa Selanjutnya?</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRetry}
          className="flex flex-col items-center gap-2 p-4 bg-primary-50 hover:bg-primary-100 rounded-xl text-primary-700 transition-colors"
        >
          <RefreshCw className="w-6 h-6" />
          <span className="font-medium text-sm">Uji Ulang</span>
        </button>

        <Link
          href="/exam/setup"
          className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
        >
          <Home className="w-6 h-6" />
          <span className="font-medium text-sm">Ujian Baru</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
        >
          <Download className="w-6 h-6" />
          <span className="font-medium text-sm">Cetak PDF</span>
        </button>

        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
        >
          <Share2 className="w-6 h-6" />
          <span className="font-medium text-sm">Bagikan</span>
        </button>
      </div>
    </motion.div>
  );
}
