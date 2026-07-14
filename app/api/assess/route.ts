import { Output } from "ai";
import { rateLimit } from "@/lib/rate-limit";
import {
  getModel,
  llmAbortSignal,
  logLlmMetadata,
  streamText,
} from "@/lib/llm";
import { ASSESS_SYSTEM_PROMPT, PROMPT_VERSIONS } from "@/lib/prompts";
import { ArchitectureRecommendationSchema, IntakeSchema } from "@/lib/schemas";
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

  const parsed = IntakeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const intake = parsed.data;
  const userMessage = JSON.stringify({
    agencyType: intake.agencyType,
    missionDescription: intake.missionDescription,
    painPoints: intake.painPoints,
    dataClassification: intake.dataClassification,
    complianceRequirements: intake.complianceRequirements,
    estimatedMonthlyVolume: intake.estimatedVolume,
  });

  return createNdjsonResponse(async (controller) => {
    logLlmMetadata({
      route: "/api/assess",
      promptVersion: PROMPT_VERSIONS.assess,
      model: CLAUDE_MODELS.sonnet,
      agencyType: intake.agencyType,
    });

    const result = streamText({
      model: getModel("sonnet"),
      system: ASSESS_SYSTEM_PROMPT,
      prompt: userMessage,
      maxOutputTokens: LLM_LIMITS.assessMaxTokens,
      abortSignal: llmAbortSignal(),
      output: Output.object({ schema: ArchitectureRecommendationSchema }),
    });

    for await (const partial of result.partialOutputStream) {
      controller.enqueue(
        encodeStreamEvent({ type: "partial", data: partial })
      );
    }

    const output = await result.output;
    const validated = ArchitectureRecommendationSchema.safeParse(output);

    logLlmMetadata({
      route: "/api/assess",
      promptVersion: PROMPT_VERSIONS.assess,
      model: CLAUDE_MODELS.sonnet,
      agencyType: intake.agencyType,
      validationOk: validated.success,
    });

    if (!validated.success) {
      controller.enqueue(
        encodeStreamEvent({
          type: "error",
          error:
            "Model output failed schema validation. Please retry the assessment.",
        })
      );
      return;
    }

    controller.enqueue(
      encodeStreamEvent({ type: "result", data: validated.data })
    );
  });
}
