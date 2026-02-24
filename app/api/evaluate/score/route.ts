import { rateLimit } from "@/lib/rate-limit";
import { anthropic } from "@/lib/claude";
import { SCORE_SYSTEM_PROMPT } from "@/lib/prompts";
import { ScoreSchema } from "@/lib/schemas";
import { CLAUDE_MODELS } from "@/lib/constants";
import type { ScoreResult } from "@/types/assessment";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const start = Date.now();

  const isDemoMode = req.headers.get("x-demo-mode") === "true";
  const { success: rateLimitOk } = rateLimit(req, isDemoMode);
  if (!rateLimitOk) {
    console.warn("[CLAUDE] /api/evaluate/score — rate limit exceeded", {
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
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
    console.warn("[CLAUDE] /api/evaluate/score — validation failed", {
      errors: parsed.error.flatten().fieldErrors,
    });
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { taskPrompt, response } = parsed.data;

  if (process.env.NODE_ENV === "development") {
    console.log("[CLAUDE] /api/evaluate/score — request received", {
      model: CLAUDE_MODELS.haiku,
      promptLength: taskPrompt.length,
      responseLength: response.length,
    });
  }

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODELS.haiku,
      max_tokens: 1024,
      system: SCORE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `TASK:\n${taskPrompt}\n\nCLAUDE'S RESPONSE:\n${response}`,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const sanitized = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const scores: ScoreResult = JSON.parse(sanitized);

    if (process.env.NODE_ENV === "development") {
      console.log("[CLAUDE] /api/evaluate/score — complete", {
        ms: Date.now() - start,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        overallScore: scores.overallScore,
      });
    }

    return Response.json(scores);
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("[CLAUDE] /api/evaluate/score — error", {
      message: error.message,
      ms: Date.now() - start,
    });
    return Response.json(
      { error: "Scoring failed. Please try again." },
      { status: 500 }
    );
  }
}
