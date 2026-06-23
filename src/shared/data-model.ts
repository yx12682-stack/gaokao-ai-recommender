export type DataMode = "verified" | "partial" | "sample" | "unavailable";

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

