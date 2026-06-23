import type {
  AdmissionDataset,
  AdmissionImportRow,
  DataCoverage,
  DataMode,
  DataSource,
  ImportResult,
  SourceAwareAdmissionStat,
  SourceAwareSchool,
  SourceType
} from "./data-model";

const sampleUpdatedAt = "2026-06-23T00:00:00.000Z";

const sampleSource = (year: number, province: string): DataSource => ({
  id: `sample-${province}-${year}`,
  sourceType: "sample",
  sourceName: "示例数据源：阳光高考与省级考试院字段结构样例",
  sourceUrl: "https://gaokao.chsi.com.cn/",
  year,
  province,
  updatedAt: sampleUpdatedAt,
  verifiedAt: sampleUpdatedAt,
  confidence: 0.2,
  notes: "用于演示真实数据结构，不代表官方录取结果。正式使用需导入省级考试院或学校招生办公开数据。"
});

const schoolSource: DataSource = {
  id: "sample-sunshine-college",
  sourceType: "sample",
  sourceName: "示例数据源：阳光高考院校库字段结构样例",
  sourceUrl: "https://gaokao.chsi.com.cn/sch/",
  year: 2026,
  province: "全国",
  updatedAt: sampleUpdatedAt,
  verifiedAt: sampleUpdatedAt,
  confidence: 0.2,
  notes: "院校字段为演示结构，正式版本需以阳光高考院校库和学校招生网核验。"
};

const baseSchools: SourceAwareSchool[] = [
  ["清华大学", "北京", "985 / 双一流", "北京", "顶尖综合研究型大学", "工科、计算机、建筑与管理交叉实力突出"],
  ["北京大学", "北京", "985 / 双一流", "北京", "顶尖综合研究型大学", "基础学科、医学、人文社科与交叉学科强"],
  ["上海交通大学", "上海", "985 / 双一流", "上海", "顶尖综合研究型大学", "工科、医学、信息与管理协同强"],
  ["浙江大学", "浙江", "985 / 双一流", "杭州", "顶尖综合研究型大学", "信息、工科、农学、医学和创新创业生态强"],
  ["南京大学", "江苏", "985 / 双一流", "南京", "顶尖综合研究型大学", "基础学科、计算机、天文地理和文理交叉强"],
  ["中国科学技术大学", "安徽", "985 / 双一流", "合肥", "顶尖理工研究型大学", "数理基础、人工智能、量子信息和科研训练强"],
  ["同济大学", "上海", "985 / 双一流", "上海", "高水平理工研究型大学", "建筑、土木、交通、设计与智能制造强"],
  ["北京航空航天大学", "北京", "985 / 双一流", "北京", "高水平理工研究型大学", "航空航天、计算机、自动化和电子信息强"],
  ["武汉大学", "湖北", "985 / 双一流", "武汉", "高水平综合研究型大学", "测绘、遥感、法学、经管和计算机基础好"],
  ["华中科技大学", "湖北", "985 / 双一流", "武汉", "高水平理工医综合大学", "机械、光电、计算机、临床医学和工程实践强"],
  ["东南大学", "江苏", "985 / 双一流", "南京", "高水平理工研究型大学", "建筑、电子、信息、交通和生医工强"],
  ["哈尔滨工业大学", "黑龙江", "985 / 双一流", "哈尔滨", "高水平理工研究型大学", "航天、机器人、计算机、材料和工程训练强"],
  ["电子科技大学", "四川", "985 / 双一流", "成都", "电子信息特色研究型大学", "电子、通信、微电子、计算机和网络安全强"],
  ["西安交通大学", "陕西", "985 / 双一流", "西安", "高水平综合研究型大学", "能源动力、电气、机械、管理和医学强"],
  ["北京邮电大学", "北京", "211 / 双一流", "北京", "信息通信特色大学", "通信、计算机、网络安全和数字经济就业连接强"],
  ["华南理工大学", "广东", "985 / 双一流", "广州", "高水平理工研究型大学", "轻工、材料、建筑、计算机和华南产业连接强"],
  ["南京航空航天大学", "江苏", "211 / 双一流", "南京", "航空航天特色大学", "航空、自动化、机械、电子信息和国防科技强"],
  ["北京科技大学", "北京", "211 / 双一流", "北京", "材料冶金特色大学", "材料、冶金、机械、自动化和新工科建设强"],
  ["深圳大学", "广东", "重点本科", "深圳", "城市创新型大学", "计算机、电子信息、设计和湾区就业连接强"],
  ["杭州电子科技大学", "浙江", "重点本科", "杭州", "电子信息特色大学", "电子、计算机、会计和杭州数字经济连接强"],
  ["上海大学", "上海", "211 / 双一流", "上海", "综合型重点大学", "材料、通信、影视艺术和上海就业资源较强"],
  ["南京邮电大学", "江苏", "双一流", "南京", "信息通信特色大学", "通信、电子、计算机、网络安全行业认可度高"],
  ["重庆邮电大学", "重庆", "重点本科", "重庆", "信息通信特色大学", "通信、软件、自动化和西部数字产业连接强"],
  ["西安电子科技大学", "陕西", "211 / 双一流", "西安", "电子信息特色大学", "电子、通信、网络安全、雷达和芯片方向强"]
].map(([name, province, type, city, level, campusAndEmployment], index) => {
  const featuredMajors = featuredMajorsFor(type, campusAndEmployment);
  return {
    id: index + 1,
    name,
    province,
    type,
    city,
    level,
    ownership: "公办",
    educationType: "普通本科",
    featuredMajors,
    advantagedDisciplines: featuredMajors.slice(0, 4),
    campusAndEmployment,
    suitableFor: suitableFor(type, city),
    dataMode: "sample",
    dataSources: [schoolSource]
  };
});

