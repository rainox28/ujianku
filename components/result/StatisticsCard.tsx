// components/result/StatisticsCard.tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, MinusCircle, Clock } from "lucide-react";
import { EXAM_CONFIG } from "@/lib/constants";

interface Props {
  benarPG: number;
  salahPG: number;
  totalPG: number;
  essayScores: number[];
}

export function StatisticsCard({
  benarPG,
  salahPG,
  totalPG,
  essayScores,
}: Props) {
  const tidakDijawab = totalPG - benarPG - salahPG;
  const avgEssay =
    essayScores.length > 0
      ? essayScores.reduce((a, b) => a + b, 0) / essayScores.length
      : 0;

  const stats = [
    {
      label: "Benar",
      value: benarPG,
      icon: CheckCircle,
      color: "text-success-600",
      bg: "bg-success-50",
    },
    {
      label: "Salah",
      value: salahPG,
      icon: XCircle,
      color: "text-danger-600",
      bg: "bg-danger-50",
    },
    {
      label: "Kosong",
      value: tidakDijawab,
      icon: MinusCircle,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      label: "Rata-rata Essay",
      value: `${Math.round(avgEssay)}%`,
      icon: Clock,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card p-6"
    >
      <h3 className="font-bold text-gray-900 mb-4">Statistik Jawaban</h3>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`${stat.bg} rounded-xl p-4`}
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Bars */}
      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Tingkat Kebenaran PG</span>
            <span className="font-medium text-gray-900">
              {Math.round((benarPG / totalPG) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill !from-success-500 !to-success-600"
              initial={{ width: 0 }}
              animate={{ width: `${(benarPG / totalPG) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Rata-rata Essay</span>
            <span className="font-medium text-gray-900">
              {Math.round(avgEssay)}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${avgEssay}%` }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
