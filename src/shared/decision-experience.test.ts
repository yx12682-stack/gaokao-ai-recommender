import { describe, expect, it } from "vitest";
import { buildDecisionExperience, buildOutcomeNebula } from "./decision-experience";
import type { ReachableSchoolsResponse, VolunteerPlanResponse } from "./recommendation";

function makePool(overrides: Partial<ReachableSchoolsResponse> = {}): ReachableSchoolsResponse {
  return {
    summary: {
      total: 3,
      reach: 1,
      match: 1,
      safety: 1,
      latestYear: 2025,
      dataMode: "partial",
      dataStatus: "部分真实"
    },
    dataNotice: "学校池包含部分真实数据，仍需权威复核。",
    items: [
      {
        schoolId: 1,
        schoolName: "北京未来大学",
        category: "reach",
        city: "北京",
        province: "北京",
        probability: 0.32,
        rankGap: -420,
        riskLevel: "high",
        dataMode: "partial",
        eligibleMajors: [{ majorName: "人工智能" }, { majorName: "计算机科学与技术" }]
      },
      {
        schoolId: 2,
        schoolName: "上海工程大学",
        category: "match",
        city: "上海",
        province: "上海",
        probability: 0.58,
        rankGap: 120,
        riskLevel: "medium",
        dataMode: "partial",
        eligibleMajors: [{ majorName: "人工智能" }, { majorName: "电子信息工程" }]
      },
      {
        schoolId: 3,
        schoolName: "南京安全大学",
        category: "safety",
        city: "南京",
        province: "江苏",
        probability: 0.78,
        rankGap: 860,
        riskLevel: "low",
        dataMode: "sample",
        eligibleMajors: [{ majorName: "法学" }]
      }
    ],
    cohortOutcomes: {
      label: "相似位次录取去向",
      province: "北京",
      subject: "physics",
      rankCenter: 2600,
      rankBand: { from: 2200, to: 3000 },
      yearsIncluded: [2023, 2024, 2025],
      schoolDistribution: [],
      majorDistribution: [],
      cityDistribution: [],
      schoolMajorPairs: [
        {
          schoolName: "北京未来大学",
          majorName: "人工智能",
          city: "北京",
          count: 16,
          share: 0.286,
          latestYear: 2025,
          dataMode: "partial"
        },
        {
          schoolName: "上海工程大学",
          majorName: "电子信息工程",
          city: "上海",
          count: 9,
          share: 0.161,
          latestYear: 2025,
          dataMode: "partial"
        },
        {
          schoolName: "南京安全大学",
          majorName: "法学",
          city: "南京",
          count: 3,
          share: 0.054,
          latestYear: 2024,
          dataMode: "sample"
        }
      ],
      dataMode: "partial",
      coverageState: "partial",
      privacyNote: "仅展示聚合录取记录，不展示任何个人选择记录。"
    },
    ...overrides
  } as ReachableSchoolsResponse;
}

function makePlan(): VolunteerPlanResponse {
  return {
    summary: {
      total: 16,
      reach: 6,
      match: 6,
      safety: 4,
      latestYear: 2025,
      dataMode: "sample",
      dataStatus: "样例数据"
    },
    dataNotice: "志愿表为示例结构。",
    items: [
      { category: "reach", slotCategory: "reach", majorName: "人工智能" },
      { category: "match", slotCategory: "match", majorName: "电子信息工程" },
      { category: "safety", slotCategory: "safety", majorName: "法学" }
    ]
  } as VolunteerPlanResponse;
}

describe("decision experience helpers", () => {
  it("tracks profile, school-pool, major-selection, and volunteer-plan phases", () => {
    expect(buildDecisionExperience({ pool: null, selectedSchoolCount: 0, selectedMajorCount: 0, plan: null }).phase).toBe(
      "profile"
    );
    expect(
      buildDecisionExperience({ pool: makePool(), selectedSchoolCount: 0, selectedMajorCount: 0, plan: null }).phase
    ).toBe("school_pool");
    expect(
      buildDecisionExperience({ pool: makePool(), selectedSchoolCount: 2, selectedMajorCount: 1, plan: null }).phase
    ).toBe("major_selection");
    expect(
      buildDecisionExperience({ pool: makePool(), selectedSchoolCount: 2, selectedMajorCount: 1, plan: makePlan() }).phase
    ).toBe("volunteer_plan");
  });

  it("builds sorted similar-outcome nebula nodes with intensity labels and rounded percentages", () => {
    const nebula = buildOutcomeNebula(makePool().cohortOutcomes);

    expect(nebula.status).toBe("ready");
    expect(nebula.rankBandLabel).toBe("2,200 - 3,000 位次");
    expect(nebula.nodes.map((node) => node.label)).toEqual([
      "北京未来大学 · 人工智能",
      "上海工程大学 · 电子信息工程",
      "南京安全大学 · 法学"
    ]);
    expect(nebula.nodes.map((node) => [node.percentage, node.intensity, node.intensityLabel])).toEqual([
      ["29%", "core", "核心密度"],
      ["16%", "strong", "强信号"],
      ["5%", "trace", "低样本"]
    ]);
    expect(nebula.nodes[0].detail).toBe("北京 · 2025 · 16 条聚合记录");
  });

  it("returns a privacy-safe empty state when similar-rank outcomes are unavailable", () => {
    const nebula = buildOutcomeNebula({
      ...makePool().cohortOutcomes,
      schoolMajorPairs: [],
      missingReason: "暂未导入该省该科类的官方录取记录。"
    });

    expect(nebula.status).toBe("empty");
    expect(nebula.nodes).toEqual([]);
    expect(nebula.emptyMessage).toBe("暂未导入该省该科类的官方录取记录。");
    expect(nebula.privacyNote).toContain("聚合");
  });
});
