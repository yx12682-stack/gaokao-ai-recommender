import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { getRecommendations } from "../shared/recommendation";

const currentDir = dirname(fileURLToPath(import.meta.url));
const clientDistPath = resolve(currentDir, "../../dist");
const clientIndexPath = join(clientDistPath, "index.html");

const recommendRequestSchema = z
  .object({
    score: z.number().min(1).max(750).optional(),
    rank: z.number().int().positive().optional(),
    province: z.string().min(1),
    subject: z.enum(["physics", "history", "science", "arts", "comprehensive"]),
    cityPreference: z.number().min(0).max(1).default(0.5),
    preferredCities: z.array(z.string().min(1)).default([]),
    majors: z.array(z.string().min(1)).min(1),
    riskPreference: z.enum(["conservative", "balanced", "aggressive"])
  })
  .refine((payload) => payload.rank || payload.score, {
    message: "score or rank is required",
    path: ["rank"]
  });

export function createRecommendApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.post("/recommend", (request, response) => {
    const parsed = recommendRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_RECOMMEND_REQUEST",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
      return;
    }

    response.json(getRecommendations(parsed.data));
  });

  if (existsSync(clientIndexPath)) {
    app.use(express.static(clientDistPath));
    app.get("*", (_request, response) => {
      response.sendFile(clientIndexPath);
    });
  }

  return app;
}
