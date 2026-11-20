// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Keys rotation
const API_KEYS = [
  process.env.GEMINI_API_KEY_1!,
  process.env.GEMINI_API_KEY_2!,
  process.env.GEMINI_API_KEY_3!,
].filter(Boolean);

if (API_KEYS.length === 0) {
  console.warn("No GEMINI_API_KEY_1..3 set; AI calls will fail.");
}

let currentKeyIndex = 0;

// Rotate ke key berikutnya
function getNextApiKey(): string {
  if (API_KEYS.length === 0) throw new Error("GEMINI_API_KEY is not configured");
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// Buat client dengan key rotation
export function createGeminiClient() {
  const apiKey = getNextApiKey();
  return new GoogleGenerativeAI(apiKey);
}

// Model configurations
export const MODEL_CONFIG = {
  soalGenerator: {
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    },
  },
  penilaiJawaban: {
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
    },
  },
  pembahasanGenerator: {
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.5,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    },
  },
};

export type OpsiJawaban = "A" | "B" | "C" | "D" | "E";

export interface GeneratedSoalPG {
  nomor: number;
  pertanyaan: string;
  opsi: Record<OpsiJawaban, string>;
  jawabanBenar: OpsiJawaban;
}

export interface GeneratedSoalEssay {
  nomor: number;
  pertanyaan: string;
  kunciJawaban: string;
  poinPenilaian: string[];
}

export interface ExamMetadata {
  jenjang: string;
  kelas: number;
  semester: number;
  mataPelajaran: string;
  tanggalGenerate: string;
  jumlahSoalPG?: number;
  jumlahSoalEssay?: number;
}

export interface GeneratedExam {
  pilihanGanda: GeneratedSoalPG[];
  essay: GeneratedSoalEssay[];
  metadata: ExamMetadata;
}

// What the browser receives while the exam is running: no answer keys.
export type PublicSoalPG = Omit<GeneratedSoalPG, "jawabanBenar">;
export type PublicSoalEssay = Pick<GeneratedSoalEssay, "nomor" | "pertanyaan">;

export interface PublicExam {
  examId: string;
  expiresAt: string;
  pilihanGanda: PublicSoalPG[];
  essay: PublicSoalEssay[];
  metadata: ExamMetadata;
}
