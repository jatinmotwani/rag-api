import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { toPgVectorLiteral } from "../db/vector";
import { chat, embedText } from "../llm/ollama";
import { config } from "../config";

type RetrievalRow = {
  chunk_id: string;
  document_id: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
  filename: string;
  distance: number;
};

type Source = {
  document_id: string;
  page: number | null;
  chunk_index?: number;
  snippet?: string;
  filename?: string;
  distance?: number;
};

type QueryOptions = {
  topK?: number;
  snippetMax?: number;
  includeSources?: boolean;
  includeDistance?: boolean;
  includeFilename?: boolean;
  includeChunkIndex?: boolean;
};

function buildContext(rows: RetrievalRow[]): string {
  return rows
    .map((row, index) => {
      const page = row.page_number ?? "n/a";
      return [
        `Source ${index + 1} | ${row.filename} | doc=${row.document_id} | chunk=${row.chunk_index} | page=${page}`,
        row.text,
      ].join("\n");
    })
    .join("\n\n");
}

function buildSnippet(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trim()}...`;
}

export async function runQuery(question: string, options: QueryOptions = {}) {
  const topK = options.topK ?? 4;
  const snippetMax = options.snippetMax ?? 200;
  const includeSources = options.includeSources ?? true;
  const includeDistance = options.includeDistance ?? false;
  const includeFilename = options.includeFilename ?? true;
  const includeChunkIndex = options.includeChunkIndex ?? false;

  const embedding = await embedText(question);
  const vectorLiteral = toPgVectorLiteral(embedding);

  const rows = await prisma.$queryRaw<RetrievalRow[]>(
    Prisma.sql`
      SELECT
        c.id as chunk_id,
        c.document_id,
        c.page_number,
        c.chunk_index,
        c.text,
        d.filename,
        (e.vector <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)}) as distance
      FROM embeddings e
      JOIN chunks c ON c.id = e.chunk_id
      JOIN documents d ON d.id = c.document_id
      ORDER BY e.vector <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)}
      LIMIT ${topK}
    `
  );

  if (rows.length === 0) {
    return {
      answer: "No relevant sources found in the documents.",
      sources: [],
    };
  }

  const context = buildContext(rows);

  const systemPrompt = [
    "You are a local RAG assistant.",
    "Use only the provided sources to answer.",
    "If the answer is not in the sources, say you don't know based on the documents.",
  ].join(" ");

  const userPrompt = `Question: ${question}\n\nSources:\n${context}`;

  const answer = await chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  await prisma.query.create({
    data: {
      question,
      answer,
      model: config.ollama.chatModel,
      topK,
    },
  });

  const sources: Source[] = includeSources
    ? rows.map((row) => {
        const source: Source = {
          document_id: row.document_id,
          page: row.page_number,
          snippet: buildSnippet(row.text, snippetMax),
        };
        if (includeFilename) {
          source.filename = row.filename;
        }
        if (includeChunkIndex) {
          source.chunk_index = row.chunk_index;
        }
        if (includeDistance) {
          source.distance = row.distance;
        }
        return source;
      })
    : [];

  return { answer, sources };
}
