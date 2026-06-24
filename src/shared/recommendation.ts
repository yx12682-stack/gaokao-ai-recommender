import type {
  AdmissionTrend,
  CohortDistributionItem,
  CohortOutcomes,
  CohortSchoolMajorPair,
  CoverageState,
  DataMode,
  DataSource,
  MajorCatalogEntry,
  ProbabilityExplanation,
  RiskLevel,
  SchoolMajorOption,
  SchoolReachability,
  SourceAwareAdmissionStat,
  SourceAwareSchool,
  VolunteerPlanItem
} from "./data-model";
import { getMajorCatalogEntry, nationalMajorCatalog } from "./major-catalog";
import { getAdmissionDataset } from "./real-data-store";

export { getMajorCatalog, getMajorCatalogEntry, nationalMajorCatalog } from "./major-catalog";
export { getNationalSourceCoverage, getSourceRegistry } from "./source-registry";

export type RiskPreference = "conservative" | "balanced" | "aggressive";
export type SubjectType = "physics" | "history" | "science" | "arts" | "comprehensive";
export type RecommendationCategory = "reach" | "match" | "safety";

export interface School {
  id: number;
  name: string;
  province: string;
  type: string;
  city: string;
  level?: string;
  ownership?: string;
  educationType?: string;
  featuredMajors?: string[];
  advantagedDisciplines?: string[];
  campusAndEmployment?: string;
  suitableFor?: string[];
  dataMode?: DataMode;
  dataSources?: DataSource[];
}

export interface AdmissionStat {
  schoolId: number;
  year: number;
  province: string;
  major: string;
  minRank: number;
  avgRank: number;
  stdRank: number;
  planCount?: number;
  subjectRequirement?: string;
  dataMode?: DataMode;
  dataSource?: DataSource;
}

export interface RecommendInput {
  score?: number;
  rank?: number;
  province: string;
  subject: SubjectType;
  cityPreference: number;
  preferredCities?: string[];
  majors: string[];
  riskPreference: RiskPreference;
}

export interface CohortOutcomesInput {
  score?: number;
  rank?: number;
  province: string;
  subject: SubjectType;
}

export interface ProbabilityFactors {
  base: number;
  majorHeat: number;
  regionalCompetition: number;
  cityPreference: number;
  trend: number;
  riskAdjustment: number;
}

export interface ProbabilityResult {
  probability: number;
  z: number;
  gap: number;
  factors: ProbabilityFactors;
}

export interface AlternativeSchool {
  schoolName: string;
  probability: number;
  reason: string;
}

export interface SchoolProfile {
  summary: string;
  level: string;
  location: string;
  ownership: string;
  educationType: string;
  strengths: string[];
  featuredMajors: string[];
  advantagedDisciplines: string[];
  suitableFor: string[];
  admissionInsight: string;
  campusAndEmployment: string;
  campusTags: string[];
}

export interface CareerGuide {
  overview: string;
  coreCourses: string[];
  suitableStudents: string[];
  directions: string[];
  roles: string[];
  industryOutlook: string;
  graduateDirections: string[];
  skillFocus: string[];
  riskReminder: string;
  longTermPath: string;
}

export interface Recommendation {
  schoolId: number;
  schoolName: string;
  province: string;
  city: string;
  type: string;
  major: string;
  probability: number;
  category: RecommendationCategory;
  selectionStage: "school_pool";
  schoolReachability: SchoolReachability;
  eligibleMajors: SchoolMajorOption[];
  reason: string;
  risk: string;
  dataMode: DataMode;
  dataSource: DataSource;
  dataSources: DataSource[];
  probabilityExplanation: ProbabilityExplanation;
  admissionTrend: AdmissionTrend;
  rankGap: number;
  riskLevel: RiskLevel;
  evidence: string[];
  schoolProfile: SchoolProfile;
  careerGuide: CareerGuide;
  alternative: AlternativeSchool;
}

export interface RecommendResponse {
  reach: Recommendation[];
  match: Recommendation[];
  safety: Recommendation[];
  cohortOutcomes: CohortOutcomes;
}

export interface SchoolFirstSummary {
  total: number;
  reach: number;
  match: number;
  safety: number;
  latestYear: number | null;
  dataMode: DataMode;
  dataStatus: string;
}

export interface ReachableSchoolsResponse {
  items: Recommendation[];
  summary: SchoolFirstSummary;
  cohortOutcomes: CohortOutcomes;
  dataNotice: string;
}

export interface SchoolDetailResponse {
  school: SourceAwareSchool;
  profile: SchoolProfile;
  admissionStats: SourceAwareAdmissionStat[];
  dataSources: DataSource[];
  dataNotice: string;
}

export interface SchoolMajorsInput extends RecommendInput {
  schoolId: number;
}

export interface SchoolMajorsResponse {
  schoolId: number;
  schoolName: string;
  items: SchoolMajorOption[];
  dataNotice: string;
}

export interface VolunteerPlanInput extends RecommendInput {
  selectedSchoolIds?: number[];
  selectedMajors?: string[];
}

export interface VolunteerPlanResponse {
  items: VolunteerPlanItem[];
  summary: SchoolFirstSummary;
  dataNotice: string;
}

const K = -1.35;

export const provinceOptions = [
  "全国",
  "北京",
  "天津",
  "河北",
  "山西",
  "内蒙古",
  "辽宁",
  "吉林",
  "黑龙江",
  "上海",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "广西",
  "海南",
  "重庆",
  "四川",
  "贵州",
  "云南",
  "西藏",
  "陕西",
  "甘肃",
  "青海",
  "宁夏",
  "新疆"
];

export const cityOptions = [
  "全国",
  "北京",
  "上海",
  "广州",
  "深圳",
  "杭州",
  "南京",
  "武汉",
  "成都",
  "西安",
  "重庆",
  "天津",
  "苏州",
  "合肥",
  "厦门",
  "长沙",
  "青岛",
  "济南",
  "郑州",
  "沈阳",
  "大连",
  "哈尔滨",
  "长春",
  "南昌",
  "福州",
  "昆明",
  "贵阳",
  "南宁",
  "海口",
  "石家庄",
  "太原",
  "呼和浩特",
  "兰州",
  "西宁",
  "银川",
  "乌鲁木齐",
  "拉萨",
  "宁波",
  "无锡",
  "佛山",
  "珠海"
];

export const majorOptions = nationalMajorCatalog.map((major) => major.name);

export const schools: School[] = [
  { id: 1, name: "清华大学", province: "北京", type: "985 / 双一流", city: "北京" },
  { id: 2, name: "北京大学", province: "北京", type: "985 / 双一流", city: "北京" },
  { id: 3, name: "上海交通大学", province: "上海", type: "985 / 双一流", city: "上海" },
  { id: 4, name: "浙江大学", province: "浙江", type: "985 / 双一流", city: "杭州" },
  { id: 5, name: "南京大学", province: "江苏", type: "985 / 双一流", city: "南京" },
  { id: 6, name: "中国科学技术大学", province: "安徽", type: "985 / 双一流", city: "合肥" },
  { id: 7, name: "同济大学", province: "上海", type: "985 / 双一流", city: "上海" },
  { id: 8, name: "北京航空航天大学", province: "北京", type: "985 / 双一流", city: "北京" },
  { id: 9, name: "武汉大学", province: "湖北", type: "985 / 双一流", city: "武汉" },
  { id: 10, name: "华中科技大学", province: "湖北", type: "985 / 双一流", city: "武汉" },
  { id: 11, name: "东南大学", province: "江苏", type: "985 / 双一流", city: "南京" },
  { id: 12, name: "哈尔滨工业大学", province: "黑龙江", type: "985 / 双一流", city: "哈尔滨" },
  { id: 13, name: "电子科技大学", province: "四川", type: "985 / 双一流", city: "成都" },
  { id: 14, name: "西安交通大学", province: "陕西", type: "985 / 双一流", city: "西安" },
  { id: 15, name: "北京邮电大学", province: "北京", type: "211 / 双一流", city: "北京" },
  { id: 16, name: "华南理工大学", province: "广东", type: "985 / 双一流", city: "广州" },
  { id: 17, name: "南京航空航天大学", province: "江苏", type: "211 / 双一流", city: "南京" },
  { id: 18, name: "北京科技大学", province: "北京", type: "211 / 双一流", city: "北京" },
  { id: 19, name: "深圳大学", province: "广东", type: "重点本科", city: "深圳" },
  { id: 20, name: "杭州电子科技大学", province: "浙江", type: "重点本科", city: "杭州" },
  { id: 21, name: "上海大学", province: "上海", type: "211 / 双一流", city: "上海" },
  { id: 22, name: "南京邮电大学", province: "江苏", type: "双一流", city: "南京" },
  { id: 23, name: "重庆邮电大学", province: "重庆", type: "重点本科", city: "重庆" },
  { id: 24, name: "西安电子科技大学", province: "陕西", type: "211 / 双一流", city: "西安" }
];

