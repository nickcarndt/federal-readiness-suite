import { z } from "zod";
import {
  AGENCY_TYPES,
  COMPLIANCE_REQUIREMENTS,
  DATA_CLASSIFICATIONS,
  PAIN_POINTS,
  VOLUME_OPTIONS,
  ALLOWED_DATA_CLASSIFICATIONS,
} from "@/lib/constants";

const agencyTypeValues = AGENCY_TYPES.map((a) => a.value) as [
  (typeof AGENCY_TYPES)[number]["value"],
  ...(typeof AGENCY_TYPES)[number]["value"][],
];

const volumeValues = VOLUME_OPTIONS.map((v) => v.value) as [
  (typeof VOLUME_OPTIONS)[number]["value"],
  ...(typeof VOLUME_OPTIONS)[number]["value"][],
];

const allowedClassificationValues = ALLOWED_DATA_CLASSIFICATIONS.map(
  (c) => c.value
) as [
  (typeof ALLOWED_DATA_CLASSIFICATIONS)[number]["value"],
  ...(typeof ALLOWED_DATA_CLASSIFICATIONS)[number]["value"][],
];

const allClassificationValues = DATA_CLASSIFICATIONS.map((c) => c.value) as [
  (typeof DATA_CLASSIFICATIONS)[number]["value"],
  ...(typeof DATA_CLASSIFICATIONS)[number]["value"][],
];

const painPointValues = PAIN_POINTS.map((p) => p.id) as [
  (typeof PAIN_POINTS)[number]["id"],
  ...(typeof PAIN_POINTS)[number]["id"][],
];

const complianceValues = COMPLIANCE_REQUIREMENTS.map((c) => c.id) as [
  (typeof COMPLIANCE_REQUIREMENTS)[number]["id"],
  ...(typeof COMPLIANCE_REQUIREMENTS)[number]["id"][],
];

/** Max chars for free-text fields that reach the LLM (cost fence). */
export const MAX_MISSION_CHARS = 500;
export const MAX_EVAL_PROMPT_CHARS = 32_000;
export const MAX_EVAL_RESPONSE_CHARS = 48_000;

export const IntakeSchema = z.object({
  agencyType: z.enum(agencyTypeValues),
  missionDescription: z
    .string()
    .min(20, "Mission description must be at least 20 characters")
    .max(MAX_MISSION_CHARS),
  painPoints: z.array(z.enum(painPointValues)),
  dataClassification: z.enum(allowedClassificationValues, {
    error: "Secret and Top Secret / SCI are not supported in this demo",
  }),
  complianceRequirements: z.array(z.enum(complianceValues)),
  estimatedVolume: z.enum(volumeValues),
});

export type IntakeSchemaType = z.infer<typeof IntakeSchema>;

/** Client may collect any classification; API only accepts allowed ones. */
export const IntakeFormClassificationSchema = z.enum(allClassificationValues);

export const EvaluateSchema = z.object({
  scenario: z.string().min(1).max(128),
  customPrompt: z.string().max(MAX_EVAL_PROMPT_CHARS).optional(),
  model: z.enum(["sonnet", "haiku"]),
});

export const ScoreSchema = z.object({
  taskPrompt: z.string().min(1).max(MAX_EVAL_PROMPT_CHARS),
  response: z.string().min(1).max(MAX_EVAL_RESPONSE_CHARS),
});

export type EvaluateSchemaType = z.infer<typeof EvaluateSchema>;
export type ScoreSchemaType = z.infer<typeof ScoreSchema>;

export const RoadmapRequestSchema = z.object({
  intake: IntakeSchema,
  architecture: z
    .object({
      recommendedModel: z.string(),
      deploymentPathway: z.string(),
      monthlyCost: z.string(),
    })
    .nullable()
    .optional(),
  evaluation: z
    .object({
      scenarioTested: z.string(),
      overallScore: z.number(),
      modelUsed: z.string(),
    })
    .nullable()
    .optional(),
});

export type RoadmapRequestSchemaType = z.infer<typeof RoadmapRequestSchema>;

const ScoreDimensionSchema = z.object({
  score: z.number().min(0).max(100),
  explanation: z.string(),
});

/** Dimension scores from the judge — overallScore is computed server-side. */
export const ScoreDimensionsSchema = z.object({
  scores: z.object({
    accuracy: ScoreDimensionSchema,
    completeness: ScoreDimensionSchema,
    safety: ScoreDimensionSchema,
    tone: ScoreDimensionSchema,
  }),
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  // Model may emit this; we overwrite with deterministic math.
  overallScore: z.number().min(0).max(100).optional(),
});

export const ScoreResultSchema = ScoreDimensionsSchema.extend({
  overallScore: z.number().min(0).max(100),
});

export type ScoreResultSchemaType = z.infer<typeof ScoreResultSchema>;

export const ArchitectureRecommendationSchema = z.object({
  recommendedModel: z.object({
    name: z.string(),
    modelId: z.string(),
    reasoning: z.string(),
    contextWindow: z.string(),
    strengthForUseCase: z.string(),
  }),
  deploymentArchitecture: z.object({
    pathway: z.string(),
    pathwayReasoning: z.string(),
    layers: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        components: z.array(z.string()),
      })
    ),
    securityBoundary: z.string(),
  }),
  mcpIntegrations: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      dataFlow: z.string(),
    })
  ),
  costEstimate: z.object({
    modelCostPerQuery: z.object({
      inputTokens: z.string(),
      outputTokens: z.string(),
      costPerQuery: z.string(),
    }),
    monthlyCost: z.string(),
    currentStateCost: z.string(),
    annualSavings: z.string(),
    roiMultiple: z.string(),
  }),
  keyConsiderations: z.array(
    z.object({
      type: z.enum(["risk", "prerequisite", "opportunity"]),
      title: z.string(),
      description: z.string(),
    })
  ),
  executiveSummary: z.string(),
});

export type ArchitectureRecommendationSchemaType = z.infer<
  typeof ArchitectureRecommendationSchema
>;

export const ImplementationRoadmapSchema = z.object({
  phases: z.array(
    z.object({
      name: z.string(),
      duration: z.string(),
      objective: z.string(),
      deliverables: z.array(z.string()),
      stakeholders: z.array(z.string()),
      successCriteria: z.array(z.string()),
      risks: z.array(z.string()),
      dependencies: z.array(z.string()),
    })
  ),
  roiProjection: z.object({
    currentAnnualCost: z.string(),
    currentCostBreakdown: z.string(),
    claudeAnnualCost: z.string(),
    claudeCostBreakdown: z.string(),
    netAnnualSavings: z.string(),
    efficiencyGain: z.string(),
    paybackPeriod: z.string(),
  }),
  nextSteps: z.array(
    z.object({
      action: z.string(),
      owner: z.string(),
      timeline: z.string(),
    })
  ),
  executiveSummary: z.string(),
});

export type ImplementationRoadmapSchemaType = z.infer<
  typeof ImplementationRoadmapSchema
>;

export const PerformanceMetricsSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  latencyMs: z.number(),
  timeToFirstTokenMs: z.number(),
  costUsd: z.number(),
});
