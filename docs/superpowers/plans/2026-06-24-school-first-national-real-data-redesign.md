# School-First National Real Data Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app into a school-first gaokao decision system with school pools, school-specific major selection, national major plain-language catalog, similar-rank outcome distributions, and strict official-data provenance.

**Architecture:** Keep the existing React + Express + TypeScript app and preserve `POST /recommend`. Split domain data into focused modules: catalog data, source registry, school-first recommendation, cohort outcomes, plan building, and frontend decision cockpit surfaces. Existing sample data remains clearly marked as sample while official-data import and validation paths become first-class.

**Tech Stack:** React 18, Vite, TypeScript, Express, Zod, Vitest, Supertest, Framer Motion, Lucide React, Render Web Service.

---

## File Structure

- Create `src/shared/major-catalog.ts`: national undergraduate major catalog entries, simple search helpers, and plain-language profile lookup.
- Create `src/shared/source-registry.ts`: national source registry, province coverage status, and official source validation helpers.
- Create `src/shared/cohort-outcomes.ts`: similar-rank outcome aggregation from admission stats.
- Create `src/shared/school-first-recommendation.ts`: school-centered recommendation assembly from admission stats, school profiles, major catalog, and probability model.
- Create `src/shared/plan-builder.ts`: final 6/6/4 volunteer plan builder from selected school-major options.
- Modify `src/shared/data-model.ts`: add shared types for source registry, major catalog, school pool recommendations, school-major options, cohort outcomes, and volunteer plan items.
- Modify `src/shared/real-data-store.ts`: expose source-aware query helpers needed by school-first recommendation and cohort aggregation.
- Modify `src/shared/recommendation.ts`: keep probability functions and public `getRecommendations`, but delegate school-first result building to focused modules.
- Modify `src/shared/recommendation.test.ts`: add school-first model, catalog, source coverage, cohort, and plan builder tests.
- Modify `src/server/app.ts`: keep `POST /recommend`; add catalog, school, school-major, cohort, plan, and source-registry endpoints.
- Modify `src/server/recommend-api.test.ts`: add API contract tests for new endpoints and compatibility.
- Modify `src/App.tsx`: rebuild user flow around student profile -> school pool -> school detail -> major choice -> plan builder.
- Modify `src/styles.css`: add AI cockpit layout, stronger but restrained animations, school cards, cohort charts, major explainer panels, and final plan controls.
- Modify `README.md`: document school-first flow, real-data constraints, official source workflow, Render redeploy, and API usage.

---

### Task 1: Lock The School-First Contract With Tests

**Files:**
- Modify: `src/shared/recommendation.test.ts`
- Modify: `src/server/recommend-api.test.ts`

- [ ] **Step 1: Add failing shared-model tests**

Append these tests to `src/shared/recommendation.test.ts`:

```ts
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
  expect(first.schoolReachability.rankGap).toEqual(expect.any(Number));
  expect(first.eligibleMajors.length).toBeGreaterThanOrEqual(3);
  expect(first.eligibleMajors[0]).toEqual(
    expect.objectContaining({
      majorName: expect.any(String),
      plainLanguage: expect.any(String),
      fitProbability: expect.any(Number),
      dataMode: expect.any(String)
    })
  );
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

  expect(catalog.length).toBeGreaterThanOrEqual(845);
  expect(computer?.plainLanguage).toContain("软件");
  expect(computer?.suitableFor.length).toBeGreaterThanOrEqual(3);
  expect(computer?.riskReminder).toBeTruthy();
});
```

- [ ] **Step 2: Import the new catalog helpers in the test file**

Update the import block in `src/shared/recommendation.test.ts`:

```ts
import {
  calculateBaseProbability,
  calculateProbability,
  cityOptions,
  getMajorCatalog,
  getMajorCatalogEntry,
  getRecommendations,
  majorOptions,
  provinceOptions
} from "./recommendation";
```

- [ ] **Step 3: Add failing API tests**

Append these tests to `src/server/recommend-api.test.ts`:

```ts
it("returns a searchable national major catalog", async () => {
  const app = createRecommendApp();

  const response = await request(app).get("/catalog/majors?query=计算机");

  expect(response.status).toBe(200);
  expect(response.body.items.length).toBeGreaterThan(0);
  expect(response.body.items[0]).toEqual(
    expect.objectContaining({
      name: expect.any(String),
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
```

- [ ] **Step 4: Run tests to verify the contract fails**

Run:

```bash
npm test -- src/shared/recommendation.test.ts src/server/recommend-api.test.ts
```

Expected: FAIL with missing exports such as `getMajorCatalog`, missing fields such as `selectionStage`, and missing route `/catalog/majors`.

- [ ] **Step 5: Commit the failing contract tests**

```bash
git add src/shared/recommendation.test.ts src/server/recommend-api.test.ts
git commit -m "test: lock school first recommendation contract"
```

---

### Task 2: Add School-First Domain Types

**Files:**
- Modify: `src/shared/data-model.ts`
- Test: `src/shared/recommendation.test.ts`

- [ ] **Step 1: Add shared type definitions**

Append these exports to `src/shared/data-model.ts`:

```ts
export type CoverageState = "verified" | "partial" | "sample" | "missing" | "stale";

export interface SourceRegistryEntry {
  id: string;
  province: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
  datasetType: "school_profile" | "admission_stats" | "major_catalog" | "employment_report";
  year: number;
  lastCheckedAt: string;
  updatedAt: string;
  coverageState: CoverageState;
  confidence: number;
  notes: string;
}

export interface MajorCatalogEntry {
  code: string;
  name: string;
  category: string;
  majorClass: string;
  degreeCategory: string;
  plainLanguage: string;
  interests: string[];
  suitableFor: string[];
  coreCourses: string[];
  employmentDirections: string[];
  representativeCareers: string[];
  industryOutlook: string;
  graduateDirections: string[];
  riskReminder: string;
  relatedMajors: string[];
  dataSource: DataSource;
}

export interface SchoolMajorOption {
  majorName: string;
  plainLanguage: string;
  fitProbability: number;
  heatLevel: "high" | "medium" | "low";
  dataMode: DataMode;
  source: DataSource;
  rankGap?: number;
  reason: string;
  risk: string;
  careerSummary: string;
}

export interface SchoolReachability {
  probability: number;
  rankGap: number;
  zScore: number;
  latestYear: number;
  trend: AdmissionTrend;
  explanation: ProbabilityExplanation;
}

export interface CohortDistributionItem {
  name: string;
  count: number;
  share: number;
  dataMode: DataMode;
}

export interface CohortSchoolMajorPair {
  schoolName: string;
  majorName: string;
  city: string;
  count: number;
  share: number;
  latestYear: number;
  dataMode: DataMode;
}

export interface CohortOutcomes {
  label: "相似位次录取去向";
  province: string;
  subject: string;
  rankCenter: number;
  rankBand: {
    from: number;
    to: number;
  };
  yearsIncluded: number[];
  schoolDistribution: CohortDistributionItem[];
  majorDistribution: CohortDistributionItem[];
  cityDistribution: CohortDistributionItem[];
  schoolMajorPairs: CohortSchoolMajorPair[];
  dataMode: DataMode;
  coverageState: CoverageState;
  privacyNote: string;
  missingReason?: string;
}

export interface VolunteerPlanItem {
  id: string;
  category: "reach" | "match" | "safety";
  schoolId: number;
  schoolName: string;
  majorName: string;
  probability: number;
  dataMode: DataMode;
  reason: string;
  risk: string;
  alternativeSchoolName: string;
}
```

