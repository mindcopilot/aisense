/**
 * Model registry — the single place every model used by Looma is configured.
 *
 * Keeping construction here (rather than scattered `anthropic(...)` calls)
 * means model choices, provider keys and defaults change in exactly one file.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { config } from "../config.js";

const anthropic = createAnthropic({
  // A placeholder keeps provider construction valid offline; calls only
  // happen when `config.llm.live` is true.
  apiKey: config.llm.anthropicApiKey || "offline",
});

export interface ModelRegistry {
  /** Reasoning model behind the AI art director "Atelier". */
  artDirector: LanguageModel;
  /** Fast model for short utility generations. */
  fast: LanguageModel;
  /** Logical id of the (simulated) image rendering model. */
  imageModelId: string;
}

export const models: ModelRegistry = {
  artDirector: anthropic(config.llm.chatModel),
  fast: anthropic(config.llm.fastModel),
  imageModelId: config.llm.imageModel,
};
