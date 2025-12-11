// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Keys rotation
const API_KEYS = [
  process.env.GEMINI_API_KEY_1!,
  process.env.GEMINI_API_KEY_2!,
  process.env.GEMINI_API_KEY_3!,
].filter(Boolean);

let currentKeyIndex = 0;

// Rotate ke key berikutnya
function getNextApiKey(): string {
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

// Types untuk API response
export interface GeneratedSoalPG {
  nomor: number;
  pertanyaan: string;
  opsi: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  jawabanBenar: "A" | "B" | "C" | "D" | "E";
}

export interface GeneratedSoalEssay {
  nomor: number;
  pertanyaan: string;
  kunciJawaban: string;
  poinPenilaian: string[];
}

export interface GeneratedExam {
  pilihanGanda: GeneratedSoalPG[];
  essay: GeneratedSoalEssay[];
  metadata: {
    jenjang: string;
    kelas: number;
    semester: number;
    mataPelajaran: string;
    tanggalGenerate: string;
  };
}

export interface GeneratedSoalPG {
  nomor: number;
  pertanyaan: string;
  opsi: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  jawabanBenar: "A" | "B" | "C" | "D" | "E";
}

export interface GeneratedSoalEssay {
  nomor: number;
  pertanyaan: string;
  kunciJawaban: string;
  poinPenilaian: string[];
}