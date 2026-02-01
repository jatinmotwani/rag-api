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
- Parsing: pdfjs-dist for PDFs, mammoth for DOCX, plain text for TXT/MD.

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

## Ingestion Pipeline (Local)
1) Load file from disk.
2) Parse:
   - PDF: extract text per page.
   - DOCX: extract structured text.
   - TXT/MD: read directly.
3) Normalize: strip noise, preserve page boundaries.
4) Chunk: target 500 to 900 tokens, 100 overlap.
5) Embed: call local Ollama embedding model.
6) Store: write chunks + vectors to Postgres.

## Retrieval Pipeline (Local)
1) Embed the query with the same embedding model.
2) Vector search: top_k by cosine similarity.
3) Optional keyword filter (simple Postgres full-text).
4) Build context with top 4 to 8 chunks.
5) Generate answer with Ollama chat model.
6) Return answer + citations.

## API Endpoints (Learning MVP)
- POST /v1/documents (upload or local path)
- GET /v1/documents
- DELETE /v1/documents/:id
- POST /v1/query

## Response Format (Query)
```
{
  "answer": "...",
  "sources": [
    {
      "document_id": "doc_123",
      "page": 2,
      "snippet": "..."
    }
  ],
  "usage": {
    "model": "ollama:local",
    "prompt_tokens": 1200,
    "completion_tokens": 200
  }
}
```

## Model Selection (Local)
- Use any Ollama chat model you have pulled.
- Use a local embedding model that Ollama supports.
- Start small to keep latency reasonable.

## Cost Controls
- None required (local). Optimize for responsiveness instead.

## Multi-Tenant Isolation
- Not applicable for a single-user learning project.
