export interface IntakeFormData {
  agencyType: string;
  missionDescription: string;
  painPoints: string[];
  dataClassification: string;
  complianceRequirements: string[];
  estimatedVolume: string;
}

export interface RecommendedModel {
  name: string;
  modelId: string;
  reasoning: string;
  contextWindow: string;
  strengthForUseCase: string;
}

export interface ArchitectureLayer {
  name: string;
  description: string;
  components: string[];
}

export interface DeploymentArchitecture {
  pathway: string;
  pathwayReasoning: string;
  layers: ArchitectureLayer[];
  securityBoundary: string;
}

export interface McpIntegration {
  name: string;
  purpose: string;
  dataFlow: string;
}

export interface CostEstimate {
  modelCostPerQuery: {
    inputTokens: string;
    outputTokens: string;
    costPerQuery: string;
  };
  monthlyCost: string;
  currentStateCost: string;
  annualSavings: string;
  roiMultiple: string;
}

export interface KeyConsideration {
  type: "risk" | "prerequisite" | "opportunity";
  title: string;
  description: string;
}

export interface ArchitectureRecommendation {
  recommendedModel: RecommendedModel;
  deploymentArchitecture: DeploymentArchitecture;
  mcpIntegrations: McpIntegration[];
  costEstimate: CostEstimate;
  keyConsiderations: KeyConsideration[];
  executiveSummary: string;
}

export interface PerformanceMetrics {
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  timeToFirstTokenMs: number;
  costUsd: number;
}

export interface ScoreDimension {
  score: number;
  explanation: string;
}

export interface ScoreResult {
  scores: {
    accuracy: ScoreDimension;
    completeness: ScoreDimension;
    safety: ScoreDimension;
    tone: ScoreDimension;
  };
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface EvaluationResult {
  scenarioId: string;
  scenarioLabel: string;
  taskPrompt: string;
  response: string;
  modelUsed: string;
  metrics: PerformanceMetrics;
  scores: ScoreResult;
}

export interface RoadmapPhase {
  name: string;
  duration: string;
  objective: string;
  deliverables: string[];
  stakeholders: string[];
  successCriteria: string[];
  risks: string[];
  dependencies: string[];
}

export interface RoiProjection {
  currentAnnualCost: string;
  currentCostBreakdown: string;
  claudeAnnualCost: string;
  claudeCostBreakdown: string;
  netAnnualSavings: string;
  efficiencyGain: string;
  paybackPeriod: string;
}

export interface NextStep {
  action: string;
  owner: string;
  timeline: string;
}

export interface ImplementationRoadmap {
  phases: RoadmapPhase[];
  roiProjection: RoiProjection;
  nextSteps: NextStep[];
  executiveSummary: string;
}

export interface AssessmentResults {
  architecture?: ArchitectureRecommendation;
  evaluation?: EvaluationResult;
  roadmap?: ImplementationRoadmap;
}

export interface AssessmentContextValue {
  intake: IntakeFormData;
  setIntake: (data: IntakeFormData) => void;
  results: AssessmentResults;
  setResults: (results: AssessmentResults) => void;
  completedSteps: number[];
  markStepComplete: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  demoMode: boolean;
  setDemoMode: (mode: boolean) => void;
  isHydrated: boolean;
  resetAssessment: () => void;
}

export interface ComplianceStatus {
  framework: string;
  status: "authorized" | "partial" | "conditional";
  detail: string;
}

export const EMPTY_INTAKE: IntakeFormData = {
  agencyType: "",
  missionDescription: "",
  painPoints: [],
  dataClassification: "",
  complianceRequirements: [],
  estimatedVolume: "",
};
