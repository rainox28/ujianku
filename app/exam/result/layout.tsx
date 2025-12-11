// app/exam/result/layout.tsx
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  title: "Hasil Ujian",
  description: "Lihat nilai dan pembahasan lengkap ujianmu",
  noIndex: true,
});

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
