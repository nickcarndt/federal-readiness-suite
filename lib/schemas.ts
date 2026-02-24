import { z } from "zod";

export const IntakeSchema = z.object({
  agencyType: z.string().min(1, "Agency type is required"),
  missionDescription: z
    .string()
    .min(20, "Mission description must be at least 20 characters"),
  painPoints: z.array(z.string()),
  dataClassification: z.string().min(1, "Data classification is required"),
  complianceRequirements: z.array(z.string()),
  estimatedVolume: z.string().min(1, "Estimated volume is required"),
});

export type IntakeSchemaType = z.infer<typeof IntakeSchema>;

export const EvaluateSchema = z.object({
  scenario: z.string().min(1, "Scenario is required"),
  customPrompt: z.string().optional(),
  model: z.enum(["sonnet", "haiku"]),
});

export const ScoreSchema = z.object({
  taskPrompt: z.string().min(1, "Task prompt is required"),
  response: z.string().min(1, "Response is required"),
});

export type EvaluateSchemaType = z.infer<typeof EvaluateSchema>;
export type ScoreSchemaType = z.infer<typeof ScoreSchema>;

export const RoadmapRequestSchema = z.object({
  intake: z.object({
    agencyType: z.string().min(1),
    missionDescription: z.string(),
    painPoints: z.array(z.string()),
    dataClassification: z.string(),
    complianceRequirements: z.array(z.string()),
    estimatedVolume: z.string(),
  }),
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
