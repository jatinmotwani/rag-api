import express from "express";
import { pool } from "./db";

export function createServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));

  app.get("/health", async (_req, res) => {
    await pool.query("SELECT 1;");
    res.json({ ok: true });
  });

  app.get("/v1/documents", (_req, res) => {
    res.json({ items: [] });
  });

  app.post("/v1/documents", (_req, res) => {
    res.status(501).json({ error: "Not implemented yet" });
  });

  app.post("/v1/query", (_req, res) => {
    res.status(501).json({ error: "Not implemented yet" });
  });

  return app;
}
