import { describe, expect, it } from "vitest";
import {
  calculateBaseProbability,
  calculateProbability,
  cityOptions,
  getRecommendations,
  majorOptions,
  provinceOptions
} from "./recommendation";

describe("gaokao recommendation model", () => {
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
});