- [ ] **Step 2: Run typecheck through the build command**

Run:

```bash
npm run build
```

Expected: PASS or fail only because later tasks have not used these new types. If TypeScript reports duplicate type names, keep the existing type and extend it instead of defining a second interface with the same name.

- [ ] **Step 3: Commit the domain types**

```bash
git add src/shared/data-model.ts
git commit -m "feat: add school first domain types"
```

---

### Task 3: Add National Source Registry

**Files:**
- Create: `src/shared/source-registry.ts`
- Modify: `src/shared/real-data-store.ts`
- Modify: `src/shared/recommendation.test.ts`

- [ ] **Step 1: Add failing source registry test**

Append to `src/shared/recommendation.test.ts`:

```ts
it("reports national official source coverage without treating missing provinces as verified", () => {
  const registry = getSourceRegistry();
  const coverage = getNationalSourceCoverage();

  expect(registry.length).toBeGreaterThanOrEqual(31);
  expect(coverage.totalProvinces).toBeGreaterThanOrEqual(31);
  expect(coverage.byCoverageState.missing).toBeGreaterThan(0);
  expect(coverage.byCoverageState.verified ?? 0).toBe(0);
  expect(registry.every((entry) => entry.sourceUrl.startsWith("https://"))).toBe(true);
});
```

Update the import from `./recommendation`:

```ts
  getNationalSourceCoverage,
  getSourceRegistry,
```

- [ ] **Step 2: Create `src/shared/source-registry.ts`**

Create the file with this content:

```ts
import type { CoverageState, SourceRegistryEntry, SourceType } from "./data-model";

const OFFICIAL_SOURCE_BY_PROVINCE: Record<string, { sourceName: string; sourceUrl: string }> = {
  北京: { sourceName: "北京教育考试院", sourceUrl: "https://www.bjeea.cn/" },
  天津: { sourceName: "天津招考资讯网", sourceUrl: "https://www.zhaokao.net/" },
  河北: { sourceName: "河北省教育考试院", sourceUrl: "https://www.hebeea.edu.cn/" },
  山西: { sourceName: "山西招生考试网", sourceUrl: "https://www.sxkszx.cn/" },
  内蒙古: { sourceName: "内蒙古招生考试信息网", sourceUrl: "https://www.nm.zsks.cn/" },
  辽宁: { sourceName: "辽宁招生考试之窗", sourceUrl: "https://www.lnzsks.com/" },
  吉林: { sourceName: "吉林省教育考试院", sourceUrl: "https://www.jleea.com.cn/" },
  黑龙江: { sourceName: "黑龙江省招生考试信息港", sourceUrl: "https://www.lzk.hl.cn/" },
  上海: { sourceName: "上海招考热线", sourceUrl: "https://www.shmeea.edu.cn/" },
  江苏: { sourceName: "江苏省教育考试院", sourceUrl: "https://www.jseea.cn/" },
  浙江: { sourceName: "浙江省教育考试院", sourceUrl: "https://www.zjzs.net/" },
  安徽: { sourceName: "安徽省教育招生考试院", sourceUrl: "https://www.ahzsks.cn/" },
  福建: { sourceName: "福建省教育考试院", sourceUrl: "https://www.eeafj.cn/" },
  江西: { sourceName: "江西省教育考试院", sourceUrl: "https://www.jxeea.cn/" },
  山东: { sourceName: "山东省教育招生考试院", sourceUrl: "https://www.sdzk.cn/" },
  河南: { sourceName: "河南省教育考试院", sourceUrl: "https://www.haeea.cn/" },
  湖北: { sourceName: "湖北省教育考试院", sourceUrl: "https://www.hbea.edu.cn/" },
  湖南: { sourceName: "湖南省教育考试院", sourceUrl: "https://www.hneeb.cn/" },
  广东: { sourceName: "广东省教育考试院", sourceUrl: "https://eea.gd.gov.cn/" },
  广西: { sourceName: "广西招生考试院", sourceUrl: "https://www.gxeea.cn/" },
  海南: { sourceName: "海南省考试局", sourceUrl: "https://ea.hainan.gov.cn/" },
  重庆: { sourceName: "重庆市教育考试院", sourceUrl: "https://www.cqksy.cn/" },
  四川: { sourceName: "四川省教育考试院", sourceUrl: "https://www.sceea.cn/" },
  贵州: { sourceName: "贵州省招生考试院", sourceUrl: "https://zsksy.guizhou.gov.cn/" },
  云南: { sourceName: "云南省招生考试院", sourceUrl: "https://www.ynzs.cn/" },
  西藏: { sourceName: "西藏自治区教育考试院", sourceUrl: "https://zsks.edu.xizang.gov.cn/" },
  陕西: { sourceName: "陕西省教育考试院", sourceUrl: "https://www.sneea.cn/" },
  甘肃: { sourceName: "甘肃省教育考试院", sourceUrl: "https://www.ganseea.cn/" },
  青海: { sourceName: "青海省教育考试网", sourceUrl: "https://www.qhjyks.com/" },
  宁夏: { sourceName: "宁夏教育考试院", sourceUrl: "https://www.nxjyks.cn/" },
  新疆: { sourceName: "新疆招生网", sourceUrl: "https://www.xjzk.gov.cn/" }
};

const sourceType: SourceType = "provincial_exam_authority";
const provinceNames = [
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

export function getSourceRegistry(): SourceRegistryEntry[] {
  return provinceNames
    .map((province) => {
      const source = OFFICIAL_SOURCE_BY_PROVINCE[province];
      return {
        id: `province-admission-${province}`,
        province,
        sourceType,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        datasetType: "admission_stats",
        year: 2025,
        lastCheckedAt: "2026-06-24",
        updatedAt: "2026-06-24",
        coverageState: "missing",
        confidence: 0,
        notes: "已登记权威来源入口，尚未导入并核验该省真实录取数据。"
      };
    });
}

export function getNationalSourceCoverage() {
  const registry = getSourceRegistry();
  const byCoverageState = registry.reduce<Record<CoverageState, number>>(
    (acc, entry) => {
      acc[entry.coverageState] += 1;
      return acc;
    },
    { verified: 0, partial: 0, sample: 0, missing: 0, stale: 0 }
  );

  return {
    totalProvinces: registry.length,
    byCoverageState,
    registry
  };
}
```

- [ ] **Step 3: Re-export registry helpers from `src/shared/recommendation.ts`**

