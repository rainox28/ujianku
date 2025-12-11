// components/result/LearningRecommendations.tsx
"use client";

import { motion } from "framer-motion";
import { Lightbulb, BookOpen, Target, ArrowRight } from "lucide-react";

interface Props {
  saranBelajar: string[];
  weakTopics?: string[];
}

export function LearningRecommendations({ saranBelajar, weakTopics }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Saran Belajar dari AI</h3>
          <p className="text-sm text-gray-500">
            Rekomendasi personal berdasarkan hasil ujianmu
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3 mb-6">
        {saranBelajar.map((saran, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl"
          >
            <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-amber-800 font-bold text-sm">
                {index + 1}
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{saran}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
    </motion.div>
  );
}
