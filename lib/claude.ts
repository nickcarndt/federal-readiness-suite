import Anthropic from "@anthropic-ai/sdk";

// Singleton Anthropic client — reads ANTHROPIC_API_KEY from environment
export const anthropic = new Anthropic();
