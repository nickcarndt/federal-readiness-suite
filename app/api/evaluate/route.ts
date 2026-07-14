import { rateLimit } from "@/lib/rate-limit";
import {
  getModel,
  llmAbortSignal,
  logLlmMetadata,
  streamText,
} from "@/lib/llm";
import { EVALUATE_SYSTEM_PROMPT, PROMPT_VERSIONS } from "@/lib/prompts";
import { EvaluateSchema } from "@/lib/schemas";
import {
  CLAUDE_MODELS,
  CLAUDE_MODEL_PRICING,
  FEDERAL_SCENARIOS,
  LLM_LIMITS,
} from "@/lib/constants";
import {
  createNdjsonResponse,
  encodeStreamEvent,
} from "@/lib/ndjson-stream";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const start = Date.now();

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

  const parsed = EvaluateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { scenario, customPrompt, model } = parsed.data;

  let taskPrompt = customPrompt ?? "";
  if (!customPrompt) {
    const found = FEDERAL_SCENARIOS.find((s) => s.id === scenario);
    if (!found) {
      return Response.json(
        { error: "Unknown scenario. Provide a valid scenario id or customPrompt." },
        { status: 400 }
      );
    }
    taskPrompt = found.prompt;
  }

  const modelId = model === "haiku" ? CLAUDE_MODELS.haiku : CLAUDE_MODELS.sonnet;
  const pricing =
    model === "haiku" ? CLAUDE_MODEL_PRICING.haiku : CLAUDE_MODEL_PRICING.sonnet;

  return createNdjsonResponse(async (controller) => {
    logLlmMetadata({
      route: "/api/evaluate",
      promptVersion: PROMPT_VERSIONS.evaluate,
      model: modelId,
    });

    let timeToFirstTokenMs = 0;
    let firstChunk = false;

    const result = streamText({
      model: getModel(model),
      system: EVALUATE_SYSTEM_PROMPT,
      prompt: taskPrompt,
      maxOutputTokens: LLM_LIMITS.evaluateMaxTokens,
      abortSignal: llmAbortSignal(),
    });

    for await (const delta of result.textStream) {
      if (!firstChunk) {
        timeToFirstTokenMs = Date.now() - start;
        firstChunk = true;
      }
      controller.enqueue(encodeStreamEvent({ type: "text", delta }));
    }

    const usage = await result.usage;
    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    const latencyMs = Date.now() - start;
    const costUsd =
      (inputTokens / 1_000_000) * pricing.inputPerMillion +
      (outputTokens / 1_000_000) * pricing.outputPerMillion;

    controller.enqueue(
      encodeStreamEvent({
        type: "metrics",
        data: {
          inputTokens,
          outputTokens,
          latencyMs,
          timeToFirstTokenMs,
          costUsd,
        },
      })
    );

    // Signal completion with empty result marker for client state machine.
    controller.enqueue(
      encodeStreamEvent({ type: "result", data: { ok: true } })
    );
  });
}
