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
  ClipboardList,
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
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  cityOptions,
  majorOptions,
  provinceOptions,
  type ReachableSchoolsResponse,
  type Recommendation,
  type RiskPreference,
  type SubjectType,
  type VolunteerPlanResponse
} from "./shared/recommendation";
import {
  buildDecisionExperience,
  type CockpitCardSignal,
  type CockpitSignalLane,
  type CockpitSignals,
  type DecisionExperience,
  type DecisionOrbitItem,
  type GroupKey,
  type OutcomeNebula as OutcomeNebulaState
} from "./shared/decision-experience";

type RequestMode = "schools" | "plan" | null;
type SchoolPoolItem = ReachableSchoolsResponse["items"][number];
type VolunteerPlanItem = VolunteerPlanResponse["items"][number];

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
    shortTitle: string;
    count: string;
    tone: string;
    icon: typeof TrendingUp;
  }
> = {
  reach: { title: "冲刺学校", shortTitle: "冲", count: "6", tone: "reach", icon: TrendingUp },
  match: { title: "稳妥学校", shortTitle: "稳", count: "6", tone: "match", icon: Radar },
  safety: { title: "保底学校", shortTitle: "保", count: "4", tone: "safety", icon: ShieldCheck }
};

const schoolThoughtSteps = ["读取学生画像", "生成可达学校池", "准备校内专业预览"];
const planThoughtSteps = ["读取已选学校专业", "补齐冲稳保梯度", "生成 6/6/4 志愿表"];

