import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { prisma } from "../db/prisma";
import { ingestDocument } from "../ingestion/ingest";
import { parseOptionalBoolean, parseOptionalNumber } from "../utils/parse";

type IngestBody = {
  path?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  force?: boolean;
};

type UploadBody = {
  chunk_size?: string;
  chunk_overlap?: string;
  force?: string;
};

type UploadRequest = Request<Record<string, never>, unknown, UploadBody> & {
  file?: Express.Multer.File;
};

function createUploadMiddleware() {
  const uploadDir = path.resolve("data/uploads");
  void fs.mkdir(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
  });
}

export function documentsRouter() {
  const router = Router();
  const upload = createUploadMiddleware();

  router.get("/", async (_req: Request, res: Response) => {
    try {
      const items = await prisma.document.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post(
    "/",
    async (
      req: Request<Record<string, never>, unknown, IngestBody>,
      res: Response
    ) => {
      try {
        const { path: filePath, chunk_size, chunk_overlap } = req.body ?? {};
        if (!filePath || typeof filePath !== "string") {
          res.status(400).json({ error: "path is required" });
          return;
        }
        const chunkSize = parseOptionalNumber(chunk_size);
        const chunkOverlap = parseOptionalNumber(chunk_overlap);
        const force = parseOptionalBoolean(req.body?.force) ?? false;

        const result = await ingestDocument(filePath, {
          chunkSize,
          chunkOverlap,
          force,
        });
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    }
  );

  router.post(
    "/upload",
    upload.single("file"),
    async (req: UploadRequest, res: Response) => {
      try {
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: "file is required" });
          return;
        }

        const chunkSize = parseOptionalNumber(req.body?.chunk_size);
        const chunkOverlap = parseOptionalNumber(req.body?.chunk_overlap);
        const force = parseOptionalBoolean(req.body?.force) ?? false;

        const result = await ingestDocument(file.path, {
          chunkSize,
          chunkOverlap,
          originalName: file.originalname,
          force,
        });
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    }
  );

  router.delete(
    "/:id",
    async (req: Request<{ id: string }>, res: Response) => {
      try {
        const id = req.params.id;
        await prisma.document.delete({ where: { id } });
        res.json({ deleted: true });
      } catch (error) {
        res.status(404).json({ error: (error as Error).message });
      }
    }
  );

  return router;
}