Add near other exports:

```ts
export { getNationalSourceCoverage, getSourceRegistry } from "./source-registry";
```

- [ ] **Step 4: Run the registry tests**

Run:

```bash
npm test -- src/shared/recommendation.test.ts -t "national official source coverage"
```

Expected: PASS for the new registry test.

- [ ] **Step 5: Commit the source registry**

```bash
git add src/shared/source-registry.ts src/shared/recommendation.ts src/shared/recommendation.test.ts
git commit -m "feat: add national source registry"
```

---

### Task 4: Add National Major Catalog With Plain-Language Explanations

**Files:**
- Create: `src/shared/major-catalog.ts`
- Modify: `src/shared/recommendation.ts`
- Modify: `src/server/app.ts`
- Test: `src/shared/recommendation.test.ts`
- Test: `src/server/recommend-api.test.ts`

- [ ] **Step 1: Create the catalog module**

Create `src/shared/major-catalog.ts`:

```ts
import type { DataSource, MajorCatalogEntry } from "./data-model";

const ministryMajorCatalogSource: DataSource = {
  id: "moe-undergraduate-major-catalog-2026",
  sourceType: "manual_verified",
  sourceName: "教育部《普通高等学校本科专业目录（2026年）》",
  sourceUrl: "https://www.moe.gov.cn/srcsite/A08/moe_1034/s3882/202604/t20260427_1434931.html",
  year: 2026,
  province: "全国",
  updatedAt: "2026-04-27",
  verifiedAt: "2026-06-24",
  confidence: 0.95,
  notes: "专业名称、门类和专业类以教育部本科专业目录为准；白话解释为产品侧解释文本。"
};

const featuredProfiles: Record<string, Partial<MajorCatalogEntry>> = {
  计算机科学与技术: {
    plainLanguage: "学习软件、系统、算法和计算机底层原理，解决信息系统怎么设计、运行和变得更智能的问题。",
    interests: ["逻辑推理", "编程", "数学", "系统设计"],
    suitableFor: ["喜欢拆解复杂问题", "能接受长期写代码和调试", "数学与英语基础较稳"],
    coreCourses: ["程序设计", "数据结构", "操作系统", "计算机网络", "数据库系统", "软件工程"],
    employmentDirections: ["软件开发", "互联网平台", "人工智能应用", "企业数字化", "信息安全"],
    representativeCareers: ["软件工程师", "后端工程师", "算法工程师", "测试开发工程师", "数据工程师"],
    industryOutlook: "数字化、人工智能和产业软件长期需要计算机人才，但岗位竞争更看重项目能力、实习经历和持续学习。",
    graduateDirections: ["计算机科学与技术", "软件工程", "人工智能", "网络空间安全", "电子信息"],
    riskReminder: "热门专业竞争强，课程难度高，单靠专业名称不能保证高薪，需要持续积累项目和工程能力。"
  },
  人工智能: {
    plainLanguage: "学习让机器识别、预测、生成和决策的方法，把数学、算法、数据和工程系统结合起来。",
    interests: ["数学建模", "编程", "数据分析", "前沿技术"],
    suitableFor: ["数学基础较好", "愿意学习概率统计和算法", "能接受技术快速变化"],
    coreCourses: ["机器学习", "深度学习", "数据结构", "概率统计", "模式识别", "自然语言处理"],
    employmentDirections: ["算法研发", "智能制造", "大模型应用", "自动驾驶", "数据智能"],
    representativeCareers: ["算法工程师", "机器学习工程师", "数据科学家", "AI产品工程师", "智能系统工程师"],
    industryOutlook: "人工智能应用面广，但高质量岗位对数学、编程、论文或项目经历要求较高。",
    graduateDirections: ["人工智能", "计算机科学与技术", "控制科学与工程", "电子信息", "软件工程"],
    riskReminder: "本科阶段容易学得宽而不深，建议关注学校课程、实验室、算力资源和实践项目。"
  },
  电子信息工程: {
    plainLanguage: "研究通信、芯片、传感器、硬件电路和电子系统如何设计、连接和处理信息。",
    interests: ["电子硬件", "通信网络", "物理", "动手实验"],
    suitableFor: ["理工基础较好", "愿意做实验和工程验证", "对硬件与系统感兴趣"],
    coreCourses: ["电路分析", "模拟电子技术", "数字电子技术", "信号与系统", "通信原理", "嵌入式系统"],
    employmentDirections: ["芯片与半导体", "通信设备", "智能硬件", "新能源电子", "工业控制"],
    representativeCareers: ["硬件工程师", "嵌入式工程师", "通信算法工程师", "电气工程师", "测试验证工程师"],
    industryOutlook: "半导体、通信设备、智能制造和新能源相关岗位需求稳定，区域产业链会影响实习与就业机会。",
    graduateDirections: ["电子科学与技术", "信息与通信工程", "控制科学与工程", "集成电路工程", "电子信息"],
    riskReminder: "学习曲线较陡，低年级基础课和实验能力会影响后续方向选择。"
  },
  临床医学: {
    plainLanguage: "学习人体疾病的诊断、治疗和预防，目标是培养医生和医学相关专业人才。",
    interests: ["生命科学", "医学", "助人", "长期学习"],
    suitableFor: ["能接受长学制和高强度训练", "责任心强", "愿意持续学习和考试"],
    coreCourses: ["人体解剖学", "生理学", "病理学", "诊断学", "内科学", "外科学"],
    employmentDirections: ["医院临床", "医学科研", "公共卫生", "医学影像或检验", "医药企业医学岗位"],
    representativeCareers: ["临床医生", "住院医师", "医学研究员", "医疗产品医学顾问", "公共卫生医师"],
    industryOutlook: "医疗需求稳定，但成长周期长，院校层次、城市、医院平台和规培路径影响很大。",
    graduateDirections: ["内科学", "外科学", "儿科学", "影像医学", "临床医学专业硕士"],
    riskReminder: "周期长、压力大，需关注学制、规培、执业资格和专业调剂风险。"
  },
  法学: {
    plainLanguage: "学习法律规则、案件分析和社会治理，训练用法律逻辑解决纠纷和合规问题。",
    interests: ["阅读表达", "逻辑辩论", "公共事务", "规则分析"],
    suitableFor: ["阅读量大也能坚持", "表达和写作能力较好", "愿意准备法律职业资格考试"],
    coreCourses: ["法理学", "宪法学", "民法", "刑法", "行政法", "诉讼法"],
    employmentDirections: ["律师事务所", "法院检察系统", "企业法务", "合规风控", "公共管理"],
    representativeCareers: ["律师", "法务专员", "合规经理", "公务员", "法律研究员"],
    industryOutlook: "法律、合规和公共治理需求稳定，但职业入口很看重学校平台、资格考试和实习经历。",
    graduateDirections: ["法学", "法律硕士", "国际法", "民商法", "经济法"],
    riskReminder: "就业分化明显，非法考、无实习、无写作积累会显著影响竞争力。"
  }
};

const baseMajors = [
  ["080901", "计算机科学与技术", "工学", "计算机类", "工学"],
  ["080717T", "人工智能", "工学", "电子信息类", "工学"],
  ["080701", "电子信息工程", "工学", "电子信息类", "工学"],
  ["100201K", "临床医学", "医学", "临床医学类", "医学"],
  ["030101K", "法学", "法学", "法学类", "法学"],
  ["050101", "汉语言文学", "文学", "中国语言文学类", "文学"],
  ["080202", "机械设计制造及其自动化", "工学", "机械类", "工学"],
  ["120203K", "会计学", "管理学", "工商管理类", "管理学"]
];

function fallbackProfile(name: string): Partial<MajorCatalogEntry> {
  return {
    plainLanguage: `${name}主要学习该领域的基础理论、方法工具和实践应用，帮助学生进入相关行业岗位或继续深造。`,
    interests: ["专业兴趣", "持续学习", "实践应用"],
    suitableFor: ["愿意系统学习专业基础", "希望结合学校平台和城市资源选择方向", "能通过实习确认职业兴趣"],
    coreCourses: ["专业导论", "学科基础课", "研究方法", "实践实训", "毕业设计"],
    employmentDirections: ["本专业相关岗位", "交叉行业岗位", "公共部门", "继续深造"],
    representativeCareers: ["专业助理", "项目专员", "研究助理", "运营专员"],
    industryOutlook: "就业质量取决于学校平台、城市产业、个人能力和实习质量，需要结合真实就业质量报告判断。",
    graduateDirections: ["本专业继续深造", "交叉学科", "专业硕士"],
    riskReminder: "不同学校培养重点差异较大，需要复核课程设置、转专业政策和毕业去向。"
  };
}

export const nationalMajorCatalog: MajorCatalogEntry[] = baseMajors.map(([code, name, category, majorClass, degreeCategory]) => ({
  code,
  name,
  category,
  majorClass,
  degreeCategory,
  relatedMajors: [],
  dataSource: ministryMajorCatalogSource,
  ...fallbackProfile(name),
  ...featuredProfiles[name]
})) as MajorCatalogEntry[];

export function getMajorCatalog(query = "") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nationalMajorCatalog;
  return nationalMajorCatalog.filter((major) => {
    return `${major.name} ${major.category} ${major.majorClass} ${major.plainLanguage}`.toLowerCase().includes(normalized);
  });
}

export function getMajorCatalogEntry(name: string) {
  return nationalMajorCatalog.find((major) => major.name === name);
}
```

