import type { CoverageState, SourceRegistryEntry, SourceType } from "./data-model";

const REGISTRY_YEAR = 2025;
const REGISTRY_DATE = "2026-06-24";
const SOURCE_TYPE: SourceType = "provincial_exam_authority";
const COVERAGE_STATE: CoverageState = "missing";
const MISSING_DATA_NOTE = "已登记权威来源入口，尚未导入并核验该省真实录取数据。";

const nationalOfficialSourceEntrypoints = [
  { id: "beijing", province: "北京", sourceUrl: "https://www.bjeea.cn/" },
  { id: "tianjin", province: "天津", sourceUrl: "https://www.zhaokao.net/" },
  { id: "hebei", province: "河北", sourceUrl: "https://www.hebeea.edu.cn/" },
  { id: "shanxi", province: "山西", sourceUrl: "https://www.sxkszx.cn/" },
  { id: "inner-mongolia", province: "内蒙古", sourceUrl: "https://www.nm.zsks.cn/" },
  { id: "liaoning", province: "辽宁", sourceUrl: "https://www.lnzsks.com/" },
  { id: "jilin", province: "吉林", sourceUrl: "https://www.jleea.com.cn/" },
  { id: "heilongjiang", province: "黑龙江", sourceUrl: "https://www.lzk.hl.cn/" },
  { id: "shanghai", province: "上海", sourceUrl: "https://www.shmeea.edu.cn/" },
  { id: "jiangsu", province: "江苏", sourceUrl: "https://www.jseea.cn/" },
  { id: "zhejiang", province: "浙江", sourceUrl: "https://www.zjzs.net/" },
  { id: "anhui", province: "安徽", sourceUrl: "https://www.ahzsks.cn/" },
  { id: "fujian", province: "福建", sourceUrl: "https://www.eeafj.cn/" },
  { id: "jiangxi", province: "江西", sourceUrl: "https://www.jxeea.cn/" },
  { id: "shandong", province: "山东", sourceUrl: "https://www.sdzk.cn/" },
  { id: "henan", province: "河南", sourceUrl: "https://www.haeea.cn/" },
  { id: "hubei", province: "湖北", sourceUrl: "https://www.hbea.edu.cn/" },
  { id: "hunan", province: "湖南", sourceUrl: "https://www.hneeb.cn/" },
  { id: "guangdong", province: "广东", sourceUrl: "https://eea.gd.gov.cn/" },
  { id: "guangxi", province: "广西", sourceUrl: "https://www.gxeea.cn/" },
  { id: "hainan", province: "海南", sourceUrl: "https://ea.hainan.gov.cn/" },
  { id: "chongqing", province: "重庆", sourceUrl: "https://www.cqksy.cn/" },
  { id: "sichuan", province: "四川", sourceUrl: "https://www.sceea.cn/" },
  { id: "guizhou", province: "贵州", sourceUrl: "https://zsksy.guizhou.gov.cn/" },
  { id: "yunnan", province: "云南", sourceUrl: "https://www.ynzs.cn/" },
  { id: "xizang", province: "西藏", sourceUrl: "https://zsks.edu.xizang.gov.cn/" },
  { id: "shaanxi", province: "陕西", sourceUrl: "https://www.sneea.cn/" },
  { id: "gansu", province: "甘肃", sourceUrl: "https://www.ganseea.cn/" },
  { id: "qinghai", province: "青海", sourceUrl: "https://www.qhjyks.com/" },
  { id: "ningxia", province: "宁夏", sourceUrl: "https://www.nxjyks.cn/" },
  { id: "xinjiang", province: "新疆", sourceUrl: "https://www.xjzk.gov.cn/" }
] as const;

const sourceRegistry: SourceRegistryEntry[] = nationalOfficialSourceEntrypoints.map((entry) => ({
  id: `admission-stats-${entry.id}-${REGISTRY_YEAR}`,
  province: entry.province,
  sourceType: SOURCE_TYPE,
  sourceName: `${entry.province}省级考试招生权威入口`,
  sourceUrl: entry.sourceUrl,
  datasetType: "admission_stats",
  year: REGISTRY_YEAR,
  lastCheckedAt: REGISTRY_DATE,
  updatedAt: REGISTRY_DATE,
  coverageState: COVERAGE_STATE,
  confidence: 0,
  notes: MISSING_DATA_NOTE
}));

export function getSourceRegistry(): SourceRegistryEntry[] {
  return sourceRegistry.map((entry) => ({ ...entry }));
}

export function getNationalSourceCoverage(): {
  totalProvinces: number;
  byCoverageState: Partial<Record<CoverageState, number>>;
  registry: SourceRegistryEntry[];
} {
  const registry = getSourceRegistry();
  const byCoverageState = registry.reduce<Partial<Record<CoverageState, number>>>((counts, entry) => {
    counts[entry.coverageState] = (counts[entry.coverageState] ?? 0) + 1;
    return counts;
  }, {});

  return {
    totalProvinces: registry.length,
    byCoverageState,
    registry
  };
}
