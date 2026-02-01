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
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: numberFromEnv("DB_PORT", 5432),
    user: process.env.DB_USER ?? "rag",
    password: process.env.DB_PASSWORD ?? "rag",
    database: process.env.DB_NAME ?? "rag",
  },
  embedDim: numberFromEnv("EMBED_DIM", 768),
  ollama: {
    host: process.env.OLLAMA_HOST ?? "http://localhost:11434",
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? "SET_ME",
    chatModel: process.env.OLLAMA_CHAT_MODEL ?? "SET_ME",
  },
};
