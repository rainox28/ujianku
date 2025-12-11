// app/register/layout.tsx
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  title: "Daftar",
  description: "Daftar akun UjianKu gratis untuk menyimpan riwayat ujianmu",
});

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
