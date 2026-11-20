import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, LogOut, Plus, Target, TrendingUp } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { getUserStats } from "@/lib/exam/stats";
import { constructMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Dashboard",
  description: "Riwayat dan progres ujianmu",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

function scoreColor(nilai: number) {
  if (nilai >= 70) return "text-green-600";
  if (nilai >= 50) return "text-yellow-600";
  return "text-red-600";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getUserStats(session.user.id);
  const name = session.user.name?.split(" ")[0] || "Siswa";

  const cards = [
    { label: "Total ujian", value: stats.totalExams, icon: BookOpen },
    { label: "Rata-rata nilai", value: stats.averageScore, icon: TrendingUp },
    { label: "Lulus", value: stats.passCount, icon: CheckCircle2 },
    { label: "Tingkat kelulusan", value: `${stats.passRate}%`, icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/images/17.png" alt="UjianKu" width={110} height={30} />
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-ghost text-sm flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Halo, {name}</h1>
            <p className="text-gray-600 mt-1">
              {stats.totalExams > 0
                ? "Ini progres latihan ujianmu."
                : "Kamu belum mengerjakan ujian. Mulai dari yang pertama."}
            </p>
          </div>
          <Link href="/exam/setup" className="btn-primary inline-flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Buat ujian baru
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-4 sm:p-5">
              <Icon className="w-5 h-5 text-primary-600 mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {stats.totalExams > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="card p-5 lg:col-span-1 self-start">
              <h2 className="font-bold text-gray-900 mb-4">Nilai per mata pelajaran</h2>
              <ul className="space-y-4">
                {stats.subjectStats.map((s) => (
                  <li key={s.mataPelajaran}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-700">
                        {s.mataPelajaran}{" "}
                        <span className="text-gray-400">({s.count}x)</span>
                      </span>
                      <span className="font-semibold tabular-nums text-gray-900">{s.avgScore}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.min(100, s.avgScore)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5 lg:col-span-2">
              <h2 className="font-bold text-gray-900 mb-4">Riwayat ujian</h2>
              <ul className="divide-y divide-gray-100">
                {stats.recent.map((r) => (
                  <li key={r.resultId}>
                    <Link
                      href={`/exam/result?id=${r.resultId}`}
                      className="flex items-center gap-4 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{r.mataPelajaran}</p>
                        <p className="text-sm text-gray-500">
                          {r.jenjang} kelas {r.kelas} · {dateFormat.format(r.createdAt)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-full",
                          r.status === "LULUS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {r.status === "LULUS" ? "Lulus" : "Belum lulus"}
                      </span>
                      <span className={cn("text-xl font-bold tabular-nums w-12 text-right", scoreColor(r.nilaiTotal))}>
                        {Math.round(r.nilaiTotal)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