const latestBeijingStats: AdmissionStat[] = [
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

const latestProvinceStats: AdmissionStat[] = Object.entries(provinceRankMultipliers).flatMap(([province, multiplier]) =>
  latestBeijingStats.map((stat) => ({
    ...stat,
    province,
    minRank: Math.max(100, Math.round(stat.minRank * multiplier)),
    avgRank: Math.max(200, Math.round(stat.avgRank * multiplier)),
    stdRank: Math.max(120, Math.round(stat.stdRank * multiplier * 0.96))
  }))
);

const historicalRows: AdmissionStat[] = latestProvinceStats.flatMap((stat, index) => {
  const schoolOrder = index % latestBeijingStats.length;
  const direction = schoolOrder < 10 ? -1 : 1;
  const drift = Math.round((index % 4) * 90 + 120);
  return [
    {
      ...stat,
      year: 2023,
      avgRank: Math.max(200, stat.avgRank - direction * drift * 2),
      minRank: Math.max(100, stat.minRank - direction * drift)
    },
    {
      ...stat,
      year: 2024,
      avgRank: Math.max(200, stat.avgRank - direction * drift),
      minRank: Math.max(100, stat.minRank - direction * Math.round(drift / 2))
    }
  ];
});

export const admissionStats: AdmissionStat[] = [...historicalRows, ...latestProvinceStats];

const majorHeatPenalty: Record<string, number> = {
  计算机科学与技术: -0.055,
  人工智能: -0.065,
  软件工程: -0.04,
  电子信息工程: -0.035,
  数据科学与大数据技术: -0.04,
  临床医学: -0.06,
  金融学: -0.045,
  法学: -0.035,
  通信工程: -0.025,
  自动化: -0.018,
  电气工程及其自动化: -0.026,
  口腔医学: -0.06,
  会计学: -0.032,
  汉语言文学: -0.018
};

const cityCompetitionPenalty: Record<string, number> = {
  北京: -0.035,
  上海: -0.032,
  杭州: -0.024,
  深圳: -0.026,
  南京: -0.018,
  广州: -0.015,
  成都: -0.01,
  西安: -0.006,
  武汉: -0.006,
  重庆: -0.008,
  天津: -0.01,
  苏州: -0.014,
  合肥: -0.006,
  厦门: -0.014,
  长沙: -0.01,
  青岛: -0.012,
  济南: -0.008,
  郑州: -0.008,
  沈阳: -0.006,
  大连: -0.01,
  哈尔滨: -0.004,
  长春: -0.004,
  南昌: -0.006,
  福州: -0.008,
  昆明: -0.006,
  贵阳: -0.004,
  南宁: -0.004,
  海口: -0.004,
  石家庄: -0.004,
  太原: -0.004,
  呼和浩特: -0.003,
  兰州: -0.003,
  西宁: -0.002,
  银川: -0.002,
  乌鲁木齐: -0.003,
  拉萨: -0.002,
  宁波: -0.01,
  无锡: -0.01,
  佛山: -0.008,
  珠海: -0.008
};

const riskAdjustments: Record<RiskPreference, number> = {
  conservative: -0.045,
  balanced: 0,
  aggressive: 0.035
};

const typeStrengths: Record<string, string[]> = {
  "985 / 双一流": ["科研平台强", "保研与深造资源充足", "全国认可度高", "复合型项目多"],
  "211 / 双一流": ["行业资源集中", "优势专业稳定", "城市就业连接强", "升学与就业平衡"],
  "双一流": ["重点学科突出", "区域认可度高", "专业建设投入稳定"],
  重点本科: ["就业导向明确", "区域产业协同强", "录取性价比高"]
};

const majorCareerProfiles: Array<{
  match: string[];
  overview: (major: string) => string;
  directions: string[];
  roles: string[];
  skillFocus: string[];
  longTermPath: string;
}> = [
  {
    match: ["计算机", "软件", "人工智能", "数据科学", "网络", "信息安全", "物联网", "数字媒体技术"],
    overview: (major) => `${major} 面向数字产业核心岗位，学习路径通常从编程、算法、系统设计和工程实践展开。`,
    directions: ["互联网平台与企业软件", "人工智能与数据智能", "金融科技与产业数字化", "网络安全与云计算"],
    roles: ["软件工程师", "算法工程师", "数据分析师", "后端开发工程师", "产品技术经理", "安全工程师"],
    skillFocus: ["编程基础", "数据结构与算法", "工程协作", "数据库与云服务", "数学建模"],
    longTermPath: "可向技术专家、架构师、算法负责人、数据科学负责人或技术型产品管理发展。"
  },
  {
    match: ["电子", "通信", "微电子", "光电", "自动化", "机器人工程", "电气"],
    overview: (major) => `${major} 连接硬件、控制、通信和智能制造，适合希望进入高端制造与硬科技行业的学生。`,
    directions: ["芯片与半导体", "通信设备与网络", "智能制造与机器人", "新能源与电力系统"],
    roles: ["硬件工程师", "嵌入式工程师", "通信算法工程师", "电气工程师", "自动化工程师", "测试验证工程师"],
    skillFocus: ["电路基础", "信号处理", "控制理论", "嵌入式开发", "实验与工程验证"],
    longTermPath: "可向研发骨干、系统工程师、项目技术负责人、产品线专家或产业解决方案架构师发展。"
  },
  {
    match: ["临床医学", "口腔医学", "医学", "药学", "护理", "预防医学", "中医学"],
    overview: (major) => `${major} 培养周期较长，职业稳定性强，通常需要持续深造、规培或取得对应执业资格。`,
    directions: ["综合医院与专科医院", "公共卫生与疾控", "医药研发与注册", "医疗器械与健康管理"],
    roles: ["临床医生", "口腔医生", "药物研发专员", "公共卫生专员", "医学影像医师", "健康管理顾问"],
    skillFocus: ["医学基础", "临床思维", "沟通与伦理", "证照考试", "长期学习能力"],
    longTermPath: "可向主治医师、专科医生、医学科研、医院管理或医药产业医学事务岗位发展。"
  },
  {
    match: ["金融", "经济", "财政", "会计", "财务", "审计", "国际经济"],
    overview: (major) => `${major} 偏向资金、商业和组织经营分析，需要把数理能力、政策理解和商业判断结合起来。`,
    directions: ["银行与证券基金", "企业财务与投融资", "咨询与审计", "金融科技与风控"],
    roles: ["金融分析师", "投研助理", "审计师", "财务分析师", "风险管理专员", "咨询顾问"],
    skillFocus: ["财务报表", "统计分析", "宏观与产业理解", "Excel/Python", "表达与研究写作"],
    longTermPath: "可向投资经理、财务负责人、风控负责人、咨询项目经理或企业战略岗位发展。"
  },
  {
    match: ["法学", "知识产权", "社会学", "行政管理", "公共事业"],
    overview: (major) => `${major} 强调规则理解、文本分析、公共议题和沟通表达，适合逻辑严密且愿意长期积累的人。`,
    directions: ["律师与法律服务", "企业合规", "知识产权", "公共部门与社会治理"],
    roles: ["律师助理", "法务专员", "合规专员", "知识产权顾问", "公共政策研究员", "公务员方向"],
    skillFocus: ["法律检索", "案例分析", "写作表达", "谈判沟通", "资格考试规划"],
    longTermPath: "可向执业律师、企业法务负责人、合规负责人、公共政策专家或司法考试相关路径发展。"
  },
  {
    match: ["汉语言", "新闻", "广告", "网络与新媒体", "英语", "日语", "历史", "教育"],
    overview: (major) => `${major} 重视语言、内容、教育和传播能力，职业弹性较大，作品与实习积累很关键。`,
    directions: ["教育培训与学校", "媒体与内容运营", "品牌传播", "出版文化与公共传播"],
    roles: ["教师", "内容策划", "新媒体运营", "品牌文案", "编辑", "国际业务专员"],
    skillFocus: ["写作表达", "教学设计", "信息检索", "用户洞察", "跨文化沟通"],
    longTermPath: "可向骨干教师、内容负责人、品牌传播负责人、出版编辑或国际化运营岗位发展。"
  },
  {
    match: ["机械", "车辆", "材料", "能源", "土木", "建筑", "交通", "航空", "船舶", "环境", "食品", "安全"],
    overview: (major) => `${major} 以工程设计、制造、建设和产业应用为核心，适合喜欢解决真实复杂系统问题的学生。`,
    directions: ["先进制造", "汽车与新能源", "建筑与基础设施", "航空航天与交通装备", "环保与安全工程"],
    roles: ["机械工程师", "结构工程师", "工艺工程师", "质量工程师", "项目工程师", "研发工程师"],
    skillFocus: ["工程制图", "力学与材料", "仿真软件", "项目管理", "现场实践"],
    longTermPath: "可向高级工程师、项目经理、产品研发负责人、工厂技术管理或产业专家发展。"
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function roundProbability(value: number) {
  return Number(value.toFixed(2));
}

function toSchoolMap(schoolRows: School[] = schools) {
  return new Map(schoolRows.map((school) => [school.id, school]));
}

export function calculateBaseProbability({
  studentRank,
  schoolAvgRank,
  schoolStdRank
}: {
  studentRank: number;
  schoolAvgRank: number;
  schoolStdRank: number;
}) {
  const safeStdRank = Math.max(1, schoolStdRank);
  const gap = studentRank - schoolAvgRank;
  const z = gap / safeStdRank;
  return sigmoid(K * z);
}

export function calculateProbability({
  studentRank,
  province,
  preferredCities = [],
  cityPreference,
  majors,
  riskPreference,
  stat,
  school,
  trendDelta
}: {
  studentRank: number;
  province: string;
  preferredCities?: string[];
  cityPreference: number;
  majors: string[];
  riskPreference: RiskPreference;
  stat: AdmissionStat;
  school: School;
  trendDelta: number;
}): ProbabilityResult {
  const safeStdRank = Math.max(1, stat.stdRank);
  const gap = studentRank - stat.avgRank;
  const z = gap / safeStdRank;
  const base = calculateBaseProbability({
    studentRank,
    schoolAvgRank: stat.avgRank,
    schoolStdRank: safeStdRank
  });

  const selectedMajorPenalty = majors.includes(stat.major) ? majorHeatPenalty[stat.major] ?? -0.018 : -0.035;
  const regionalCompetition =
    (cityCompetitionPenalty[school.city] ?? -0.004) + (school.province === province ? 0.012 : 0);
  const acceptsNationalCity = preferredCities.includes("全国") || preferredCities.length === 0;
  const cityMatch = acceptsNationalCity || preferredCities.includes(school.city);
  const cityPreferenceFactor = acceptsNationalCity ? 0 : cityMatch ? cityPreference * 0.06 : -cityPreference * 0.045;
  const trend = clamp(trendDelta, -0.08, 0.08);
  const riskAdjustment = riskAdjustments[riskPreference];
  const probability = clamp(
    base + selectedMajorPenalty + regionalCompetition + cityPreferenceFactor + trend + riskAdjustment,
    0.03,
    0.96
  );

  return {
    probability: roundProbability(probability),
    z,
    gap,
    factors: {
      base: roundProbability(base),
      majorHeat: Number(selectedMajorPenalty.toFixed(3)),
      regionalCompetition: Number(regionalCompetition.toFixed(3)),
      cityPreference: Number(cityPreferenceFactor.toFixed(3)),
      trend: Number(trend.toFixed(3)),
      riskAdjustment: Number(riskAdjustment.toFixed(3))
    }
  };
}

function estimateRankFromScore(score: number, subject: SubjectType) {
  const normalized = clamp(score, 300, 750);
  const base = subject === "history" || subject === "arts" ? 260000 : 300000;
  return Math.max(500, Math.round(base * Math.exp(-(normalized - 420) / 74)));
}

function latestStatsForProvince(
  province: string,
  stats: AdmissionStat[] = admissionStats,
  subject?: SubjectType,
  selectedMajors: string[] = []
) {
  const latestBySchool = new Map<number, AdmissionStat>();
  const selectedMajorSet = new Set(selectedMajors);
  for (const stat of stats) {
    if (stat.province !== province) continue;
    if (subject && !subjectMatchesRequirement(subject, stat.subjectRequirement)) continue;
    const previous = latestBySchool.get(stat.schoolId);
    if (!previous || shouldReplaceSchoolRepresentative(stat, previous, selectedMajorSet)) {
      latestBySchool.set(stat.schoolId, stat);
    }
  }
  return [...latestBySchool.values()];
}

function shouldReplaceSchoolRepresentative(next: AdmissionStat, previous: AdmissionStat, selectedMajors: Set<string>) {
  if (previous.year !== next.year) return previous.year < next.year;
  const nextSelected = selectedMajors.has(next.major);
  const previousSelected = selectedMajors.has(previous.major);
  if (nextSelected !== previousSelected) return nextSelected;
  return next.avgRank > previous.avgRank;
}

function latestStatsForSchoolInProvince({
  schoolId,
  province,
  stats,
  subject
}: {
  schoolId: number;
  province: string;
  stats: AdmissionStat[];
  subject: SubjectType;
}) {
  const eligibleRows = stats.filter(
    (stat) => stat.schoolId === schoolId && stat.province === province && subjectMatchesRequirement(subject, stat.subjectRequirement)
  );
  const latestYear = eligibleRows.reduce<number | null>(
    (current, stat) => (current === null ? stat.year : Math.max(current, stat.year)),
    null
  );
  return latestYear === null ? [] : eligibleRows.filter((stat) => stat.year === latestYear);
}

function trendDeltaFor(stat: AdmissionStat, stats: AdmissionStat[] = admissionStats) {
  const rows = stats
    .filter(
      (row) =>
        row.schoolId === stat.schoolId &&
        row.province === stat.province &&
        row.major === stat.major &&
        row.year < stat.year
    )
    .sort((a, b) => b.year - a.year);
  const previous = rows[0];
  if (!previous) return 0;

  const selectivityShift = (stat.avgRank - previous.avgRank) / Math.max(stat.stdRank, 1);
  return clamp(selectivityShift * 0.035, -0.055, 0.055);
}

function categoryFor(probability: number): RecommendationCategory {
  if (probability < 0.4) return "reach";
  if (probability <= 0.7) return "match";
  return "safety";
}

function riskText(category: RecommendationCategory, probability: number, stat: AdmissionStat) {
  if (category === "reach") {
    return `录取概率 ${Math.round(probability * 100)}%，近年平均位次约 ${stat.avgRank.toLocaleString("zh-CN")}，需接受热门专业波动和同分竞争。`;
  }
  if (category === "match") {
    return `录取概率 ${Math.round(probability * 100)}%，与近三年均值区间接近，建议搭配同层次院校形成梯度。`;
  }
  return `录取概率 ${Math.round(probability * 100)}%，位次缓冲较明显，但仍需关注专业组计划数变化。`;
}

function reasonText({
  school,
  stat,
  probability,
  preferredCities,
  majors
}: {
  school: School;
  stat: AdmissionStat;
  probability: number;
  preferredCities: string[];
  majors: string[];
}) {
  const citySignal = preferredCities.includes(school.city) ? `命中城市偏好 ${school.city}` : `${school.city} 提供区域梯度`;
  const majorSignal = majors.includes(stat.major) ? `匹配专业偏好「${stat.major}」` : `以相近专业「${stat.major}」增强方案宽度`;
  return `${school.name} 是 ${school.type} 院校，${majorSignal}，${citySignal}，模型综合录取概率为 ${Math.round(
    probability * 100
  )}%。`;
}

function getSchoolProfile(school: School, stat: AdmissionStat, category: RecommendationCategory, probability: number): SchoolProfile {
  const strengths = typeStrengths[school.type] ?? ["专业基础稳定", "区域就业连接明确", "培养路径清晰"];
  const categoryText = category === "reach" ? "冲刺" : category === "match" ? "稳妥" : "保底";
  const featuredMajors = school.featuredMajors ?? [stat.major, "通识培养", "交叉学科"];
  const advantagedDisciplines = school.advantagedDisciplines ?? strengths.slice(0, 4);
  const suitableFor = school.suitableFor ?? ["希望按位次做梯度决策", "需要兼顾学校层次与专业方向"];
  return {
    summary: `${school.name} 位于${school.city}，属于${school.type}院校。本次推荐把它放入${categoryText}梯度，适合作为志愿组合中的${categoryText}节点。`,
    level: school.level ?? school.type,
    location: `${school.province} · ${school.city}`,
    ownership: school.ownership ?? "以官方招生章程为准",
    educationType: school.educationType ?? "普通本科",
    strengths: [...strengths, `${school.city} 城市资源`, `${stat.major} 专业方向`].slice(0, 5),
    featuredMajors,
    advantagedDisciplines,
    suitableFor,
    admissionInsight: `近年 ${stat.major} 平均录取位次约 ${stat.avgRank.toLocaleString(
      "zh-CN"
    )}，最低位次样本约 ${stat.minRank.toLocaleString("zh-CN")}；当前模型概率为 ${Math.round(
      probability * 100
    )}%，需要结合当年计划数、选科要求和专业组变化复核。`,
    campusAndEmployment:
      school.campusAndEmployment ?? `${school.city} 的区域产业、升学资源和实习机会会影响该校毕业去向，需要结合学校就业质量报告复核。`,
    campusTags: [school.province, school.city, school.type, stat.major]
  };
}

function getCareerGuide(major: string): CareerGuide {
  const profile =
    majorCareerProfiles.find((item) => item.match.some((keyword) => major.includes(keyword))) ?? {
      overview: (name: string) => `${name} 需要结合学科基础、行业实习和个人能力形成清晰职业路径。`,
      directions: ["企事业单位专业岗位", "行业研究与运营管理", "继续深造与交叉学科", "公共部门与区域产业"],
      roles: ["专业助理", "运营专员", "项目专员", "研究助理", "管理培训生"],
      skillFocus: ["专业基础", "数据分析", "沟通表达", "实习实践", "证书与作品积累"],
      longTermPath: "可依据个人兴趣向专业专家、项目管理、行业研究、公共服务或复合型管理岗位发展。"
    };
  const expansion = careerExpansionFor(major);

  return {
    overview: profile.overview(major),
    coreCourses: expansion.coreCourses,
    suitableStudents: expansion.suitableStudents,
    directions: profile.directions,
    roles: profile.roles,
    industryOutlook: expansion.industryOutlook,
    graduateDirections: expansion.graduateDirections,
    skillFocus: profile.skillFocus,
    riskReminder: expansion.riskReminder,
    longTermPath: profile.longTermPath
  };
}

function careerExpansionFor(major: string) {
  if (["计算机", "软件", "人工智能", "数据科学", "网络", "信息安全"].some((keyword) => major.includes(keyword))) {
    return {
      coreCourses: ["程序设计", "数据结构", "算法分析", "计算机系统", "数据库", "机器学习基础"],
      suitableStudents: ["数学与逻辑基础较好", "愿意持续学习新技术", "能接受高强度项目实践"],
      industryOutlook: "数字化、人工智能和产业软件长期需求仍强，但岗位会更看重工程能力、实习经历和复合背景。",
      graduateDirections: ["计算机科学与技术", "软件工程", "人工智能", "网络空间安全", "电子信息专硕"],
      riskReminder: "热门方向竞争激烈，普通课程成绩不足以形成优势，需要通过项目、竞赛、实习或科研证明能力。"
    };
  }
  if (["电子", "通信", "自动化", "电气", "微电子", "机器人工程"].some((keyword) => major.includes(keyword))) {
    return {
      coreCourses: ["电路分析", "模拟电子技术", "数字电子技术", "信号与系统", "控制理论", "嵌入式系统"],
      suitableStudents: ["物理和数学基础扎实", "喜欢硬件与系统调试", "能接受实验和工程验证"],
      industryOutlook: "半导体、通信设备、智能制造和新能源相关岗位需求稳定，区域产业链会显著影响实习与就业机会。",
      graduateDirections: ["电子科学与技术", "信息与通信工程", "控制科学与工程", "电气工程", "集成电路工程"],
      riskReminder: "学习曲线较陡，低年级基础课和实验能力会影响后续方向选择。"
    };
  }
  if (["临床医学", "口腔医学", "药学", "护理", "医学"].some((keyword) => major.includes(keyword))) {
    return {
      coreCourses: ["人体解剖学", "生理学", "病理学", "药理学", "诊断学", "临床技能训练"],
      suitableStudents: ["愿意长期学习和考试", "沟通稳定性强", "能接受规培和执业资格路径"],
      industryOutlook: "医疗健康需求长期稳定，但培养周期长、资格要求高，城市和医院平台差异明显。",
      graduateDirections: ["临床医学", "口腔医学", "公共卫生", "药学", "基础医学"],
      riskReminder: "周期长、压力大，需关注学制、规培、执业资格和专业调剂风险。"
    };
  }
  if (["金融", "经济", "财政", "会计", "财务", "审计"].some((keyword) => major.includes(keyword))) {
    return {
      coreCourses: ["微观经济学", "宏观经济学", "会计学", "公司金融", "计量经济学", "统计分析"],
      suitableStudents: ["对商业和数据敏感", "表达与研究写作能力较强", "愿意积累实习和证书"],
      industryOutlook: "金融与经营分析岗位仍有需求，但更看重学校平台、实习质量、数据能力和行业理解。",
      graduateDirections: ["应用经济学", "金融专硕", "会计专硕", "统计学", "工商管理"],
      riskReminder: "热门岗位集中在头部城市和头部机构，需要尽早规划实习、证书和量化工具能力。"
    };
  }
  if (["法学", "知识产权", "社会学", "行政管理"].some((keyword) => major.includes(keyword))) {
    return {
      coreCourses: ["法理学", "宪法学", "民法", "刑法", "行政法", "法律文书写作"],
      suitableStudents: ["阅读和表达能力强", "逻辑严谨", "能接受资格考试和长期案例积累"],
      industryOutlook: "法律、合规和公共治理需求稳定，专业资格、学校平台和实习经历对职业入口影响大。",
      graduateDirections: ["法学", "法律硕士", "知识产权", "公共管理", "社会治理"],
      riskReminder: "法考、考研和公务员等路径竞争都很强，需要提前设计备选路线。"
    };
  }
  return {
    coreCourses: ["专业导论", "学科基础课", "研究方法", "数据分析", "实践实训", "毕业设计"],
    suitableStudents: ["愿意探索交叉方向", "重视实习与作品积累", "希望通过深造或证书增强竞争力"],
    industryOutlook: "就业质量取决于学校平台、城市产业、个人能力和实习质量，需要结合真实就业质量报告判断。",
    graduateDirections: ["本专业继续深造", "交叉学科", "教育方向", "管理方向", "专业硕士"],
    riskReminder: "不同学校培养重点差异较大，需要复核课程设置、转专业政策和毕业去向。"
  };
}

function sourceFor(school: School, stat: AdmissionStat): DataSource {
  return (
    stat.dataSource ??
    school.dataSources?.[0] ?? {
      id: "sample-legacy",
      sourceType: "sample",
      sourceName: "示例数据源：本地历史样例",
      sourceUrl: "https://gaokao.chsi.com.cn/",
      year: stat.year,
      province: stat.province,
      updatedAt: "2026-06-23T00:00:00.000Z",
      verifiedAt: "2026-06-23T00:00:00.000Z",
      confidence: 0.2,
      notes: "旧版本地样例数据，仅用于演示推荐流程。"
    }
  );
}

function dataModeFor(school: School, stat: AdmissionStat): DataMode {
  return stat.dataMode ?? school.dataMode ?? "sample";
}

function riskLevelFor(category: RecommendationCategory, probability: number): RiskLevel {
  if (category === "reach" || probability < 0.45) return "high";
  if (category === "match" || probability < 0.74) return "medium";
  return "low";
}

function probabilityExplanationFor(result: ProbabilityResult): ProbabilityExplanation {
  return {
    formula: "gap = student_rank - school_avg_rank; z = gap / school_std; probability = 1 / (1 + exp(-k * z))",
    gap: Math.round(result.gap),
    z: Number(result.z.toFixed(3)),
    factors: {
      ...result.factors,
      final: result.probability
    },
    narrative: `基础 sigmoid 概率为 ${Math.round(result.factors.base * 100)}%，叠加专业热度、地区竞争、城市偏好、年份趋势和风险偏好后，最终概率为 ${Math.round(
      result.probability * 100
    )}%。`
  };
}

function admissionTrendFor(stat: AdmissionStat, stats: AdmissionStat[]): AdmissionTrend {
  const rows = stats
    .filter((row) => row.schoolId === stat.schoolId && row.province === stat.province && row.major === stat.major)
    .sort((a, b) => a.year - b.year);
  const yearlyAvgRanks = rows.map((row) => ({
    year: row.year,
    avgRank: row.avgRank,
    minRank: row.minRank
  }));
  const first = rows[0] ?? stat;
  const latest = rows[rows.length - 1] ?? stat;
  const delta = latest.avgRank - first.avgRank;
  const direction = Math.abs(delta) < stat.stdRank * 0.18 ? "stable" : delta < 0 ? "rising" : "declining";
  const values = rows.map((row) => row.avgRank);
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length, 1);
  const coefficient = Math.sqrt(variance) / Math.max(mean, 1);
  const volatility = coefficient > 0.18 ? "high" : coefficient > 0.08 ? "medium" : "low";
  const directionText = direction === "rising" ? "录取位次趋紧" : direction === "declining" ? "录取位次有所放宽" : "录取位次基本稳定";

  return {
    latestYear: latest.year,
    yearlyAvgRanks,
    direction,
    volatility,
    summary: `${latest.year} 年平均位次 ${latest.avgRank.toLocaleString("zh-CN")}；近三年趋势显示${directionText}，波动水平为 ${volatility}。`
  };
}

function evidenceFor({
  school,
  stat,
  probability,
  dataMode,
  source,
  trend
}: {
  school: School;
  stat: AdmissionStat;
  probability: number;
  dataMode: DataMode;
  source: DataSource;
  trend: AdmissionTrend;
}) {
  return [
    `${source.sourceName}（${source.year}，${source.sourceType}，可信度 ${Math.round(source.confidence * 100)}%）`,
    `${school.name} · ${stat.major} 最新平均位次 ${stat.avgRank.toLocaleString("zh-CN")}，最低位次样本 ${stat.minRank.toLocaleString("zh-CN")}`,
    `数据模式：${dataMode === "verified" ? "真实核验" : dataMode === "partial" ? "部分真实" : "示例结构"}；模型概率 ${Math.round(
      probability * 100
    )}%`,
    trend.summary
  ];
}

function uniqueMajorNames(names: Array<string | undefined>) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const name of names) {
    const normalized = name?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}

function heatLevelFor(majorName: string): SchoolMajorOption["heatLevel"] {
  const heatPenalty = majorHeatPenalty[majorName] ?? -0.018;
  if (heatPenalty <= -0.045) return "high";
  if (heatPenalty <= -0.025) return "medium";
  return "low";
}

function careerSummaryFor(majorName: string) {
  const catalogEntry = getMajorCatalogEntry(majorName);
  if (catalogEntry) {
    const directions = catalogEntry.employmentDirections.slice(0, 2).join("、");
    const careers = catalogEntry.representativeCareers.slice(0, 3).join("、");
    return `${directions}；代表岗位包括${careers}。${catalogEntry.industryOutlook}`;
  }

  const guide = getCareerGuide(majorName);
  return `${guide.directions.slice(0, 2).join("、")}；代表岗位包括${guide.roles.slice(0, 3).join("、")}。${guide.industryOutlook}`;
}

function candidateMajorNamesFor(school: School, stat: AdmissionStat, selectedMajors: string[], schoolMajorStats: AdmissionStat[] = []) {
  const preferredNames = uniqueMajorNames([
    stat.major,
    ...schoolMajorStats.map((item) => item.major),
    ...(school.featuredMajors ?? []),
    ...selectedMajors
  ]);
  const preferredEntries = preferredNames.flatMap((name) => {
    const entry = getMajorCatalogEntry(name);
    return entry ? [entry] : [];
  });
  const catalogPreferredNames = preferredEntries.map((entry) => entry.name);
  const relatedNames = preferredEntries.flatMap((entry) => entry.relatedMajors);
  const preferredMajorClasses = new Set(preferredEntries.map((entry) => entry.majorClass));
  const sameClassNames = nationalMajorCatalog
    .filter((entry) => preferredMajorClasses.has(entry.majorClass))
    .map((entry) => entry.name);

  return uniqueMajorNames([
    ...catalogPreferredNames,
    ...relatedNames,
    ...sameClassNames,
    "计算机科学与技术",
    "电子信息工程",
    "软件工程",
    "人工智能",
    "自动化",
    "通信工程"
  ]).slice(0, 5);
}

function majorOptionReason({
  majorName,
  school,
  stat,
  selectedMajors
}: {
  majorName: string;
  school: School;
  stat: AdmissionStat;
  selectedMajors: string[];
}) {
  if (majorName === stat.major) {
    return `该方向有 ${stat.year} 年 ${school.name} 录取位次样本，可作为校内专业选择的首个参照。`;
  }
  if (school.featuredMajors?.includes(majorName)) {
    return `${majorName} 来自 ${school.name} 的特色专业线索，适合作为同校备选方向继续核验。`;
  }
  if (selectedMajors.includes(majorName)) {
    return `该方向来自考生专业偏好，放入 ${school.name} 的校内备选池用于和录取位次一起比较。`;
  }
  return `${majorName} 与该校优势方向或国家专业目录相近，可补足同一学校下的专业选择宽度。`;
}

function buildEligibleMajors({
  school,
  stat,
  selectedMajors,
  probability,
  rankGap,
  source,
  dataMode,
  schoolMajorStats,
  studentRank
}: {
  school: School;
  stat: AdmissionStat;
  selectedMajors: string[];
  probability: number;
  rankGap: number;
  source: DataSource;
  dataMode: DataMode;
  schoolMajorStats?: AdmissionStat[];
  studentRank: number;
}): SchoolMajorOption[] {
  const selectedMajorSet = new Set(selectedMajors);
  const statHeatPenalty = majorHeatPenalty[stat.major] ?? -0.018;
  const sameSchoolMajorStats = schoolMajorStats ?? [];
  const majorStatsByName = new Map(sameSchoolMajorStats.map((item) => [item.major, item]));

  return candidateMajorNamesFor(school, stat, selectedMajors, sameSchoolMajorStats).map((majorName, index) => {
    const majorStat = majorStatsByName.get(majorName);
    const catalogEntry = getMajorCatalogEntry(majorName);
    const guide = getCareerGuide(majorName);
    const optionHeatPenalty = majorHeatPenalty[majorName] ?? -0.018;
    const heatAdjustment = optionHeatPenalty - statHeatPenalty;
    const preferenceAdjustment = selectedMajorSet.has(majorName) ? 0.012 : 0;
    const positionAdjustment = majorName === stat.major ? 0 : -Math.min(index * 0.006, 0.03);
    const majorStatProbability =
      majorStat && majorStat.major !== stat.major
        ? roundProbability(
            clamp(
              calculateBaseProbability({
                studentRank,
                schoolAvgRank: majorStat.avgRank,
                schoolStdRank: majorStat.stdRank
              }) +
                heatAdjustment +
                preferenceAdjustment,
              0.03,
              0.96
            )
          )
        : null;
    const fitProbability =
      majorName === stat.major
        ? probability
        : majorStatProbability ?? roundProbability(clamp(probability + heatAdjustment + preferenceAdjustment + positionAdjustment, 0.03, 0.96));
    const optionStat = majorStat ?? stat;
    const optionSource = sourceFor(school, optionStat);
    const optionDataMode = dataModeFor(school, optionStat);
    const optionRankGap = majorStat ? studentRank - majorStat.avgRank : rankGap - (fitProbability - probability) * Math.max(stat.stdRank, 1);

    return {
      majorName,
      plainLanguage: catalogEntry?.plainLanguage ?? guide.overview,
      fitProbability,
      heatLevel: heatLevelFor(majorName),
      dataMode: optionDataMode ?? dataMode,
      source: majorStat ? optionSource : majorName === stat.major ? source : catalogEntry?.dataSource ?? source,
      rankGap: Math.round(optionRankGap),
      reason: majorOptionReason({ majorName, school, stat, selectedMajors }),
      risk: catalogEntry?.riskReminder ?? guide.riskReminder,
      careerSummary: careerSummaryFor(majorName)
    };
  });
}

function withAlternative(item: Omit<Recommendation, "alternative">, pool: Omit<Recommendation, "alternative">[]) {
  const safer = pool
    .filter((candidate) => candidate.schoolId !== item.schoolId && candidate.probability >= item.probability)
    .sort((a, b) => a.probability - b.probability)[0];
  const fallback = pool
    .filter((candidate) => candidate.schoolId !== item.schoolId)
    .sort((a, b) => Math.abs(a.probability - item.probability) - Math.abs(b.probability - item.probability))[0];
  const alternative = safer ?? fallback ?? item;

  return {
    ...item,
    alternative: {
      schoolName: alternative.schoolName,
      probability: alternative.probability,
      reason:
        alternative.schoolId === item.schoolId
          ? "当前 mock 数据中同梯度替代有限，可用相邻梯度院校补充。"
          : `${alternative.schoolName} 概率约 ${Math.round(alternative.probability * 100)}%，可作为同方向替代。`
    }
  };
}

function sortForCategory<T extends { probability: number }>(items: T[], category: RecommendationCategory) {
  if (category === "reach") {
    return [...items].sort((a, b) => b.probability - a.probability);
  }
  if (category === "match") {
    return [...items].sort((a, b) => Math.abs(a.probability - 0.58) - Math.abs(b.probability - 0.58));
  }
  return [...items].sort((a, b) => b.probability - a.probability);
}

function selectGroup(items: Omit<Recommendation, "alternative">[], category: RecommendationCategory, count: number) {
  return sortForCategory(
    items.filter((item) => item.category === category),
    category
  ).slice(0, count);
}

type CohortRow = {
  stat: SourceAwareAdmissionStat;
  school: School;
};

function rankBandFor(rankCenter: number) {
  const radius = Math.max(500, Math.round(rankCenter * 0.16));
  return {
    from: Math.max(1, rankCenter - radius),
    to: rankCenter + radius
  };
}

function subjectMatchesRequirement(subject: SubjectType, requirement?: string) {
  if (!requirement || requirement.includes("不限")) return true;

  const subjectKeywords: Record<SubjectType, string[]> = {
    physics: ["物理", "理科"],
    history: ["历史", "文科"],
    science: ["理科", "物理"],
    arts: ["文科", "历史"],
    comprehensive: ["综合", "不限"]
  };

  return subjectKeywords[subject].some((keyword) => requirement.includes(keyword));
}

function summarizeDataMode(rows: CohortRow[]): DataMode {
  if (rows.length === 0) return "unavailable";

  const modes = new Set(rows.map(({ school, stat }) => dataModeFor(school, stat)));
  if (modes.size === 1) return [...modes][0];
  return "partial";
}

function coverageStateFor(dataMode: DataMode): CoverageState {
  if (dataMode === "verified") return "verified";
  if (dataMode === "sample") return "sample";
  if (dataMode === "unavailable") return "missing";
  return "partial";
}

function dataModeLabel(dataMode: DataMode) {
  if (dataMode === "verified") return "真实核验数据";
  if (dataMode === "partial") return "部分真实数据";
  if (dataMode === "sample") return "样例数据";
  return "暂无可用数据";
}

function dataStatusText(dataMode: DataMode) {
  if (dataMode === "verified") {
    return "当前结果已优先使用导入并核验的真实录取数据，仍需在填报前复核当年招生章程、专业组和计划数。";
  }
  if (dataMode === "partial") {
    return "当前结果混合了部分真实数据和样例结构，未覆盖的省份、学校或专业仍需继续接入权威来源。";
  }
  if (dataMode === "sample") {
    return "当前结果主要基于样例数据结构，用于产品流程演示，不应直接作为正式志愿填报依据。";
  }
  return "当前没有足够录取数据支撑结论，仅能展示学校与专业目录层面的基础信息。";
}

function buildDataNotice(dataMode: DataMode, extra?: string) {
  const prefix = `当前数据状态：${dataModeLabel(dataMode)}。${dataStatusText(dataMode)}`;
  const authorityNotice =
    "正式产品需持续接入并核验各省考试院、学校招生网、阳光高考等权威数据，覆盖录取分/位次、专业组、选科要求、计划数和招生章程。";
  return [prefix, extra, authorityNotice].filter(Boolean).join(" ");
}

function summarizeDataModeFromModes(modes: DataMode[]): DataMode {
  if (modes.length === 0) return "unavailable";
  const uniqueModes = new Set(modes);
  if (uniqueModes.size === 1) return modes[0];
  if (uniqueModes.has("verified") || uniqueModes.has("partial")) return "partial";
  if (uniqueModes.has("sample")) return "sample";
  return "unavailable";
}

function summaryForRecommendations(items: Recommendation[]): SchoolFirstSummary {
  const latestYear = items.length === 0 ? null : Math.max(...items.map((item) => item.admissionTrend.latestYear));
  const dataMode = summarizeDataModeFromModes(items.map((item) => item.dataMode));

  return {
    total: items.length,
    reach: items.filter((item) => item.category === "reach").length,
    match: items.filter((item) => item.category === "match").length,
    safety: items.filter((item) => item.category === "safety").length,
    latestYear,
    dataMode,
    dataStatus: dataStatusText(dataMode)
  };
}

function uniqueSources(sources: Array<DataSource | undefined>) {
  const byId = new Map<string, DataSource>();
  for (const source of sources) {
    if (source) byId.set(source.id, source);
  }
  return [...byId.values()];
}

function latestStatForSchool({
  schoolId,
  province,
  stats
}: {
  schoolId: number;
  province?: string;
  stats: SourceAwareAdmissionStat[];
}) {
  const schoolStats = stats.filter((stat) => stat.schoolId === schoolId);
  const provinceStats = province ? schoolStats.filter((stat) => stat.province === province) : [];
  const candidates = provinceStats.length > 0 ? provinceStats : schoolStats;

  return candidates.sort((left, right) => {
    if (right.year !== left.year) return right.year - left.year;
    return left.avgRank - right.avgRank;
  })[0];
}

function fallbackProfileForSchool(school: SourceAwareSchool): SchoolProfile {
  const strengths = school.advantagedDisciplines.length > 0 ? school.advantagedDisciplines : ["专业建设", "区域就业", "升学发展"];

  return {
    summary: `${school.name} 位于${school.city}，属于${school.type}院校。当前缺少足够录取统计，需结合官方来源继续核验。`,
    level: school.level,
    location: `${school.province} · ${school.city}`,
    ownership: school.ownership,
    educationType: school.educationType,
    strengths: strengths.slice(0, 5),
    featuredMajors: school.featuredMajors,
    advantagedDisciplines: school.advantagedDisciplines,
    suitableFor: school.suitableFor,
    admissionInsight: "当前没有足够录取统计支撑概率判断，请优先补充省级考试院与学校招生网公开数据。",
    campusAndEmployment: school.campusAndEmployment,
    campusTags: [school.province, school.city, school.type]
  };
}

function roundedShare(count: number, total: number) {
  return total === 0 ? 0 : Number((count / total).toFixed(3));
}

function compareCohortCounts(
  left: { name?: string; schoolName?: string; majorName?: string; count: number; latestYear?: number },
  right: { name?: string; schoolName?: string; majorName?: string; count: number; latestYear?: number }
) {
  if (right.count !== left.count) return right.count - left.count;
  if ((right.latestYear ?? 0) !== (left.latestYear ?? 0)) return (right.latestYear ?? 0) - (left.latestYear ?? 0);
  return (left.name ?? `${left.schoolName}-${left.majorName}`).localeCompare(
    right.name ?? `${right.schoolName}-${right.majorName}`,
    "zh-CN"
  );
}

function buildDistribution(rows: CohortRow[], nameFor: (row: CohortRow) => string): CohortDistributionItem[] {
  const groups = new Map<string, CohortRow[]>();

  for (const row of rows) {
    const name = nameFor(row);
    groups.set(name, [...(groups.get(name) ?? []), row]);
  }

  return [...groups.entries()]
    .map(([name, groupRows]) => ({
      name,
      count: groupRows.length,
      share: roundedShare(groupRows.length, rows.length),
      dataMode: summarizeDataMode(groupRows)
    }))
    .sort(compareCohortCounts)
    .slice(0, 8);
}

function buildSchoolMajorPairs(rows: CohortRow[]): CohortSchoolMajorPair[] {
  const groups = new Map<string, CohortRow[]>();

  for (const row of rows) {
    const key = `${row.school.name}\u0000${row.stat.major}\u0000${row.school.city}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return [...groups.values()]
    .map((groupRows) => {
      const first = groupRows[0];
      return {
        schoolName: first.school.name,
        majorName: first.stat.major,
        city: first.school.city,
        count: groupRows.length,
        share: roundedShare(groupRows.length, rows.length),
        latestYear: Math.max(...groupRows.map(({ stat }) => stat.year)),
        dataMode: summarizeDataMode(groupRows)
      };
    })
    .sort(compareCohortCounts)
    .slice(0, 10);
}

export function getCohortOutcomes(input: CohortOutcomesInput): CohortOutcomes {
  const rankCenter = input.rank ?? estimateRankFromScore(input.score ?? 600, input.subject);
  const rankBand = rankBandFor(rankCenter);
  const dataset = getAdmissionDataset();
  const schoolMap = toSchoolMap(dataset.schools);
  let missingReason: string | undefined;

  let provinceStats = dataset.stats.filter(
    (stat) => stat.province === input.province && subjectMatchesRequirement(input.subject, stat.subjectRequirement)
  );

  if (provinceStats.length === 0 && input.province !== "全国") {
    provinceStats = dataset.stats.filter(
      (stat) => stat.province === "全国" && subjectMatchesRequirement(input.subject, stat.subjectRequirement)
    );
    missingReason = `${input.province} 当前没有可用聚合录取样本，已使用全国样本补足。`;
  }

  if (provinceStats.length === 0) {
    provinceStats = dataset.stats.filter((stat) => subjectMatchesRequirement(input.subject, stat.subjectRequirement));
    missingReason = "当前省份没有可用聚合录取样本，已使用全部样本中的最近位次记录补足。";
  }

  const rows = provinceStats
    .map((stat) => {
      const school = schoolMap.get(stat.schoolId);
      if (!school) return null;
      return { stat, school };
    })
    .filter((row): row is CohortRow => Boolean(row));

  let selectedRows = rows.filter(({ stat }) => stat.avgRank >= rankBand.from && stat.avgRank <= rankBand.to);

  if (selectedRows.length === 0 && rows.length > 0) {
    selectedRows = rows
      .sort((left, right) => {
        const distance = Math.abs(left.stat.avgRank - rankCenter) - Math.abs(right.stat.avgRank - rankCenter);
        if (distance !== 0) return distance;
        return right.stat.year - left.stat.year;
      })
      .slice(0, Math.min(12, rows.length));
    missingReason = missingReason ?? "当前位次区间聚合样本不足，已使用最接近该位次的录取统计补足。";
  }

  const dataMode = summarizeDataMode(selectedRows);

  return {
    label: "相似位次录取去向",
    province: input.province,
    subject: input.subject,
    rankCenter,
    rankBand,
    yearsIncluded: [...new Set(selectedRows.map(({ stat }) => stat.year))].sort((a, b) => b - a),
    schoolDistribution: buildDistribution(selectedRows, ({ school }) => school.name),
    majorDistribution: buildDistribution(selectedRows, ({ stat }) => stat.major),
    cityDistribution: buildDistribution(selectedRows, ({ school }) => school.city),
    schoolMajorPairs: buildSchoolMajorPairs(selectedRows),
    dataMode,
    coverageState: coverageStateFor(dataMode),
    privacyNote: "仅汇总公开录取数据中的院校-专业录取位次，不使用个人学生记录或可识别学生信息。",
    missingReason
  };
}

function buildRecommendationCandidates(input: RecommendInput): Omit<Recommendation, "alternative">[] {
  const preferredCities = input.preferredCities ?? [];
  const studentRank = input.rank ?? estimateRankFromScore(input.score ?? 600, input.subject);
  const dataset = getAdmissionDataset();
  const schoolMap = toSchoolMap(dataset.schools);
  const stats = dataset.stats;
  const latestStats = latestStatsForProvince(input.province, stats, input.subject, input.majors);

  return latestStats
    .map((stat) => {
      const school = schoolMap.get(stat.schoolId);
      if (!school) return null;
      const schoolMajorStats = latestStatsForSchoolInProvince({
        schoolId: school.id,
        province: input.province,
        stats,
        subject: input.subject
      });
      const probabilityResult = calculateProbability({
        studentRank,
        province: input.province,
        preferredCities,
        cityPreference: input.cityPreference,
        majors: input.majors,
        riskPreference: input.riskPreference,
        stat,
        school,
        trendDelta: trendDeltaFor(stat, stats)
      });
      const category = categoryFor(probabilityResult.probability);
      const primarySource = sourceFor(school, stat);
      const dataMode = dataModeFor(school, stat);
      const admissionTrend = admissionTrendFor(stat, stats);
      const probabilityExplanation = probabilityExplanationFor(probabilityResult);
      const rankGap = Math.round(probabilityResult.gap);
      const riskLevel = riskLevelFor(category, probabilityResult.probability);
      const evidence = evidenceFor({
        school,
        stat,
        probability: probabilityResult.probability,
        dataMode,
        source: primarySource,
        trend: admissionTrend
      });

      return {
        schoolId: school.id,
        schoolName: school.name,
        province: school.province,
        city: school.city,
        type: school.type,
        major: stat.major,
        probability: probabilityResult.probability,
        category,
        selectionStage: "school_pool",
        schoolReachability: {
          probability: probabilityResult.probability,
          rankGap,
          zScore: probabilityExplanation.z,
          latestYear: admissionTrend.latestYear,
          trend: admissionTrend,
          explanation: probabilityExplanation
        },
        eligibleMajors: buildEligibleMajors({
          school,
          stat,
          selectedMajors: input.majors,
          probability: probabilityResult.probability,
          rankGap,
          source: primarySource,
          dataMode,
          schoolMajorStats,
          studentRank
        }),
        reason: reasonText({
          school,
          stat,
          probability: probabilityResult.probability,
          preferredCities,
          majors: input.majors
        }),
        risk: riskText(category, probabilityResult.probability, stat),
        dataMode,
        dataSource: primarySource,
        dataSources: [primarySource, ...(school.dataSources ?? [])].filter(
          (source, index, all) => all.findIndex((item) => item.id === source.id) === index
        ),
        probabilityExplanation,
        admissionTrend,
        rankGap,
        riskLevel,
        evidence,
        schoolProfile: getSchoolProfile(school, stat, category, probabilityResult.probability),
        careerGuide: getCareerGuide(stat.major)
      };
    })
    .filter((candidate): candidate is Omit<Recommendation, "alternative"> => Boolean(candidate));
}

function buildRecommendationPool(input: RecommendInput): Recommendation[] {
  const candidates = buildRecommendationCandidates(input);
  return candidates.map((item) => withAlternative(item, candidates));
}

export function getRecommendations(input: RecommendInput): RecommendResponse {
  const studentRank = input.rank ?? estimateRankFromScore(input.score ?? 600, input.subject);
  const candidates = buildRecommendationCandidates(input);

  const reach = selectGroup(candidates, "reach", 6);
  const match = selectGroup(candidates, "match", 6);
  const safety = selectGroup(candidates, "safety", 4);
  const alternativePool = [...match, ...safety, ...reach];

  return {
    reach: reach.map((item) => withAlternative(item, alternativePool)),
    match: match.map((item) => withAlternative(item, alternativePool)),
    safety: safety.map((item) => withAlternative(item, alternativePool)),
    cohortOutcomes: getCohortOutcomes({
      province: input.province,
      subject: input.subject,
      rank: studentRank
    })
  };
}

export function getReachableSchools(input: RecommendInput): ReachableSchoolsResponse {
  const recommendations = getRecommendations(input);
  const items = [...recommendations.reach, ...recommendations.match, ...recommendations.safety];
  const summary = summaryForRecommendations(items);

  return {
    items,
    summary,
    cohortOutcomes: recommendations.cohortOutcomes,
    dataNotice: buildDataNotice(summary.dataMode)
  };
}

export function getSchoolDetail(schoolId: number): SchoolDetailResponse | undefined {
  const dataset = getAdmissionDataset();
  const school = dataset.schools.find((item) => item.id === schoolId);
  if (!school) return undefined;

  const admissionStatsForSchool = dataset.stats
    .filter((stat) => stat.schoolId === schoolId)
    .sort((left, right) => {
      if (right.year !== left.year) return right.year - left.year;
      if (left.province !== right.province) return left.province.localeCompare(right.province, "zh-CN");
      return left.major.localeCompare(right.major, "zh-CN");
    });
  const latestStat = admissionStatsForSchool[0];
  const profile = latestStat ? getSchoolProfile(school, latestStat, "match", 0.5) : fallbackProfileForSchool(school);
  const dataMode = summarizeDataModeFromModes([school.dataMode, ...admissionStatsForSchool.map((stat) => stat.dataMode)]);

  return {
    school,
    profile,
    admissionStats: admissionStatsForSchool,
    dataSources: uniqueSources([...school.dataSources, ...admissionStatsForSchool.map((stat) => stat.dataSource)]),
    dataNotice: buildDataNotice(dataMode)
  };
}

function fallbackSourceForSchool(school: SourceAwareSchool): DataSource {
  return (
    school.dataSources[0] ?? {
      id: `school-${school.id}-unavailable`,
      sourceType: "sample",
      sourceName: "示例数据源：学校画像缺少来源",
      sourceUrl: "https://gaokao.chsi.com.cn/",
      year: 2026,
      province: school.province,
      updatedAt: "2026-06-24T00:00:00.000Z",
      confidence: 0,
      notes: "该学校画像暂无可用来源，仅用于保持接口结构完整。"
    }
  );
}

function fallbackMajorOptionsForSchool(school: SourceAwareSchool): SchoolMajorOption[] {
  const fallbackSource = fallbackSourceForSchool(school);

  return uniqueMajorNames([...school.featuredMajors, "计算机科学与技术", "电子信息工程", "人工智能", "软件工程"])
    .slice(0, 5)
    .map((majorName) => {
      const catalogEntry = getMajorCatalogEntry(majorName);
      const guide = getCareerGuide(majorName);

      return {
        majorName,
        plainLanguage: catalogEntry?.plainLanguage ?? guide.overview,
        fitProbability: 0,
        heatLevel: heatLevelFor(majorName),
        dataMode: school.dataMode,
        source: catalogEntry?.dataSource ?? fallbackSource,
        reason: `${majorName} 来自 ${school.name} 的学校画像或国家专业目录，可作为校内专业池的候选方向继续核验。`,
        risk: catalogEntry?.riskReminder ?? guide.riskReminder,
        careerSummary: careerSummaryFor(majorName)
      };
    });
}

export function getSchoolMajors(input: SchoolMajorsInput): SchoolMajorsResponse | undefined {
  const dataset = getAdmissionDataset();
  const school = dataset.schools.find((item) => item.id === input.schoolId);
  if (!school) return undefined;
  const studentRank = input.rank ?? estimateRankFromScore(input.score ?? 600, input.subject);

  const recommendation = buildRecommendationPool(input).find((item) => item.schoolId === input.schoolId);
  if (recommendation) {
    return {
      schoolId: school.id,
      schoolName: school.name,
      items: recommendation.eligibleMajors,
      dataNotice: buildDataNotice(
        recommendation.dataMode,
        "该校进入当前模型推荐池，专业池优先复用同一次推荐计算中的概率、风险和来源信息。"
      )
    };
  }

  const stat = latestStatForSchool({
    schoolId: school.id,
    province: input.province,
    stats: dataset.stats.filter((item) => subjectMatchesRequirement(input.subject, item.subjectRequirement))
  });
  if (!stat) {
    return {
      schoolId: school.id,
      schoolName: school.name,
      items: fallbackMajorOptionsForSchool(school),
      dataNotice: buildDataNotice(
        school.dataMode,
        "该校不在当前推荐池，且暂无录取统计可计算专业概率，已返回基于学校画像和教育部专业目录的候选专业。"
      )
    };
  }

  const probabilityResult = calculateProbability({
    studentRank,
    province: input.province,
    preferredCities: input.preferredCities ?? [],
    cityPreference: input.cityPreference,
    majors: input.majors,
    riskPreference: input.riskPreference,
    stat,
    school,
    trendDelta: trendDeltaFor(stat, dataset.stats)
  });
  const source = sourceFor(school, stat);
  const dataMode = dataModeFor(school, stat);
  const schoolMajorStats = latestStatsForSchoolInProvince({
    schoolId: school.id,
    province: stat.province,
    stats: dataset.stats,
    subject: input.subject
  });

  return {
    schoolId: school.id,
    schoolName: school.name,
    items: buildEligibleMajors({
      school,
      stat,
      selectedMajors: input.majors,
      probability: probabilityResult.probability,
      rankGap: Math.round(probabilityResult.gap),
      source,
      dataMode,
      schoolMajorStats,
      studentRank
    }),
    dataNotice: buildDataNotice(
      dataMode,
      "该校不在当前推荐池，已使用该校最近录取统计和教育部专业目录生成 fallback 专业池。"
    )
  };
}

function pickMajorNameForPlan(recommendation: Recommendation, selectedMajorNames: string[]) {
  const selectedMajorSet = new Set(selectedMajorNames);
  return (
    recommendation.eligibleMajors.find((major) => selectedMajorSet.has(major.majorName))?.majorName ??
    recommendation.eligibleMajors[0]?.majorName ??
    recommendation.major
  );
}

type VolunteerPlanSelection = {
  recommendation: Recommendation;
  planCategory: RecommendationCategory;
};

function compareByReachability(left: Recommendation, right: Recommendation) {
  if (left.probability !== right.probability) return left.probability - right.probability;
  if (left.rankGap !== right.rankGap) return right.rankGap - left.rankGap;
  return left.schoolName.localeCompare(right.schoolName, "zh-CN");
}

const volunteerPlanQuotas: Array<{ category: RecommendationCategory; count: number }> = [
  { category: "reach", count: 6 },
  { category: "match", count: 6 },
  { category: "safety", count: 4 }
];

function buildVolunteerPlanSelections(input: VolunteerPlanInput, pool: Recommendation[]): VolunteerPlanSelection[] {
  const usedSchoolIds = new Set<number>();
  const selectedSchoolOrder = new Map((input.selectedSchoolIds ?? []).map((schoolId, index) => [schoolId, index]));
  const selections: VolunteerPlanSelection[] = [];

  const takeForCategory = (category: RecommendationCategory, count: number) => {
    const selected = pool
      .filter((recommendation) => recommendation.category === category && selectedSchoolOrder.has(recommendation.schoolId))
      .sort((left, right) => selectedSchoolOrder.get(left.schoolId)! - selectedSchoolOrder.get(right.schoolId)!);
    const fillers = sortForCategory(
      pool.filter((recommendation) => recommendation.category === category && !selectedSchoolOrder.has(recommendation.schoolId)),
      category
    );

    for (const recommendation of [...selected, ...fillers]) {
      if (selections.filter((selection) => selection.planCategory === category).length >= count) break;
      if (usedSchoolIds.has(recommendation.schoolId)) continue;
      selections.push({ recommendation, planCategory: category });
      usedSchoolIds.add(recommendation.schoolId);
    }
  };

  for (const { category, count } of volunteerPlanQuotas) {
    takeForCategory(category, count);
  }

  for (const { category, count } of volunteerPlanQuotas) {
    let categoryCount = selections.filter((selection) => selection.planCategory === category).length;
    const fallback = pool.filter((recommendation) => !usedSchoolIds.has(recommendation.schoolId)).sort(compareByReachability);
    for (const recommendation of fallback) {
      if (categoryCount >= count) break;
      selections.push({ recommendation, planCategory: category });
      usedSchoolIds.add(recommendation.schoolId);
      categoryCount += 1;
    }
  }

  return volunteerPlanQuotas.flatMap(({ category }) =>
    selections.filter((selection) => selection.planCategory === category)
  );
}

function summaryForVolunteerPlan(selections: VolunteerPlanSelection[]): SchoolFirstSummary {
  const recommendations = selections.map((selection) => selection.recommendation);
  const latestYear =
    recommendations.length === 0 ? null : Math.max(...recommendations.map((item) => item.admissionTrend.latestYear));
  const dataMode = summarizeDataModeFromModes(recommendations.map((item) => item.dataMode));

  return {
    total: selections.length,
    reach: selections.filter((selection) => selection.planCategory === "reach").length,
    match: selections.filter((selection) => selection.planCategory === "match").length,
    safety: selections.filter((selection) => selection.planCategory === "safety").length,
    latestYear,
    dataMode,
    dataStatus: dataStatusText(dataMode)
  };
}

function toVolunteerPlanItem(
  recommendation: Recommendation,
  index: number,
  selectedMajorNames: string[],
  planCategory: RecommendationCategory
): VolunteerPlanItem {
  const majorName = pickMajorNameForPlan(recommendation, selectedMajorNames);

  return {
    id: `${planCategory}-${recommendation.schoolId}-${index + 1}`,
    category: recommendation.category,
    slotCategory: planCategory,
    schoolId: recommendation.schoolId,
    schoolName: recommendation.schoolName,
    majorName,
    probability: recommendation.probability,
    dataMode: recommendation.dataMode,
    reason: recommendation.reason,
    risk: recommendation.risk,
    alternativeSchoolName: recommendation.alternative.schoolName
  };
}

export function getVolunteerPlan(input: VolunteerPlanInput): VolunteerPlanResponse {
  const selectedMajorNames = input.selectedMajors && input.selectedMajors.length > 0 ? input.selectedMajors : input.majors;
  const pool = buildRecommendationPool(input);
  const selections = buildVolunteerPlanSelections(input, pool);
  const summary = summaryForVolunteerPlan(selections);

  return {
    items: selections.map(({ recommendation, planCategory }, index) =>
      toVolunteerPlanItem(recommendation, index, selectedMajorNames, planCategory)
    ),
    summary,
    dataNotice: buildDataNotice(summary.dataMode)
  };
}

export function getMajorDetail(majorName: string): MajorCatalogEntry | undefined {
  return getMajorCatalogEntry(majorName);
}