- [ ] **Step 2: Expand `baseMajors` to the official 2026 catalog count**

Use the official Ministry of Education catalog as the source for the full `baseMajors` list. Preserve the `ministryMajorCatalogSource` metadata and keep the five featured profile overrides. After expansion, this assertion must pass:

```ts
expect(getMajorCatalog().length).toBeGreaterThanOrEqual(845);
```

The official source referenced in the code is the Ministry of Education 2026 undergraduate major catalog page. If the page is temporarily unreachable, use the downloadable catalog linked from that page and keep the same `sourceName`, `year`, and `verifiedAt`.

- [ ] **Step 3: Re-export catalog helpers and replace `majorOptions`**

In `src/shared/recommendation.ts`, add:

```ts
export { getMajorCatalog, getMajorCatalogEntry, nationalMajorCatalog } from "./major-catalog";
import { nationalMajorCatalog } from "./major-catalog";
```

Replace the existing `majorOptions` export with:

```ts
export const majorOptions = nationalMajorCatalog.map((major) => major.name);
```

- [ ] **Step 4: Add catalog route**

In `src/server/app.ts`, import:

```ts
import { getMajorCatalog } from "../shared/recommendation";
```

Add this route before `POST /recommend`:

```ts
app.get("/catalog/majors", (request, response) => {
  const query = typeof request.query.query === "string" ? request.query.query : "";
  response.json({
    items: getMajorCatalog(query),
    source: "教育部普通高等学校本科专业目录",
    year: 2026
  });
});
```

- [ ] **Step 5: Run catalog tests**

Run:

```bash
npm test -- src/shared/recommendation.test.ts src/server/recommend-api.test.ts -t "major catalog|searchable national major catalog"
```

Expected: catalog tests PASS.

- [ ] **Step 6: Commit the major catalog**

```bash
git add src/shared/major-catalog.ts src/shared/recommendation.ts src/server/app.ts src/shared/recommendation.test.ts src/server/recommend-api.test.ts
git commit -m "feat: add national major catalog"
```

---

### Task 5: Add Cohort Outcome Aggregation

**Files:**
- Create: `src/shared/cohort-outcomes.ts`
- Modify: `src/shared/real-data-store.ts`
- Modify: `src/shared/recommendation.ts`
- Modify: `src/server/app.ts`
- Test: `src/shared/recommendation.test.ts`
- Test: `src/server/recommend-api.test.ts`

- [ ] **Step 1: Create `src/shared/cohort-outcomes.ts`**

```ts
import type { CohortDistributionItem, CohortOutcomes, SourceAwareAdmissionStat } from "./data-model";
import { getAdmissionDataset } from "./real-data-store";

function rankBandFor(rank: number) {
  const radius = Math.max(500, Math.round(rank * 0.08));
  return {
    from: Math.max(1, rank - radius),
    to: rank + radius
  };
}

function distribution<T extends string>(
  stats: SourceAwareAdmissionStat[],
  getName: (stat: SourceAwareAdmissionStat) => T
): CohortDistributionItem[] {
  const counts = new Map<T, { count: number; dataMode: SourceAwareAdmissionStat["dataMode"] }>();
  for (const stat of stats) {
    const name = getName(stat);
    const existing = counts.get(name);
    counts.set(name, {
      count: (existing?.count ?? 0) + 1,
      dataMode: existing?.dataMode === "verified" ? "verified" : stat.dataMode
    });
  }

  return [...counts.entries()]
    .map(([name, item]) => ({
      name,
      count: item.count,
      share: stats.length === 0 ? 0 : item.count / stats.length,
      dataMode: item.dataMode
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function getCohortOutcomes(input: { province: string; subject: string; rank: number }): CohortOutcomes {
  const band = rankBandFor(input.rank);
  const dataset = getAdmissionDataset();
  const schoolsById = new Map(dataset.schools.map((school) => [school.id, school]));
  const matchedStats = dataset.stats.filter((stat) => {
    const provinceMatches = input.province === "全国" || stat.province === input.province;
    const rankMatches = stat.avgRank >= band.from && stat.avgRank <= band.to;
    return provinceMatches && rankMatches;
  });

  const yearsIncluded = [...new Set(matchedStats.map((stat) => stat.year))].sort((a, b) => b - a);
  const schoolDistribution = distribution(matchedStats, (stat) => schoolsById.get(stat.schoolId)?.name ?? `学校 ${stat.schoolId}`);
  const majorDistribution = distribution(matchedStats, (stat) => stat.major);
  const cityDistribution = distribution(matchedStats, (stat) => schoolsById.get(stat.schoolId)?.city ?? "未知城市");

  return {
    label: "相似位次录取去向",
    province: input.province,
    subject: input.subject,
    rankCenter: input.rank,
    rankBand: band,
    yearsIncluded,
    schoolDistribution,
    majorDistribution,
    cityDistribution,
    schoolMajorPairs: matchedStats.slice(0, 12).map((stat) => {
      const school = schoolsById.get(stat.schoolId);
      return {
        schoolName: school?.name ?? `学校 ${stat.schoolId}`,
        majorName: stat.major,
        city: school?.city ?? "未知城市",
        count: 1,
        share: matchedStats.length === 0 ? 0 : 1 / matchedStats.length,
        latestYear: stat.year,
        dataMode: stat.dataMode
      };
    }),
    dataMode: matchedStats.some((stat) => stat.dataMode === "verified") ? "partial" : "sample",
    coverageState: matchedStats.length >= 6 ? "sample" : "missing",
    privacyNote: "本模块只使用公开录取数据做相似位次聚合，不使用个人学生记录。",
    missingReason: matchedStats.length === 0 ? "当前省份、科类、位次区间缺少可用官方录取记录。" : undefined
  };
}
```

