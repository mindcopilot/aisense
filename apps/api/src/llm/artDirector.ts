/**
 * Atelier — the AI art director.
 *
 * Owns every LLM interaction for the Studio. Built on the Vercel AI SDK (the
 * recommended LLM base library) and traced end-to-end through Langfuse.
 *
 * Falls back to a deterministic local response when no API key is configured,
 * so the product is fully runnable offline.
 */
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ChatMessage, Look } from "@looma/shared";
import { config } from "../config.js";
import { startTrace } from "./observability.js";

const LOOKS: Look[] = [
  "cream", "desert", "sage", "rose", "studio",
  "midnight", "coral", "bone", "ink", "sand",
];

const directorSchema = z.object({
  reply: z.string().describe("用中文回复用户，像一位资深 AI 艺术总监"),
  intent: z.enum(["propose", "generate", "chat"]),
  proposals: z
    .array(
      z.object({
        title: z.string(),
        desc: z.string(),
        looks: z.array(z.enum(LOOKS as [Look, ...Look[]])).length(4),
      }),
    )
    .optional(),
  generation: z
    .object({
      count: z.number().int().min(1).max(12),
      pose: z.string(),
      looks: z.array(z.enum(LOOKS as [Look, ...Look[]])).min(1),
    })
    .optional(),
});

export type DirectorOutput = z.infer<typeof directorSchema>;

const SYSTEM_PROMPT = `你是 Looma 的 AI 艺术总监 "Atelier"。
你为电商卖家策划 AI 商拍。回应原则：
- 当用户描述新需求或上传产品时，给出 2-3 个创意方向（intent=propose）。
- 当用户明确选定方向或要求出图/加变体时，规划一个生成批次（intent=generate）。
- 其它情况只对话（intent=chat）。
保持克制、有文学感的语气，避免堆砌形容词。`;

function buildPromptHistory(history: ChatMessage[]): string {
  return history
    .map((m) => `${m.role === "user" ? "用户" : "Atelier"}：${m.text}`)
    .join("\n");
}

/** Deterministic fallback used when no Anthropic key is set. */
function localFallback(latest: string): DirectorOutput {
  const wantsGenerate = /生成|出图|加|变体|回眸|走位|序列/.test(latest);
  if (wantsGenerate) {
    return {
      reply: "正在为你生成 — 我会在画布上加 4 张新草稿，保持当前光线参数。",
      intent: "generate",
      generation: { count: 4, pose: "新草稿", looks: ["sage", "cream", "bone", "rose"] },
    };
  }
  return {
    reply: "好的，我从光线、姿态、构图三层给你三个方向，每个 4 张，挑一个我再深做。",
    intent: "propose",
    proposals: [
      { title: "苔园清晨", desc: "潮湿石阶 · 侧逆光 · 文学杂志感", looks: ["sage", "bone", "cream", "sage"] },
      { title: "亚麻日光", desc: "落地窗白纱 · 顶光 · 自然站姿", looks: ["cream", "bone", "rose", "cream"] },
      { title: "海边礼拜日", desc: "黄昏沙地 · 逆光剪影 · 走动序列", looks: ["desert", "coral", "sand", "desert"] },
    ],
  };
}

/**
 * Run one art-director turn over the conversation history.
 * @param history full thread, oldest first; the last entry is the user turn.
 */
export async function directShoot(
  projectId: string,
  history: ChatMessage[],
): Promise<DirectorOutput> {
  const latest = history.at(-1)?.text ?? "";
  const trace = startTrace("studio.art-director", { projectId });

  if (!config.llm.anthropicApiKey) {
    const output = localFallback(latest);
    trace.logGeneration({
      name: "art-director.fallback",
      model: "local-fallback",
      input: latest,
      output,
    });
    await trace.end(output);
    return output;
  }

  const anthropic = createAnthropic({ apiKey: config.llm.anthropicApiKey });
  const prompt = buildPromptHistory(history);

  try {
    const { object, usage } = await generateObject({
      model: anthropic(config.llm.model),
      schema: directorSchema,
      system: SYSTEM_PROMPT,
      prompt,
    });

    trace.logGeneration({
      name: "art-director",
      model: config.llm.model,
      input: prompt,
      output: object,
      usage: {
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
      },
    });
    await trace.end(object);
    return object;
  } catch (err) {
    console.error("[artDirector] LLM call failed, using fallback", err);
    const output = localFallback(latest);
    await trace.end({ error: String(err), fallback: output });
    return output;
  }
}
