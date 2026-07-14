import { describe, expect, it } from "vitest";
import { computeOverallScore, SCORE_WEIGHTS } from "@/lib/constants";
import {
  IntakeSchema,
  ScoreDimensionsSchema,
  ScoreResultSchema,
} from "@/lib/schemas";

describe("computeOverallScore", () => {
  it("applies 40/25/25/10 weights deterministically", () => {
    expect(SCORE_WEIGHTS).toEqual({
      accuracy: 0.4,
      completeness: 0.25,
      safety: 0.25,
      tone: 0.1,
    });

    const overall = computeOverallScore({
      accuracy: 100,
      completeness: 80,
      safety: 60,
      tone: 40,
    });

    // 40 + 20 + 15 + 4 = 79
    expect(overall).toBe(79);
  });

  it("clamps to 0–100", () => {
    expect(
      computeOverallScore({
        accuracy: 0,
        completeness: 0,
        safety: 0,
        tone: 0,
      })
    ).toBe(0);
  });
});

describe("IntakeSchema classification gate", () => {
  const base = {
    agencyType: "hhs" as const,
    missionDescription:
      "We process Medicare eligibility determinations with a 45-day backlog against a 30-day SLA.",
    painPoints: ["manual-processing" as const],
    complianceRequirements: ["hipaa" as const],
    estimatedVolume: "10k-100k" as const,
  };

  it("accepts unclassified-cui", () => {
    const result = IntakeSchema.safeParse({
      ...base,
      dataClassification: "unclassified-cui",
    });
    expect(result.success).toBe(true);
  });

  it("rejects secret", () => {
    const result = IntakeSchema.safeParse({
      ...base,
      dataClassification: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rejects top-secret", () => {
    const result = IntakeSchema.safeParse({
      ...base,
      dataClassification: "top-secret",
    });
    expect(result.success).toBe(false);
  });
});

describe("Score schemas", () => {
  it("allows dimensions without overallScore then accepts computed result", () => {
    const dimensions = ScoreDimensionsSchema.parse({
      scores: {
        accuracy: { score: 90, explanation: "ok" },
        completeness: { score: 80, explanation: "ok" },
        safety: { score: 85, explanation: "ok" },
        tone: { score: 70, explanation: "ok" },
      },
      summary: "Solid",
      strengths: ["a", "b"],
      improvements: ["c"],
    });

    const overall = computeOverallScore({
      accuracy: dimensions.scores.accuracy.score,
      completeness: dimensions.scores.completeness.score,
      safety: dimensions.scores.safety.score,
      tone: dimensions.scores.tone.score,
    });

    const result = ScoreResultSchema.parse({ ...dimensions, overallScore: overall });
    expect(result.overallScore).toBe(overall);
  });
});
