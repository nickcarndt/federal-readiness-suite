import { Output } from "ai";
import { rateLimit } from "@/lib/rate-limit";
import {
  generateText,
  getModel,
  llmAbortSignal,
  logLlmMetadata,
} from "@/lib/llm";
import { SCORE_SYSTEM_PROMPT, PROMPT_VERSIONS } from "@/lib/prompts";
import {
  ScoreDimensionsSchema,
  ScoreResultSchema,
  ScoreSchema,
} from "@/lib/schemas";
import {
  CLAUDE_MODELS,
  LLM_LIMITS,
  computeOverallScore,
} from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { success: rateLimitOk } = rateLimit(req);
  if (!rateLimitOk) {
    return Response.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ScoreSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { taskPrompt, response } = parsed.data;

  try {
    logLlmMetadata({
      route: "/api/evaluate/score",
      promptVersion: PROMPT_VERSIONS.score,
      model: CLAUDE_MODELS.haiku,
    });

    const result = await generateText({
      model: getModel("haiku"),
      system: SCORE_SYSTEM_PROMPT,
      prompt: `TASK:\n${taskPrompt}\n\nCLAUDE'S RESPONSE:\n${response}`,
      maxOutputTokens: LLM_LIMITS.scoreMaxTokens,
      abortSignal: llmAbortSignal(),
      output: Output.object({ schema: ScoreDimensionsSchema }),
    });

    const dimensions = ScoreDimensionsSchema.safeParse(result.output);
    if (!dimensions.success) {
      logLlmMetadata({
        route: "/api/evaluate/score",
        promptVersion: PROMPT_VERSIONS.score,
        model: CLAUDE_MODELS.haiku,
        validationOk: false,
      });
      return Response.json(
        { error: "Scoring output failed schema validation. Please try again." },
        { status: 502 }
      );
    }

    const overallScore = computeOverallScore({
      accuracy: dimensions.data.scores.accuracy.score,
      completeness: dimensions.data.scores.completeness.score,
      safety: dimensions.data.scores.safety.score,
      tone: dimensions.data.scores.tone.score,
    });

    const scores = ScoreResultSchema.parse({
      ...dimensions.data,
      overallScore,
    });

    logLlmMetadata({
      route: "/api/evaluate/score",
      promptVersion: PROMPT_VERSIONS.score,
      model: CLAUDE_MODELS.haiku,
      validationOk: true,
    });

    return Response.json(scores);
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("[CLAUDE] /api/evaluate/score — error", {
      message: error.message,
    });
    return Response.json(
      { error: "Scoring failed. Please try again." },
      { status: 500 }
    );
  }
}
