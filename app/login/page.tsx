import { LoginForm } from "@/components/auth/LoginForm";
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  title: "Masuk",
  description: "Masuk ke UjianKu untuk melihat riwayat ujianmu",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <LoginForm urlError={error} />;
}