const latestBeijingStats = [
  { schoolId: 1, year: 2025, province: "北京", major: "计算机科学与技术", minRank: 360, avgRank: 720, stdRank: 430 },
  { schoolId: 2, year: 2025, province: "北京", major: "人工智能", minRank: 420, avgRank: 880, stdRank: 460 },
  { schoolId: 3, year: 2025, province: "北京", major: "电子信息工程", minRank: 760, avgRank: 1250, stdRank: 520 },
  { schoolId: 4, year: 2025, province: "北京", major: "计算机科学与技术", minRank: 930, avgRank: 1480, stdRank: 560 },
  { schoolId: 5, year: 2025, province: "北京", major: "软件工程", minRank: 1200, avgRank: 1760, stdRank: 620 },
  { schoolId: 6, year: 2025, province: "北京", major: "数据科学与大数据技术", minRank: 1500, avgRank: 2180, stdRank: 690 },
  { schoolId: 7, year: 2025, province: "北京", major: "智能制造工程", minRank: 1800, avgRank: 2480, stdRank: 700 },
  { schoolId: 8, year: 2025, province: "北京", major: "电子信息工程", minRank: 1950, avgRank: 2820, stdRank: 760 },
  { schoolId: 9, year: 2025, province: "北京", major: "计算机科学与技术", minRank: 2100, avgRank: 2980, stdRank: 820 },
  { schoolId: 10, year: 2025, province: "北京", major: "人工智能", minRank: 2250, avgRank: 3220, stdRank: 860 },
  { schoolId: 11, year: 2025, province: "北京", major: "软件工程", minRank: 2380, avgRank: 3150, stdRank: 900 },
  { schoolId: 12, year: 2025, province: "北京", major: "自动化", minRank: 2500, avgRank: 3300, stdRank: 960 },
  { schoolId: 13, year: 2025, province: "北京", major: "电子信息工程", minRank: 3100, avgRank: 3500, stdRank: 1060 },
  { schoolId: 14, year: 2025, province: "北京", major: "电气工程及其自动化", minRank: 3400, avgRank: 5120, stdRank: 1160 },
  { schoolId: 15, year: 2025, province: "北京", major: "通信工程", minRank: 3700, avgRank: 5680, stdRank: 1240 },
  { schoolId: 16, year: 2025, province: "北京", major: "软件工程", minRank: 4000, avgRank: 6400, stdRank: 1320 },
  { schoolId: 17, year: 2025, province: "北京", major: "自动化", minRank: 4300, avgRank: 7100, stdRank: 1480 },
  { schoolId: 18, year: 2025, province: "北京", major: "材料科学与工程", minRank: 4600, avgRank: 7900, stdRank: 1600 },
  { schoolId: 19, year: 2025, province: "北京", major: "计算机科学与技术", minRank: 4900, avgRank: 8700, stdRank: 1750 },
  { schoolId: 20, year: 2025, province: "北京", major: "人工智能", minRank: 5200, avgRank: 9500, stdRank: 1900 },
  { schoolId: 21, year: 2025, province: "北京", major: "电子信息工程", minRank: 5500, avgRank: 10400, stdRank: 2100 },
  { schoolId: 22, year: 2025, province: "北京", major: "通信工程", minRank: 5900, avgRank: 11300, stdRank: 2300 },
  { schoolId: 23, year: 2025, province: "北京", major: "软件工程", minRank: 6500, avgRank: 12800, stdRank: 2600 },
  { schoolId: 24, year: 2025, province: "北京", major: "电子信息工程", minRank: 6800, avgRank: 13600, stdRank: 2800 }
];

