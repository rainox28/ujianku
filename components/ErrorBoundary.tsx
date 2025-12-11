// components/ErrorBoundary.tsx
"use client"; // ✅ ADD THIS

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-danger-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Terjadi Kesalahan
            </h2>
            <p className="text-gray-600 mb-6">
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang
              </button>
              <Link href="/" className="btn-secondary">
                <Home className="w-4 h-4" />
                Ke Beranda
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
