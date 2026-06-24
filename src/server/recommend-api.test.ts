import request from "supertest";
import { describe, expect, it } from "vitest";
import { createRecommendApp } from "./app";

type PlanCategory = "reach" | "match" | "safety";

function categoryCounts<T extends Record<K, PlanCategory>, K extends keyof T>(items: T[], key: K) {
  return {
    reach: items.filter((item) => item[key] === "reach").length,
    match: items.filter((item) => item[key] === "match").length,
    safety: items.filter((item) => item[key] === "safety").length
  };
}

function bucketForProbability(probability: number): PlanCategory {
  if (probability < 0.4) return "reach";
  if (probability <= 0.7) return "match";
  return "safety";
}

describe("POST /recommend", () => {
  const validRecommendationPayload = {
    score: 642,
    rank: 2600,
    province: "北京",
    subject: "physics",
    cityPreference: 0.72,
    preferredCities: ["北京", "上海", "杭州"],
    majors: ["计算机科学与技术", "人工智能"],
    riskPreference: "balanced"
  };

  it("returns reach, match, and safety recommendation arrays for a valid request", async () => {
    const app = createRecommendApp();

    const response = await request(app).post("/recommend").send(validRecommendationPayload);

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

  it("accepts empty major preferences for school-first recommendation", async () => {
    const app = createRecommendApp();

    const response = await request(app).post("/recommend").send({
      score: 642,
      rank: 2600,
      province: "北京",
      subject: "physics",
      cityPreference: 0.72,
      preferredCities: ["北京", "上海"],
      majors: [],
      riskPreference: "balanced"
    });

    expect(response.status).toBe(200);
    expect(response.body.match[0].selectionStage).toBe("school_pool");
    expect(response.body.match[0].eligibleMajors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects admission data imports that are missing source metadata", async () => {
    const app = createRecommendApp({ dataImportToken: "test-admin-token" });

    const response = await request(app)
      .post("/data/import")
      .set("x-admin-token", "test-admin-token")
      .send([{ schoolName: "缺来源大学" }]);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_IMPORT_RECORDS");
    expect(response.body.result.accepted).toBe(0);
    expect(response.body.result.errors.length).toBeGreaterThan(0);
  });

  it("keeps admission data import disabled unless an admin token is configured and supplied", async () => {
    const disabledApp = createRecommendApp();
    const tokenApp = createRecommendApp({ dataImportToken: "test-admin-token" });
    const rows = [
      {
        schoolName: "接口导入测试大学",
        schoolProvince: "北京",
        schoolType: "测试本科",
        schoolLevel: "测试院校",
        city: "北京",
        province: "接口测试省",
        major: "计算机科学与技术",
        year: 2025,
        minRank: 1200,
        avgRank: 1800,
        stdRank: 500,
        subjectRequirement: "物理",
        sourceType: "manual_verified",
        sourceName: "接口测试省教育考试院",
        sourceUrl: "https://example.edu.cn/admission",
        updatedAt: "2026-06-23T00:00:00.000Z",
        verifiedAt: "2026-06-23T00:00:00.000Z",
        confidence: 0.9,
        dataMode: "verified"
      }
    ];

    const disabled = await request(disabledApp).post("/data/import").send(rows);
    const unauthorized = await request(tokenApp).post("/data/import").send(rows);
    const authorized = await request(tokenApp).post("/data/import").set("x-admin-token", "test-admin-token").send(rows);

    expect(disabled.status).toBe(403);
    expect(disabled.body.error).toBe("DATA_IMPORT_DISABLED");
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.error).toBe("UNAUTHORIZED_DATA_IMPORT");
    expect(authorized.status).toBe(200);
    expect(authorized.body.result.accepted).toBe(1);
  });

  it("returns a searchable national major catalog", async () => {
    const app = createRecommendApp();

    const response = await request(app).get("/catalog/majors?query=计算机");

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        name: "计算机科学与技术",
        plainLanguage: expect.any(String),
        category: expect.any(String),
        majorClass: expect.any(String)
      })
    );
  });

  it("returns similar rank outcome distribution from aggregate official-style records", async () => {
    const app = createRecommendApp();

    const response = await request(app).post("/cohort-outcomes").send({
      province: "北京",
      subject: "physics",
      rank: 2600
    });

    expect(response.status).toBe(200);
    expect(response.body.label).toBe("相似位次录取去向");
    expect(response.body.schoolDistribution.length).toBeGreaterThan(0);
    expect(response.body.privacyNote).toContain("不使用个人学生记录");
  });

  it("returns a school-first reachable school pool with summary and data notice", async () => {
    const app = createRecommendApp();

    const response = await request(app).post("/schools/reachable").send({
      ...validRecommendationPayload,
      majors: []
    });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(16);
    expect(response.body.summary).toEqual(
      expect.objectContaining({
        total: 16,
        reach: 6,
        match: 6,
        safety: 4,
        latestYear: expect.any(Number),
        dataMode: expect.any(String),
        dataStatus: expect.stringContaining("样例")
      })
    );
    expect(response.body.cohortOutcomes.label).toBe("相似位次录取去向");
    expect(response.body.dataNotice).toContain("各省考试院");
    expect(response.body.dataNotice).toContain("学校招生网");
    expect(response.body.dataNotice).toContain("阳光高考");
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        schoolId: expect.any(Number),
        schoolName: expect.any(String),
        province: expect.any(String),
        city: expect.any(String),
        type: expect.any(String),
        category: expect.stringMatching(/^(reach|match|safety)$/),
        probability: expect.any(Number),
        rankGap: expect.any(Number),
        riskLevel: expect.stringMatching(/^(high|medium|low)$/),
        schoolReachability: expect.any(Object),
        eligibleMajors: expect.any(Array),
        schoolProfile: expect.any(Object),
        probabilityExplanation: expect.any(Object),
        admissionTrend: expect.any(Object),
        dataMode: expect.any(String),
        dataSources: expect.any(Array),
        reason: expect.any(String),
        risk: expect.any(String),
        alternative: expect.objectContaining({
          schoolName: expect.any(String)
        })
      })
    );
  });

  it("returns school detail for a known school and 404 for an unknown school", async () => {
    const app = createRecommendApp();

    const response = await request(app).get("/schools/9");

    expect(response.status).toBe(200);
    expect(response.body.school).toEqual(
      expect.objectContaining({
        id: 9,
        name: "武汉大学",
        city: "武汉"
      })
    );
    expect(response.body.profile.summary).toContain("武汉大学");
    expect(response.body.admissionStats.length).toBeGreaterThan(0);
    expect(response.body.admissionStats[0]).toEqual(
      expect.objectContaining({
        year: expect.any(Number),
        province: expect.any(String),
        major: expect.any(String),
        avgRank: expect.any(Number),
        dataMode: expect.any(String),
        dataSource: expect.objectContaining({
          sourceUrl: expect.any(String)
        })
      })
    );
    expect(response.body.dataSources.length).toBeGreaterThan(0);
    expect(response.body.dataNotice).toContain("权威数据");

    const missing = await request(app).get("/schools/999999");
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "SCHOOL_NOT_FOUND" });
  });

  it("returns majors for a school from recommendations or a catalog fallback", async () => {
    const app = createRecommendApp();

    const response = await request(app)
      .get("/schools/9/majors")
      .query({
        province: "北京",
        subject: "physics",
        rank: "2600",
        score: "642",
        riskPreference: "balanced",
        cityPreference: "0.72",
        majors: "计算机科学与技术,人工智能"
      });

    expect(response.status).toBe(200);
    expect(response.body.schoolId).toBe(9);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        majorName: expect.any(String),
        plainLanguage: expect.any(String),
        fitProbability: expect.any(Number),
        heatLevel: expect.stringMatching(/^(high|medium|low)$/),
        source: expect.objectContaining({
          sourceUrl: expect.any(String)
        }),
        careerSummary: expect.any(String),
        risk: expect.any(String),
        reason: expect.any(String)
      })
    );
    expect(response.body.dataNotice).toContain("样例");
  });

  it("returns complete major catalog detail and 404 for an unknown major", async () => {
    const app = createRecommendApp();

    const response = await request(app).get(encodeURI("/majors/计算机科学与技术"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        code: expect.any(String),
        name: "计算机科学与技术",
        category: expect.any(String),
        majorClass: expect.any(String),
        degreeCategory: expect.any(String),
        plainLanguage: expect.any(String),
        interests: expect.any(Array),
        suitableFor: expect.any(Array),
        coreCourses: expect.any(Array),
        employmentDirections: expect.any(Array),
        representativeCareers: expect.any(Array),
        industryOutlook: expect.any(String),
        graduateDirections: expect.any(Array),
        riskReminder: expect.any(String),
        relatedMajors: expect.any(Array),
        dataSource: expect.objectContaining({
          sourceUrl: expect.any(String)
        })
      })
    );

    const missing = await request(app).get(encodeURI("/majors/不存在专业"));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "MAJOR_NOT_FOUND" });
  });

  it("returns the national source registry coverage", async () => {
    const app = createRecommendApp();

    const response = await request(app).get("/source-registry");

    expect(response.status).toBe(200);
    expect(response.body.totalProvinces).toBeGreaterThanOrEqual(31);
    expect(response.body.byCoverageState.missing).toBeGreaterThan(0);
    expect(response.body.registry[0]).toEqual(
      expect.objectContaining({
        province: expect.any(String),
        sourceType: "provincial_exam_authority",
        sourceUrl: expect.stringContaining("https://")
      })
    );
  });

  it("builds a volunteer plan with selected schools prioritized and model recommendations filling gaps", async () => {
    const app = createRecommendApp();

    const response = await request(app)
      .post("/plans/volunteer")
      .send({
        ...validRecommendationPayload,
        selectedSchoolIds: [9, 10],
        selectedMajors: ["计算机科学与技术", "人工智能"]
      });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(16);
    expect(response.body.summary).toEqual(
      expect.objectContaining({
        total: 16,
        reach: 6,
        match: 6,
        safety: 4
      })
    );
    expect(response.body.items.map((item: { schoolId: number }) => item.schoolId)).toEqual(expect.arrayContaining([9, 10]));
    expect(categoryCounts(response.body.items as Array<{ slotCategory: PlanCategory }>, "slotCategory")).toEqual({
      reach: 6,
      match: 6,
      safety: 4
    });
    for (const item of response.body.items as Array<{ category: PlanCategory; slotCategory: PlanCategory; probability: number }>) {
      expect(item.category).toBe(bucketForProbability(item.probability));
      expect(item.slotCategory).toMatch(/^(reach|match|safety)$/);
    }
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        schoolId: expect.any(Number),
        schoolName: expect.any(String),
        majorName: expect.any(String),
        category: expect.stringMatching(/^(reach|match|safety)$/),
        slotCategory: expect.stringMatching(/^(reach|match|safety)$/),
        probability: expect.any(Number),
        dataMode: expect.any(String),
        reason: expect.any(String),
        risk: expect.any(String),
        alternativeSchoolName: expect.any(String)
      })
    );
    expect(response.body.dataNotice).toContain("各省考试院");
  });

  it("fills volunteer plan quotas for extreme high and low ranks", async () => {
    const app = createRecommendApp();

    for (const rank of [500, 20000]) {
      const response = await request(app)
        .post("/plans/volunteer")
        .send({
          ...validRecommendationPayload,
          score: rank === 500 ? 700 : 520,
          rank
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(16);
      expect(categoryCounts(response.body.items as Array<{ slotCategory: PlanCategory }>, "slotCategory")).toEqual({
        reach: 6,
        match: 6,
        safety: 4
      });
      for (const item of response.body.items as Array<{ category: PlanCategory; probability: number }>) {
        expect(item.category).toBe(bucketForProbability(item.probability));
      }
      expect(response.body.summary).toEqual(
        expect.objectContaining({
          total: 16,
          reach: 6,
          match: 6,
          safety: 4
        })
      );
      expect(new Set(response.body.items.map((item: { schoolId: number }) => item.schoolId)).size).toBe(16);
    }
  });
});
