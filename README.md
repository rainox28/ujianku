# UjianKu

Latihan ujian berbasis AI untuk siswa SD, SMP, dan SMA. Pilih jenjang, kelas, semester, dan mata pelajaran (atau upload materi sendiri), kerjakan ujian dengan timer, lalu dapat nilai dan pembahasan.

## Cara kerja

1. **Buat soal.** `POST /api/generate-questions` meminta Gemini membuat soal pilihan ganda dan essay. Soal PG dibuat lebih banyak dari yang diminta, lalu duplikat dibuang, kunci jawabannya diverifikasi ulang tanpa melihat kunci, dan kuncinya dibagi rata ke A-E. Soal lengkap dengan kuncinya disimpan di database; browser hanya menerima soal tanpa kunci.
2. **Kerjakan.** Timer dihitung dari tenggat di server (`expiresAt`), jadi refresh halaman tidak menambah waktu. Saat waktu habis, jawaban terkirim otomatis.
3. **Kumpulkan.** `POST /api/exams/[id]/submit` menilai di server: PG dicocokkan dengan kunci di database, essay dinilai Gemini. Satu ujian hanya bisa dinilai sekali. Hasil dan pembahasan disimpan.
4. **Lihat riwayat.** Pengguna yang login punya `/dashboard` berisi statistik dan riwayat ujian. Uji ulang membuat percobaan baru dengan soal yang sama.

Pengguna yang login bisa mengunggah materi (PDF, DOCX, PPTX, maks. 10MB). Server hanya menyimpan teks hasil ekstraksi di tabel `materials`; file aslinya tidak disimpan. Soal lalu dibuat dari materi itu.

## Tech stack

Next.js 16 (App Router) dan React 19, Tailwind CSS 4, NextAuth v5 (Google dan email/password, sesi JWT), Drizzle ORM dengan Neon Postgres, Google Gemini (`gemini-2.5-flash`).

## Menjalankan lokal

Butuh Node.js 20+ dan database Postgres (Neon).

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npx drizzle-kit migrate      # buat tabel
npm run dev
```

Buka http://localhost:3000.

### Environment

| Variabel | Keterangan |
|---|---|
| `GEMINI_API_KEY_1..3` | Kunci Google AI Studio, dirotasi per request. Minimal satu. |
| `DATABASE_URL` | Connection string Neon Postgres. |
| `AUTH_SECRET` | Rahasia NextAuth. Buat dengan `npx auth secret`. |
| `AUTH_URL` | URL aplikasi, mis. `http://localhost:3000`. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Kredensial OAuth Google. Redirect URI: `/api/auth/callback/google`. |

## Batas penggunaan

Pembatasan permintaan disimpan di tabel `rate_limits` (lihat `lib/rate-limit.ts`): tamu dibatasi per IP, pengguna login per akun, ditambah batas global untuk pembuatan soal. Batas per IP memakai header `x-forwarded-for`, jadi di luar Vercel pasang proxy yang menimpa header itu.

## Struktur

```
app/api/           route handler (generate, submit, retake, upload, results, auth)
app/exam/          halaman setup, ujian, dan hasil
app/dashboard/     riwayat dan statistik (server component)
lib/exam/          pembuatan soal, penilaian, pembahasan, ekstraksi materi
lib/db/            skema Drizzle dan migrasi
lib/rate-limit.ts  pembatasan permintaan
```

## Perintah

```bash
npm run dev                  # development
npm run build                # build produksi
npm run lint                 # ESLint
npx drizzle-kit generate     # buat migrasi dari perubahan skema
npx drizzle-kit migrate      # terapkan migrasi
```
