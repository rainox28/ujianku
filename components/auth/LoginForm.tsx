"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { AuthShell, Divider, GoogleIcon } from "./AuthShell";

const URL_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "Email ini sudah terdaftar dengan password. Masuk dengan email dan password.",
  AccessDenied: "Akses ditolak.",
};

export function LoginForm({ urlError }: { urlError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? URL_ERRORS[urlError] ?? "Gagal masuk. Coba lagi." : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Email atau password salah, atau terlalu banyak percobaan. Coba lagi nanti.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Masuk"
      subtitle="Lihat riwayat ujian dan progres belajarmu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Daftar
          </Link>
        </>
      }
    >
      <button
        type="button"
        onClick={() => signIn("google", { redirectTo: "/dashboard" })}
        className="btn-secondary w-full flex items-center justify-center gap-3"
      >
        <GoogleIcon />
        Lanjut dengan Google
      </button>

      <Divider />

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="nama@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Masuk
        </button>
      </form>
    </AuthShell>
  );
}