const initialForm: FormState = {
  score: "642",
  rank: "2600",
  province: "北京",
  subject: "physics",
  cityPreference: 0.72,
  preferredCities: ["北京", "上海", "杭州", "南京"],
  majors: [],
  riskPreference: "balanced"
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function cnPercent(probability: number) {
  return `${Math.round(probability * 100)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("zh-CN");
}

function dataModeLabel(mode: Recommendation["dataMode"]) {
  const labels = {
    verified: "真实核验",
    partial: "部分真实",
    sample: "样例数据",
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

function heatLabel(level: SchoolPoolItem["eligibleMajors"][number]["heatLevel"]) {
  const labels = {
    high: "热门",
    medium: "中热",
    low: "相对冷门"
  };
  return labels[level] ?? "未知热度";
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

export function groupReachableSchools<T extends { category: GroupKey }>(items: T[]) {
  return items.reduce<Record<GroupKey, T[]>>(
    (groups, item) => {
      groups[item.category].push(item);
      return groups;
    },
    { reach: [], match: [], safety: [] }
  );
}

export function toggleUniqueSelection<T extends string | number>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function buildSelectedMajorKey(schoolId: number, majorName: string) {
  return `${schoolId}:${majorName}`;
}

export function removeSelectedMajorsForSchool(keys: string[], schoolId: number) {
  return keys.filter((key) => readSelectedMajorKey(key).schoolId !== schoolId);
}

function readSelectedMajorKey(key: string) {
  const [schoolId, ...majorParts] = key.split(":");
  return {
    schoolId: Number(schoolId),
    majorName: majorParts.join(":")
  };
}

export function deriveSelectedMajorNames(keys: string[]) {
  return [...new Set(keys.map((key) => readSelectedMajorKey(key).majorName).filter(Boolean))];
}

function buildProfilePayload(form: FormState) {
  return {
    score: form.score ? Number(form.score) : undefined,
    rank: form.rank ? Number(form.rank) : undefined,
    province: form.province,
    subject: form.subject,
    cityPreference: form.cityPreference,
    preferredCities: form.preferredCities,
    majors: form.majors,
    riskPreference: form.riskPreference
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string; details?: Array<{ message?: string }> };
    const details = body.details?.map((item) => item.message).filter(Boolean).join("；");
    return details || body.error || fallback;
  } catch {
    return fallback;
  }
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

function MajorGuideGateway({
  selectedMajors,
  onPick
}: {
  selectedMajors: string[];
  onPick: (major: string) => void;
}) {
  const gatewayMajors = ["计算机科学与技术", "临床医学", "法学", "机械设计制造及其自动化"].filter((major) =>
    majorOptions.includes(major)
  );

  return (
    <div className="major-gateway">
      <div className="major-gateway-head">
        <div className="major-gateway-icon">
          <BookOpen size={17} />
        </div>
        <div>
          <span>National Major Index</span>
          <strong>全国专业解释库</strong>
        </div>
        <em>{majorOptions.length} 个方向</em>
      </div>
      <div className="major-gateway-actions">
        {gatewayMajors.map((major) => (
          <button
            className={selectedMajors.includes(major) ? "is-selected" : ""}
            type="button"
            key={major}
            onClick={() => onPick(major)}
          >
            {major}
          </button>
        ))}
      </div>
    </div>
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

function FlowSteps({
  hasPool,
  hasSelection,
  hasPlan,
  requestMode
}: {
  hasPool: boolean;
  hasSelection: boolean;
  hasPlan: boolean;
  requestMode: RequestMode;
}) {
  const steps = [
    { title: "输入画像", hint: "分数 / 位次 / 城市", done: hasPool, active: !hasPool || requestMode === "schools" },
    { title: "生成学校池", hint: "冲稳保可达梯度", done: hasPool, active: hasPool && !hasSelection },
    { title: "选择学校专业", hint: "校内专业解释", done: hasSelection, active: hasPool && !hasPlan },
    { title: "生成志愿表", hint: "6 / 6 / 4", done: hasPlan, active: requestMode === "plan" || hasPlan }
  ];

  return (
    <section className="flow-rail" aria-label="填报决策流程">
      {steps.map((step, index) => (
        <motion.div
          className={`flow-step ${step.done ? "is-done" : ""} ${step.active ? "is-active" : ""}`}
          key={step.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.34 }}
        >
          <span>{index + 1}</span>
          <div>
            <strong>{step.title}</strong>
            <p>{step.hint}</p>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

function ThoughtPanel({
  requestMode,
  stepIndex,
  hasPool,
  hasPlan
}: {
  requestMode: RequestMode;
  stepIndex: number;
  hasPool: boolean;
  hasPlan: boolean;
}) {
  const isGenerating = requestMode !== null;
  const steps = requestMode === "plan" ? planThoughtSteps : schoolThoughtSteps;
  const idleText = hasPlan ? "志愿表已生成，可继续调整学校或专业" : hasPool ? "学校池已生成，继续查看校内专业" : "等待生成学校池";

  return (
    <div className={`thought-panel ${isGenerating ? "is-generating" : ""}`}>
      <div className="analysis-beam" aria-hidden="true" />
      <div className="thought-core">
        <div className={`thinking-mark ${isGenerating ? "is-thinking" : ""}`}>
          <BrainCircuit size={20} />
        </div>
        <div>
          <span>AI Decision Engine</span>
          <strong>{isGenerating ? steps[stepIndex] : idleText}</strong>
        </div>
      </div>
      <div className="thought-steps">
        {steps.map((step, index) => (
          <span className={index <= stepIndex && isGenerating ? "is-active" : ""} key={step}>
            {step}
          </span>
        ))}
      </div>
      <div className="analysis-pipeline" aria-hidden="true">
        {steps.map((step, index) => (
          <i className={index <= stepIndex && isGenerating ? "is-active" : ""} key={step}>
            <span />
          </i>
        ))}
      </div>
    </div>
  );
}

function SignalLane({ lane }: { lane: CockpitSignalLane }) {
  const isHistory = lane.key === "historySignal";

  return (
    <article className={`signal-lane ${lane.key}`}>
      <div className="signal-lane-head">
        <span>{lane.title}</span>
        <strong>{lane.summary}</strong>
      </div>
      <div className="signal-bars">
        {lane.items.length === 0 ? (
          <p>{lane.emptyText}</p>
        ) : (
          lane.items.map((item) => {
            const width = item.value > 0 ? Math.max(item.share, 6) : 0;
            return (
              <div className={`signal-item ${item.tone ?? ""}`} key={`${lane.key}-${item.label}`}>
                <div className="signal-row">
                  <span>{item.label}</span>
                  <strong>
                    {item.value}
                    {isHistory ? "%" : ""}
                  </strong>
                </div>
                <div className="signal-track" aria-hidden="true">
                  <span style={{ width: `${width}%` }} />
                </div>
                {item.detail && <em>{item.detail}</em>}
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function DecisionCockpit({ signals, requestMode }: { signals: CockpitSignals; requestMode: RequestMode }) {
  const lanes = [signals.riskGradient, signals.cityDistribution, signals.majorDistribution, signals.historySignal];
  const cardIcons: Record<CockpitCardSignal["key"], typeof Layers3> = {
    candidateSchools: Layers3,
    selection: CheckCircle2,
    dataConfidence: Database,
    volunteerPlan: ClipboardList
  };

  return (
    <motion.section
      className={`decision-cockpit phase-${signals.phase} ${requestMode ? "is-analyzing" : ""}`}
      aria-label="AI 决策驾驶舱"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cockpit-shell-line" aria-hidden="true" />
      <div className="cockpit-header">
        <div>
          <span className="eyebrow">
            <BrainCircuit size={15} />
            AI Decision Cockpit
          </span>
          <h2>决策驾驶舱</h2>
        </div>
        <div className="cockpit-status">
          <span>{signals.statusLabel}</span>
          <p>{signals.statusDetail}</p>
        </div>
      </div>

      <div className="cockpit-card-grid">
        {signals.cards.map((card, index) => {
          const Icon = cardIcons[card.key];
          return (
            <motion.article
              className={`cockpit-card ${card.tone}`}
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.045, duration: 0.32 }}
            >
              <div className="cockpit-card-head">
                <Icon size={16} />
                <span>{card.label}</span>
              </div>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </motion.article>
          );
        })}
      </div>

      <div className="cockpit-lanes">
        {lanes.map((lane, index) => (
          <motion.div
            key={lane.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + index * 0.05, duration: 0.34 }}
          >
            <SignalLane lane={lane} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function orbitStyle(item: DecisionOrbitItem): CSSProperties {
  return {
    "--angle": `${item.angle}deg`,
    "--counter-angle": `${-item.angle}deg`,
    "--radius": `${item.radius * 2.08}px`,
    "--node-size": `${item.size + 22}px`,
    "--z": item.zIndex
  } as CSSProperties;
}

function nebulaStyle(node: OutcomeNebulaState["nodes"][number]): CSSProperties {
  return {
    "--angle": `${node.angle}deg`,
    "--counter-angle": `${-node.angle}deg`,
    "--radius": `${node.radius * 1.86}px`
  } as CSSProperties;
}

function DecisionUniverseHero({
  experience,
  pool,
  selectedSchoolCount,
  selectedMajorCount,
  requestMode,
  onOpen
}: {
  experience: DecisionExperience;
  pool: ReachableSchoolsResponse | null;
  selectedSchoolCount: number;
  selectedMajorCount: number;
  requestMode: RequestMode;
  onOpen: (item: SchoolPoolItem) => void;
}) {
  const schoolById = useMemo(
    () => new Map((pool?.items ?? []).map((item) => [item.schoolId, item] as const)),
    [pool]
  );
  const phaseLabel: Record<DecisionExperience["phase"], string> = {
    profile: "画像输入",
    school_pool: "学校池",
    major_selection: "校内专业",
    volunteer_plan: "志愿表"
  };
  const isAnalyzing = requestMode !== null;

  return (
    <motion.section
      className={`decision-universe phase-${experience.phase} ${isAnalyzing ? "is-analyzing" : ""}`}
      aria-label="学校优先决策层"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="universe-copy">
        <span className="eyebrow">
          <Layers3 size={15} />
          Decision Layer
        </span>
        <h2>学校宇宙</h2>
        <p>{experience.cockpit.statusDetail}</p>
        <div className="universe-metrics">
          <div>
            <span>当前阶段</span>
            <strong>{phaseLabel[experience.phase]}</strong>
          </div>
          <div>
            <span>候选学校</span>
            <strong>{pool?.summary.total ?? 0}</strong>
          </div>
          <div>
            <span>已选学校 / 专业</span>
            <strong>
              {selectedSchoolCount} / {selectedMajorCount}
            </strong>
          </div>
        </div>
      </div>

      <div className="universe-stage" aria-label="学校池轨道">
        <div className="universe-core">
          <BrainCircuit size={23} />
          <strong>{pool ? dataModeLabel(pool.summary.dataMode) : "等待画像"}</strong>
          <span>{pool ? `冲 ${pool.summary.reach} · 稳 ${pool.summary.match} · 保 ${pool.summary.safety}` : "School first"}</span>
        </div>
        {experience.universe.layers.map((layer) => (
          <div className={`orbit-ring ${layer.key}`} key={layer.key}>
            <span>{layer.label}</span>
            <em>{layer.count}</em>
          </div>
        ))}
        {experience.universe.items.length === 0
          ? Array.from({ length: 9 }).map((_, index) => (
              <i
                className="universe-ghost-node"
                style={
                  {
                    "--angle": `${index * 40 - 90}deg`,
                    "--counter-angle": `${-(index * 40 - 90)}deg`,
                    "--radius": `${(38 + (index % 3) * 16) * 2.08}px`
                  } as CSSProperties
                }
                key={index}
              />
            ))
          : experience.universe.items.map((item) => {
              const school = schoolById.get(item.schoolId);
              return (
                <button
                  className={`universe-node ${item.category} risk-${item.riskLevel}`}
                  style={orbitStyle(item)}
                  type="button"
                  key={item.id}
                  onClick={() => school && onOpen(school)}
                  aria-label={`查看 ${item.schoolName}`}
                >
                  <span>{item.percentage}</span>
                  <em>{item.schoolName}</em>
                </button>
              );
            })}
      </div>

      <div className="universe-layer-list">
        {experience.universe.layers.map((layer) => (
          <div className={layer.key} key={layer.key}>
            <span>{layer.label}</span>
            <strong>{layer.count}</strong>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function OutcomeNebula({ nebula }: { nebula: OutcomeNebulaState }) {
  return (
    <section className={`outcome-nebula ${nebula.status}`} aria-label="相似位次聚合去向">
      <div className="outcome-nebula-head">
        <div>
          <span>Similar Rank Outcomes</span>
          <h3>{nebula.title}</h3>
          <p>
            {nebula.rankBandLabel} · {nebula.yearsLabel} · {dataModeLabel(nebula.dataMode)}
          </p>
        </div>
        <strong>{nebula.nodes.length || "暂无"}</strong>
      </div>

      <div className="nebula-map">
        <div className="nebula-core">
          <Radar size={18} />
          <span>聚合记录</span>
        </div>
        {nebula.status === "empty" ? (
          <p className="nebula-empty">{nebula.emptyMessage}</p>
        ) : (
          nebula.nodes.map((node) => (
            <article className={`nebula-node ${node.intensity}`} style={nebulaStyle(node)} key={node.id}>
              <span>{node.percentage}</span>
              <strong>{node.schoolName}</strong>
              <em>{node.majorName}</em>
              <small>
                {node.intensityLabel} · {node.city}
              </small>
            </article>
          ))
        )}
      </div>

      <div className="nebula-evidence">
        {nebula.nodes.slice(0, 4).map((node) => (
          <div key={`${node.id}-evidence`}>
            <span>{node.label}</span>
            <strong>{node.percentage}</strong>
            <em>{node.detail}</em>
          </div>
        ))}
      </div>
      <p className="privacy-note">{nebula.privacyNote}</p>
    </section>
  );
}

function DistributionChips({ items, emptyText }: { items: Array<[string, number]>; emptyText: string }) {
  if (items.length === 0) return <p>{emptyText}</p>;
  return (
    <div className="distribution-chips">
      {items.map(([label, count]) => (
        <span key={label}>
          {label}
          <em>{count}</em>
        </span>
      ))}
    </div>
  );
}

function SchoolPoolOverview({ pool, nebula }: { pool: ReachableSchoolsResponse; nebula: OutcomeNebulaState }) {
  const overview = useMemo(() => {
    const countBy = <Key extends string>(items: SchoolPoolItem[], getKey: (item: SchoolPoolItem) => Key) =>
      items.reduce<Record<Key, number>>((acc, item) => {
        const key = getKey(item);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {} as Record<Key, number>);

    const risk = countBy(pool.items, (item) => item.riskLevel);
    const cities = Object.entries(countBy(pool.items, (item) => item.city)).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const majors = Object.entries(
      pool.items.reduce<Record<string, number>>((acc, item) => {
        item.eligibleMajors.slice(0, 3).forEach((major) => {
          acc[major.majorName] = (acc[major.majorName] ?? 0) + 1;
        });
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { risk, cities, majors };
  }, [pool]);

  return (
    <div className="school-pool-overview">
      <div className="data-notice">
        <Database size={17} />
        <p>{pool.dataNotice}</p>
      </div>

      <div className="overview-grid">
        <div>
          <span>学校池总览</span>
          <strong>{pool.summary.total}</strong>
          <p>
            冲 {pool.summary.reach} · 稳 {pool.summary.match} · 保 {pool.summary.safety}
          </p>
        </div>
        <div>
          <span>风险分布</span>
          <strong>
            高 {overview.risk.high ?? 0} · 中 {overview.risk.medium ?? 0} · 低 {overview.risk.low ?? 0}
          </strong>
          <p>由学校可达概率、rankGap 与趋势共同判断</p>
        </div>
        <div>
          <span>城市分布</span>
          <DistributionChips items={overview.cities} emptyText="暂无城市分布" />
        </div>
        <div>
          <span>专业方向分布</span>
          <DistributionChips items={overview.majors} emptyText="暂无专业方向" />
        </div>
      </div>

      <OutcomeNebula nebula={nebula} />
    </div>
  );
}

function SchoolCard({
  item,
  index,
  onOpen,
  isSelected
}: {
  item: SchoolPoolItem;
  index: number;
  onOpen: (item: SchoolPoolItem) => void;
  isSelected: boolean;
}) {
  const tilt = useCardTilt();
  const previewMajors = item.eligibleMajors.slice(0, 3);

  return (
    <motion.article
      className={`recommendation-card ${item.category} ${isSelected ? "is-selected-school" : ""}`}
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
          <span>录取</span>
        </div>
      </div>
      <div className="source-row">
        <span className={`source-chip ${item.dataMode}`}>{dataModeLabel(item.dataMode)}</span>
        <span>{groupMeta[item.category].title}</span>
        <span>rankGap {formatNumber(item.rankGap)}</span>
        <span className={`risk-chip ${item.riskLevel}`}>{riskLevelLabel(item.riskLevel)}</span>
        {isSelected && <span className="selected-chip">已选学校</span>}
      </div>
      <div className="major-preview">
        <span>
          <GraduationCap size={15} />
          该校可选专业预览
        </span>
        <div>
          {previewMajors.map((major) => (
            <em key={major.majorName}>{major.majorName}</em>
          ))}
        </div>
      </div>
      <p className="reason">{item.reason}</p>
      <button className="detail-link" type="button" onClick={() => onOpen(item)}>
        查看该校专业
        <ChevronRight size={15} />
      </button>
    </motion.article>
  );
}

function DetailDrawer({
  item,
  selectedSchoolIds,
  selectedMajorKeys,
  onToggleSchool,
  onToggleMajor,
  onClose
}: {
  item: SchoolPoolItem | null;
  selectedSchoolIds: number[];
  selectedMajorKeys: string[];
  onToggleSchool: (schoolId: number) => void;
  onToggleMajor: (schoolId: number, majorName: string) => void;
  onClose: () => void;
}) {
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
                <span>School First Detail</span>
                <h2>{item.schoolName}</h2>
                <p>
                  {item.city} · {item.province} · {item.type}
                </p>
              </div>
              <button className="ghost-icon" type="button" onClick={onClose} aria-label="关闭详情">
                <X size={18} />
              </button>
            </div>

            <div className="drawer-actions">
              <button
                className={`selection-action ${selectedSchoolIds.includes(item.schoolId) ? "is-selected" : ""}`}
                type="button"
                onClick={() => onToggleSchool(item.schoolId)}
              >
                <CheckCircle2 size={17} />
                {selectedSchoolIds.includes(item.schoolId) ? "已选择该学校" : "选择该学校"}
              </button>
              <span>选择学校和校内专业后，可生成 6/6/4 志愿表。</span>
            </div>

            <div className="drawer-hero">
              <div>
                <span>录取概率</span>
                <strong>{cnPercent(item.schoolReachability.probability)}</strong>
              </div>
              <div>
                <span>rankGap</span>
                <strong>{formatNumber(item.schoolReachability.rankGap)}</strong>
              </div>
              <div>
                <span>风险等级</span>
                <strong>{riskLevelLabel(item.riskLevel)}</strong>
              </div>
            </div>

            <section className="detail-section">
              <h3>
                <Building2 size={18} />
                学校画像
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
                可达概率与趋势
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
              <div className="insight-note">
                gap {formatNumber(item.schoolReachability.rankGap)} · z {item.schoolReachability.zScore} ·{" "}
                {item.probabilityExplanation.formula}
              </div>
            </section>

            <section className="detail-section">
              <h3>
                <BookOpen size={18} />
                该校可选专业
              </h3>
              <div className="eligible-major-list">
                {item.eligibleMajors.map((major) => {
                  const key = buildSelectedMajorKey(item.schoolId, major.majorName);
                  const selected = selectedMajorKeys.includes(key);
                  return (
                    <article className={`eligible-major-card ${selected ? "is-selected" : ""}`} key={major.majorName}>
                      <div className="major-card-head">
                        <div>
                          <strong>{major.majorName}</strong>
                          <span>
                            {heatLabel(major.heatLevel)} · 匹配 {cnPercent(major.fitProbability)}
                          </span>
                        </div>
                        <button type="button" onClick={() => onToggleMajor(item.schoolId, major.majorName)}>
                          {selected ? "取消专业" : "选择专业"}
                        </button>
                      </div>
                      <p>{major.plainLanguage}</p>
                      <div className="career-summary">
                        <BriefcaseBusiness size={15} />
                        <span>{major.careerSummary}</span>
                      </div>
                      <div className="major-risk">
                        <span>风险提醒</span>
                        <p>{major.risk}</p>
                      </div>
                      <div className="source-row">
                        <span className={`source-chip ${major.dataMode}`}>{dataModeLabel(major.dataMode)}</span>
                        {major.rankGap !== undefined && <span>专业 rankGap {formatNumber(major.rankGap)}</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="detail-section">
              <h3>
                <FileText size={18} />
                录取证据与来源
              </h3>
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
                <Compass size={18} />
                决策提醒
              </h3>
              <p>{item.risk}</p>
              <div className="insight-note">
                替代学校：{item.alternative.schoolName}，参考概率 {cnPercent(item.alternative.probability)}。
              </div>
            </section>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlanPanel({
  plan,
  requestMode,
  selectedSchoolCount,
  selectedMajorCount,
  onGenerate,
  error
}: {
  plan: VolunteerPlanResponse | null;
  requestMode: RequestMode;
  selectedSchoolCount: number;
  selectedMajorCount: number;
  onGenerate: () => void;
  error: string;
}) {
  const groupedPlan = useMemo(
    () =>
      (plan?.items ?? []).reduce<Record<GroupKey, VolunteerPlanItem[]>>(
        (groups, item) => {
          groups[item.slotCategory].push(item);
          return groups;
        },
        { reach: [], match: [], safety: [] }
      ),
    [plan]
  );
  const isPlanning = requestMode === "plan";

  return (
    <section className="plan-panel">
      <div className="plan-head">
        <div>
          <span>Volunteer Plan</span>
          <h3>生成 6/6/4 志愿表</h3>
          <p>
            已选 {selectedSchoolCount} 所学校 · {selectedMajorCount} 个校内专业
          </p>
        </div>
        <button className="secondary-action" type="button" onClick={onGenerate} disabled={isPlanning}>
          <ClipboardList size={17} />
          <span>{isPlanning ? "生成中" : "生成 6/6/4 志愿表"}</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isPlanning && (
        <div className="plan-skeleton">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="skeleton-card compact" key={index} />
          ))}
        </div>
      )}

      {plan && !isPlanning && (
        <div className="volunteer-plan">
          <div className="plan-summary">
            <span>
              冲 {plan.summary.reach} · 稳 {plan.summary.match} · 保 {plan.summary.safety}
            </span>
            <p>{plan.dataNotice}</p>
          </div>
          {(Object.keys(groupMeta) as GroupKey[]).map((key) => (
            <section className="plan-group" key={key}>
              <div className="plan-group-title">
                <strong>
                  {groupMeta[key].title} · {groupedPlan[key].length}
                </strong>
                <span>{groupMeta[key].count} 条目标配额</span>
              </div>
              <div className="plan-list">
                {groupedPlan[key].map((item) => (
                  <PlanCard item={item} key={item.id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function PlanCard({ item }: { item: VolunteerPlanItem }) {
  return (
    <article className={`plan-card ${item.slotCategory}`}>
      <div className="plan-card-top">
        <span>{groupMeta[item.slotCategory].shortTitle}</span>
        <strong>{cnPercent(item.probability)}</strong>
      </div>
      <div className="plan-model-badge">真实概率梯度 · {groupMeta[item.category].title}</div>
      <h4>{item.schoolName}</h4>
      <p className="plan-major">{item.majorName}</p>
      <p>{item.reason}</p>
      <div className="major-risk">
        <span>风险</span>
        <p>{item.risk}</p>
      </div>
      <div className="alternative-row">
        <span>替代学校</span>
        <strong>{item.alternativeSchoolName}</strong>
      </div>
    </article>
  );
}

export function App() {
  const [booting, setBooting] = useState(true);
  const [form, setForm] = useState<FormState>(initialForm);
  const [schoolPool, setSchoolPool] = useState<ReachableSchoolsResponse | null>(null);
  const [plan, setPlan] = useState<VolunteerPlanResponse | null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupKey>("reach");
  const [requestMode, setRequestMode] = useState<RequestMode>(null);
  const [thoughtStep, setThoughtStep] = useState(0);
  const [schoolError, setSchoolError] = useState("");
  const [planError, setPlanError] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<SchoolPoolItem | null>(null);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<number[]>([]);
  const [selectedMajorKeys, setSelectedMajorKeys] = useState<string[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setBooting(false), 760);
    return () => window.clearTimeout(id);
  }, []);

  const groupedSchools = useMemo(() => groupReachableSchools(schoolPool?.items ?? []), [schoolPool]);
  const activeItems = useMemo(() => groupedSchools[activeGroup], [activeGroup, groupedSchools]);
  const decisionExperience = useMemo(
    () =>
      buildDecisionExperience({
        pool: schoolPool,
        selectedSchoolCount: selectedSchoolIds.length,
        selectedMajorCount: selectedMajorKeys.length,
        plan
      }),
    [schoolPool, selectedSchoolIds.length, selectedMajorKeys.length, plan]
  );
  const cockpitSignals = decisionExperience.cockpit;
  const filteredMajorOptions = useMemo(() => {
    const query = majorQuery.trim().toLowerCase();
    if (!query) return majorOptions;
    return majorOptions.filter((major) => major.toLowerCase().includes(query));
  }, [majorQuery]);
  const selectedMajorNames = useMemo(() => deriveSelectedMajorNames(selectedMajorKeys), [selectedMajorKeys]);

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
      return { ...current, [key]: toggleUniqueSelection(values, value) };
    });
  }

  function toggleSchoolSelection(schoolId: number) {
    setSelectedSchoolIds((current) => {
      const isSelected = current.includes(schoolId);
      if (isSelected) {
        setSelectedMajorKeys((majorKeys) => removeSelectedMajorsForSchool(majorKeys, schoolId));
      }
      return toggleUniqueSelection(current, schoolId);
    });
  }

  function toggleMajorSelection(schoolId: number, majorName: string) {
    const key = buildSelectedMajorKey(schoolId, majorName);
    setSelectedMajorKeys((current) => toggleUniqueSelection(current, key));
    if (!selectedMajorKeys.includes(key)) {
      setSelectedSchoolIds((current) => (current.includes(schoolId) ? current : [...current, schoolId]));
    }
  }

  function resetAll() {
    setForm(initialForm);
    setSchoolPool(null);
    setPlan(null);
    setSelectedSchool(null);
    setSelectedSchoolIds([]);
    setSelectedMajorKeys([]);
    setSchoolError("");
    setPlanError("");
    setActiveGroup("reach");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSchoolError("");
    setPlanError("");
    setSchoolPool(null);
    setPlan(null);
    setSelectedSchool(null);
    setSelectedSchoolIds([]);
    setSelectedMajorKeys([]);
    setActiveGroup("reach");
    setRequestMode("schools");
    setThoughtStep(0);

    const stepTimers = [
      window.setTimeout(() => setThoughtStep(1), 560),
      window.setTimeout(() => setThoughtStep(2), 1120)
    ];

    try {
      const [response] = await Promise.all([
        fetch("/schools/reachable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildProfilePayload(form))
        }),
        wait(1500)
      ]);

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "学校池请求参数未通过校验"));
      }

      const data = (await response.json()) as ReachableSchoolsResponse;
      setSchoolPool(data);
    } catch (requestError) {
      setSchoolError(requestError instanceof Error ? requestError.message : "生成学校池失败，请稍后重试");
    } finally {
      stepTimers.forEach((timer) => window.clearTimeout(timer));
      setThoughtStep(2);
      window.setTimeout(() => setRequestMode(null), 340);
    }
  }

  async function generatePlan() {
    setPlanError("");
    setRequestMode("plan");
    setThoughtStep(0);

    const stepTimers = [
      window.setTimeout(() => setThoughtStep(1), 520),
      window.setTimeout(() => setThoughtStep(2), 1040)
    ];

    try {
      const [response] = await Promise.all([
        fetch("/plans/volunteer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...buildProfilePayload(form),
            selectedSchoolIds,
            selectedMajors: selectedMajorNames
          })
        }),
        wait(1320)
      ]);

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "志愿表请求参数未通过校验"));
      }

      const data = (await response.json()) as VolunteerPlanResponse;
      setPlan(data);
    } catch (requestError) {
      setPlanError(requestError instanceof Error ? requestError.message : "生成志愿表失败，请稍后重试");
    } finally {
      stepTimers.forEach((timer) => window.clearTimeout(timer));
      setThoughtStep(2);
      window.setTimeout(() => setRequestMode(null), 320);
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
          <h1>先看学校，再定专业</h1>
        </div>
        <div className="header-metrics">
          <span>School-first</span>
          <strong>学校池 · 校内专业 · 6/6/4</strong>
        </div>
      </section>

      <section className="trust-banner">
        <div>
          <Database size={20} />
          <div>
            <span>Data Readiness</span>
            <p>
              {schoolPool?.dataNotice ??
                "当前流程会先生成学校可达池，再进入校内专业解释与志愿表。样例数据会明确标注，正式填报必须复核各省考试院、阳光高考和学校招生网。"}
            </p>
          </div>
        </div>
        <a href="https://gaokao.chsi.com.cn/" target="_blank" rel="noreferrer">
          阳光高考
          <ExternalLink size={14} />
        </a>
      </section>

      <FlowSteps
        hasPool={Boolean(schoolPool)}
        hasSelection={selectedSchoolIds.length > 0 || selectedMajorKeys.length > 0}
        hasPlan={Boolean(plan)}
        requestMode={requestMode}
      />

      <DecisionUniverseHero
        experience={decisionExperience}
        pool={schoolPool}
        selectedSchoolCount={selectedSchoolIds.length}
        selectedMajorCount={selectedMajorKeys.length}
        requestMode={requestMode}
        onOpen={setSelectedSchool}
      />

      <DecisionCockpit signals={cockpitSignals} requestMode={requestMode} />

      <section className="hero-grid">
        <form className="panel control-panel" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <span>Student Profile</span>
              <h2>输入画像</h2>
              <p className="panel-subtitle">专业偏好可以先留空，先看可达学校，再看每所学校里能选什么专业。</p>
            </div>
            <button className="ghost-icon" type="button" onClick={resetAll} aria-label="恢复示例">
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
            <span>专业偏好 · 可选填 {majorOptions.length}</span>
            <input
              className="mini-search"
              value={majorQuery}
              onChange={(event) => setMajorQuery(event.target.value)}
              placeholder="可留空；也可搜索法学、临床医学、机械"
            />
            <div className="selected-major-strip">
              {form.majors.length === 0
                ? "未选择专业：将先按学校可达性生成学校池"
                : `已选 ${form.majors.length} 个：${form.majors.slice(0, 4).join("、")}`}
            </div>
            <MajorGuideGateway selectedMajors={form.majors} onPick={(major) => toggleArrayValue("majors", major)} />
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

          {schoolError && <div className="error-banner">{schoolError}</div>}

          <button className="primary-action" type="submit" disabled={requestMode !== null}>
            <Search size={18} />
            <span>{requestMode === "schools" ? "生成中" : "生成学校池"}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <section className="panel result-panel">
          <div className="panel-heading results-heading">
            <div>
              <span>School Pool</span>
              <h2>学校可达梯度</h2>
            </div>
            <div className="matrix-count">
              <Layers3 size={18} />
              冲 6 · 稳 6 · 保 4
            </div>
          </div>

          <ThoughtPanel
            requestMode={requestMode}
            stepIndex={thoughtStep}
            hasPool={Boolean(schoolPool)}
            hasPlan={Boolean(plan)}
          />

          {schoolPool && <SchoolPoolOverview pool={schoolPool} nebula={decisionExperience.outcomeNebula} />}

          <div className="group-tabs" role="tablist" aria-label="学校可达梯度">
            {(Object.keys(groupMeta) as GroupKey[]).map((key) => {
              const meta = groupMeta[key];
              const Icon = meta.icon;
              const total = groupedSchools[key].length || Number(meta.count);
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
            {!schoolPool && requestMode !== "schools" && (
              <div className="empty-state">
                <div className="empty-icon">
                  <BrainCircuit size={28} />
                </div>
                <h3>先生成学校池</h3>
                <p>提交画像后，会先展示可能可达的学校，再进入每所学校的可选专业。</p>
              </div>
            )}

            {requestMode === "schools" && !schoolPool && (
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
              {schoolPool && (
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
                    <SchoolCard
                      item={item}
                      index={index}
                      key={`${activeGroup}-${item.schoolId}`}
                      onOpen={setSelectedSchool}
                      isSelected={selectedSchoolIds.includes(item.schoolId)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {schoolPool && (
            <PlanPanel
              plan={plan}
              requestMode={requestMode}
              selectedSchoolCount={selectedSchoolIds.length}
              selectedMajorCount={selectedMajorKeys.length}
              onGenerate={generatePlan}
              error={planError}
            />
          )}
        </section>
      </section>

      <section className="insight-strip" aria-label="模型参数">
        <div>
          <span>Step 1</span>
          <strong>画像输入</strong>
        </div>
        <ChevronRight size={18} />
        <div>
          <span>Step 2</span>
          <strong>学校可达池</strong>
        </div>
        <ChevronRight size={18} />
        <div>
          <span>Step 3</span>
          <strong>校内专业与志愿表</strong>
        </div>
      </section>
      <DetailDrawer
        item={selectedSchool}
        selectedSchoolIds={selectedSchoolIds}
        selectedMajorKeys={selectedMajorKeys}
        onToggleSchool={toggleSchoolSelection}
        onToggleMajor={toggleMajorSelection}
        onClose={() => setSelectedSchool(null)}
      />
    </main>
  );
}
