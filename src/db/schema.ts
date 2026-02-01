import { config } from "../config";
import { withClient } from "./index";

export async function ensureSchema(): Promise<void> {
  const statements = [
    "CREATE EXTENSION IF NOT EXISTS vector;",
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    `CREATE TABLE IF NOT EXISTS documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      filename text NOT NULL,
      file_type text NOT NULL,
      file_size integer NOT NULL,
      status text NOT NULL DEFAULT 'uploaded',
      local_path text NOT NULL,
      checksum text NOT NULL,
      page_count integer,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS chunks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      page_number integer,
      chunk_index integer NOT NULL,
      text text NOT NULL,
      token_count integer,
      start_offset integer,
      end_offset integer,
      embedding_model text,
      created_at timestamptz NOT NULL DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS embeddings (
      chunk_id uuid PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
      vector vector(${config.embedDim}) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS queries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      question text NOT NULL,
      answer text,
      model text,
      top_k integer,
      latency_ms integer,
      prompt_tokens integer,
      completion_tokens integer,
      created_at timestamptz NOT NULL DEFAULT now()
    );`,
    "CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);",
    "CREATE INDEX IF NOT EXISTS idx_chunks_text_gin ON chunks USING gin (to_tsvector('english', text));",
  ];

  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      for (const stmt of statements) {
        await client.query(stmt);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
