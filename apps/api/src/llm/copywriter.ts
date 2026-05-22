/**
 * Copywriter — generates 小红书-format posts from a brief.
 *
 * Like the art director, it is built on the Vercel AI SDK, traced through
 * Langfuse, and falls back to a deterministic local draft when no API key is
 * configured. The 小红书 rules come from the content/xiaohongshu spec module.
 */
import { generateObject } from "ai";
import { z } from "zod";
import type { PostTone } from "@looma/shared";
import { config } from "../config.js";
import { models } from "./models.js";
import { startTrace } from "./observability.js";
import { XHS_PROMPT_GUIDE, XHS_SPEC } from "../content/xiaohongshu.js";

const postSchema = z.object({
  title: z.string().describe("小红书标题，含钩子"),
  body: z.string().describe("小红书正文，口语化、分段、emoji 适量"),
  tags: z
    .array(z.string())
    .min(XHS_SPEC.tags.min)
    .max(XHS_SPEC.tags.max)
    .describe("话题标签，均以 # 开头"),
  coverTip: z.string().describe("一句话封面建议（竖版 3:4）"),
});

export type PostDraft = z.infer<typeof postSchema>;

const TONE_HINT: Record<PostTone, string> = {
  literary: "文学杂志感，克制、有画面感",
  lively: "活泼亲和，像朋友安利",
  professional: "专业测评感，理性、有信息量",
};

function systemPrompt(tone: PostTone): string {
  return `你是小红书爆款电商笔记写手。语气：${TONE_HINT[tone]}。
${XHS_PROMPT_GUIDE}
只输出符合规范的内容，不要解释。`;
}

/** Deterministic fallback used when no LLM key is configured. */
function localFallback(brief: string, tone: PostTone): PostDraft {
  const subject = brief.trim().slice(0, 12) || "新品";
  // Keep the title within the 20-char 小红书 cap regardless of brief length.
  const titleSubject = Array.from(subject).slice(0, 6).join("");
  return {
    title: `🌿 ${titleSubject}｜被夸爆的春日穿搭`,
    body:
      `最近入手的这件${subject}，真的越穿越喜欢🌷\n\n` +
      `面料是亲肤的亚麻，透气又有垂坠感，上身松弛不挑人。\n` +
      `搭配清晨的自然光拍出来，氛围感直接拉满📷\n\n` +
      `日常通勤、周末出片都能驾驭，颜色也很好搭。\n` +
      `姐妹们还想看哪种搭配？评论区告诉我，记得先收藏～`,
    tags: ["#春日穿搭", "#亚麻", "#穿搭分享", "#氛围感", "#新品安利"],
    coverTip: "竖版 3:4，模特侧逆光自然站姿，标题文字压在上三分之一。",
  };
}

/** Generate one 小红书 post draft from a brief. */
export async function writePost(
  projectId: string,
  brief: string,
  tone: PostTone,
): Promise<PostDraft> {
  const trace = startTrace("content.copywriter", { projectId, tone });

  if (!config.llm.live) {
    const draft = localFallback(brief, tone);
    trace.logGeneration({
      name: "copywriter.fallback",
      model: "local-fallback",
      input: brief,
      output: draft,
    });
    await trace.end(draft);
    return draft;
  }

  try {
    const { object, usage } = await generateObject({
      model: models.artDirector,
      schema: postSchema,
      system: systemPrompt(tone),
      prompt: `产品与卖点：${brief}`,
    });
    trace.logGeneration({
      name: "copywriter",
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
    console.error("[copywriter] LLM call failed, using fallback", err);
    const draft = localFallback(brief, tone);
    await trace.end({ error: String(err), fallback: draft });
    return draft;
  }
}