const provinceRankMultipliers: Record<string, number> = {
  全国: 1.5,
  北京: 1,
  天津: 1.18,
  河北: 1.72,
  山西: 1.42,
  内蒙古: 1.28,
  辽宁: 1.34,
  吉林: 1.24,
  黑龙江: 1.3,
  上海: 1.08,
  江苏: 1.22,
  浙江: 1.28,
  安徽: 1.55,
  福建: 1.4,
  江西: 1.5,
  山东: 1.65,
  河南: 1.9,
  湖北: 1.48,
  湖南: 1.52,
  广东: 1.45,
  广西: 1.5,
  海南: 1.18,
  重庆: 1.36,
  四川: 1.55,
  贵州: 1.46,
  云南: 1.44,
  西藏: 1.05,
  陕西: 1.38,
  甘肃: 1.34,
  青海: 1.08,
  宁夏: 1.1,
  新疆: 1.22
};

const seedStats: SourceAwareAdmissionStat[] = Object.entries(provinceRankMultipliers).flatMap(([province, multiplier]) =>
  latestBeijingStats.flatMap((stat, index) => {
    const schoolOrder = index % latestBeijingStats.length;
    const direction = schoolOrder < 10 ? -1 : 1;
    const drift = Math.round((index % 4) * 90 + 120);
    const source2025 = sampleSource(2025, province);
    const latest = {
      ...stat,
      province,
      minRank: Math.max(100, Math.round(stat.minRank * multiplier)),
      avgRank: Math.max(200, Math.round(stat.avgRank * multiplier)),
      stdRank: Math.max(120, Math.round(stat.stdRank * multiplier * 0.96))
    };

    return [
      withSource(
        {
          ...latest,
          year: 2023,
          avgRank: Math.max(200, latest.avgRank - direction * drift * 2),
          minRank: Math.max(100, latest.minRank - direction * drift)
        },
        sampleSource(2023, province)
      ),
      withSource(
        {
          ...latest,
          year: 2024,
          avgRank: Math.max(200, latest.avgRank - direction * drift),
          minRank: Math.max(100, latest.minRank - direction * Math.round(drift / 2))
        },
        sampleSource(2024, province)
      ),
      withSource(latest, source2025)
    ];
  })
);

const importedSchools: SourceAwareSchool[] = [];
const importedStats: SourceAwareAdmissionStat[] = [];

export function getAdmissionDataset(): AdmissionDataset {
  return {
    schools: [...baseSchools, ...importedSchools],
    stats: [...seedStats, ...importedStats]
  };
}

export function getDataSources(): DataSource[] {
  const byId = new Map<string, DataSource>();
  for (const school of getAdmissionDataset().schools) {
    for (const source of school.dataSources) byId.set(source.id, source);
  }
  for (const stat of getAdmissionDataset().stats) byId.set(stat.dataSource.id, stat.dataSource);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, "zh-CN"));
}

export function getDataCoverage(): DataCoverage {
  const dataset = getAdmissionDataset();
  const byMode: Partial<Record<DataMode, number>> = {};
  const bySourceType: Partial<Record<SourceType, number>> = {};
  const provinces = new Set<string>();
  let latestYear: number | null = null;
  let updatedAt: string | null = null;

  for (const stat of dataset.stats) {
    byMode[stat.dataMode] = (byMode[stat.dataMode] ?? 0) + 1;
    bySourceType[stat.dataSource.sourceType] = (bySourceType[stat.dataSource.sourceType] ?? 0) + 1;
    provinces.add(stat.province);
    latestYear = latestYear === null ? stat.year : Math.max(latestYear, stat.year);
    updatedAt = newerIso(updatedAt, stat.dataSource.updatedAt);
  }

  return {
    totalRecords: dataset.stats.length,
    totalSchools: dataset.schools.length,
    byMode,
    bySourceType,
    provinces: [...provinces].sort((a, b) => a.localeCompare(b, "zh-CN")),
    latestYear,
    updatedAt
  };
}

