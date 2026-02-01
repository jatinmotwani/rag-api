import fs from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { toPgVectorLiteral } from "../db/vector";
import { config } from "../config";
import { chunkText } from "./chunker";
import { embedText } from "../llm/ollama";
import { parseFile } from "./parser";
import { sha256File } from "../utils/hash";

type IngestOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
  originalName?: string;
  force?: boolean;
};

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 100;

export async function ingestDocument(
  filePath: string,
  options: IngestOptions = {}
) {
  const absolutePath = path.resolve(filePath);
  const stats = await fs.stat(absolutePath);
  if (!stats.isFile()) {
    throw new Error("Path is not a file.");
  }

  const checksum = await sha256File(absolutePath);
  const existing = await prisma.document.findFirst({ where: { checksum } });
  if (existing) {
    if (options.force) {
      await prisma.document.delete({ where: { id: existing.id } });
    } else {
      return {
        document: existing,
        chunksAdded: 0,
        skipped: true,
        reason:
          existing.status === "failed" ? "existing_failed" : "already_exists",
      };
    }
  }

  const parsed = await parseFile(absolutePath);
  if (!parsed.text) {
    throw new Error("Parsed text is empty.");
  }

  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;
  if (chunkOverlap >= chunkSize) {
    throw new Error("chunk_overlap must be smaller than chunk_size.");
  }
  const chunks = chunkText(parsed.text, { chunkSize, chunkOverlap });

  const document = await prisma.document.create({
    data: {
      filename: options.originalName ?? path.basename(absolutePath),
      fileType: parsed.fileType,
      fileSize: stats.size,
      status: "indexing",
      localPath: absolutePath,
      checksum,
      pageCount: parsed.pageCount,
      metadata: {},
    },
  });

  let chunksAdded = 0;
  try {
    for (const chunk of chunks) {
      const created = await prisma.chunk.create({
        data: {
          documentId: document.id,
          pageNumber: null,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          tokenCount: chunk.tokenCount,
          embeddingModel: config.ollama.embedModel,
        },
      });

      const embedding = await embedText(chunk.text);
      const vectorLiteral = toPgVectorLiteral(embedding);

      await prisma.$executeRaw(
        Prisma.sql`INSERT INTO embeddings (chunk_id, vector) VALUES (CAST(${created.id} AS uuid), ${Prisma.raw(
          `'${vectorLiteral}'::vector`
        )})`
      );

      chunksAdded += 1;
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "ready" },
    });
  } catch (error) {
    // Keep a simple log for local debugging.
    console.error("Ingest failed:", error);
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "failed" },
    });
    throw error;
  }

  return { document, chunksAdded, skipped: false };
}
