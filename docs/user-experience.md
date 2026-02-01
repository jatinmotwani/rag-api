# User Experience (Learning)

## Primary User Journey
1. Start Docker Compose for local services.
2. Pull an Ollama model for chat and embeddings.
3. Ingest a small set of documents.
4. Ask questions and receive answers with citations.
5. Inspect logs and retrieval context to learn.

## Example Workflow (API)
### 1) Upload a document
```
POST /v1/documents
Content-Type: multipart/form-data
- file=@policies.pdf
```

### 2) Ask a question
```
POST /v1/query
{
  "question": "What is the refund window?",
  "top_k": 4
}
```

### 3) Response with citations
```
{
  "answer": "Refunds are allowed within 14 days of purchase.",
  "sources": [
    {
      "document_id": "doc_abc",
      "page": 2,
      "snippet": "Refunds are allowed within 14 days..."
    }
  ]
}
```

## Example Use Cases
- Learn how retrieval quality affects answers.
- Compare chunking strategies on the same documents.
- Practice evaluation of citations and faithfulness.

## What You See Locally
- Documents list with ingestion status.
- Query logs with selected chunks and scores.
- Simple usage stats (latency, token counts).
