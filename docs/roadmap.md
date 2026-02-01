# Learning Roadmap

## Phase 0: Local Setup (Day 0-1)
- Install Ollama and pull a small chat model.
- Set up Docker Compose for Postgres + pgvector.
- Create a tiny sample document set.

## Phase 1: MVP Pipeline (Day 2-3)
- Parse and chunk documents.
- Generate embeddings locally.
- Store in Postgres and run vector search.

## Phase 2: Query and Citations (Day 4-5)
- Build a query endpoint or CLI.
- Assemble context and generate answers with citations.
- Log retrieval scores and selected chunks.

## Phase 3: Quality Experiments (Day 6-7)
- Try different chunk sizes and overlaps.
- Add simple hybrid search (keyword + vector).
- Create a small evaluation set.

## Phase 4: Nice-to-Have (Week 2+)
- Optional OCR for scanned PDFs.
- Optional reranking model.
- Minimal UI for browsing documents and answers.
