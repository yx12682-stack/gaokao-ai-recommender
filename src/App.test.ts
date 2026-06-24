import { describe, expect, it } from "vitest";
import {
  buildCockpitSignals,
  buildSelectedMajorKey,
  deriveSelectedMajorNames,
  groupReachableSchools,
  removeSelectedMajorsForSchool,
  toggleUniqueSelection
} from "./App";
import type { ReachableSchoolsResponse, VolunteerPlanResponse } from "./shared/recommendation";

describe("school-first frontend helpers", () => {
  it("groups a flat reachable school pool by school reachability category", () => {
    const grouped = groupReachableSchools([
      { category: "match", schoolName: "稳妥大学" },
      { category: "reach", schoolName: "冲刺大学" },
      { category: "safety", schoolName: "保底大学" },
      { category: "match", schoolName: "另一所稳妥大学" }
    ]);

    expect(grouped.reach.map((item) => item.schoolName)).toEqual(["冲刺大学"]);
    expect(grouped.match.map((item) => item.schoolName)).toEqual(["稳妥大学", "另一所稳妥大学"]);
    expect(grouped.safety.map((item) => item.schoolName)).toEqual(["保底大学"]);
  });

  it("toggles selected schools and selected school-major keys without duplicates", () => {
    expect(toggleUniqueSelection([9, 10], 9)).toEqual([10]);
    expect(toggleUniqueSelection([9, 10], 11)).toEqual([9, 10, 11]);
    expect(toggleUniqueSelection(["9:计算机科学与技术"], "9:计算机科学与技术")).toEqual([]);
  });

  it("derives unique major names from school-specific selections for volunteer plan payloads", () => {
    const keys = [
      buildSelectedMajorKey(9, "计算机科学与技术"),
      buildSelectedMajorKey(10, "计算机科学与技术"),
      buildSelectedMajorKey(10, "人工智能")
    ];

    expect(deriveSelectedMajorNames(keys)).toEqual(["计算机科学与技术", "人工智能"]);
  });

  it("removes hidden selected majors when their school is deselected", () => {
    const keys = [
      buildSelectedMajorKey(9, "计算机科学与技术"),
      buildSelectedMajorKey(10, "计算机科学与技术"),
      buildSelectedMajorKey(10, "人工智能")
    ];

    expect(removeSelectedMajorsForSchool(keys, 10)).toEqual([buildSelectedMajorKey(9, "计算机科学与技术")]);
  });

  it("builds idle cockpit signals before a school pool exists", () => {
    const signals = buildCockpitSignals(null, 0, 0, null);

    expect(signals.phase).toBe("idle");
    expect(signals.cards.map((card) => [card.key, card.value])).toEqual([
      ["candidateSchools", "0"],
      ["selection", "0 所 / 0 专业"],
      ["dataConfidence", "等待数据"],
      ["volunteerPlan", "未开始"]
    ]);
    expect(signals.riskGradient.summary).toBe("暂无风险梯度");
    expect(signals.cityDistribution.items).toEqual([]);
    expect(signals.majorDistribution.items).toEqual([]);
    expect(signals.historySignal.summary).toBe("等待相似位次去向");
  });

  it("summarizes school pool signals with risk, city, major, and cohort distributions", () => {
    const pool = {
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
          category: "reach",
          city: "北京",
          riskLevel: "high",
          eligibleMajors: [{ majorName: "人工智能" }, { majorName: "计算机科学与技术" }]
        },
        {
          category: "match",
          city: "上海",
          riskLevel: "medium",
          eligibleMajors: [{ majorName: "人工智能" }, { majorName: "法学" }]
        },
        {
          category: "safety",
          city: "北京",
          riskLevel: "low",
          eligibleMajors: [{ majorName: "临床医学" }]
        }
      ],
      cohortOutcomes: {
        schoolMajorPairs: [
          { schoolName: "北京大学", majorName: "人工智能", city: "北京", share: 0.28, latestYear: 2025 },
          { schoolName: "上海交通大学", majorName: "电子信息类", city: "上海", share: 0.16, latestYear: 2025 }
        ],
        dataMode: "partial",
        missingReason: undefined
      }
    } as ReachableSchoolsResponse;

    const signals = buildCockpitSignals(pool, 2, 3, null);

    expect(signals.phase).toBe("school_pool");
    expect(signals.cards.map((card) => [card.key, card.value])).toEqual([
      ["candidateSchools", "3"],
      ["selection", "2 所 / 3 专业"],
      ["dataConfidence", "部分真实"],
      ["volunteerPlan", "待生成"]
    ]);
    expect(signals.riskGradient.items.map((item) => [item.label, item.value, item.share])).toEqual([
      ["冲刺", 1, 33],
      ["稳妥", 1, 33],
      ["保底", 1, 33]
    ]);
    expect(signals.cityDistribution.items.map((item) => [item.label, item.value])).toEqual([
      ["北京", 2],
      ["上海", 1]
    ]);
    expect(signals.majorDistribution.items.map((item) => [item.label, item.value])).toEqual([
      ["人工智能", 2],
      ["计算机科学与技术", 1],
      ["法学", 1],
      ["临床医学", 1]
    ]);
    expect(signals.historySignal.summary).toBe("2 条相似去向");
    expect(signals.historySignal.items[0]).toMatchObject({
      label: "北京大学 · 人工智能",
      value: 28
    });
  });

  it("promotes volunteer plan signals after the 6/6/4 plan is generated", () => {
    const pool = {
      summary: {
        total: 16,
        reach: 6,
        match: 6,
        safety: 4,
        latestYear: 2025,
        dataMode: "sample",
        dataStatus: "样例数据"
      },
      dataNotice: "样例学校池。",
      items: [
        { category: "reach", city: "北京", riskLevel: "high", eligibleMajors: [{ majorName: "人工智能" }] },
        { category: "match", city: "南京", riskLevel: "medium", eligibleMajors: [{ majorName: "软件工程" }] }
      ],
      cohortOutcomes: {
        schoolMajorPairs: [],
        dataMode: "sample",
        missingReason: "暂无相似位次去向样本"
      }
    } as ReachableSchoolsResponse;
    const plan = {
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
        { category: "reach", majorName: "人工智能" },
        { category: "reach", majorName: "人工智能" },
        { category: "match", majorName: "软件工程" },
        { category: "safety", majorName: "法学" }
      ]
    } as VolunteerPlanResponse;

    const signals = buildCockpitSignals(pool, 5, 4, plan);

    expect(signals.phase).toBe("volunteer_plan");
    expect(signals.cards.map((card) => [card.key, card.value])).toEqual([
      ["candidateSchools", "16"],
      ["selection", "5 所 / 4 专业"],
      ["dataConfidence", "样例数据"],
      ["volunteerPlan", "6 / 6 / 4"]
    ]);
    expect(signals.riskGradient.summary).toBe("冲 6 · 稳 6 · 保 4");
    expect(signals.majorDistribution.items.map((item) => [item.label, item.value])).toEqual([
      ["人工智能", 2],
      ["软件工程", 1],
      ["法学", 1]
    ]);
    expect(signals.historySignal.summary).toBe("暂无相似位次去向样本");
  });
});
