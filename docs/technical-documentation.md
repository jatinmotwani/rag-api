# Technical Documentation (Local Learning)

## Overview
A single-user RAG system that runs entirely on a local machine. It ingests documents,
builds embeddings with Ollama, stores vectors in Postgres + pgvector, and answers
questions with citations.

## Architecture (Local)
- App (Node.js or Python): ingestion + query logic.
- Ollama: local LLM and embedding models.
- Postgres + pgvector (Docker): store chunks and vectors.
- Local filesystem: store original docs and parsed text.
- Optional: Redis (Docker) only if we add background jobs.

## Technology Choices (Default, Local)
- Runtime: Node.js + TypeScript (can swap to Python).
- Database: PostgreSQL 16 + pgvector.
- ORM: Prisma.
- Model runner: Ollama.
- Embeddings: local embedding model from Ollama.
- Answer model: local chat model from Ollama.
- Parsing: pdf-parse for PDFs, mammoth for DOCX, plain text for TXT/MD.
- OCR (optional): Tesseract + Poppler (`pdftoppm`) for scanned PDFs.

## Code Layout
- `src/app.ts`: Express app wiring
- `src/server.ts`: entrypoint
- `src/config/`: environment config
- `src/db/`: Prisma client + pgvector helpers
- `src/ingestion/`: parse → chunk → embed → store
- `src/llm/`: Ollama client
- `src/rag/`: retrieval + prompt + answer
- `src/routes/`: API routes

## Core Data Model (Simplified)
### documents
- id (uuid)
- filename, file_type, file_size
- status (uploaded, parsing, indexing, ready, failed)
- local_path
- checksum (sha256)
- page_count
- metadata (jsonb)
- created_at, updated_at

### chunks
- id (uuid)
- document_id (fk)
- page_number
- chunk_index
- text
- token_count
- start_offset, end_offset (optional)
- embedding_model
- created_at

### embeddings
- chunk_id (fk)
- vector (vector(N) depending on model)
- created_at

### queries
- id (uuid)
- question
- answer
- model
- top_k
- latency_ms
- prompt_tokens, completion_tokens
- created_at

Indexes:
- pgvector index on embeddings.vector.
- GIN index on chunks.text for keyword search.

Note: Prisma does not yet support pgvector operations directly, so embeddings are
inserted and queried using raw SQL via Prisma.

## Ingestion Pipeline (Local)
1) Load file from disk.
2) Parse:
   - PDF: extract text (page boundaries not preserved yet).
   - If PDF text is sparse and OCR is enabled, run OCR.
   - DOCX: extract structured text.
   - TXT/MD: read directly.
3) Normalize: strip extra whitespace.
4) Chunk: target 500 to 900 tokens, 100 overlap.
5) Embed: call local Ollama embedding model.
6) Store: write chunks + vectors to Postgres.

Note: the current parser does not preserve per-page chunk mapping, so citations are
chunk-level. Page numbers may be null until we add page-aware parsing.

Note: chunk sizes use a simple word-based approximation, not a tokenizer. This is
intentional for learning and can be swapped later.

## OCR Setup (Optional)
Install dependencies (macOS):
```
brew install tesseract poppler
```

Enable OCR in `.env`:
```
OCR_ENABLED=true
OCR_LANG=eng
OCR_DPI=300
OCR_MIN_CHARS_PER_PAGE=50
```

## Retrieval Pipeline (Local)
1) Embed the query with the same embedding model.
2) Vector search: top_k by cosine similarity.
3) Optional keyword filter (simple Postgres full-text).
4) Build context with top 4 to 8 chunks.
5) Generate answer with Ollama chat model.
6) Return answer + citations.

## API Endpoints (Learning MVP)
- POST /v1/documents (local file path JSON)
- POST /v1/documents/upload (multipart/form-data upload)
- GET /v1/documents
- DELETE /v1/documents/:id
- POST /v1/query

### Example: ingest a local file
```
POST /v1/documents
{
  "path": "./data/sample.txt",
  "chunk_size": 800,
  "chunk_overlap": 100,
  "force": false
}
```

### Example: ask a question
```
POST /v1/query
{
  "question": "What is the refund window?",
  "top_k": 4,
  "snippet_max": 200,
  "include_sources": true,
  "include_distance": false,
  "include_filename": true,
  "include_chunk_index": false
}
```

### Example: upload a PDF (multipart/form-data)
- field: `file` (type: File)
- optional fields: `chunk_size`, `chunk_overlap`, `force`

## Response Format (Query)
```
{
  "answer": "...",
  "sources": [
    {
      "document_id": "doc_123",
      "page": 2,
      "chunk_index": 0,
      "filename": "policies.pdf",
      "distance": 0.12,
      "snippet": "..."
    }
  ]
}
```

## Model Selection (Local)
### Model Basics (RAG)
RAG uses two types of models:
- Embedding model: converts text into vectors used for search.
- Chat model: generates the final answer using retrieved chunks.

### Key Model Parameters (What They Mean)
- Parameter count (e.g., 7B, 8B): larger tends to be smarter but slower and heavier.
- Context window (num_ctx): how many tokens the model can read at once.
- Embedding dimension: length of each vector; must match the database column.
- Quantization (Q4, Q5, Q6): smaller models that run faster with some quality loss.
- Sampling: temperature, top_p, top_k, repetition penalty (controls creativity vs. determinism).
- Max tokens: caps the output length.

### How to Choose Models for Local RAG
- Retrieval quality: embedding model quality dominates search accuracy.
- Context length: longer is useful for big chunks or long prompts.
- Latency and hardware: smaller models are easier on CPU/RAM.
- Language support: pick multilingual models if your docs aren't English.
- License: make sure the license matches your learning/usage goals.

### Recommended Local Defaults (Current)
- Embeddings: `nomic-embed-text` (768-dim, long context, fast).
- Chat/Answer: `llama3.1:8b-instruct-q4_K_M` (strong general reasoning, good local speed).

### Alternatives (When to Use)
- `bge-m3` embeddings: better multilingual + hybrid retrieval, heavier, 1024-dim (update schema).
- `qwen2.5:7b-instruct`: strong instruction following + structured outputs, good general model.
- `mistral:instruct`: fast and light, decent quality for small docs.

### Important Note
If you change the embedding model, update:
- `EMBED_DIM` in `.env`
- `vector(N)` dimension in `prisma/schema.prisma`

### Local Model Setup (Ollama)
Pull the models:
```
ollama pull nomic-embed-text
ollama pull llama3.1:8b-instruct-q4_K_M
```

Set `.env`:
```
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.1:8b-instruct-q4_K_M
EMBED_DIM=768
```

Database connection is configured via `DATABASE_URL` in `.env`.

## Local Setup (Quick Start)
1) `cp .env.example .env`
2) `docker compose up -d`
3) `npm install`
4) `npx prisma migrate dev --name init`
5) `npm run dev`

## Cost Controls
- None required (local). Optimize for responsiveness instead.

## Multi-Tenant Isolation
- Not applicable for a single-user learning project.
