import request from "supertest";
import { describe, expect, it } from "vitest";
import { createRecommendApp } from "./app";

describe("POST /recommend", () => {
  it("returns reach, match, and safety recommendation arrays for a valid request", async () => {
    const app = createRecommendApp();

    const response = await request(app)
      .post("/recommend")
      .send({
        score: 642,
        rank: 2600,
        province: "北京",
        subject: "physics",
        cityPreference: 0.72,
        preferredCities: ["北京", "上海", "杭州"],
        majors: ["计算机科学与技术", "人工智能"],
        riskPreference: "balanced"
      });

    expect(response.status).toBe(200);
    expect(response.body.reach).toHaveLength(6);
    expect(response.body.match).toHaveLength(6);
    expect(response.body.safety).toHaveLength(4);
    expect(response.body.reach[0]).toEqual(
      expect.objectContaining({
        schoolName: expect.any(String),
        probability: expect.any(Number),
        dataMode: expect.any(String),
        dataSource: expect.objectContaining({
          sourceUrl: expect.any(String)
        }),
        probabilityExplanation: expect.objectContaining({
          formula: expect.stringContaining("1 / (1 + exp")
        }),
        reason: expect.any(String),
        risk: expect.any(String),
        alternative: expect.objectContaining({
          schoolName: expect.any(String)
        })
      })
    );
  });

  it("returns 400 with validation details for invalid payloads", async () => {
    const app = createRecommendApp();

    const response = await request(app).post("/recommend").send({
      score: -1,
      rank: 0,
      province: "",
      subject: "unknown",
      cityPreference: 3,
      majors: [],
      riskPreference: "balanced"
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_RECOMMEND_REQUEST");
    expect(response.body.details.length).toBeGreaterThan(0);
  });

  it("returns source coverage for the loaded admission dataset", async () => {
    const app = createRecommendApp();

    const response = await request(app).get("/data-coverage");

    expect(response.status).toBe(200);
    expect(response.body.totalRecords).toBeGreaterThan(0);
    expect(response.body.byMode.sample).toBeGreaterThan(0);
    expect(response.body.latestYear).toBeGreaterThanOrEqual(2025);
  });

  it("rejects admission data imports that are missing source metadata", async () => {
    const app = createRecommendApp();

    const response = await request(app).post("/data/import").send([{ schoolName: "缺来源大学" }]);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_IMPORT_RECORDS");
    expect(response.body.result.accepted).toBe(0);
    expect(response.body.result.errors.length).toBeGreaterThan(0);
  });
});
