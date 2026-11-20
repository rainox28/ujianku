import JSZip from "jszip";
import { extractText, getDocumentProxy } from "unpdf";

/** Text kept per material. Longer documents are cut, which is plenty for one exam. */
export const MAX_MATERIAL_CHARS = 40_000;
const MIN_MATERIAL_CHARS = 200;
const MAX_PDF_PAGES = 150;
const MAX_PPTX_SLIDES = 300;
// A 10MB upload can inflate far beyond that; refuse archives that expand past this.
const MAX_UNZIPPED_BYTES = 30 * 1024 * 1024;

export class MaterialError extends Error {}

export type MaterialKind = "pdf" | "docx" | "pptx";

const MIME: Record<string, MaterialKind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

/** The browser-reported type is only a hint, so the file signature is checked as well. */
export function detectKind(file: File, bytes: Uint8Array): MaterialKind {
  const kind = MIME[file.type];
  if (!kind) throw new MaterialError("Format file tidak didukung. Gunakan PDF, DOCX, atau PPTX.");

  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  const isPdf = startsWith([0x25, 0x50, 0x44, 0x46]); // %PDF
  const isZip = startsWith([0x50, 0x4b, 0x03, 0x04]); // PK..
  if ((kind === "pdf" && !isPdf) || (kind !== "pdf" && !isZip)) {
    throw new MaterialError("Isi file tidak sesuai dengan formatnya.");
  }
  return kind;
}

function decodeXml(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** Pulls the text runs out of WordprocessingML / DrawingML, one line per paragraph. */
function xmlToText(xml: string, run: string, paragraph: string) {
  const text = xml
    .replace(new RegExp(`</${paragraph}>`, "g"), "\n")
    .replace(/<(?:w:br|a:br)\s*\/>/g, "\n")
    .replace(/<w:tab\s*\/>/g, "\t");
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const runs = [...line.matchAll(new RegExp(`<${run}(?:\s[^>]*)?>([^<]*)</${run}>`, "g"))];
    const joined = runs.map((m) => decodeXml(m[1])).join("");
    if (joined.trim()) out.push(joined.trim());
  }
  return out.join("\n");
}

async function openZip(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  let total = 0;
  zip.forEach((_path, entry) => {
    const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    total += size ?? 0;
  });
  if (total > MAX_UNZIPPED_BYTES) throw new MaterialError("File terlalu besar setelah dibuka.");
  return zip;
}

async function readDocx(bytes: Uint8Array) {
  const zip = await openZip(bytes);
  const doc = zip.file("word/document.xml");
  if (!doc) throw new MaterialError("File DOCX tidak valid.");
  return xmlToText(await doc.async("string"), "w:t", "w:p");
}

async function readPptx(bytes: Uint8Array) {
  const zip = await openZip(bytes);
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
    .slice(0, MAX_PPTX_SLIDES);
  if (slides.length === 0) throw new MaterialError("File PPTX tidak valid.");

  const parts: string[] = [];
  for (const name of slides) {
    const text = xmlToText(await zip.file(name)!.async("string"), "a:t", "a:p");
    if (text) parts.push(text);
  }
  return parts.join("\n\n");
}

async function readPdf(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(bytes);
  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new MaterialError(`PDF maksimal ${MAX_PDF_PAGES} halaman.`);
  }
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export async function extractMaterialText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(file, bytes);

  let raw: string;
  try {
    raw = kind === "pdf" ? await readPdf(bytes) : kind === "docx" ? await readDocx(bytes) : await readPptx(bytes);
  } catch (error) {
    if (error instanceof MaterialError) throw error;
    console.error("Material extraction failed:", error);
    throw new MaterialError("File tidak bisa dibaca. Pastikan file tidak rusak atau diproteksi password.");
  }

  const text = raw.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < MIN_MATERIAL_CHARS) {
    throw new MaterialError(
      "Teks di file terlalu sedikit. File hasil scan (berupa gambar) belum didukung."
    );
  }
  return text.slice(0, MAX_MATERIAL_CHARS);
}

/** Splits text into `count` roughly equal parts, preferring paragraph boundaries. */
export function splitMaterial(text: string, count: number): string[] {
  if (count <= 1) return [text];
  const target = Math.ceil(text.length / count);
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < count && start < text.length; i++) {
    let end = i === count - 1 ? text.length : Math.min(text.length, start + target);
    if (end < text.length) {
      const nl = text.indexOf("\n", end);
      if (nl !== -1 && nl - end < target * 0.3) end = nl;
    }
    parts.push(text.slice(start, end).trim());
    start = end;
  }
  return parts.filter(Boolean);
}

/** A compact view of the whole text: its start, middle and end. */
export function sampleMaterial(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = Math.floor(maxChars / 3);
  const mid = Math.floor((text.length - slice) / 2);
  return [text.slice(0, slice), text.slice(mid, mid + slice), text.slice(-slice)].join("\n[...]\n");
}
