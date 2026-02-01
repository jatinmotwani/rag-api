import { Router, type Request, type Response } from "express";
import { runQuery } from "../rag/query";
import { parseOptionalBoolean, parseOptionalNumber } from "../utils/parse";

type QueryBody = {
  question?: string;
  top_k?: number;
  snippet_max?: number;
  include_sources?: boolean;
  include_distance?: boolean;
  include_filename?: boolean;
  include_chunk_index?: boolean;
};

export function queryRouter() {
  const router = Router();

  router.post(
    "/",
    async (
      req: Request<Record<string, never>, unknown, QueryBody>,
      res: Response
    ) => {
      try {
      const { question } = req.body ?? {};
      if (!question || typeof question !== "string") {
        res.status(400).json({ error: "question is required" });
        return;
      }

      const topK = parseOptionalNumber(req.body?.top_k) ?? 4;
      const snippetMax = parseOptionalNumber(req.body?.snippet_max);
      const includeSources = parseOptionalBoolean(req.body?.include_sources);
      const includeDistance = parseOptionalBoolean(req.body?.include_distance);
      const includeFilename = parseOptionalBoolean(req.body?.include_filename);
      const includeChunkIndex = parseOptionalBoolean(
        req.body?.include_chunk_index
      );

      const result = await runQuery(question, {
        topK,
        snippetMax,
        includeSources,
        includeDistance,
        includeFilename,
        includeChunkIndex,
      });
      res.json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    }
  );

  return router;
}
