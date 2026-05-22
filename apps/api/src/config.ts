/**
 * Centralised, validated configuration.
 *
 * Every other module depends on this — and nothing else for env access — so
 * environment coupling stays in one place.
 */
import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),

  databaseUrl: required("DATABASE_URL", "postgres://looma:looma@localhost:5432/looma"),

  temporal: {
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
    namespace: process.env.TEMPORAL_NAMESPACE ?? "default",
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "looma-photoshoot",
  },

  llm: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    /** Whether a real LLM provider is configured. */
    get live(): boolean {
      return Boolean(process.env.ANTHROPIC_API_KEY);
    },
    /** Reasoning model — drives the AI art director. */
    chatModel: process.env.LLM_CHAT_MODEL ?? "claude-sonnet-4-6",
    /** Fast model — short utility calls (captions, titles). */
    fastModel: process.env.LLM_FAST_MODEL ?? "claude-haiku-4-5-20251001",
    /** Image model — photoshoot rendering (simulated in this build). */
    imageModel: process.env.LLM_IMAGE_MODEL ?? "looma-director-v3",
  },

  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? "",
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? "",
    baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
    enabled: Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
  },
} as const;

export type Config = typeof config;
