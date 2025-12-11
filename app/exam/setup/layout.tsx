// app/exam/setup/layout.tsx
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  title: "Mulai Ujian",
  description: "Pilih jenjang, kelas, dan mata pelajaran untuk memulai ujian",
});

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
