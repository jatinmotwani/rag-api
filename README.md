# Local RAG Learning Lab

Build and understand a Retrieval-Augmented Generation (RAG) system completely locally.
This project is optimized for learning, not production.

## What You’ll Learn
- How documents become searchable chunks
- How embeddings enable semantic search
- How retrieval + prompting produces grounded answers
- How to experiment with chunking, top‑K, and models

## System Diagram (High Level)
```
Ingestion Flow:
  [PDF/DOCX/TXT]
          |
          v
  [Parse + Normalize]
          |
          v
       [Chunking]
          |
          v
  [Embeddings (Ollama)]
          |
          v
  [Postgres + pgvector]

Query Flow:
  [User Question]
          |
          v
   [Query Embedding]
          |
          v
  [Similarity Search] <----> [Postgres + pgvector]
          |
          v
     [Top-K Chunks]
          |
          v
    [Prompt Builder]
          |
          v
  [Chat Model (Ollama)]
          |
          v
   [Answer + Sources]
```

## Prerequisites
- Node.js 18+
- Docker Desktop
- Ollama
- (Optional for OCR) Tesseract + Poppler
  - macOS: `brew install tesseract poppler`

## Quick Start
1) Pull models:
```
ollama pull nomic-embed-text
ollama pull llama3.1:8b-instruct-q4_K_M
```

2) Configure env:
```
cp .env.example .env
```

3) Start Postgres:
```
docker compose up -d
```

4) Install deps:
```
npm install
```

5) Migrate DB:
```
npx prisma migrate dev --name init
```

6) Run API:
```
npm run dev
```

## Testing (Curl)
Health:
```
curl http://127.0.0.1:3000/health
```

Upload a PDF:
```
curl -X POST http://127.0.0.1:3000/v1/documents/upload \
  -F "file=@./data/sample.pdf"
```

Query:
```
curl -X POST http://127.0.0.1:3000/v1/query \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the refund window?","top_k":4}'
```

## Testing (Postman)
- **POST** `http://127.0.0.1:3000/v1/documents/upload`
  - Body → form-data → `file` (File)
- **POST** `http://127.0.0.1:3000/v1/query`
  - Body → raw → JSON

## API Endpoints
- `GET /health`
- `GET /v1/documents`
- `POST /v1/documents` (local file path JSON)
- `POST /v1/documents/upload` (multipart/form-data)
- `DELETE /v1/documents/:id`
- `POST /v1/query`

## OCR (Optional)
Enable OCR in `.env`:
```
OCR_ENABLED=true
OCR_LANG=eng
OCR_DPI=300
OCR_MIN_CHARS_PER_PAGE=50
```
If the PDF text is sparse, OCR runs automatically.

## Folder Structure
```
src/
  app.ts                  # Express app setup
  server.ts               # App entrypoint
  config/                 # Env config
  db/                     # Prisma + pgvector helpers
  ingestion/              # parse -> chunk -> embed -> store
  llm/                    # Ollama client
  rag/                    # retrieval + prompt + answer
  routes/                 # API routes
  utils/                  # helpers
docs/
  technical-documentation.md
  learn_rag.md
```

## How It Works (Short Version)
1) Ingest a file → parse text → chunk.
2) Embed each chunk and store vectors in Postgres.
3) On query, embed the question and retrieve top‑K chunks.
4) Build a prompt with those chunks and ask the chat model.
5) Return answer + sources.

## Troubleshooting
- **Empty answers**: check Ollama is running and models are pulled.
- **OCR errors**: install `tesseract` + `poppler`.
- **Embedding dimension mismatch**: update `EMBED_DIM` and `vector(N)` in Prisma, then re‑migrate.

## Learn More
- `docs/learn_rag.md` — complete beginner guide to RAG concepts
- `docs/technical-documentation.md` — implementation details
