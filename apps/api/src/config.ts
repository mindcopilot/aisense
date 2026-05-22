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
    model: process.env.LLM_MODEL ?? "claude-sonnet-4-6",
  },

  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? "",
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? "",
    baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
    enabled: Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
  },
} as const;

export type Config = typeof config;
