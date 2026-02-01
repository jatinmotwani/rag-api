import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { ocrPdf } from "./ocr";
import { config } from "../config";

export type ParsedDocument = {
  text: string;
  pageCount?: number;
  fileType: string;
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export async function parseFile(filePath: string): Promise<ParsedDocument> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt" || ext === ".md") {
    const text = await fs.readFile(filePath, "utf-8");
    return { text: normalizeText(text), fileType: ext.slice(1) };
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return {
      text: normalizeText(result.value ?? ""),
      fileType: "docx",
    };
  }

  if (ext === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    const text = normalizeText(result.text ?? "");
    const pageCount = result.numpages;
    const minChars =
      pageCount && pageCount > 0
        ? config.ocr.minCharsPerPage * pageCount
        : config.ocr.minCharsPerPage;

    if (config.ocr.enabled && text.length < minChars) {
      const ocrText = await ocrPdf(filePath, {
        lang: config.ocr.lang,
        dpi: config.ocr.dpi,
      });
      return {
        text: normalizeText(ocrText),
        pageCount,
        fileType: "pdf",
      };
    }

    return { text, pageCount, fileType: "pdf" };
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
