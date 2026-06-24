import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateBaseProbability,
  calculateProbability,
  cityOptions,
  getMajorCatalog,
  getMajorCatalogEntry,
  getNationalSourceCoverage,
  getRecommendations,
  getSourceRegistry,
  majorOptions,
  provinceOptions
} from "./recommendation";
import { getAdmissionDataset, getDataCoverage, importAdmissionData, resetImportedAdmissionData } from "./real-data-store";

const validImportRow = {
  schoolName: "科类测试大学",
  schoolProvince: "北京",
  schoolType: "测试本科",
  schoolLevel: "测试院校",
  city: "北京",
  province: "科类测试省",
  major: "法学",
  year: 2025,
  minRank: 1500,
  avgRank: 2200,
  stdRank: 700,
  subjectRequirement: "历史",
  sourceType: "manual_verified" as const,
  sourceName: "测试省教育考试院",
  sourceUrl: "https://example.edu.cn/admission",
  updatedAt: "2026-06-23T00:00:00.000Z",
  verifiedAt: "2026-06-23T00:00:00.000Z",
  confidence: 0.9,
  dataMode: "verified" as const
};

describe("gaokao recommendation model", () => {
  beforeEach(() => {
    resetImportedAdmissionData();
  });

  it("uses rank gap and sigmoid so a stronger student rank gives a higher base probability", () => {
    const strong = calculateBaseProbability({
      studentRank: 1200,
      schoolAvgRank: 3000,
      schoolStdRank: 900
    });
    const weak = calculateBaseProbability({
      studentRank: 4800,
      schoolAvgRank: 3000,
      schoolStdRank: 900
    });

    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeGreaterThan(0.8);
    expect(weak).toBeLessThan(0.2);
  });

  it("applies major heat, regional competition, trend, city preference, and risk corrections", () => {
    const baseline = calculateProbability({
      studentRank: 2600,
      province: "北京",
      preferredCities: ["北京"],
      cityPreference: 0.8,
      majors: ["计算机科学与技术"],
      riskPreference: "balanced",
      stat: {
        schoolId: 1,
        year: 2025,
        province: "北京",
        major: "计算机科学与技术",
        minRank: 1800,
        avgRank: 3200,
        stdRank: 800
      },
      school: {
        id: 1,
        name: "测试大学",
        province: "北京",
        type: "985",
        city: "北京"
      },
      trendDelta: 0
    });

    const tougher = calculateProbability({
      studentRank: 2600,
      province: "北京",
      preferredCities: ["杭州"],
      cityPreference: 0.2,
      majors: ["人工智能"],
      riskPreference: "conservative",
      stat: {
        schoolId: 2,
        year: 2025,
        province: "北京",
        major: "人工智能",
        minRank: 1200,
        avgRank: 2600,
        stdRank: 550
      },
      school: {
        id: 2,
        name: "更热大学",
        province: "上海",
        type: "985",
        city: "上海"
      },
      trendDelta: -0.08
    });

    expect(baseline.probability).toBeGreaterThan(tougher.probability);
    expect(tougher.factors.majorHeat).toBeLessThan(0);
    expect(tougher.factors.riskAdjustment).toBeLessThan(0);
  });

  it("returns three complete volunteer groups with required recommendation fields", () => {
    const result = getRecommendations({
      score: 642,
      rank: 2600,
      province: "北京",
      subject: "physics",
      cityPreference: 0.72,
      preferredCities: ["北京", "上海", "杭州", "南京"],
      majors: ["计算机科学与技术", "人工智能", "电子信息工程"],
      riskPreference: "balanced"
    });

    expect(result.reach).toHaveLength(6);
    expect(result.match).toHaveLength(6);
    expect(result.safety).toHaveLength(4);
    expect(result.reach.every((item) => item.probability < 0.4)).toBe(true);
    expect(result.match.every((item) => item.probability >= 0.4 && item.probability <= 0.7)).toBe(true);
    expect(result.safety.every((item) => item.probability > 0.7)).toBe(true);

    for (const item of [...result.reach, ...result.match, ...result.safety]) {
      expect(item.schoolName).toBeTruthy();
      expect(item.reason).toContain(item.major);
      expect(item.risk).toBeTruthy();
      expect(item.alternative.schoolName).toBeTruthy();
    }
  });

  it("supports nationwide province and expanded nationwide city and major preference catalogs", () => {
    expect(provinceOptions[0]).toBe("全国");
    expect(provinceOptions).toContain("新疆");
    expect(provinceOptions).toContain("海南");
    expect(cityOptions[0]).toBe("全国");
    expect(cityOptions).toContain("长沙");
    expect(cityOptions).toContain("厦门");
    expect(majorOptions).toContain("临床医学");
    expect(majorOptions).toContain("法学");
    expect(majorOptions).toContain("汉语言文学");
    expect(majorOptions).toContain("机械设计制造及其自动化");
    expect(majorOptions.length).toBeGreaterThanOrEqual(80);

    const result = getRecommendations({
      score: 642,
      rank: 4200,
      province: "全国",
      subject: "physics",
      cityPreference: 0.64,
      preferredCities: ["全国"],
      majors: ["临床医学", "法学", "计算机科学与技术"],
      riskPreference: "balanced"
    });

    expect(result.reach).toHaveLength(6);
    expect(result.match).toHaveLength(6);
    expect(result.safety).toHaveLength(4);
  });

  it("includes school preview details and career guidance for every recommendation", () => {
    const result = getRecommendations({
      score: 642,
      rank: 2600,
      province: "北京",
      subject: "physics",
      cityPreference: 0.72,
      preferredCities: ["北京", "上海", "杭州", "南京"],
      majors: ["计算机科学与技术", "人工智能", "电子信息工程"],
      riskPreference: "balanced"
    });

    const first = result.match[0];
    expect(first.schoolProfile.summary).toContain(first.schoolName);
    expect(first.schoolProfile.strengths.length).toBeGreaterThanOrEqual(3);
    expect(first.schoolProfile.admissionInsight).toContain("位次");
    expect(first.careerGuide.overview).toContain(first.major);
    expect(first.careerGuide.directions.length).toBeGreaterThanOrEqual(4);
    expect(first.careerGuide.roles.length).toBeGreaterThanOrEqual(5);
    expect(first.careerGuide.longTermPath).toBeTruthy();
  });

  it("explains every recommendation with provenance, probability factors, trend, and evidence", () => {
    const result = getRecommendations({
      score: 642,
      rank: 2600,
      province: "北京",
      subject: "physics",
      cityPreference: 0.72,
      preferredCities: ["北京", "上海", "杭州", "南京"],
      majors: ["计算机科学与技术", "人工智能", "电子信息工程"],
      riskPreference: "balanced"
    });

    const first = result.match[0];
    expect(first.dataMode).toBe("sample");
    expect(first.dataSource.sourceUrl).toContain("gaokao.chsi.com.cn");
    expect(first.dataSources.length).toBeGreaterThanOrEqual(1);
    expect(first.probabilityExplanation.formula).toContain("1 / (1 + exp");
    expect(first.probabilityExplanation.factors.base).toEqual(expect.any(Number));
    expect(first.probabilityExplanation.factors.final).toBe(first.probability);
    expect(first.admissionTrend.latestYear).toBeGreaterThanOrEqual(2025);
    expect(first.admissionTrend.yearlyAvgRanks.length).toBeGreaterThanOrEqual(3);
    expect(first.rankGap).toEqual(expect.any(Number));
    expect(["high", "medium", "low"]).toContain(first.riskLevel);
    expect(first.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it("tracks source coverage and never treats sample records as verified", () => {
    const coverage = getDataCoverage();
    const dataset = getAdmissionDataset();

    expect(dataset.stats.length).toBeGreaterThan(0);
    expect(coverage.totalRecords).toBeGreaterThan(0);
    expect(coverage.byMode.sample).toBeGreaterThan(0);
    expect(coverage.byMode.verified ?? 0).toBe(0);
    expect(dataset.stats.every((stat) => stat.dataMode !== "verified")).toBe(true);
  });

  it("rejects imported admission rows without required source metadata", () => {
    const result = importAdmissionData([
      {
        schoolName: "测试大学",
        province: "北京",
        city: "北京",
        major: "计算机科学与技术",
        year: 2025,
        minRank: 1000,
        avgRank: 1600,
        stdRank: 500
      }
    ]);

    expect(result.accepted).toBe(0);
    expect(result.errors[0].message).toContain("sourceUrl");
  });

  it("rejects imported admission rows with unsafe source metadata or non-finite ranks", () => {
    const result = importAdmissionData([
      {
        ...validImportRow,
        sourceType: "totally_fake",
        sourceUrl: "javascript:alert(1)",
        minRank: Number.NaN,
        confidence: 999
      }
    ]);

    expect(result.accepted).toBe(0);
    expect(result.rejected).toBe(1);
    expect(result.errors[0].message).toContain("sourceType");
    expect(result.errors[0].message).toContain("sourceUrl");
    expect(result.errors[0].message).toContain("confidence");
    expect(result.errors[0].message).toContain("minRank");
  });

  it("filters imported admission rows by subject requirement before recommending schools", () => {
    const importResult = importAdmissionData([validImportRow]);
    const result = getRecommendations({
      score: 660,
      rank: 1800,
      province: "科类测试省",
      subject: "physics",
      cityPreference: 0.5,
      preferredCities: ["北京"],
      majors: [],
      riskPreference: "balanced"
    });
    const allRecommendations = [...result.reach, ...result.match, ...result.safety];

    expect(importResult.accepted).toBe(1);
    expect(allRecommendations.some((item) => item.schoolName === "科类测试大学")).toBe(false);
  });

  it("keeps multiple verified school-major rows available under the same reachable school", () => {
    const importResult = importAdmissionData([
      {
        ...validImportRow,
        schoolName: "多专业测试大学",
        province: "多专业测试省",
        major: "计算机科学与技术",
        avgRank: 3100,
        minRank: 2500,
        stdRank: 700,
        subjectRequirement: "物理"
      },
      {
        ...validImportRow,
        schoolName: "多专业测试大学",
        province: "多专业测试省",
        major: "人工智能",
        avgRank: 3600,
        minRank: 2900,
        stdRank: 760,
        subjectRequirement: "物理"
      }
    ]);
    const result = getRecommendations({
      score: 650,
      rank: 3000,
      province: "多专业测试省",
      subject: "physics",
      cityPreference: 0.5,
      preferredCities: ["北京"],
      majors: [],
      riskPreference: "balanced"
    });
    const recommendation = [...result.reach, ...result.match, ...result.safety].find(
      (item) => item.schoolName === "多专业测试大学"
    );
    const majorNames = recommendation?.eligibleMajors.map((item) => item.majorName) ?? [];

    expect(importResult.accepted).toBe(2);
    expect(recommendation).toBeTruthy();
    expect(recommendation?.dataMode).toBe("verified");
    expect(majorNames).toContain("计算机科学与技术");
    expect(majorNames).toContain("人工智能");
    expect(recommendation?.eligibleMajors.find((major) => major.majorName === "人工智能")?.rankGap).toEqual(expect.any(Number));
  });

  it("returns school-first recommendations with eligible majors instead of requiring major-first decisions", () => {
    const result = getRecommendations({
      score: 642,
      rank: 2600,
      province: "北京",
      subject: "physics",
      cityPreference: 0.72,
      preferredCities: ["北京", "上海", "杭州", "南京"],
      majors: [],
      riskPreference: "balanced"
    });

    const first = result.match[0];

    expect(first.selectionStage).toBe("school_pool");
    expect(first.schoolId).toEqual(expect.any(Number));
    expect(first.schoolName).toEqual(expect.any(String));
    expect(first.schoolReachability.probability).toBe(first.probability);
    expect(first.schoolReachability.rankGap).toBe(first.rankGap);
    expect(first.schoolReachability.zScore).toBe(first.probabilityExplanation.z);
    expect(first.schoolReachability.latestYear).toBe(first.admissionTrend.latestYear);
    expect(first.schoolReachability.trend).toBe(first.admissionTrend);
    expect(first.schoolReachability.explanation).toBe(first.probabilityExplanation);
    expect(first.eligibleMajors.length).toBeGreaterThanOrEqual(3);
    expect(first.eligibleMajors[0]).toEqual(
      expect.objectContaining({
        majorName: expect.any(String),
        plainLanguage: expect.any(String),
        fitProbability: expect.any(Number),
        heatLevel: expect.stringMatching(/^(high|medium|low)$/),
        dataMode: expect.any(String),
        source: expect.objectContaining({
          sourceUrl: expect.any(String)
        }),
        rankGap: expect.any(Number),
        reason: expect.any(String),
        risk: expect.any(String),
        careerSummary: expect.any(String)
      })
    );
    for (const major of first.eligibleMajors) {
      expect(getMajorCatalogEntry(major.majorName)).toBeTruthy();
      expect(major.fitProbability).toBeGreaterThanOrEqual(0.03);
      expect(major.fitProbability).toBeLessThanOrEqual(0.96);
    }
    for (const recommendation of [...result.reach, ...result.match, ...result.safety]) {
      expect(recommendation.eligibleMajors.length).toBeGreaterThanOrEqual(3);
      for (const major of recommendation.eligibleMajors) {
        expect(getMajorCatalogEntry(major.majorName)).toBeTruthy();
      }
    }
  });

  it("builds similar-rank outcomes from aggregate admission records, not personal records", () => {
    const result = getRecommendations({
      score: 642,
      rank: 2600,
      province: "北京",
      subject: "physics",
      cityPreference: 0.72,
      preferredCities: ["北京", "上海"],
      majors: [],
      riskPreference: "balanced"
    });

    expect(result.cohortOutcomes.label).toBe("相似位次录取去向");
    expect(result.cohortOutcomes.privacyNote).toContain("公开录取数据");
    expect(result.cohortOutcomes.rankBand.from).toBeLessThan(2600);
    expect(result.cohortOutcomes.rankBand.to).toBeGreaterThan(2600);
    expect(result.cohortOutcomes.schoolDistribution.length).toBeGreaterThan(0);
    expect(result.cohortOutcomes.majorDistribution.length).toBeGreaterThan(0);
  });

  it("exposes national major catalog entries with parent-friendly explanations", () => {
    const catalog = getMajorCatalog();
    const computer = getMajorCatalogEntry("计算机科学与技术");

    expect(catalog.length).toBe(883);
    expect(getMajorCatalogEntry("法律英语")?.code).toBe("0502105T");
    expect(getMajorCatalogEntry("计算语言学")?.code).toBe("0502106TK");
    expect(getMajorCatalogEntry("语言智能")?.code).toBe("0502107TK");
    expect(computer?.plainLanguage).toContain("软件");
    expect(computer?.suitableFor.length).toBeGreaterThanOrEqual(3);
    expect(computer?.riskReminder).toBeTruthy();
  });

  it("prioritizes major names over generated explanatory text when searching the national catalog", () => {
    const catalog = getMajorCatalog("计算机");

    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog[0].name).toBe("计算机科学与技术");
  });

  it("reports national official source coverage without treating missing provinces as verified", () => {
    const registry = getSourceRegistry();
    const coverage = getNationalSourceCoverage();

    expect(registry.length).toBeGreaterThanOrEqual(31);
    expect(coverage.totalProvinces).toBeGreaterThanOrEqual(31);
    expect(coverage.byCoverageState.missing).toBeGreaterThan(0);
    expect(coverage.byCoverageState.verified ?? 0).toBe(0);
    expect(registry.every((entry) => entry.sourceUrl.startsWith("https://"))).toBe(true);
  });
});
