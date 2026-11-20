import { RegisterForm } from "@/components/auth/RegisterForm";
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  title: "Daftar",
  description: "Buat akun UjianKu untuk menyimpan hasil ujianmu",
  noIndex: true,
});

export default function RegisterPage() {
  return <RegisterForm />;
}
