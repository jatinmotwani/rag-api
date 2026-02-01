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
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? "SET_ME",
    chatModel: process.env.OLLAMA_CHAT_MODEL ?? "SET_ME",
  },
};
