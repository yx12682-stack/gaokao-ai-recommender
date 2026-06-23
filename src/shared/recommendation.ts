export type RiskPreference = "conservative" | "balanced" | "aggressive";
export type SubjectType = "physics" | "history" | "science" | "arts" | "comprehensive";
export type RecommendationCategory = "reach" | "match" | "safety";

export interface School {
  id: number;
  name: string;
  province: string;
  type: string;
  city: string;
}

export interface AdmissionStat {
  schoolId: number;
  year: number;
  province: string;
  major: string;
  minRank: number;
  avgRank: number;
  stdRank: number;
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
  strengths: string[];
  admissionInsight: string;
  campusTags: string[];
}

export interface CareerGuide {
  overview: string;
  directions: string[];
  roles: string[];
  skillFocus: string[];
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
  reason: string;
  risk: string;
  schoolProfile: SchoolProfile;
  careerGuide: CareerGuide;
  alternative: AlternativeSchool;
}

export interface RecommendResponse {
  reach: Recommendation[];
  match: Recommendation[];
  safety: Recommendation[];
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

export const majorOptions = [
  "哲学",
  "经济学",
  "财政学",
  "金融学",
  "金融工程",
  "保险学",
  "国际经济与贸易",
  "法学",
  "知识产权",
  "社会学",
  "社会工作",
  "思想政治教育",
  "教育学",
  "学前教育",
  "小学教育",
  "体育教育",
  "汉语言文学",
  "汉语国际教育",
  "英语",
  "日语",
  "新闻学",
  "广告学",
  "网络与新媒体",
  "历史学",
  "数学与应用数学",
  "信息与计算科学",
  "物理学",
  "应用物理学",
  "化学",
  "应用化学",
  "地理科学",
  "地理信息科学",
  "生物科学",
  "生物技术",
  "心理学",
  "应用心理学",
  "统计学",
  "应用统计学",
  "工程力学",
  "机械工程",
  "机械设计制造及其自动化",
  "材料成型及控制工程",
  "工业设计",
  "车辆工程",
  "智能制造工程",
  "测控技术与仪器",
  "材料科学与工程",
  "高分子材料与工程",
  "新能源材料与器件",
  "能源与动力工程",
  "新能源科学与工程",
  "电气工程及其自动化",
  "电子信息工程",
  "电子科学与技术",
  "通信工程",
  "微电子科学与工程",
  "光电信息科学与工程",
  "人工智能",
  "自动化",
  "机器人工程",
  "计算机科学与技术",
  "软件工程",
  "网络工程",
  "信息安全",
  "物联网工程",
  "数字媒体技术",
  "数据科学与大数据技术",
  "网络空间安全",
  "土木工程",
  "建筑环境与能源应用工程",
  "给排水科学与工程",
  "水利水电工程",
  "测绘工程",
  "遥感科学与技术",
  "化学工程与工艺",
  "制药工程",
  "地质工程",
  "交通运输",
  "交通工程",
  "船舶与海洋工程",
  "航空航天工程",
  "飞行器设计与工程",
  "环境工程",
  "环境科学",
  "生物医学工程",
  "食品科学与工程",
  "建筑学",
  "城乡规划",
  "风景园林",
  "安全工程",
  "生物工程",
  "农学",
  "园艺",
  "植物保护",
  "动物科学",
  "动物医学",
  "林学",
  "临床医学",
  "麻醉学",
  "医学影像学",
  "口腔医学",
  "预防医学",
  "药学",
  "中医学",
  "护理学",
  "信息管理与信息系统",
  "工程管理",
  "工商管理",
  "市场营销",
  "会计学",
  "财务管理",
  "人力资源管理",
  "审计学",
  "公共事业管理",
  "行政管理",
  "物流管理",
  "电子商务",
  "旅游管理",
  "音乐学",
  "美术学",
  "视觉传达设计",
  "环境设计",
  "产品设计",
  "数字媒体艺术"
];

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

function toSchoolMap() {
  return new Map(schools.map((school) => [school.id, school]));
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

function latestStatsForProvince(province: string) {
  const latestBySchool = new Map<number, AdmissionStat>();
  for (const stat of admissionStats) {
    if (stat.province !== province) continue;
    const previous = latestBySchool.get(stat.schoolId);
    if (!previous || previous.year < stat.year) {
      latestBySchool.set(stat.schoolId, stat);
    }
  }
  return [...latestBySchool.values()];
}

function trendDeltaFor(stat: AdmissionStat) {
  const rows = admissionStats
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
  return {
    summary: `${school.name} 位于${school.city}，属于${school.type}院校。本次推荐把它放入${categoryText}梯度，适合作为志愿组合中的${categoryText}节点。`,
    strengths: [...strengths, `${school.city} 城市资源`, `${stat.major} 专业方向`].slice(0, 5),
    admissionInsight: `近年 ${stat.major} 平均录取位次约 ${stat.avgRank.toLocaleString(
      "zh-CN"
    )}，最低位次样本约 ${stat.minRank.toLocaleString("zh-CN")}；当前模型概率为 ${Math.round(
      probability * 100
    )}%，需要结合当年计划数、选科要求和专业组变化复核。`,
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

  return {
    overview: profile.overview(major),
    directions: profile.directions,
    roles: profile.roles,
    skillFocus: profile.skillFocus,
    longTermPath: profile.longTermPath
  };
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

function selectGroup(items: Omit<Recommendation, "alternative">[], category: RecommendationCategory, count: number) {
  const categoryItems = items.filter((item) => item.category === category);
  if (category === "reach") {
    return categoryItems.sort((a, b) => b.probability - a.probability).slice(0, count);
  }
  if (category === "match") {
    return categoryItems.sort((a, b) => Math.abs(a.probability - 0.58) - Math.abs(b.probability - 0.58)).slice(0, count);
  }
  return categoryItems.sort((a, b) => b.probability - a.probability).slice(0, count);
}

export function getRecommendations(input: RecommendInput): RecommendResponse {
  const preferredCities = input.preferredCities ?? [];
  const studentRank = input.rank ?? estimateRankFromScore(input.score ?? 600, input.subject);
  const schoolMap = toSchoolMap();
  const latestStats = latestStatsForProvince(input.province);

  const candidates = latestStats
    .map((stat) => {
      const school = schoolMap.get(stat.schoolId);
      if (!school) return null;
      const probabilityResult = calculateProbability({
        studentRank,
        province: input.province,
        preferredCities,
        cityPreference: input.cityPreference,
        majors: input.majors,
        riskPreference: input.riskPreference,
        stat,
        school,
        trendDelta: trendDeltaFor(stat)
      });
      const category = categoryFor(probabilityResult.probability);

      return {
        schoolId: school.id,
        schoolName: school.name,
        province: school.province,
        city: school.city,
        type: school.type,
        major: stat.major,
        probability: probabilityResult.probability,
        category,
        reason: reasonText({
          school,
          stat,
          probability: probabilityResult.probability,
          preferredCities,
          majors: input.majors
        }),
        risk: riskText(category, probabilityResult.probability, stat),
        schoolProfile: getSchoolProfile(school, stat, category, probabilityResult.probability),
        careerGuide: getCareerGuide(stat.major)
      };
    })
    .filter((candidate): candidate is Omit<Recommendation, "alternative"> => Boolean(candidate));

  const reach = selectGroup(candidates, "reach", 6);
  const match = selectGroup(candidates, "match", 6);
  const safety = selectGroup(candidates, "safety", 4);
  const alternativePool = [...match, ...safety, ...reach];

  return {
    reach: reach.map((item) => withAlternative(item, alternativePool)),
    match: match.map((item) => withAlternative(item, alternativePool)),
    safety: safety.map((item) => withAlternative(item, alternativePool))
  };
}
