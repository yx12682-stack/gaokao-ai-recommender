import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ChevronRight,
  Compass,
  Database,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers3,
  MapPin,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X
} from "lucide-react";
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  cityOptions,
  majorOptions,
  provinceOptions,
  type Recommendation,
  type RecommendResponse,
  type RiskPreference,
  type SubjectType
} from "./shared/recommendation";

type GroupKey = keyof RecommendResponse;

interface FormState {
  score: string;
  rank: string;
  province: string;
  subject: SubjectType;
  cityPreference: number;
  preferredCities: string[];
  majors: string[];
  riskPreference: RiskPreference;
}

const subjectOptions: Array<{ value: SubjectType; label: string }> = [
  { value: "physics", label: "物理类" },
  { value: "history", label: "历史类" },
  { value: "science", label: "理科" },
  { value: "arts", label: "文科" }
];

const riskOptions: Array<{ value: RiskPreference; label: string; hint: string }> = [
  { value: "conservative", label: "保守", hint: "优先安全边际" },
  { value: "balanced", label: "平衡", hint: "梯度均衡" },
  { value: "aggressive", label: "激进", hint: "提高冲刺权重" }
];

const groupMeta: Record<
  GroupKey,
  {
    title: string;
    count: string;
    tone: string;
    icon: typeof TrendingUp;
  }
> = {
  reach: { title: "冲刺", count: "6", tone: "reach", icon: TrendingUp },
  match: { title: "稳妥", count: "6", tone: "match", icon: Radar },
  safety: { title: "保底", count: "4", tone: "safety", icon: ShieldCheck }
};

const thoughtSteps = ["正在分析录取概率", "正在匹配院校", "正在生成最优志愿方案"];

