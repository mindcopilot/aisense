/**
 * Campaign planner — expands a one-sentence brief into a structured
 * marketing plan (image shots + video concept + article spec).
 *
 * Built on the Vercel AI SDK, traced through Langfuse, with a deterministic
 * offline fallback. This is the first step of the marketing pipeline.
 */
import { generateObject } from "ai";
import { z } from "zod";
import type { CampaignPlan, Look } from "@looma/shared";
import { config } from "../config.js";
import { models } from "./models.js";
import { startTrace } from "./observability.js";

const LOOKS: [Look, ...Look[]] = [
  "cream", "desert", "sage", "rose", "studio",
  "midnight", "coral", "bone", "ink", "sand",
];

const planSchema = z.object({
  theme: z.string().describe("营销主题，一句话"),
  imageShots: z
    .array(z.object({ look: z.enum(LOOKS), pose: z.string() }))
    .min(2)
    .max(4),
  videoConcept: z.string(),
  videoClips: z
    .array(z.object({ label: z.string(), motion: z.string() }))
    .min(3)
    .max(5),
  article: z.object({
    brief: z.string(),
    vertical: z.enum(["ecommerce", "ai_tech"]),
    angle: z.enum(["tutorial", "review", "news", "opinion"]).nullable(),
    tone: z.enum(["literary", "lively", "professional"]),
  }),
});

const SYSTEM_PROMPT = `你是营销总监。把用户的一句话需求拆解成一套可执行的宣传物料方案：
- imageShots：2-4 张宣传图的视觉方向（look 取景配色 + pose 姿态/构图）。
- videoConcept + videoClips：一支短视频的概念与 3-5 个分镜。
- article：一篇配套图文的写作设定（brief 要点、vertical 领域、angle 体裁、tone 语气）。
若需求偏 AI/科技，article.vertical 用 ai_tech 并选合适 angle；否则用 ecommerce、angle 为 null。`;

/** Deterministic fallback used when no LLM key is configured. */
function localFallback(brief: string): CampaignPlan {
  const isAi = /AI|ai|模型|agent|科技|大模型|llm|gpt|claude/i.test(brief);
  return {
    theme: brief.trim().slice(0, 24) || "新品宣传",
    imageShots: [
      { look: "cream", pose: "正面主图" },
      { look: "sage", pose: "场景氛围" },
      { look: "ink", pose: "细节特写" },
    ],
    videoConcept: `围绕「${brief.trim().slice(0, 16)}」的 15 秒短视频，强调质感与节奏。`,
    videoClips: [
      { label: "开场 · 主题点题", motion: "ZOOM IN" },
      { label: "中段 · 卖点展开", motion: "PAN L→R" },
      { label: "收尾 · 行动号召", motion: "FADE OUT" },
    ],
    article: isAi
      ? { brief, vertical: "ai_tech", angle: "review", tone: "professional" }
      : { brief, vertical: "ecommerce", angle: null, tone: "lively" },
  };
}

/** Turn a one-sentence brief into a full campaign plan. */
export async function planCampaignBrief(
  campaignId: string,
  brief: string,
): Promise<CampaignPlan> {
  const trace = startTrace("marketing.planner", { campaignId });

  if (!config.llm.live) {
    const plan = localFallback(brief);
    trace.logGeneration({
      name: "planner.fallback",
      model: "local-fallback",
      input: brief,
      output: plan,
    });
    await trace.end(plan);
    return plan;
  }

  try {
    const { object, usage } = await generateObject({
      model: models.artDirector,
      schema: planSchema,
      system: SYSTEM_PROMPT,
      prompt: `一句话需求：${brief}`,
    });
    trace.logGeneration({
      name: "planner",
      model: config.llm.chatModel,
      input: brief,
      output: object,
      usage: {
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
      },
    });
    await trace.end(object);
    return object;
  } catch (err) {
    console.error("[campaignPlanner] LLM call failed, using fallback", err);
    const plan = localFallback(brief);
    await trace.end({ error: String(err), fallback: plan });
    return plan;
  }
}
