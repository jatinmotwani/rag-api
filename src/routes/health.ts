import { Router, type Request, type Response } from "express";
import { prisma } from "../db/prisma";

export function healthRouter() {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    await prisma.$queryRaw`SELECT 1;`;
    res.json({ ok: true });
  });

  return router;
}