const initialForm: FormState = {
  score: "642",
  rank: "2600",
  province: "北京",
  subject: "physics",
  cityPreference: 0.72,
  preferredCities: ["北京", "上海", "杭州", "南京"],
  majors: ["计算机科学与技术", "人工智能", "电子信息工程"],
  riskPreference: "balanced"
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function cnPercent(probability: number) {
  return `${Math.round(probability * 100)}%`;
}

function dataModeLabel(mode: Recommendation["dataMode"]) {
  const labels = {
    verified: "真实核验",
    partial: "部分真实",
    sample: "示例结构",
    unavailable: "暂无数据"
  };
  return labels[mode] ?? "未知";
}

function riskLevelLabel(level: Recommendation["riskLevel"]) {
  const labels = {
    high: "高风险",
    medium: "中风险",
    low: "低风险"
  };
  return labels[level] ?? "未知风险";
}

function trendLabel(direction: Recommendation["admissionTrend"]["direction"]) {
  const labels = {
    rising: "位次趋紧",
    stable: "基本稳定",
    declining: "位次放宽"
  };
  return labels[direction] ?? "趋势未知";
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  return [...new Map(items.map((item) => [getKey(item), item])).values()];
}

function useCardTilt() {
  const ref = useRef<HTMLArticleElement | null>(null);

  function handleMove(event: MouseEvent<HTMLElement>) {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 7;
    const rotateX = -((y / rect.height) - 0.5) * 7;
    element.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
    element.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    element.style.setProperty("--mx", `${x}px`);
    element.style.setProperty("--my", `${y}px`);
    element.style.transform = `perspective(920px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
      2
    )}deg) translateY(-4px)`;
  }

  function handleLeave() {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--rx", "0deg");
    element.style.setProperty("--ry", "0deg");
    element.style.transform = "perspective(920px) rotateX(0deg) rotateY(0deg) translateY(0)";
  }

  return { ref, handleMove, handleLeave };
}

function ToggleTag({
  selected,
  children,
  onClick
}: {
  selected: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button className={`tag ${selected ? "is-selected" : ""}`} type="button" onClick={onClick}>
      {selected && <CheckCircle2 size={14} strokeWidth={2.4} />}
      <span>{children}</span>
    </button>
  );
}

function SkeletonScreen() {
  return (
    <main className="app-shell skeleton-shell">
      <section className="hero-grid">
        <div className="panel skeleton-panel">
          <div className="sk sk-title" />
          <div className="sk sk-line wide" />
          <div className="sk sk-line" />
          <div className="sk-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="sk sk-pill" key={index} />
            ))}
          </div>
        </div>
        <div className="panel skeleton-panel">
          <div className="sk sk-title" />
          <div className="sk-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="sk sk-card" key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function RecommendationCard({
  item,
  index,
  onOpen
}: {
  item: Recommendation;
  index: number;
  onOpen: (item: Recommendation) => void;
}) {
  const tilt = useCardTilt();

  return (
    <motion.article
      className={`recommendation-card ${item.category}`}
      ref={tilt.ref}
      onMouseMove={tilt.handleMove}
      onMouseLeave={tilt.handleLeave}
      variants={{
        hidden: { opacity: 0, y: 18, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1 }
      }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="card-glow" />
      <div className="card-topline">
        <span className="rank-badge">{String(index + 1).padStart(2, "0")}</span>
        <span className="school-type">{item.type}</span>
      </div>
      <div className="card-main">
        <div>
          <button className="school-title-button" type="button" onClick={() => onOpen(item)}>
            <span>{item.schoolName}</span>
          </button>
          <p className="school-meta">
            <MapPin size={15} />
            {item.city} · {item.province}
          </p>
        </div>
        <div className="probability-orb">
          <strong>{cnPercent(item.probability)}</strong>
          <span>概率</span>
        </div>
      </div>
      <div className="major-row">
        <GraduationCap size={16} />
        <span>{item.major}</span>
      </div>
      <div className="source-row">
        <span className={`source-chip ${item.dataMode}`}>{dataModeLabel(item.dataMode)}</span>
        <span>{item.admissionTrend.latestYear} 年</span>
        <span>gap {item.rankGap.toLocaleString("zh-CN")}</span>
        <span className={`risk-chip ${item.riskLevel}`}>{riskLevelLabel(item.riskLevel)}</span>
      </div>
      <p className="reason">{item.reason}</p>
      <div className="risk-box">
        <span>风险说明</span>
        <p>{item.risk}</p>
      </div>
      <div className="alternative-row">
        <span>替代建议</span>
        <strong>{item.alternative.schoolName}</strong>
        <em>{cnPercent(item.alternative.probability)}</em>
      </div>
      <button className="detail-link" type="button" onClick={() => onOpen(item)}>
        预览学校与职业路径
        <ChevronRight size={15} />
      </button>
    </motion.article>
  );
}

function DetailDrawer({ item, onClose }: { item: Recommendation | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className="detail-drawer"
            initial={{ x: 28, opacity: 0, filter: "blur(8px)" }}
            animate={{ x: 0, opacity: 1, filter: "blur(0)" }}
            exit={{ x: 28, opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <span>School Preview</span>
                <h2>{item.schoolName}</h2>
                <p>
                  {item.city} · {item.type} · {item.major}
                </p>
              </div>
              <button className="ghost-icon" type="button" onClick={onClose} aria-label="关闭详情">
                <X size={18} />
              </button>
            </div>

            <div className="drawer-hero">
              <div>
                <span>录取概率</span>
                <strong>{cnPercent(item.probability)}</strong>
              </div>
              <div>
                <span>志愿梯度</span>
                <strong>{groupMeta[item.category].title}</strong>
              </div>
              <div>
                <span>数据状态</span>
                <strong>{dataModeLabel(item.dataMode)}</strong>
              </div>
            </div>

            <section className="detail-section">
              <h3>
                <Building2 size={18} />
                学校预览
              </h3>
              <p>{item.schoolProfile.summary}</p>
              <div className="profile-facts">
                <span>{item.schoolProfile.level}</span>
                <span>{item.schoolProfile.location}</span>
                <span>{item.schoolProfile.ownership}</span>
                <span>{item.schoolProfile.educationType}</span>
              </div>
              <div className="mini-grid">
                {item.schoolProfile.strengths.map((strength) => (
                  <span key={strength}>{strength}</span>
                ))}
              </div>
              <p>{item.schoolProfile.campusAndEmployment}</p>
              <div className="detail-columns">
                <div>
                  <span>优势学科</span>
                  <ul>
                    {item.schoolProfile.advantagedDisciplines.map((discipline) => (
                      <li key={discipline}>{discipline}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span>特色专业</span>
                  <ul>
                    {item.schoolProfile.featuredMajors.map((major) => (
                      <li key={major}>{major}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="insight-note">{item.schoolProfile.admissionInsight}</div>
            </section>

            <section className="detail-section">
              <h3>
                <ChartNoAxesColumnIncreasing size={18} />
                概率拆解
              </h3>
              <p>{item.probabilityExplanation.narrative}</p>
              <div className="probability-breakdown">
                {Object.entries(item.probabilityExplanation.factors).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{key === "final" || key === "base" ? cnPercent(value) : value.toFixed(3)}</strong>
                  </div>
                ))}
              </div>
              <div className="insight-note">
                gap {item.probabilityExplanation.gap.toLocaleString("zh-CN")} · z {item.probabilityExplanation.z} ·{" "}
                {item.probabilityExplanation.formula}
              </div>
            </section>

            <section className="detail-section">
              <h3>
                <FileText size={18} />
                录取证据与趋势
              </h3>
              <div className="trend-grid">
                <div>
                  <span>最新年份</span>
                  <strong>{item.admissionTrend.latestYear}</strong>
                </div>
                <div>
                  <span>趋势</span>
                  <strong>{trendLabel(item.admissionTrend.direction)}</strong>
                </div>
                <div>
                  <span>波动</span>
                  <strong>{item.admissionTrend.volatility}</strong>
                </div>
              </div>
              <p>{item.admissionTrend.summary}</p>
              <ul className="evidence-list">
                {item.evidence.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="source-list">
                {uniqueBy(item.dataSources, (source) => source.id).map((source) => (
                  <a href={source.sourceUrl} target="_blank" rel="noreferrer" key={source.id}>
                    <Database size={15} />
                    <span>{source.sourceName}</span>
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <h3>
                <BookOpen size={18} />
                推荐与风险说明
              </h3>
              <p>{item.reason}</p>
              <p>{item.risk}</p>
              <div className="insight-note">
                替代学校：{item.alternative.schoolName}，参考概率 {cnPercent(item.alternative.probability)}。
              </div>
            </section>

            <section className="detail-section">
              <h3>
                <BriefcaseBusiness size={18} />
                专业就业方向
              </h3>
              <p>{item.careerGuide.overview}</p>
              <div className="detail-columns">
                <div>
                  <span>核心课程</span>
                  <ul>
                    {item.careerGuide.coreCourses.map((course) => (
                      <li key={course}>{course}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span>适合学生</span>
                  <ul>
                    {item.careerGuide.suitableStudents.map((trait) => (
                      <li key={trait}>{trait}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="detail-columns">
                <div>
                  <span>方向</span>
                  <ul>
                    {item.careerGuide.directions.map((direction) => (
                      <li key={direction}>{direction}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span>职业选择</span>
                  <ul>
                    {item.careerGuide.roles.map((role) => (
                      <li key={role}>{role}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p>{item.careerGuide.industryOutlook}</p>
              <div className="detail-columns">
                <div>
                  <span>考研方向</span>
                  <ul>
                    {item.careerGuide.graduateDirections.map((direction) => (
                      <li key={direction}>{direction}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span>风险提醒</span>
                  <p>{item.careerGuide.riskReminder}</p>
                </div>
              </div>
              <div className="skill-row">
                {item.careerGuide.skillFocus.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <div className="career-path">
                <Compass size={16} />
                <p>{item.careerGuide.longTermPath}</p>
              </div>
            </section>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThoughtPanel({ isGenerating, stepIndex }: { isGenerating: boolean; stepIndex: number }) {
  return (
    <div className="thought-panel">
      <div className="thought-core">
        <div className={`thinking-mark ${isGenerating ? "is-thinking" : ""}`}>
          <BrainCircuit size={20} />
        </div>
        <div>
          <span>AI Decision Engine</span>
          <strong>{isGenerating ? thoughtSteps[stepIndex] : "等待生成志愿方案"}</strong>
        </div>
      </div>
      <div className="thought-steps">
        {thoughtSteps.map((step, index) => (
          <span className={index <= stepIndex && isGenerating ? "is-active" : ""} key={step}>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

export function App() {
  const [booting, setBooting] = useState(true);
  const [form, setForm] = useState<FormState>(initialForm);
  const [results, setResults] = useState<RecommendResponse | null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupKey>("reach");
  const [isGenerating, setIsGenerating] = useState(false);
  const [thoughtStep, setThoughtStep] = useState(0);
  const [error, setError] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setBooting(false), 760);
    return () => window.clearTimeout(id);
  }, []);

  const activeItems = useMemo(() => results?.[activeGroup] ?? [], [activeGroup, results]);
  const allResults = useMemo(() => (results ? [...results.reach, ...results.match, ...results.safety] : []), [results]);
  const resultOverview = useMemo(() => {
    const countBy = <Key extends string>(items: Recommendation[], getKey: (item: Recommendation) => Key) =>
      items.reduce<Record<Key, number>>((acc, item) => {
        const key = getKey(item);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {} as Record<Key, number>);
    const latestYear = allResults.reduce<number | null>(
      (latest, item) => (latest === null ? item.admissionTrend.latestYear : Math.max(latest, item.admissionTrend.latestYear)),
      null
    );
    return {
      total: allResults.length,
      byMode: countBy(allResults, (item) => item.dataMode),
      byRisk: countBy(allResults, (item) => item.riskLevel),
      topCities: Object.entries(countBy(allResults, (item) => item.city)).slice(0, 4),
      topMajors: Object.entries(countBy(allResults, (item) => item.major)).slice(0, 4),
      latestYear
    };
  }, [allResults]);
  const filteredMajorOptions = useMemo(() => {
    const query = majorQuery.trim().toLowerCase();
    if (!query) return majorOptions;
    return majorOptions.filter((major) => major.toLowerCase().includes(query));
  }, [majorQuery]);

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArrayValue(key: "preferredCities" | "majors", value: string) {
    setForm((current) => {
      const values = current[key];
      if (key === "preferredCities" && value === "全国") {
        return { ...current, [key]: values.includes("全国") ? [] : ["全国"] };
      }
      if (key === "preferredCities" && values.includes("全国")) {
        return { ...current, [key]: [value] };
      }
      const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      return { ...current, [key]: next };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResults(null);
    setSelectedRecommendation(null);
    setActiveGroup("reach");
    setIsGenerating(true);
    setThoughtStep(0);

    const stepTimers = [
      window.setTimeout(() => setThoughtStep(1), 620),
      window.setTimeout(() => setThoughtStep(2), 1220)
    ];

    try {
      const payload = {
        score: form.score ? Number(form.score) : undefined,
        rank: form.rank ? Number(form.rank) : undefined,
        province: form.province,
        subject: form.subject,
        cityPreference: form.cityPreference,
        preferredCities: form.preferredCities,
        majors: form.majors,
        riskPreference: form.riskPreference
      };

      const [response] = await Promise.all([
        fetch("/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }),
        wait(1600)
      ]);

      if (!response.ok) {
        throw new Error("请求参数未通过校验");
      }

      const data = (await response.json()) as RecommendResponse;
      setResults(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "生成失败，请稍后重试");
    } finally {
      stepTimers.forEach((timer) => window.clearTimeout(timer));
      setThoughtStep(2);
      window.setTimeout(() => setIsGenerating(false), 380);
    }
  }

  if (booting) return <SkeletonScreen />;

  return (
    <main className="app-shell">
      <div className="ambient-grid" />
      <section className="header-bar">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} />
            Gaokao Decision AI
          </span>
          <h1>高考志愿 AI 推荐系统</h1>
        </div>
        <div className="header-metrics">
          <span>规则模型</span>
          <strong>gap / z / sigmoid</strong>
        </div>
      </section>

      <section className="trust-banner">
        <div>
          <Database size={20} />
          <div>
            <span>Real Data Readiness</span>
            <p>
              当前内置为来源可追踪的示例结构。正式填报必须导入各省教育考试院、阳光高考、学校招生网等权威数据，缺失数据不会伪装成真实结果。
            </p>
          </div>
        </div>
        <a href="https://gaokao.chsi.com.cn/" target="_blank" rel="noreferrer">
          阳光高考
          <ExternalLink size={14} />
        </a>
      </section>

      <section className="hero-grid">
        <form className="panel control-panel" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <span>Student Profile</span>
              <h2>输入画像</h2>
            </div>
            <button className="ghost-icon" type="button" onClick={() => setForm(initialForm)} aria-label="恢复示例">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>高考分数</span>
              <input
                inputMode="numeric"
                value={form.score}
                onChange={(event) => updateForm("score", event.target.value)}
                placeholder="如 642"
              />
            </label>
            <label className="field">
              <span>省排名</span>
              <input
                inputMode="numeric"
                value={form.rank}
                onChange={(event) => updateForm("rank", event.target.value)}
                placeholder="如 2600"
              />
            </label>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>省份</span>
              <select value={form.province} onChange={(event) => updateForm("province", event.target.value)}>
                {provinceOptions.map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>科类</span>
              <div className="segmented compact">
                {subjectOptions.map((option) => (
                  <button
                    className={form.subject === option.value ? "is-active" : ""}
                    type="button"
                    key={option.value}
                    onClick={() => updateForm("subject", option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="slider-field">
            <span>
              城市偏好
              <strong>{form.cityPreference.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={form.cityPreference}
              onChange={(event) => updateForm("cityPreference", Number(event.target.value))}
            />
          </label>

          <div className="field">
            <span>城市偏好 · 全国城市</span>
            <div className="tag-cloud scroll-cloud city-cloud">
              {cityOptions.map((city) => (
                <ToggleTag
                  selected={form.preferredCities.includes(city)}
                  key={city}
                  onClick={() => toggleArrayValue("preferredCities", city)}
                >
                  {city}
                </ToggleTag>
              ))}
            </div>
          </div>

          <div className="field">
            <span>专业偏好 · 全国专业库 {majorOptions.length}</span>
            <input
              className="mini-search"
              value={majorQuery}
              onChange={(event) => setMajorQuery(event.target.value)}
              placeholder="搜索专业，如 法学、临床医学、机械"
            />
            <div className="selected-major-strip">
              {form.majors.length === 0 ? "未选择专业" : `已选 ${form.majors.length} 个：${form.majors.slice(0, 4).join("、")}`}
            </div>
            <div className="tag-cloud scroll-cloud major-cloud">
              {filteredMajorOptions.map((major) => (
                <ToggleTag
                  selected={form.majors.includes(major)}
                  key={major}
                  onClick={() => toggleArrayValue("majors", major)}
                >
                  {major}
                </ToggleTag>
              ))}
            </div>
          </div>

          <div className="field">
            <span>风险偏好</span>
            <div className="risk-grid">
              {riskOptions.map((option) => (
                <button
                  className={form.riskPreference === option.value ? "risk-option is-active" : "risk-option"}
                  type="button"
                  key={option.value}
                  onClick={() => updateForm("riskPreference", option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button className="primary-action" type="submit" disabled={isGenerating || form.majors.length === 0}>
            <Search size={18} />
            <span>{isGenerating ? "生成中" : "生成志愿方案"}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <section className="panel result-panel">
          <div className="panel-heading results-heading">
            <div>
              <span>Recommendation Matrix</span>
              <h2>志愿方案</h2>
            </div>
            <div className="matrix-count">
              <Layers3 size={18} />
              6 · 6 · 4
            </div>
          </div>

          <ThoughtPanel isGenerating={isGenerating} stepIndex={thoughtStep} />

          {results && (
            <div className="overview-grid">
              <div>
                <span>总推荐</span>
                <strong>{resultOverview.total}</strong>
                <p>冲刺 / 稳妥 / 保底</p>
              </div>
              <div>
                <span>数据状态</span>
                <strong>{Object.entries(resultOverview.byMode).map(([mode, count]) => `${dataModeLabel(mode as Recommendation["dataMode"])} ${count}`).join(" · ")}</strong>
                <p>缺少权威导入时仅作结构演示</p>
              </div>
              <div>
                <span>风险分布</span>
                <strong>
                  高 {resultOverview.byRisk.high ?? 0} · 中 {resultOverview.byRisk.medium ?? 0} · 低 {resultOverview.byRisk.low ?? 0}
                </strong>
                <p>由概率区间与梯度共同判定</p>
              </div>
              <div>
                <span>最新年份</span>
                <strong>{resultOverview.latestYear ?? "-"}</strong>
                <p>{resultOverview.topCities.map(([city, count]) => `${city}${count}`).join(" / ")}</p>
              </div>
            </div>
          )}

          <div className="group-tabs" role="tablist" aria-label="志愿分组">
            {(Object.keys(groupMeta) as GroupKey[]).map((key) => {
              const meta = groupMeta[key];
              const Icon = meta.icon;
              const total = results?.[key].length ?? Number(meta.count);
              return (
                <button
                  className={activeGroup === key ? `is-active ${meta.tone}` : meta.tone}
                  type="button"
                  role="tab"
                  key={key}
                  onClick={() => setActiveGroup(key)}
                >
                  <Icon size={17} />
                  <span>{meta.title}</span>
                  <em>{total}</em>
                </button>
              );
            })}
          </div>

          <div className="result-stage">
            {!results && !isGenerating && (
              <div className="empty-state">
                <div className="empty-icon">
                  <BrainCircuit size={28} />
                </div>
                <h3>等待输入完成</h3>
                <p>提交后将生成冲刺、稳妥、保底三套院校梯度。</p>
              </div>
            )}

            {isGenerating && !results && (
              <div className="progressive-skeleton">
                {Array.from({ length: 6 }).map((_, index) => (
                  <motion.div
                    className="skeleton-card"
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.34 }}
                  />
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {results && (
                <motion.div
                  className="recommendation-list"
                  key={activeGroup}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -8, filter: "blur(5px)" }}
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.075, delayChildren: 0.04 }
                    }
                  }}
                >
                  {activeItems.map((item, index) => (
                    <RecommendationCard
                      item={item}
                      index={index}
                      key={`${activeGroup}-${item.schoolId}`}
                      onOpen={setSelectedRecommendation}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </section>

      <section className="insight-strip" aria-label="模型参数">
        <div>
          <span>Probability</span>
          <strong>1 / (1 + exp(-k · z))</strong>
        </div>
        <ChevronRight size={18} />
        <div>
          <span>Gap</span>
          <strong>student_rank - school_avg_rank</strong>
        </div>
        <ChevronRight size={18} />
        <div>
          <span>Factors</span>
          <strong>major · city · trend · risk</strong>
        </div>
      </section>
      <DetailDrawer item={selectedRecommendation} onClose={() => setSelectedRecommendation(null)} />
    </main>
  );
}
