import { rateLimit } from "@/lib/rate-limit";
import { anthropic } from "@/lib/claude";
import { EVALUATE_SYSTEM_PROMPT } from "@/lib/prompts";
import { EvaluateSchema } from "@/lib/schemas";
import { CLAUDE_MODELS, CLAUDE_MODEL_PRICING, FEDERAL_SCENARIOS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const start = Date.now();

  const isDemoMode = req.headers.get("x-demo-mode") === "true";
  const { success: rateLimitOk } = rateLimit(req, isDemoMode);
  if (!rateLimitOk) {
    console.warn("[CLAUDE] /api/evaluate — rate limit exceeded", {
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

  const parsed = EvaluateSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[CLAUDE] /api/evaluate — validation failed", {
      errors: parsed.error.flatten().fieldErrors,
    });
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { scenario, customPrompt, model } = parsed.data;

  // Resolve the task prompt — custom overrides scenario lookup
  let taskPrompt = customPrompt ?? "";
  if (!customPrompt) {
    const found = FEDERAL_SCENARIOS.find((s) => s.id === scenario);
    taskPrompt = found?.prompt ?? scenario;
  }

  const modelId = model === "haiku" ? CLAUDE_MODELS.haiku : CLAUDE_MODELS.sonnet;
  const pricing = model === "haiku" ? CLAUDE_MODEL_PRICING.haiku : CLAUDE_MODEL_PRICING.sonnet;

  if (process.env.NODE_ENV === "development") {
    console.log("[CLAUDE] /api/evaluate — request received", {
      scenario,
      model: modelId,
      promptLength: taskPrompt.length,
    });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: modelId,
          max_tokens: 2048,
          system: EVALUATE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: taskPrompt }],
        });

        if (process.env.NODE_ENV === "development") {
          console.log("[PERF] /api/evaluate — stream created", {
            ms: Date.now() - start,
          });
        }

        let timeToFirstTokenMs = 0;
        let firstChunkReceived = false;

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            if (!firstChunkReceived) {
              timeToFirstTokenMs = Date.now() - start;
              firstChunkReceived = true;
            }
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const finalMessage = await stream.finalMessage();
        const latencyMs = Date.now() - start;
        const inputTokens = finalMessage.usage.input_tokens;
        const outputTokens = finalMessage.usage.output_tokens;
        const costUsd =
          (inputTokens / 1_000_000) * pricing.inputPerMillion +
          (outputTokens / 1_000_000) * pricing.outputPerMillion;

        if (process.env.NODE_ENV === "development") {
          console.log("[CLAUDE] /api/evaluate — complete", {
            ms: latencyMs,
            timeToFirstTokenMs,
            inputTokens,
            outputTokens,
            costUsd: costUsd.toFixed(6),
            model: modelId,
          });
        }

        // Append metadata trailer — client splits on this delimiter
        const metadata = JSON.stringify({
          inputTokens,
          outputTokens,
          latencyMs,
          timeToFirstTokenMs,
          costUsd,
        });
        controller.enqueue(
          encoder.encode(`\n---METADATA---\n${metadata}`)
        );

        controller.close();
      } catch (err: unknown) {
        const error = err as { message?: string; status?: number };
        console.error("[CLAUDE] /api/evaluate — stream error", {
          message: error.message,
          status: error.status,
          ms: Date.now() - start,
        });
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
