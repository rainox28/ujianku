// app/exam/start/layout.tsx
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  title: "Ujian Berlangsung",
  description: "Kerjakan soal ujian dengan fokus dan teliti",
  noIndex: true, // Don't index exam pages
});

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