- [ ] **Step 2: Re-export cohort helper**

In `src/shared/recommendation.ts`, add:

```ts
export { getCohortOutcomes } from "./cohort-outcomes";
```

- [ ] **Step 3: Add `/cohort-outcomes` route**

In `src/server/app.ts`, import:

```ts
import { getCohortOutcomes } from "../shared/recommendation";
```

Add a Zod schema:

```ts
const cohortRequestSchema = z.object({
  province: z.string().min(1),
  subject: z.string().min(1),
  rank: z.number().int().positive()
});
```

Add the route:

```ts
app.post("/cohort-outcomes", (request, response) => {
  const parsed = cohortRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: "INVALID_COHORT_REQUEST",
      details: parsed.error.issues
    });
    return;
  }

  response.json(getCohortOutcomes(parsed.data));
});
```

- [ ] **Step 4: Run cohort tests**

Run:

```bash
npm test -- src/shared/recommendation.test.ts src/server/recommend-api.test.ts -t "similar-rank|similar rank"
```

Expected: cohort tests PASS.

- [ ] **Step 5: Commit cohort outcomes**

```bash
git add src/shared/cohort-outcomes.ts src/shared/recommendation.ts src/server/app.ts src/shared/recommendation.test.ts src/server/recommend-api.test.ts
git commit -m "feat: add similar rank outcomes"
```

---

### Task 6: Build School-First Recommendation Assembly

**Files:**
- Create: `src/shared/school-first-recommendation.ts`
- Modify: `src/shared/recommendation.ts`
- Modify: `src/shared/real-data-store.ts`
- Test: `src/shared/recommendation.test.ts`

- [ ] **Step 1: Add query helpers in `src/shared/real-data-store.ts`**

Add:

```ts
export function getStatsForSchool(schoolId: number) {
  return [...sampleStats, ...importedStats].filter((stat) => stat.schoolId === schoolId);
}

export function getSchoolById(schoolId: number) {
  return [...sampleSchools, ...importedSchools].find((school) => school.id === schoolId);
}
```

If the module uses different internal array names, use the arrays currently returned by `getAdmissionDataset()`:

```ts
export function getStatsForSchool(schoolId: number) {
  return getAdmissionDataset().stats.filter((stat) => stat.schoolId === schoolId);
}

export function getSchoolById(schoolId: number) {
  return getAdmissionDataset().schools.find((school) => school.id === schoolId);
}
```

- [ ] **Step 2: Create `src/shared/school-first-recommendation.ts`**

```ts
import type { RecommendationRequest } from "./recommendation";
import { calculateProbability } from "./recommendation";
import type { SchoolMajorOption, SchoolReachability } from "./data-model";
import { getAdmissionDataset } from "./real-data-store";
import { getCohortOutcomes } from "./cohort-outcomes";
import { getMajorCatalogEntry } from "./major-catalog";

function clamp(value: number) {
  return Math.max(0.01, Math.min(0.99, value));
}

function heatLevel(probability: number): SchoolMajorOption["heatLevel"] {
  if (probability < 0.45) return "high";
  if (probability < 0.7) return "medium";
  return "low";
}

export function buildEligibleMajors(input: RecommendationRequest, schoolId: number): SchoolMajorOption[] {
  const dataset = getAdmissionDataset();
  const school = dataset.schools.find((item) => item.id === schoolId);
  if (!school) return [];

  const stats = dataset.stats.filter((stat) => stat.schoolId === schoolId && (input.province === "全国" || stat.province === input.province));

  return stats
    .map((stat) => {
      const profile = getMajorCatalogEntry(stat.major);
      const result = calculateProbability({
        studentRank: input.rank,
        province: input.province,
        preferredCities: input.preferredCities,
        cityPreference: input.cityPreference,
        majors: input.majors,
        riskPreference: input.riskPreference,
        stat,
        school,
        trendDelta: 0
      });

      const fitProbability = clamp(result.probability);
      return {
        majorName: stat.major,
        plainLanguage: profile?.plainLanguage ?? `${stat.major}主要学习相关领域的基础理论、方法工具和实践应用。`,
        fitProbability,
        heatLevel: heatLevel(fitProbability),
        dataMode: stat.dataMode,
        source: stat.dataSource,
        rankGap: input.rank - stat.avgRank,
        reason: `该专业近年平均位次约 ${stat.avgRank.toLocaleString("zh-CN")}，与当前位次形成可比较区间。`,
        risk: fitProbability < 0.5 ? "专业热度和计划数变化可能导致波动。" : "仍需复核当年招生计划和专业组变化。",
        careerSummary: profile?.industryOutlook ?? "就业质量取决于学校平台、城市产业、个人能力和实习质量。"
      };
    })
    .sort((a, b) => b.fitProbability - a.fitProbability)
    .slice(0, 8);
}

export function buildSchoolReachability(input: RecommendationRequest, schoolId: number): SchoolReachability | undefined {
  const dataset = getAdmissionDataset();
  const school = dataset.schools.find((item) => item.id === schoolId);
  if (!school) return undefined;

  const stats = dataset.stats.filter((stat) => stat.schoolId === schoolId && (input.province === "全国" || stat.province === input.province));
  const stat = stats.sort((a, b) => Math.abs(input.rank - a.avgRank) - Math.abs(input.rank - b.avgRank))[0];
  if (!stat) return undefined;

  const probability = calculateProbability({
    studentRank: input.rank,
    province: input.province,
    preferredCities: input.preferredCities,
    cityPreference: input.cityPreference,
    majors: input.majors,
    riskPreference: input.riskPreference,
    stat,
    school,
    trendDelta: 0
  });

  return {
    probability: probability.probability,
    rankGap: input.rank - stat.avgRank,
    zScore: (input.rank - stat.avgRank) / stat.stdRank,
    latestYear: stat.year,
    trend: {
      latestYear: stat.year,
      latestAvgRank: stat.avgRank,
      direction: "stable",
      volatility: "low",
      yearlyAvgRanks: stats.slice(0, 3).map((item) => ({ year: item.year, avgRank: item.avgRank }))
    },
    explanation: {
      formula: "gap = student_rank - school_avg_rank; z = gap / school_std; probability = 1 / (1 + exp(-k * z))",
      gap: input.rank - stat.avgRank,
      z: (input.rank - stat.avgRank) / stat.stdRank,
      factors: {
        ...probability.factors,
        sourceConfidence: stat.dataSource.confidence
      },
      narrative: probability.narrative
    }
  };
}

export function attachSchoolFirstFields<T extends { schoolName: string; probability: number; schoolProfile: { id?: number }; dataSource: { confidence: number } }>(
  input: RecommendationRequest,
  groups: { reach: T[]; match: T[]; safety: T[] }
) {
  const dataset = getAdmissionDataset();
  const enrich = (item: T) => {
    const school = dataset.schools.find((candidate) => candidate.name === item.schoolName);
    const schoolId = school?.id ?? 0;
    const reachability = schoolId ? buildSchoolReachability(input, schoolId) : undefined;
    return {
      ...item,
      selectionStage: "school_pool" as const,
      schoolId,
      schoolReachability: reachability ?? {
        probability: item.probability,
        rankGap: 0,
        zScore: 0,
        latestYear: 0,
        trend: item.admissionTrend,
        explanation: item.probabilityExplanation
      },
      eligibleMajors: schoolId ? buildEligibleMajors(input, schoolId) : []
    };
  };

  return {
    reach: groups.reach.map(enrich),
    match: groups.match.map(enrich),
    safety: groups.safety.map(enrich),
    cohortOutcomes: getCohortOutcomes({
      province: input.province,
      subject: input.subject,
      rank: input.rank
    })
  };
}
```