export function importAdmissionData(rows: AdmissionImportRow[]): ImportResult {
  const errors: ImportResult["errors"] = [];
  let accepted = 0;

  rows.forEach((row, index) => {
    const missing = requiredMissing(row);
    if (missing.length > 0) {
      errors.push({ index, message: `Missing required field(s): ${missing.join(", ")}` });
      return;
    }

    const sourceType = row.sourceType ?? "manual_verified";
    const dataMode = row.dataMode ?? (sourceType === "sample" ? "sample" : "verified");
    const school = ensureImportedSchool(row, dataMode);
    const source: DataSource = {
      id: `${sourceType}-${row.province}-${row.schoolName}-${row.major}-${row.year}-${importedStats.length + accepted}`,
      sourceType,
      sourceName: row.sourceName!,
      sourceUrl: row.sourceUrl!,
      year: row.year!,
      province: row.province!,
      updatedAt: row.updatedAt!,
      verifiedAt: row.verifiedAt,
      confidence: row.confidence ?? (dataMode === "verified" ? 0.92 : 0.45),
      notes: row.notes
    };

    importedStats.push({
      schoolId: school.id,
      year: row.year!,
      province: row.province!,
      major: row.major!,
      minRank: row.minRank!,
      avgRank: row.avgRank!,
      stdRank: row.stdRank!,
      planCount: row.planCount,
      subjectRequirement: row.subjectRequirement,
      dataMode,
      dataSource: source
    });
    accepted += 1;
  });

  return {
    accepted,
    rejected: rows.length - accepted,
    errors
  };
}

function withSource(
  stat: Omit<SourceAwareAdmissionStat, "dataMode" | "dataSource">,
  dataSource: DataSource
): SourceAwareAdmissionStat {
  return {
    ...stat,
    dataMode: dataSource.sourceType === "sample" ? "sample" : "verified",
    dataSource
  };
}

function ensureImportedSchool(row: AdmissionImportRow, dataMode: DataMode): SourceAwareSchool {
  const existing = [...baseSchools, ...importedSchools].find((school) => school.name === row.schoolName);
  if (existing) return existing;

  const source: DataSource = {
    id: `school-${row.schoolName}-${importedSchools.length + 1}`,
    sourceType: row.sourceType ?? "manual_verified",
    sourceName: row.sourceName!,
    sourceUrl: row.sourceUrl!,
    year: row.year!,
    province: row.schoolProvince ?? row.province!,
    updatedAt: row.updatedAt!,
    verifiedAt: row.verifiedAt,
    confidence: row.confidence ?? 0.9,
    notes: row.notes
  };
  const school: SourceAwareSchool = {
    id: baseSchools.length + importedSchools.length + 1,
    name: row.schoolName!,
    province: row.schoolProvince ?? row.province!,
    type: row.schoolType ?? "普通本科",
    city: row.city!,
    level: row.schoolLevel ?? "真实导入院校",
    ownership: row.ownership ?? "以官方来源为准",
    educationType: row.educationType ?? "普通本科",
    featuredMajors: row.featuredMajors ?? [row.major!],
    advantagedDisciplines: row.advantagedDisciplines ?? [row.major!],
    campusAndEmployment: row.campusAndEmployment ?? "已导入官方录取数据，学校画像需继续补充阳光高考与学校招生网信息。",
    suitableFor: row.suitableFor ?? ["重视官方数据核验", "希望按省份与专业精确评估"],
    dataMode,
    dataSources: [source]
  };
  importedSchools.push(school);
  return school;
}

function requiredMissing(row: AdmissionImportRow) {
  const required: Array<keyof AdmissionImportRow> = [
    "schoolName",
    "province",
    "city",
    "major",
    "year",
    "minRank",
    "avgRank",
    "stdRank",
    "sourceName",
    "sourceUrl",
    "updatedAt"
  ];
  return required.filter((field) => {
    const value = row[field];
    return value === undefined || value === null || value === "";
  });
}

function newerIso(current: string | null, next: string) {
  if (!current) return next;
  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

function featuredMajorsFor(type: string, description: string) {
  if (description.includes("医学")) return ["临床医学", "生物医学工程", "药学", "公共卫生"];
  if (description.includes("通信") || description.includes("电子")) return ["通信工程", "电子信息工程", "计算机科学与技术", "网络空间安全"];
  if (description.includes("建筑") || description.includes("土木")) return ["建筑学", "土木工程", "城乡规划", "交通工程"];
  if (description.includes("材料")) return ["材料科学与工程", "机械工程", "自动化", "新能源材料与器件"];
  if (type.includes("985")) return ["计算机科学与技术", "人工智能", "电子信息工程", "软件工程"];
  return ["计算机科学与技术", "电子信息工程", "通信工程", "自动化"];
}

function suitableFor(type: string, city: string) {
  const labels = ["希望按位次做梯度决策", "能接受真实数据复核流程"];
  if (type.includes("985")) labels.push("目标高水平研究型大学");
  if (type.includes("211")) labels.push("重视行业认可度与升学就业平衡");
  if (["北京", "上海", "深圳", "杭州", "南京", "广州"].includes(city)) labels.push("偏好强产业城市资源");
  return labels;
}

