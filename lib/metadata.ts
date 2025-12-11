// lib/metadata.ts
import { Metadata } from "next";

const siteConfig = {
  name: "UjianKu",
  description:
    "Platform ujian otomatis berbasis AI untuk siswa SD, SMP, dan SMA. Buat, kerjakan, dan dapatkan pembahasan instan!",
  url: "https://ujianku.vercel.app",
  ogImage: "https://ujianku.vercel.app/og.png",
  creator: "UjianKu Team",
  keywords: [
    "ujian online",
    "AI",
    "pendidikan",
    "SD",
    "SMP",
    "SMA",
    "latihan soal",
    "try out",
    "belajar online",
    "kuis",
    "pembahasan soal",
    "ujian gratis",
  ],
};

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
    manifest: "/manifest.json",
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
      apple: "/apple-touch-icon.png",
    },
  };
}

export { siteConfig };