- [ ] **Step 3: Modify `getRecommendations` to enrich the existing result**

In `src/shared/recommendation.ts`, import:

```ts
import { attachSchoolFirstFields } from "./school-first-recommendation";
```

At the end of `getRecommendations`, replace:

```ts
return {
  reach,
  match,
  safety
};
```

with:

```ts
return attachSchoolFirstFields(input, {
  reach,
  match,
  safety
});
```

- [ ] **Step 4: Run school-first tests**

Run:

```bash
npm test -- src/shared/recommendation.test.ts
```

Expected: PASS for the school-first contract tests. If TypeScript complains about circular imports between `recommendation.ts` and `school-first-recommendation.ts`, move `RecommendationRequest`, `calculateProbability`, and `calculateBaseProbability` into a new `src/shared/probability-model.ts`, then import them from that module in both files.

- [ ] **Step 5: Commit school-first assembly**

```bash
git add src/shared/school-first-recommendation.ts src/shared/recommendation.ts src/shared/real-data-store.ts src/shared/recommendation.test.ts
git commit -m "feat: add school first recommendations"
```

---

### Task 7: Add School, School-Major, Source Registry, And Plan APIs

**Files:**
- Create: `src/shared/plan-builder.ts`
- Modify: `src/server/app.ts`
- Modify: `src/server/recommend-api.test.ts`

- [ ] **Step 1: Add API tests**

Append to `src/server/recommend-api.test.ts`:

```ts
it("returns school detail and school-specific major options", async () => {
  const app = createRecommendApp();

  const schoolResponse = await request(app).get("/schools/1");
  expect(schoolResponse.status).toBe(200);
  expect(schoolResponse.body.name).toEqual(expect.any(String));

  const majorsResponse = await request(app).get("/schools/1/majors?province=北京&subject=physics&rank=2600");
  expect(majorsResponse.status).toBe(200);
  expect(majorsResponse.body.items.length).toBeGreaterThan(0);
  expect(majorsResponse.body.items[0].plainLanguage).toEqual(expect.any(String));
});

it("returns national source registry coverage", async () => {
  const app = createRecommendApp();

  const response = await request(app).get("/data/source-registry");

  expect(response.status).toBe(200);
  expect(response.body.totalProvinces).toBeGreaterThanOrEqual(31);
  expect(response.body.registry.length).toBeGreaterThanOrEqual(31);
});

it("builds a final 6-6-4 volunteer plan from selected schools and majors", async () => {
  const app = createRecommendApp();

  const recommendation = await request(app).post("/recommend").send({
    score: 642,
    rank: 2600,
    province: "北京",
    subject: "physics",
    cityPreference: 0.72,
    preferredCities: ["北京", "上海", "杭州"],
    majors: [],
    riskPreference: "balanced"
  });

  const selections = [...recommendation.body.reach, ...recommendation.body.match, ...recommendation.body.safety].map((item) => ({
    category: item.category,
    schoolId: item.schoolId,
    schoolName: item.schoolName,
    majorName: item.eligibleMajors[0].majorName
  }));

  const response = await request(app).post("/plan").send({ selections });

  expect(response.status).toBe(200);
  expect(response.body.reach).toHaveLength(6);
  expect(response.body.match).toHaveLength(6);
  expect(response.body.safety).toHaveLength(4);
});
```

- [ ] **Step 2: Create `src/shared/plan-builder.ts`**

```ts
import type { VolunteerPlanItem } from "./data-model";
import { getAdmissionDataset } from "./real-data-store";

export interface PlanSelectionInput {
  category: "reach" | "match" | "safety";
  schoolId: number;
  schoolName: string;
  majorName: string;
}

export function buildVolunteerPlan(selections: PlanSelectionInput[]) {
  const dataset = getAdmissionDataset();
  const toPlanItem = (selection: PlanSelectionInput, index: number): VolunteerPlanItem => {
    const stat = dataset.stats.find((item) => item.schoolId === selection.schoolId && item.major === selection.majorName);
    return {
      id: `${selection.category}-${selection.schoolId}-${selection.majorName}-${index}`,
      category: selection.category,
      schoolId: selection.schoolId,
      schoolName: selection.schoolName,
      majorName: selection.majorName,
      probability: stat ? Math.max(0.01, Math.min(0.99, 1 - stat.avgRank / 100000)) : 0,
      dataMode: stat?.dataMode ?? "unavailable",
      reason: stat ? `依据 ${stat.year} 年 ${selection.majorName} 平均位次形成志愿梯度。` : "缺少该专业官方录取数据，需人工复核。",
      risk: stat ? "仍需复核当年招生计划、专业组和选科要求。" : "缺少专业层真实数据，不建议作为唯一依据。",
      alternativeSchoolName: selection.schoolName
    };
  };

  const grouped = {
    reach: selections.filter((item) => item.category === "reach").slice(0, 6).map(toPlanItem),
    match: selections.filter((item) => item.category === "match").slice(0, 6).map(toPlanItem),
    safety: selections.filter((item) => item.category === "safety").slice(0, 4).map(toPlanItem)
  };

  return grouped;
}
```

