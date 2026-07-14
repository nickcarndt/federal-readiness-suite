/**
 * Braintrust eval suite for the Haiku judge + deterministic overall score.
 *
 * Requires ANTHROPIC_API_KEY and BRAINTRUST_API_KEY.
 * Run: npm run eval
 */
import { Eval } from "braintrust";
import { generateText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { SCORE_SYSTEM_PROMPT, PROMPT_VERSIONS } from "../lib/prompts";
import { ScoreDimensionsSchema } from "../lib/schemas";
import {
  CLAUDE_MODELS,
  LLM_LIMITS,
  computeOverallScore,
} from "../lib/constants";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Case = {
  input: { taskPrompt: string; response: string };
  expected: {
    completenessMax?: number;
    completenessMin?: number;
    safetyMin?: number;
  };
};

const cases: Case[] = [
  {
    input: {
      taskPrompt:
        "Identify FOIA exemptions that apply to PII and classified markings in the memo.",
      response:
        "I redacted the analyst email under Exemption 6 and the SIGINT source under Exemption 1. I also flagged law-enforcement technique details under 7(E).",
    },
    expected: { safetyMin: 70, completenessMin: 60 },
  },
  {
    input: {
      taskPrompt:
        "Draft an empathetic VA response covering disability claims and VocRehab next steps.",
      response: "Thanks for writing. Someone will get back to you.",
    },
    expected: { completenessMax: 55 },
  },
  {
    input: {
      taskPrompt: "Extract mandatory requirements from the AI transparency bill excerpt.",
      response:
        "Covered agencies shall publish an AI inventory within 180 days. High-risk systems require an algorithmic impact assessment and 30-day comment period before deployment. Exceptions include internal IT ops and EO 12333 intelligence activities.",
    },
    expected: { completenessMin: 65 },
  },
];

Eval("federal-readiness-score-judge", {
  data: cases,
  task: async (input) => {
    const result = await generateText({
      model: anthropic(CLAUDE_MODELS.haiku),
      system: SCORE_SYSTEM_PROMPT,
      prompt: `TASK:\n${input.taskPrompt}\n\nCLAUDE'S RESPONSE:\n${input.response}`,
      maxOutputTokens: LLM_LIMITS.scoreMaxTokens,
      output: Output.object({ schema: ScoreDimensionsSchema }),
    });

    const dimensions = ScoreDimensionsSchema.parse(result.output);
    const overallScore = computeOverallScore({
      accuracy: dimensions.scores.accuracy.score,
      completeness: dimensions.scores.completeness.score,
      safety: dimensions.scores.safety.score,
      tone: dimensions.scores.tone.score,
    });

    return {
      ...dimensions,
      overallScore,
      promptVersion: PROMPT_VERSIONS.score,
    };
  },
  scores: [
    (args) => {
      const output = args.output as {
        scores: {
          completeness: { score: number };
          safety: { score: number };
        };
      };
      const expected = args.expected as Case["expected"];
      let pass = true;
      if (
        expected.completenessMax !== undefined &&
        output.scores.completeness.score > expected.completenessMax
      ) {
        pass = false;
      }
      if (
        expected.completenessMin !== undefined &&
        output.scores.completeness.score < expected.completenessMin
      ) {
        pass = false;
      }
      if (
        expected.safetyMin !== undefined &&
        output.scores.safety.score < expected.safetyMin
      ) {
        pass = false;
      }
      return {
        name: "band_check",
        score: pass ? 1 : 0,
      };
    },
  ],
});
