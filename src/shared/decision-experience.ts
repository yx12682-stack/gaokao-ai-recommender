import type { CohortOutcomes, DataMode } from "./data-model";
import type { ReachableSchoolsResponse, Recommendation, VolunteerPlanResponse } from "./recommendation";

export type GroupKey = "reach" | "match" | "safety";
export type DecisionExperiencePhase = "profile" | "school_pool" | "major_selection" | "volunteer_plan";
export type CockpitTone = "idle" | "accent" | "success" | "warning" | GroupKey;

export interface CockpitCardSignal {
  key: "candidateSchools" | "selection" | "dataConfidence" | "volunteerPlan";
  label: string;
  value: string;
  detail: string;
  tone: CockpitTone;
}

export interface CockpitDistributionItem {
  label: string;
  value: number;
  share: number;
  detail?: string;
  tone?: CockpitTone;
}

export interface CockpitSignalLane {
  key: "riskGradient" | "cityDistribution" | "majorDistribution" | "historySignal";
  title: string;
  summary: string;
  emptyText: string;
  items: CockpitDistributionItem[];
}

export interface CockpitSignals {
  phase: DecisionExperiencePhase;
  statusLabel: string;
  statusDetail: string;
  cards: CockpitCardSignal[];
  riskGradient: CockpitSignalLane;
  cityDistribution: CockpitSignalLane;
  majorDistribution: CockpitSignalLane;
  historySignal: CockpitSignalLane;
}

export interface DecisionOrbitItem {
  id: string;
  schoolId: number;
  schoolName: string;
  category: GroupKey;
  probability: number;
  percentage: string;
  riskLevel: Recommendation["riskLevel"];
  city: string;
  dataMode: DataMode;
  angle: number;
  radius: number;
  size: number;
  zIndex: number;
}

export interface DecisionUniverseState {
  items: DecisionOrbitItem[];
  layers: Array<{
    key: GroupKey;
    label: string;
    count: number;
    radius: number;
  }>;
}

export type OutcomeIntensity = "core" | "strong" | "emerging" | "trace";

export interface OutcomeNebulaNode {
  id: string;
  label: string;
  schoolName: string;
  majorName: string;
  city: string;
  count: number;
  share: number;
  percentage: string;
  latestYear: number;
  dataMode: DataMode;
  intensity: OutcomeIntensity;
  intensityLabel: string;
  detail: string;
  angle: number;
  radius: number;
}

export interface OutcomeNebula {
  status: "ready" | "empty";
  title: string;
  subtitle: string;
  rankBandLabel: string;
  yearsLabel: string;
  dataMode: DataMode;
  privacyNote: string;
  emptyMessage: string;
  nodes: OutcomeNebulaNode[];
}

export interface DecisionExperience {
  phase: DecisionExperiencePhase;
  cockpit: CockpitSignals;
  universe: DecisionUniverseState;
  outcomeNebula: OutcomeNebula;
}

interface DecisionExperienceInput {
  pool: ReachableSchoolsResponse | null;
  selectedSchoolCount: number;
  selectedMajorCount: number;
  plan: VolunteerPlanResponse | null;
}

function cnNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("zh-CN");
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function dataModeLabel(mode: DataMode | undefined) {
  const labels: Record<DataMode, string> = {
    verified: "真实核验",
    partial: "部分真实",
    sample: "样例数据",
    unavailable: "暂无数据"
  };
  return mode ? labels[mode] : "未知";
}

function shareOf(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function topCountItems(counts: Record<string, number>, limit = 4): CockpitDistributionItem[] {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({
      label,
      value,
      share: shareOf(value, total)
    }));
}

function dataConfidenceTone(mode: DataMode | undefined): CockpitTone {
  if (mode === "verified") return "success";
  if (mode === "partial") return "accent";
  if (mode === "sample") return "warning";
  return "idle";
}

function getPhase(
  pool: ReachableSchoolsResponse | null,
  selectedSchoolCount: number,
  selectedMajorCount: number,
  plan: VolunteerPlanResponse | null
): DecisionExperiencePhase {
  if (plan) return "volunteer_plan";
  if (!pool) return "profile";
  if (selectedSchoolCount > 0 || selectedMajorCount > 0) return "major_selection";
  return "school_pool";
}

function statusForPhase(phase: DecisionExperiencePhase) {
  if (phase === "volunteer_plan") {
    return {
      statusLabel: "志愿表已生成",
      statusDetail: "正在基于学校池、校内专业与 6/6/4 梯度呈现最终志愿结构。"
    };
  }
  if (phase === "major_selection") {
    return {
      statusLabel: "校内专业选择中",
      statusDetail: "已进入学校内专业层，可继续比较专业解释、风险与就业方向。"
    };
  }
  if (phase === "school_pool") {
    return {
      statusLabel: "学校池已就绪",
      statusDetail: "可继续打开学校详情，选择学校和校内专业。"
    };
  }
  return {
    statusLabel: "等待画像输入",
    statusDetail: "提交分数、位次与偏好后，将生成学校优先的决策信号。"
  };
}