- [ ] **Step 3: Add routes**

In `src/server/app.ts`, import:

```ts
import { buildVolunteerPlan } from "../shared/plan-builder";
import { buildEligibleMajors } from "../shared/school-first-recommendation";
import { getNationalSourceCoverage } from "../shared/source-registry";
import { getAdmissionDataset } from "../shared/real-data-store";
```

Add routes:

```ts
app.get("/data/source-registry", (_request, response) => {
  response.json(getNationalSourceCoverage());
});

app.get("/schools/:schoolId", (request, response) => {
  const schoolId = Number(request.params.schoolId);
  const school = getAdmissionDataset().schools.find((item) => item.id === schoolId);
  if (!school) {
    response.status(404).json({ error: "SCHOOL_NOT_FOUND" });
    return;
  }
  response.json(school);
});

app.get("/schools/:schoolId/majors", (request, response) => {
  const schoolId = Number(request.params.schoolId);
  const rank = Number(request.query.rank ?? 1);
  const province = typeof request.query.province === "string" ? request.query.province : "全国";
  const subject = typeof request.query.subject === "string" ? request.query.subject : "physics";

  response.json({
    items: buildEligibleMajors(
      {
        score: 0,
        rank,
        province,
        subject,
        cityPreference: 0.5,
        preferredCities: ["全国"],
        majors: [],
        riskPreference: "balanced"
      },
      schoolId
    )
  });
});

app.post("/plan", (request, response) => {
  const selections = Array.isArray(request.body?.selections) ? request.body.selections : [];
  response.json(buildVolunteerPlan(selections));
});
```

- [ ] **Step 4: Run API tests**

Run:

```bash
npm test -- src/server/recommend-api.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit API expansion**

```bash
git add src/shared/plan-builder.ts src/server/app.ts src/server/recommend-api.test.ts
git commit -m "feat: add school first decision APIs"
```

---

### Task 8: Rebuild Frontend Flow Around School Pools

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Update frontend types in `src/App.tsx`**

Add interfaces near existing frontend types:

```ts
interface SchoolMajorOptionView {
  majorName: string;
  plainLanguage: string;
  fitProbability: number;
  heatLevel: "high" | "medium" | "low";
  dataMode: Recommendation["dataMode"];
  reason: string;
  risk: string;
  careerSummary: string;
}

