/**
 * Langfuse — LLM call observability.
 *
 * Wraps the Langfuse SDK behind a tiny tracing surface so the rest of the
 * codebase records traces without knowing the vendor. When Langfuse keys are
 * absent the helpers degrade to no-ops, keeping local dev frictionless.
 */
import { Langfuse } from "langfuse";
import { config } from "../config.js";

const client = config.langfuse.enabled
  ? new Langfuse({
      publicKey: config.langfuse.publicKey,
      secretKey: config.langfuse.secretKey,
      baseUrl: config.langfuse.baseUrl,
    })
  : null;

export interface TraceHandle {
  /** Record an LLM generation against this trace. */
  logGeneration(input: {
    name: string;
    model: string;
    input: unknown;
    output: unknown;
    usage?: { promptTokens?: number; completionTokens?: number };
  }): void;
  /** Mark the trace finished and flush. */
  end(output?: unknown): Promise<void>;
}

const noopTrace: TraceHandle = {
  logGeneration: () => {},
  end: async () => {},
};

/** Start a trace for one logical unit of work (e.g. one chat turn). */
export function startTrace(name: string, metadata?: Record<string, unknown>): TraceHandle {
  if (!client) return noopTrace;

  const trace = client.trace({ name, metadata });

  return {
    logGeneration({ name, model, input, output, usage }) {
      trace.generation({
        name,
        model,
        input,
        output,
        usage: usage
          ? { input: usage.promptTokens, output: usage.completionTokens }
          : undefined,
      });
    },
    async end(output) {
      if (output !== undefined) trace.update({ output });
      await client!.flushAsync();
    },
  };
}

export async function shutdownObservability(): Promise<void> {
  await client?.shutdownAsync();
}
