import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  getCohortOutcomes,
  getMajorCatalog,
  getMajorDetail,
  getNationalSourceCoverage,
  getReachableSchools,
  getRecommendations,
  getSchoolDetail,
  getSchoolMajors,
  getVolunteerPlan
} from "../shared/recommendation";
import { getDataCoverage, getDataSources, importAdmissionData } from "../shared/real-data-store";

const currentDir = dirname(fileURLToPath(import.meta.url));
const clientDistPath = resolve(currentDir, "../../dist");
const clientIndexPath = join(clientDistPath, "index.html");

const recommendRequestBaseSchema = z.object({
  score: z.number().min(1).max(750).optional(),
  rank: z.number().int().positive().optional(),
  province: z.string().min(1),
  subject: z.enum(["physics", "history", "science", "arts", "comprehensive"]),
  cityPreference: z.number().min(0).max(1).default(0.5),
  preferredCities: z.array(z.string().min(1)).default([]),
  majors: z.array(z.string().min(1)).default([]),
  riskPreference: z.enum(["conservative", "balanced", "aggressive"])
});

const recommendRequestSchema = recommendRequestBaseSchema
  .refine((payload) => payload.rank || payload.score, {
    message: "score or rank is required",
    path: ["rank"]
  });

const volunteerPlanRequestSchema = recommendRequestBaseSchema
  .extend({
    selectedSchoolIds: z.array(z.number().int().positive()).default([]),
    selectedMajors: z.array(z.string().min(1)).default([])
  })
  .refine((payload) => payload.rank || payload.score, {
    message: "score or rank is required",
    path: ["rank"]
  });

const cohortOutcomesRequestSchema = z
  .object({
    score: z.number().min(1).max(750).optional(),
    rank: z.number().int().positive().optional(),
    province: z.string().min(1),
    subject: z.enum(["physics", "history", "science", "arts", "comprehensive"])
  })
  .refine((payload) => payload.rank || payload.score, {
    message: "score or rank is required",
    path: ["rank"]
  });

const optionalQueryNumber = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  return Number(value);
}, z.number().min(1).max(750).optional());

const optionalQueryRank = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const queryCityPreference = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  return Number(value);
}, z.number().min(0).max(1).default(0.5));

const queryListSchema = z.preprocess((value) => {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.flatMap((item) =>
    String(item)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}, z.array(z.string().min(1)).default([]));

const schoolMajorsQuerySchema = z
  .object({
    score: optionalQueryNumber,
    rank: optionalQueryRank,
    province: z.string().min(1),
    subject: z.enum(["physics", "history", "science", "arts", "comprehensive"]),
    cityPreference: queryCityPreference,
    preferredCities: queryListSchema,
    majors: queryListSchema,
    riskPreference: z.enum(["conservative", "balanced", "aggressive"]).default("balanced")
  })
  .refine((payload) => payload.rank || payload.score, {
    message: "score or rank is required",
    path: ["rank"]
  });

interface RecommendAppOptions {
  dataImportToken?: string;
}

function validationDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

function parseSchoolId(value: string) {
  const schoolId = Number(value);
  return Number.isInteger(schoolId) && schoolId > 0 ? schoolId : null;
}

export function createRecommendApp(options: RecommendAppOptions = {}) {
  const app = express();
  const dataImportToken = options.dataImportToken ?? process.env.DATA_IMPORT_TOKEN;

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.get("/catalog/majors", (request, response) => {
    const query = typeof request.query.query === "string" ? request.query.query : "";
    response.json({
      items: getMajorCatalog(query),
      source: "教育部普通高等学校本科专业目录",
      year: 2026
    });
  });

  app.post("/recommend", (request, response) => {
    const parsed = recommendRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_RECOMMEND_REQUEST",
        details: validationDetails(parsed.error)
      });
      return;
    }

    response.json(getRecommendations(parsed.data));
  });

  app.post("/schools/reachable", (request, response) => {
    const parsed = recommendRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_REACHABLE_SCHOOLS_REQUEST",
        details: validationDetails(parsed.error)
      });
      return;
    }

    response.json(getReachableSchools(parsed.data));
  });

  app.post("/cohort-outcomes", (request, response) => {
    const parsed = cohortOutcomesRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_COHORT_OUTCOMES_REQUEST",
        details: validationDetails(parsed.error)
      });
      return;
    }

    response.json(getCohortOutcomes(parsed.data));
  });

  app.get("/data-sources", (_request, response) => {
    response.json(getDataSources());
  });

  app.get("/data-coverage", (_request, response) => {
    response.json(getDataCoverage());
  });

  app.get("/source-registry", (_request, response) => {
    response.json(getNationalSourceCoverage());
  });

  app.get("/schools/:schoolId/majors", (request, response) => {
    const schoolId = parseSchoolId(request.params.schoolId);
    if (!schoolId) {
      response.status(404).json({ error: "SCHOOL_NOT_FOUND" });
      return;
    }

    const parsed = schoolMajorsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_SCHOOL_MAJORS_REQUEST",
        details: validationDetails(parsed.error)
      });
      return;
    }

    const result = getSchoolMajors({
      schoolId,
      ...parsed.data
    });
    if (!result) {
      response.status(404).json({ error: "SCHOOL_NOT_FOUND" });
      return;
    }

    response.json(result);
  });

  app.get("/schools/:schoolId", (request, response) => {
    const schoolId = parseSchoolId(request.params.schoolId);
    if (!schoolId) {
      response.status(404).json({ error: "SCHOOL_NOT_FOUND" });
      return;
    }

    const result = getSchoolDetail(schoolId);
    if (!result) {
      response.status(404).json({ error: "SCHOOL_NOT_FOUND" });
      return;
    }

    response.json(result);
  });

  app.get("/majors/:majorName", (request, response) => {
    const result = getMajorDetail(request.params.majorName);
    if (!result) {
      response.status(404).json({ error: "MAJOR_NOT_FOUND" });
      return;
    }

    response.json(result);
  });

  app.post("/plans/volunteer", (request, response) => {
    const parsed = volunteerPlanRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_VOLUNTEER_PLAN_REQUEST",
        details: validationDetails(parsed.error)
      });
      return;
    }

    response.json(getVolunteerPlan(parsed.data));
  });

  app.post("/data/import", (request, response) => {
    if (!dataImportToken) {
      response.status(403).json({
        error: "DATA_IMPORT_DISABLED",
        message: "Data import is disabled until DATA_IMPORT_TOKEN is configured for an administrator."
      });
      return;
    }

    if (request.get("x-admin-token") !== dataImportToken) {
      response.status(401).json({
        error: "UNAUTHORIZED_DATA_IMPORT",
        message: "A valid x-admin-token header is required to import admission data."
      });
      return;
    }

    if (!Array.isArray(request.body)) {
      response.status(400).json({
        error: "INVALID_IMPORT_RECORDS",
        result: {
          accepted: 0,
          rejected: 0,
          errors: [{ index: 0, message: "Request body must be an array of admission records" }]
        }
      });
      return;
    }

    const result = importAdmissionData(request.body);
    if (result.accepted === 0) {
      response.status(400).json({
        error: "INVALID_IMPORT_RECORDS",
        result
      });
      return;
    }

    response.json({ result, coverage: getDataCoverage() });
  });

  if (existsSync(clientIndexPath)) {
    app.use(express.static(clientDistPath));
    app.get("*", (_request, response) => {
      response.sendFile(clientIndexPath);
    });
  }

  return app;
}
