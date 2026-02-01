import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

type OcrOptions = {
  lang: string;
  dpi: number;
};

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await runCommand("which", [command]);
    return true;
  } catch {
    return false;
  }
}

function extractPageNumber(name: string): number {
  const match = name.match(/-(\d+)\.png$/);
  return match ? Number(match[1]) : Number.NaN;
}

export async function ocrPdf(
  filePath: string,
  options: OcrOptions
): Promise<string> {
  const hasTesseract = await commandExists("tesseract");
  const hasPdftoppm = await commandExists("pdftoppm");

  if (!hasTesseract || !hasPdftoppm) {
    const missing = [
      !hasTesseract ? "tesseract" : null,
      !hasPdftoppm ? "pdftoppm (poppler)" : null,
    ].filter(Boolean);
    throw new Error(
      `OCR requires ${missing.join(
        " and "
      )}. Install via: brew install tesseract poppler`
    );
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rag-ocr-"));
  const prefix = path.join(tempDir, "page");

  try {
    await runCommand("pdftoppm", [
      "-r",
      String(options.dpi),
      "-png",
      filePath,
      prefix,
    ]);

    const entries = await fs.readdir(tempDir);
    const images = entries
      .filter((name) => name.startsWith("page-") && name.endsWith(".png"))
      .sort((a, b) => extractPageNumber(a) - extractPageNumber(b));

    const chunks: string[] = [];
    for (let index = 0; index < images.length; index += 1) {
      const imagePath = path.join(tempDir, images[index]);
      const outputBase = path.join(tempDir, `ocr_${index}`);
      await runCommand("tesseract", [
        imagePath,
        outputBase,
        "-l",
        options.lang,
        "--dpi",
        String(options.dpi),
      ]);
      const text = await fs.readFile(`${outputBase}.txt`, "utf-8");
      chunks.push(text);
    }

    return chunks.join("\n");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