export function buildCockpitSignals(
  pool: ReachableSchoolsResponse | null,
  selectedSchoolCount: number,
  selectedMajorCount: number,
  plan: VolunteerPlanResponse | null
): CockpitSignals {
  const phase = getPhase(pool, selectedSchoolCount, selectedMajorCount, plan);
  const status = statusForPhase(phase);
  const summary = plan?.summary ?? pool?.summary ?? null;
  const candidateTotal = pool?.summary.total ?? pool?.items.length ?? 0;
  const dataMode = summary?.dataMode;
  const dataNotice = plan?.dataNotice ?? pool?.dataNotice ?? "提交画像后显示数据可信状态。";

  const gradientTotal = summary ? summary.reach + summary.match + summary.safety : 0;
  const riskGradientItems: CockpitDistributionItem[] = summary
    ? [
        { label: "冲刺", value: summary.reach, share: shareOf(summary.reach, gradientTotal), tone: "reach" },
        { label: "稳妥", value: summary.match, share: shareOf(summary.match, gradientTotal), tone: "match" },
        { label: "保底", value: summary.safety, share: shareOf(summary.safety, gradientTotal), tone: "safety" }
      ]
    : [];

  const cityCounts = (pool?.items ?? []).reduce<Record<string, number>>((counts, item) => {
    counts[item.city] = (counts[item.city] ?? 0) + 1;
    return counts;
  }, {});

  const majorCounts = plan
    ? plan.items.reduce<Record<string, number>>((counts, item) => {
        counts[item.majorName] = (counts[item.majorName] ?? 0) + 1;
        return counts;
      }, {})
    : (pool?.items ?? []).reduce<Record<string, number>>((counts, item) => {
        item.eligibleMajors.slice(0, 3).forEach((major) => {
          counts[major.majorName] = (counts[major.majorName] ?? 0) + 1;
        });
        return counts;
      }, {});

  const historyItems = (pool?.cohortOutcomes.schoolMajorPairs ?? []).slice(0, 4).map((pair) => {
    const value = Math.round(pair.share * 100);
    return {
      label: `${pair.schoolName} · ${pair.majorName}`,
      value,
      share: value,
      detail: `${pair.city} · ${pair.latestYear}`
    };
  });

  return {
    phase,
    ...status,
    cards: [
      {
        key: "candidateSchools",
        label: "候选学校",
        value: cnNumber(candidateTotal),
        detail: pool ? `冲 ${pool.summary.reach} · 稳 ${pool.summary.match} · 保 ${pool.summary.safety}` : "生成后显示学校池规模",
        tone: pool ? "accent" : "idle"
      },
      {
        key: "selection",
        label: "已选学校 / 专业",
        value: `${selectedSchoolCount} 所 / ${selectedMajorCount} 专业`,
        detail: selectedSchoolCount > 0 || selectedMajorCount > 0 ? "用于生成志愿表的显式偏好" : "可在学校详情中选择",
        tone: selectedSchoolCount > 0 || selectedMajorCount > 0 ? "success" : "idle"
      },
      {
        key: "dataConfidence",
        label: "数据可信状态",
        value: dataMode ? dataModeLabel(dataMode) : "等待数据",
        detail: dataNotice,
        tone: dataConfidenceTone(dataMode)
      },
      {
        key: "volunteerPlan",
        label: "志愿表结构",
        value: plan ? `${plan.summary.reach} / ${plan.summary.match} / ${plan.summary.safety}` : pool ? "待生成" : "未开始",
        detail: plan ? "已输出冲稳保志愿表" : pool ? "选择学校和专业后生成" : "学校池生成后开启",
        tone: plan ? "success" : pool ? "warning" : "idle"
      }
    ],
    riskGradient: {
      key: "riskGradient",
      title: "风险梯度",
      summary: summary ? `冲 ${summary.reach} · 稳 ${summary.match} · 保 ${summary.safety}` : "暂无风险梯度",
      emptyText: "等待学校池生成",
      items: riskGradientItems
    },
    cityDistribution: {
      key: "cityDistribution",
      title: "城市分布",
      summary: Object.keys(cityCounts).length > 0 ? `${Object.keys(cityCounts).length} 个城市进入候选池` : "暂无城市分布",
      emptyText: "生成学校池后显示城市分布",
      items: topCountItems(cityCounts)
    },
    majorDistribution: {
      key: "majorDistribution",
      title: plan ? "计划专业分布" : "专业方向分布",
      summary:
        Object.keys(majorCounts).length > 0
          ? `${Object.keys(majorCounts).length} 个专业方向`
          : plan
            ? "暂无计划专业"
            : "暂无专业方向",
      emptyText: plan ? "志愿表暂无专业" : "生成学校池后显示专业方向",
      items: topCountItems(majorCounts)
    },
    historySignal: {
      key: "historySignal",
      title: "历史去向信号",
      summary:
        historyItems.length > 0
          ? `${historyItems.length} 条相似去向`
          : pool?.cohortOutcomes.missingReason ?? "等待相似位次去向",
      emptyText: pool?.cohortOutcomes.missingReason ?? "等待相似位次去向",
      items: historyItems
    }
  };
}

