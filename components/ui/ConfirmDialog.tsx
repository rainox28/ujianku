// components/ui/ConfirmDialog.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "warning",
  isLoading = false,
}: Props) {
  const variants = {
    danger: {
      icon: "bg-danger-100",
      iconColor: "text-danger-600",
      button: "bg-danger-600 hover:bg-danger-700 text-white",
    },
    warning: {
      icon: "bg-warning-100",
      iconColor: "text-warning-600",
      button: "bg-warning-600 hover:bg-warning-700 text-white",
    },
    info: {
      icon: "bg-primary-100",
      iconColor: "text-primary-600",
      button: "bg-primary-600 hover:bg-primary-700 text-white",
    },
  };

  const style = variants[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
          >
            <div className="card p-6 relative">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div
                className={`w-12 h-12 ${style.icon} rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <AlertTriangle className={`w-6 h-6 ${style.iconColor}`} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                {title}
              </h3>
              <p className="text-gray-600 text-center mb-6">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="btn-secondary flex-1"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${style.button} disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="loading-spinner" />
                  ) : (
                    confirmText
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
