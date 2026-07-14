import * as ai from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { initLogger, wrapAISDK, currentSpan } from "braintrust";
import { CLAUDE_MODELS, LLM_LIMITS } from "@/lib/constants";

const projectName =
  process.env.BRAINTRUST_PROJECT_NAME ?? "federal-readiness-suite";

// Tracing is optional — app runs without BRAINTRUST_API_KEY.
if (process.env.BRAINTRUST_API_KEY) {
  initLogger({
    projectName,
    apiKey: process.env.BRAINTRUST_API_KEY,
  });
}

const { streamText, generateText } = wrapAISDK(ai);

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export { streamText, generateText, currentSpan };

export function getModel(tier: keyof typeof CLAUDE_MODELS) {
  return anthropic(CLAUDE_MODELS[tier]);
}

export function llmAbortSignal(timeoutMs = LLM_LIMITS.timeoutMs): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export function logLlmMetadata(meta: {
  route: string;
  promptVersion: string;
  model: string;
  agencyType?: string;
  validationOk?: boolean;
}) {
  try {
    currentSpan()?.log({
      metadata: meta,
    });
  } catch {
    // No active span (Braintrust unset) — ignore.
  }
}
