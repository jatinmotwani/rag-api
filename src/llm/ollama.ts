import { config } from "../config";

type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type EmbedResponse = {
  embeddings: number[][];
};

type ChatResponse = {
  message?: { content: string };
  response?: string;
};

function ollamaUrl(path: string): string {
  const base = config.ollama.host.replace(/\/+$/, "");
  return `${base}${path}`;
}

export async function embedText(input: string): Promise<number[]> {
  if (!config.ollama.embedModel || config.ollama.embedModel === "SET_ME") {
    throw new Error("OLLAMA_EMBED_MODEL is not set.");
  }

  const res = await fetch(ollamaUrl("/api/embed"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollama.embedModel,
      input,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama embed failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as EmbedResponse;
  const [embedding] = data.embeddings ?? [];
  if (!embedding) {
    throw new Error("Ollama embed returned no embeddings.");
  }
  return embedding;
}

export async function chat(messages: OllamaMessage[]): Promise<string> {
  if (!config.ollama.chatModel || config.ollama.chatModel === "SET_ME") {
    throw new Error("OLLAMA_CHAT_MODEL is not set.");
  }

  const res = await fetch(ollamaUrl("/api/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollama.chatModel,
      messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama chat failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as ChatResponse;
  if (data.message?.content) {
    return data.message.content;
  }
  if (data.response) {
    return data.response;
  }
  throw new Error("Ollama chat returned no content.");
}
