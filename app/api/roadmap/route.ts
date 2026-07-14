import { Output } from "ai";
import { rateLimit } from "@/lib/rate-limit";
import {
  getModel,
  llmAbortSignal,
  logLlmMetadata,
  streamText,
} from "@/lib/llm";
import { ROADMAP_SYSTEM_PROMPT, PROMPT_VERSIONS } from "@/lib/prompts";
import {
  ImplementationRoadmapSchema,
  RoadmapRequestSchema,
} from "@/lib/schemas";
import { CLAUDE_MODELS, LLM_LIMITS } from "@/lib/constants";
import {
  createNdjsonResponse,
  encodeStreamEvent,
} from "@/lib/ndjson-stream";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  const parsed = RoadmapRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { intake, architecture, evaluation } = parsed.data;

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

  return createNdjsonResponse(async (controller) => {
    logLlmMetadata({
      route: "/api/roadmap",
      promptVersion: PROMPT_VERSIONS.roadmap,
      model: CLAUDE_MODELS.sonnet,
      agencyType: intake.agencyType,
    });

    const result = streamText({
      model: getModel("sonnet"),
      system: ROADMAP_SYSTEM_PROMPT,
      prompt: userMessage,
      maxOutputTokens: LLM_LIMITS.roadmapMaxTokens,
      abortSignal: llmAbortSignal(),
      output: Output.object({ schema: ImplementationRoadmapSchema }),
    });

    for await (const partial of result.partialOutputStream) {
      controller.enqueue(
        encodeStreamEvent({ type: "partial", data: partial })
      );
    }

    const output = await result.output;
    const validated = ImplementationRoadmapSchema.safeParse(output);

    logLlmMetadata({
      route: "/api/roadmap",
      promptVersion: PROMPT_VERSIONS.roadmap,
      model: CLAUDE_MODELS.sonnet,
      agencyType: intake.agencyType,
      validationOk: validated.success,
    });

    if (!validated.success) {
      controller.enqueue(
        encodeStreamEvent({
          type: "error",
          error:
            "Model output failed schema validation. Please retry the roadmap.",
        })
      );
      return;
    }

    controller.enqueue(
      encodeStreamEvent({ type: "result", data: validated.data })
    );
  });
}