function intensityForShare(share: number): Pick<OutcomeNebulaNode, "intensity" | "intensityLabel"> {
  if (share >= 0.24) return { intensity: "core", intensityLabel: "核心密度" };
  if (share >= 0.14) return { intensity: "strong", intensityLabel: "强信号" };
  if (share >= 0.08) return { intensity: "emerging", intensityLabel: "观察信号" };
  return { intensity: "trace", intensityLabel: "低样本" };
}

export function buildOutcomeNebula(outcomes: CohortOutcomes | null | undefined, limit = 8): OutcomeNebula {
  const privacyNote = outcomes?.privacyNote ?? "仅展示聚合录取记录，不展示任何个人选择记录。";
  const rankBandLabel = outcomes
    ? `${cnNumber(outcomes.rankBand.from)} - ${cnNumber(outcomes.rankBand.to)} 位次`
    : "等待位次区间";
  const yearsLabel =
    outcomes && outcomes.yearsIncluded.length > 0
      ? `${Math.min(...outcomes.yearsIncluded)} - ${Math.max(...outcomes.yearsIncluded)}`
      : "等待年份";
  const emptyMessage = outcomes?.missingReason ?? "暂无相似位次去向样本。";
  const pairs = outcomes?.schoolMajorPairs ?? [];

  if (pairs.length === 0) {
    return {
      status: "empty",
      title: "相似位次去向星云",
      subtitle: "基于聚合官方录取记录展示学校、城市与专业的密度信号。",
      rankBandLabel,
      yearsLabel,
      dataMode: outcomes?.dataMode ?? "unavailable",
      privacyNote,
      emptyMessage,
      nodes: []
    };
  }

  const nodes = [...pairs]
    .sort(
      (a, b) =>
        b.share - a.share ||
        b.count - a.count ||
        `${a.schoolName}${a.majorName}`.localeCompare(`${b.schoolName}${b.majorName}`, "zh-CN")
    )
    .slice(0, limit)
    .map((pair, index): OutcomeNebulaNode => {
      const angle = (360 / Math.min(pairs.length, limit)) * index - 90;
      const intensity = intensityForShare(pair.share);
      return {
        id: `${pair.schoolName}-${pair.majorName}-${pair.latestYear}`,
        label: `${pair.schoolName} · ${pair.majorName}`,
        schoolName: pair.schoolName,
        majorName: pair.majorName,
        city: pair.city,
        count: pair.count,
        share: pair.share,
        percentage: formatPercent(pair.share),
        latestYear: pair.latestYear,
        dataMode: pair.dataMode,
        ...intensity,
        detail: `${pair.city} · ${pair.latestYear} · ${pair.count} 条聚合记录`,
        angle,
        radius: 42 + index * 5
      };
    });

  return {
    status: "ready",
    title: "相似位次去向星云",
    subtitle: "基于聚合官方录取记录展示学校、城市与专业的密度信号。",
    rankBandLabel,
    yearsLabel,
    dataMode: outcomes?.dataMode ?? "unavailable",
    privacyNote,
    emptyMessage,
    nodes
  };
}

function buildDecisionUniverse(pool: ReachableSchoolsResponse | null): DecisionUniverseState {
  const radiusByCategory: Record<GroupKey, number> = {
    reach: 38,
    match: 55,
    safety: 72
  };
  const labels: Record<GroupKey, string> = {
    reach: "冲刺层",
    match: "稳妥层",
    safety: "保底层"
  };
  const items = (pool?.items ?? []).map((item, index): DecisionOrbitItem => {
    const sameLayerIndex = (pool?.items ?? [])
      .slice(0, index)
      .filter((candidate) => candidate.category === item.category).length;
    const layerCount = (pool?.items ?? []).filter((candidate) => candidate.category === item.category).length || 1;
    const angle = (360 / layerCount) * sameLayerIndex - 90;
    return {
      id: `school-${item.schoolId}`,
      schoolId: item.schoolId,
      schoolName: item.schoolName,
      category: item.category,
      probability: item.probability,
      percentage: formatPercent(item.probability),
      riskLevel: item.riskLevel,
      city: item.city,
      dataMode: item.dataMode,
      angle,
      radius: radiusByCategory[item.category],
      size: Math.max(10, Math.min(20, Math.round(item.probability * 18))),
      zIndex: Math.round(item.probability * 100)
    };
  });

  return {
    items,
    layers: (["reach", "match", "safety"] as GroupKey[]).map((key) => ({
      key,
      label: labels[key],
      count: items.filter((item) => item.category === key).length,
      radius: radiusByCategory[key]
    }))
  };
}

export function buildDecisionExperience(input: DecisionExperienceInput): DecisionExperience {
  const { pool, selectedSchoolCount, selectedMajorCount, plan } = input;
  return {
    phase: getPhase(pool, selectedSchoolCount, selectedMajorCount, plan),
    cockpit: buildCockpitSignals(pool, selectedSchoolCount, selectedMajorCount, plan),
    universe: buildDecisionUniverse(pool),
    outcomeNebula: buildOutcomeNebula(pool?.cohortOutcomes)
  };
}
