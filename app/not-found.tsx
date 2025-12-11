// app/not-found.tsx
"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <span className="text-[150px] font-bold text-gray-100 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-primary-600" />
            </div>
          </div>
        </div>

        <h1 className="text-display text-3xl text-gray-900 mb-4">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-gray-600 mb-8">
          Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" />
            Ke Beranda
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
