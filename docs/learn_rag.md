# Learn RAG (Beginner Guide)

This guide explains Retrieval-Augmented Generation (RAG) from scratch and defines
the core terms you’ll see in this project.

## What Is RAG?
RAG is a pattern that combines:
1) **Retrieval**: find relevant chunks from your documents.
2) **Generation**: use a language model to answer using those chunks.

RAG helps reduce hallucinations and makes answers more grounded in your data.

## RAG Pipeline (Mental Model)
```
Documents -> Parse -> Chunk -> Embed -> Index -> Retrieve -> Prompt -> Answer
```

## Core Components
- **Document Store**: raw files (PDF/DOCX/TXT).
- **Chunk Store**: smaller text pieces stored in a DB.
- **Vector Index**: fast nearest-neighbor search over embeddings.
- **Retriever**: finds the top-K similar chunks for a query.
- **Generator**: LLM that uses retrieved chunks to answer.

## Key Terms (Quick Glossary)
- **LLM (Large Language Model)**: a model that generates text (answers).
- **Embedding Model**: converts text into vectors for similarity search.
- **Vector**: a list of numbers representing the meaning of text.
- **Embedding Dimension**: vector length (e.g., 768). Must match DB schema.
- **Similarity Search**: find vectors most similar to a query vector.
- **Cosine Distance / L2 Distance**: common similarity metrics.
- **Index**: data structure that makes vector search fast.
- **Top-K**: number of closest chunks you retrieve.
- **Chunking**: splitting a document into smaller pieces.
- **Overlap**: repeated tokens between chunks to preserve context.
- **Context Window**: max tokens a model can read at once.
- **Prompt**: the input text to the LLM (system + user messages).
- **System Prompt**: the “rules” for the LLM (e.g., “answer only from sources”).
- **Hallucination**: model invents facts not in the sources.
- **Grounding**: ensuring answers are supported by retrieved data.
- **Citations**: references to the chunks used in the answer.
- **OCR**: Optical Character Recognition for scanned PDFs.
- **Reranking**: optional second model to re-order retrieved chunks.
- **Hybrid Search**: combine vector search with keyword search.
- **Recall / Precision**: retrieval metrics (did we retrieve relevant chunks?).
- **Latency**: how long retrieval + generation takes.

## Models: Two Roles, Two Choices
1) **Embedding model** (search quality)
2) **Chat model** (answer quality)

### What Makes an Embedding Model “Good”?
- Strong semantic understanding
- Stable, consistent vectors
- Fast enough for your hardware
- Good multilingual support (if needed)

### What Makes a Chat Model “Good”?
- Follows instructions (instruct-tuned)
- Large context window
- Fast enough to iterate

## Indexing in RAG (Why It Matters)
Indexing = building a structure over vectors so search is fast.
Without an index, the DB must compare every vector (slow).
With an index, you get fast approximate nearest-neighbor search.

## Chunking (Why Not Use Full Docs?)
LLMs have context limits. Chunking lets you:
- retrieve only relevant parts
- fit more evidence into prompts
- improve precision

Tradeoff: chunks too small lose context; too large reduce recall.

## Retrieval
Given a query:
1) Embed the query.
2) Find top-K similar chunks in the index.
3) (Optional) Filter by keywords or rerank.

Retrieval quality is often the biggest factor in answer quality.

## Generation
We build a prompt with:
- The question
- The retrieved chunks
- A strict system rule (“answer only from sources”)

This reduces hallucinations and improves trust.

## OCR (Scanned PDFs)
Some PDFs are images, not text.
OCR converts images into text so they can be embedded and searched.

## Common Failure Modes (And Fixes)
- **No results**: embeddings missing, wrong model, wrong DB index.
- **Wrong answers**: retrieval is poor, chunking too small, or prompt too weak.
- **Long/wrong citations**: chunk too large, no page mapping.
- **Slow queries**: model too large, top-K too high, or no index.

## How This Project Maps to RAG
- Ingestion: `src/ingestion/*`
- Embeddings: `src/llm/ollama.ts`
- Indexing: `pgvector` index in Postgres
- Retrieval + Answering: `src/rag/query.ts`
- API: `src/routes/*`

## Simple Experiments You Can Try
- Change chunk size (800 -> 400) and compare answers.
- Increase top-K (4 -> 8) and see if accuracy improves.
- Try a different chat model for answer quality.
- Turn OCR on/off and test scanned PDFs.