interface CohortOutcomesView {
  label: string;
  rankBand: { from: number; to: number };
  schoolDistribution: Array<{ name: string; count: number; share: number; dataMode: Recommendation["dataMode"] }>;
  majorDistribution: Array<{ name: string; count: number; share: number; dataMode: Recommendation["dataMode"] }>;
  cityDistribution: Array<{ name: string; count: number; share: number; dataMode: Recommendation["dataMode"] }>;
  privacyNote: string;
}
```

Extend the local recommendation type if needed:

```ts
type SchoolFirstRecommendation = Recommendation & {
  selectionStage: "school_pool";
  schoolId: number;
  schoolReachability: {
    probability: number;
    rankGap: number;
    zScore: number;
    latestYear: number;
  };
  eligibleMajors: SchoolMajorOptionView[];
};
```

- [ ] **Step 2: Stop requiring major selection before generation**

Find the submit handler validation. If it blocks empty majors, remove that block. The request body should still send:

```ts
majors: form.majors
```

The empty array means "先按学校可达性推荐，再在学校里选专业".

- [ ] **Step 3: Add result state for cohort outcomes and plan selections**

Add React state:

```ts
const [cohortOutcomes, setCohortOutcomes] = useState<CohortOutcomesView | null>(null);
const [planSelections, setPlanSelections] = useState<Array<{ category: CategoryKey; schoolId: number; schoolName: string; majorName: string }>>([]);
```

After `/recommend` returns, set:

```ts
setCohortOutcomes(data.cohortOutcomes ?? null);
```

- [ ] **Step 4: Replace major-first copy**

Change the form heading copy to:

```tsx
<h2>先算可达学校，再选择专业</h2>
<p>输入成绩和位次后，系统先生成冲刺、稳妥、保底学校池。点击学校后，再查看该校可选专业、专业解释和就业方向。</p>
```

Keep the major selector as optional:

```tsx
<span>专业兴趣 · 可选填</span>
```

- [ ] **Step 5: Add a similar-rank outcome panel**

Add a component inside `src/App.tsx`:

```tsx
function CohortPanel({ outcomes }: { outcomes: CohortOutcomesView | null }) {
  if (!outcomes) return null;

  return (
    <section className="cohort-panel">
      <div>
        <span className="eyebrow">{outcomes.label}</span>
        <h3>过去相近位次主要去了哪里</h3>
        <p>
          位次区间 {outcomes.rankBand.from.toLocaleString("zh-CN")} - {outcomes.rankBand.to.toLocaleString("zh-CN")}。
          {outcomes.privacyNote}
        </p>
      </div>
      <div className="cohort-columns">
        {[
          ["学校", outcomes.schoolDistribution],
          ["专业", outcomes.majorDistribution],
          ["城市", outcomes.cityDistribution]
        ].map(([label, items]) => (
          <div className="cohort-card" key={label as string}>
            <strong>{label as string}</strong>
            {(items as CohortOutcomesView["schoolDistribution"]).slice(0, 5).map((item) => (
              <div className="cohort-bar" key={`${label}-${item.name}`}>
                <span>{item.name}</span>
                <i style={{ width: `${Math.max(8, item.share * 100)}%` }} />
                <em>{Math.round(item.share * 100)}%</em>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
```

Render it above the school cards:

```tsx
<CohortPanel outcomes={cohortOutcomes} />
```

- [ ] **Step 6: Update school cards to show school-first fields**

Inside the recommendation card, add:

```tsx
<div className="school-first-meta">
  <span>学校可达性 {Math.round(item.schoolReachability.probability * 100)}%</span>
  <span>位次差 {item.schoolReachability.rankGap.toLocaleString("zh-CN")}</span>
  <span>{item.eligibleMajors.length} 个可参考专业</span>
</div>
```

- [ ] **Step 7: Update detail drawer to show school-specific majors first**

In the selected-school drawer, add this section before career guidance:

```tsx
<section className="detail-section">
  <h3>该校可参考专业</h3>
  <div className="school-major-grid">
    {item.eligibleMajors.map((major) => (
      <button
        type="button"
        className="school-major-card"
        key={major.majorName}
        onClick={() =>
          setPlanSelections((current) => [
            ...current,
            {
              category: item.category,
              schoolId: item.schoolId,
              schoolName: item.schoolName,
              majorName: major.majorName
            }
          ])
        }
      >
        <strong>{major.majorName}</strong>
        <span>{major.plainLanguage}</span>
        <em>{Math.round(major.fitProbability * 100)}% 专业参考概率</em>
      </button>
    ))}
  </div>
</section>
```

- [ ] **Step 8: Add cockpit CSS**

Append to `src/styles.css`:

```css
.cohort-panel {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) 1.4fr;
  gap: 18px;
  padding: 22px;
  border: 1px solid rgba(31, 41, 35, 0.1);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(234, 241, 232, 0.72));
  box-shadow: 0 24px 70px rgba(33, 47, 41, 0.1);
}

.cohort-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.cohort-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(31, 41, 35, 0.08);
}

.cohort-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: #5d675f;
}

.cohort-bar i {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #4b735f, #1f3b3e);
  transform-origin: left;
  animation: growBar 680ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.school-first-meta,
.school-major-grid {
  display: grid;
  gap: 10px;
}

.school-first-meta {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.school-major-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.school-major-card {
  text-align: left;
  border: 1px solid rgba(31, 41, 35, 0.1);
  background: rgba(255, 255, 255, 0.82);
  border-radius: 18px;
  padding: 16px;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.school-major-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(30, 42, 37, 0.12);
  background: #ffffff;
}

@keyframes growBar {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
```

- [ ] **Step 9: Run frontend build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 10: Commit frontend flow**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: redesign frontend around school pools"
```

---

### Task 9: Add Stronger AI Cockpit Animations

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add AI reasoning stage data**

In `src/App.tsx`, replace the current loading labels with:

```ts
const reasoningStages = [
  "正在读取学生画像",
  "正在计算学校可达池",
  "正在匹配相似位次去向",
  "正在生成学校专业解释",
  "正在构建冲稳保志愿矩阵"
];
```

- [ ] **Step 2: Add animated reasoning component**

```tsx
function ReasoningStream({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="reasoning-stream">
      {reasoningStages.map((stage, index) => (
        <div className="reasoning-step" style={{ animationDelay: `${index * 180}ms` }} key={stage}>
          <span />
          <p>{stage}</p>
        </div>
      ))}
    </div>
  );
}
```

Render it near the submit button and results loading area:

```tsx
<ReasoningStream active={isLoading} />
```

- [ ] **Step 3: Add animated probability ring class**

Add to school card markup:

```tsx
<div className="probability-ring" style={{ "--probability": item.probability } as React.CSSProperties}>
  <strong>{Math.round(item.probability * 100)}%</strong>
  <span>学校概率</span>
</div>
```

- [ ] **Step 4: Add animation CSS**

Append to `src/styles.css`:

```css
.reasoning-stream {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.reasoning-step {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  transform: translateY(8px);
  animation: reasoningIn 640ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.reasoning-step span {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #4b735f;
  box-shadow: 0 0 0 8px rgba(75, 115, 95, 0.08);
}

.probability-ring {
  width: 92px;
  height: 92px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at center, #fff 58%, transparent 59%),
    conic-gradient(#335f54 calc(var(--probability) * 1turn), rgba(31, 41, 35, 0.08) 0);
  animation: ringIn 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.probability-ring span {
  font-size: 11px;
  color: #6a756d;
}

@keyframes reasoningIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ringIn {
  from {
    transform: scale(0.86) rotate(-12deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit animation polish**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: add ai cockpit animations"
```

---

### Task 10: Documentation, Verification, And Render Safety

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README with new user flow**

Add this section to `README.md`:

```md
## School-First Decision Flow

The product now follows a school-first decision flow:

1. Enter score, rank, province, subject type, city preference, and risk preference.
2. Generate reachable school pools first: reach, match, and safety.
3. Open a school to inspect school profile, probability explanation, data source status, and eligible majors.
4. Read major explanations in plain language before selecting school-major combinations.
5. Review similar-rank admission outcomes derived from aggregated public admission records.
6. Build a final 6 / 6 / 4 volunteer plan.

Major preference is optional. When omitted, the system recommends schools first and explains majors inside each school.
```

- [ ] **Step 2: Document official data limits**

Add:

```md
## Real Data Policy

The system must not fabricate official admissions data.

Accepted source categories:

- Provincial examination authorities
- Sunshine Gaokao
- School undergraduate admission offices
- School admission brochures and enrollment plans
- School employment quality reports

When official data has not been imported, the UI marks coverage as missing, sample, partial, or stale. The app can demonstrate structure with sample records, but sample records are never labeled as verified.
```

- [ ] **Step 3: Document new endpoints**

Add:

```md
## Additional API Endpoints

- `GET /catalog/majors?query=计算机`
- `GET /schools/:schoolId`
- `GET /schools/:schoolId/majors?province=北京&subject=physics&rank=2600`
- `POST /cohort-outcomes`
- `POST /plan`
- `GET /data/source-registry`

`POST /recommend` remains available and returns `reach`, `match`, and `safety`.
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: both commands PASS.

- [ ] **Step 5: Start local production server**

Run:

```bash
PORT=4101 npm start
```

Expected: server logs a local URL or starts without TypeScript errors.

- [ ] **Step 6: Smoke test APIs in another terminal**

Run:

```bash
curl -s http://localhost:4101/health
curl -s http://localhost:4101/catalog/majors?query=计算机 | head -c 300
curl -s -X POST http://localhost:4101/cohort-outcomes \
  -H 'Content-Type: application/json' \
  -d '{"province":"北京","subject":"physics","rank":2600}' | head -c 300
```

Expected:

- `/health` returns `{"ok":true}`.
- `/catalog/majors` returns JSON with `items`.
- `/cohort-outcomes` returns JSON with `label:"相似位次录取去向"`.

- [ ] **Step 7: Commit docs and verification readiness**

```bash
git add README.md
git commit -m "docs: document school first workflow"
```

- [ ] **Step 8: Render redeploy checklist**

After all commits are on `main`, redeploy with the existing Render service:

1. Push or upload the changed files to GitHub repository `yx12682-stack/gaokao-ai-recommender`.
2. In Render, open service `gaokao-ai-recommender`.
3. Use `Manual Deploy -> Deploy latest commit`.
4. Wait for `Live`.
5. Open `https://gaokao-ai-recommender.onrender.com`.
6. Confirm the page shows school-first copy and generates school pools.

---

## Self-Review

Spec coverage:

- School-first flow is covered by Tasks 1, 6, 8, and 10.
- Similar-rank outcomes are covered by Tasks 1, 5, 8, and 10.
- Real data policy and source registry are covered by Tasks 3, 7, and 10.
- National major catalog with plain-language explanations is covered by Task 4.
- Stronger AI cockpit animation is covered by Task 9.
- `POST /recommend` compatibility is covered by Tasks 1, 6, 7, and 10.
- Render safety is covered by Task 10.

Type consistency:

- `CoverageState`, `MajorCatalogEntry`, `SchoolMajorOption`, `SchoolReachability`, `CohortOutcomes`, and `VolunteerPlanItem` are defined in Task 2 and reused consistently in later tasks.
- API routes use the same helper names exported from shared modules.
- Frontend fields match the response shape introduced in Task 6.

Verification:

- Each domain change has a targeted test command.
- The final task requires `npm test`, `npm run build`, production start, and API smoke tests.
