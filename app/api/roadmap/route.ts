import { rateLimit } from "@/lib/rate-limit";
import { anthropic } from "@/lib/claude";
import { ROADMAP_SYSTEM_PROMPT } from "@/lib/prompts";
import { RoadmapRequestSchema } from "@/lib/schemas";
import { CLAUDE_MODELS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const start = Date.now();

  // Rate limiting — first check before any processing
  const isDemoMode = req.headers.get("x-demo-mode") === "true";
  const { success: rateLimitOk } = rateLimit(req, isDemoMode);
  if (!rateLimitOk) {
    console.warn("[CLAUDE] /api/roadmap — rate limit exceeded", {
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

  // Zod validation
  const parsed = RoadmapRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[CLAUDE] /api/roadmap — validation failed", {
      errors: parsed.error.flatten().fieldErrors,
    });
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { intake, architecture, evaluation } = parsed.data;

  if (process.env.NODE_ENV === "development") {
    console.log("[CLAUDE] /api/roadmap — request received", {
      agency: intake.agencyType,
      hasArchitecture: !!architecture,
      hasEvaluation: !!evaluation,
    });
  }

  // Build user message
  const userMessage = JSON.stringify({
    intake: {
      agencyType: intake.agencyType,
      missionDescription: intake.missionDescription,
      painPoints: intake.painPoints,
      dataClassification: intake.dataClassification,
      complianceRequirements: intake.complianceRequirements,
      estimatedMonthlyVolume: intake.estimatedVolume,
    },
    architecture: architecture ?? null,
    evaluation: evaluation ?? null,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: CLAUDE_MODELS.sonnet,
          max_tokens: 4096,
          system: ROADMAP_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });

        if (process.env.NODE_ENV === "development") {
          console.log("[PERF] /api/roadmap — stream created", {
            ms: Date.now() - start,
          });
        }

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const finalMessage = await stream.finalMessage();
        if (process.env.NODE_ENV === "development") {
          console.log("[CLAUDE] /api/roadmap — complete", {
            ms: Date.now() - start,
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
            model: CLAUDE_MODELS.sonnet,
          });
        }

        controller.close();
      } catch (err: unknown) {
        const error = err as { message?: string; status?: number };
        console.error("[CLAUDE] /api/roadmap — stream error", {
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
