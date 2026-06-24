export type DataMode = "verified" | "partial" | "sample" | "unavailable";

export type CoverageState = "verified" | "partial" | "sample" | "missing" | "stale";

export type SourceType =
  | "sunshine_college"
  | "sunshine_major"
  | "sunshine_charter"
  | "provincial_exam_authority"
  | "school_admission_office"
  | "manual_verified"
  | "sample";

export type RiskLevel = "high" | "medium" | "low";

export interface DataSource {
  id: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
  year: number;
  province: string;
  updatedAt: string;
  verifiedAt?: string;
  confidence: number;
  notes?: string;
}

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

export interface SourceAwareSchool {
  id: number;
  name: string;
  province: string;
  type: string;
  city: string;
  level: string;
  ownership: string;
  educationType: string;
  featuredMajors: string[];
  advantagedDisciplines: string[];
  campusAndEmployment: string;
  suitableFor: string[];
  dataMode: DataMode;
  dataSources: DataSource[];
}

export interface SourceAwareAdmissionStat {
  schoolId: number;
  year: number;
  province: string;
  major: string;
  minRank: number;
  avgRank: number;
  stdRank: number;
  planCount?: number;
  subjectRequirement?: string;
  dataMode: DataMode;
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

export interface AdmissionImportRow {
  schoolName?: string;
  schoolProvince?: string;
  schoolType?: string;
  schoolLevel?: string;
  city?: string;
  ownership?: string;
  educationType?: string;
  featuredMajors?: string[];
  advantagedDisciplines?: string[];
  campusAndEmployment?: string;
  suitableFor?: string[];
  province?: string;
  major?: string;
  year?: number;
  minRank?: number;
  avgRank?: number;
  stdRank?: number;
  planCount?: number;
  subjectRequirement?: string;
  sourceType?: SourceType;
  sourceName?: string;
  sourceUrl?: string;
  updatedAt?: string;
  verifiedAt?: string;
  confidence?: number;
  notes?: string;
  dataMode?: DataMode;
}

export interface ImportError {
  index: number;
  message: string;
}

export interface ImportResult {
  accepted: number;
  rejected: number;
  errors: ImportError[];
}

export interface AdmissionDataset {
  schools: SourceAwareSchool[];
  stats: SourceAwareAdmissionStat[];
}

export interface DataCoverage {
  totalRecords: number;
  totalSchools: number;
  byMode: Partial<Record<DataMode, number>>;
  bySourceType: Partial<Record<SourceType, number>>;
  provinces: string[];
  latestYear: number | null;
  updatedAt: string | null;
}

export interface ProbabilityExplanation {
  formula: string;
  gap: number;
  z: number;
  factors: {
    base: number;
    majorHeat: number;
    regionalCompetition: number;
    cityPreference: number;
    trend: number;
    riskAdjustment: number;
    final: number;
  };
  narrative: string;
}

export interface AdmissionTrend {
  latestYear: number;
  yearlyAvgRanks: Array<{
    year: number;
    avgRank: number;
    minRank: number;
  }>;
  direction: "rising" | "stable" | "declining";
  volatility: "low" | "medium" | "high";
  summary: string;
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
  slotCategory: "reach" | "match" | "safety";
  schoolId: number;
  schoolName: string;
  majorName: string;
  probability: number;
  dataMode: DataMode;
  reason: string;
  risk: string;
  alternativeSchoolName: string;
}
