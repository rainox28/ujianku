// app/page.tsx
import LandingPage from "@/components/home/LandingPage";
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  title: "UjianKu - Platform Ujian Cerdas Berbasis AI",
  description:
    "Platform ujian otomatis berbasis AI untuk siswa SD, SMP, dan SMA. Buat, kerjakan, dan dapatkan pembahasan instan!",
});

export default function Home() {
  return <LandingPage />;
}
