function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number for ${name}: ${raw}`);
  }
  return value;
}

export const config = {
  host: process.env.HOST ?? "127.0.0.1",
  port: numberFromEnv("PORT", 3000),
  databaseUrl:
    process.env.DATABASE_URL ?? "postgresql://rag:rag@127.0.0.1:5432/rag",
  embedDim: numberFromEnv("EMBED_DIM", 768),
  ollama: {
    host: process.env.OLLAMA_HOST ?? "http://localhost:11434",
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
    chatModel:
      process.env.OLLAMA_CHAT_MODEL ?? "llama3.1:8b-instruct-q4_K_M",
  },
  ocr: {
    enabled: (process.env.OCR_ENABLED ?? "false").toLowerCase() === "true",
    minCharsPerPage: numberFromEnv("OCR_MIN_CHARS_PER_PAGE", 50),
    lang: process.env.OCR_LANG ?? "eng",
    dpi: numberFromEnv("OCR_DPI", 300),
  },
};
