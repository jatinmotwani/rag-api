import express from "express";
import { documentsRouter } from "./routes/documents";
import { healthRouter } from "./routes/health";
import { queryRouter } from "./routes/query";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "5mb" }));

  app.use("/health", healthRouter());
  app.use("/v1/documents", documentsRouter());
  app.use("/v1/query", queryRouter());

  return app;
}
