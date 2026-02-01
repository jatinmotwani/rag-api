# Expected Solution

Build a local RAG lab that runs on a laptop and is optimized for learning, not scale.

## Solution Summary
- Single-user API or CLI for ingesting documents and asking questions.
- Local models via Ollama for both embeddings and generation.
- Postgres + pgvector (Docker) for storage and vector search.

## Key Learning Principles
- Simple and debuggable over scalable.
- Deterministic and reproducible runs.
- Clear visibility into each pipeline step.

## MVP Feature Set
- Ingest PDF/DOCX/TXT from local disk.
- Parse, chunk, embed, and store in Postgres.
- Query and return answers with citations.
- Basic logging of retrieval scores and context.

## Non-Goals
- Multi-tenant auth, billing, or usage limits.
- Production-grade reliability or uptime.
- Hosted UI or enterprise compliance.
