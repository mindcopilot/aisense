/**
 * Copywriter — generates 小红书-format posts from a brief.
 *
 * Built on the Vercel AI SDK, traced through Langfuse, with a deterministic
 * local fallback when no API key is configured. The 小红书 *format* rules come
 * from content/xiaohongshu; *what to write about* comes from content/verticals.
 */
import { generateObject } from "ai";
import { z } from "zod";
import type { AiAngle, PostTone, PostVertical } from "@looma/shared";
import { config } from "../config.js";
import { models } from "./models.js";
import { startTrace } from "./observability.js";
import { XHS_PROMPT_GUIDE, XHS_SPEC } from "../content/xiaohongshu.js";
import { VERTICALS, buildDomainGuide } from "../content/verticals.js";

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

export interface WritePostOptions {
  vertical: PostVertical;
  angle: AiAngle | null;
  tone: PostTone;
}

const TONE_HINT: Record<PostTone, string> = {
  literary: "文学杂志感，克制、有画面感",
  lively: "活泼亲和，像朋友安利",
  professional: "专业测评感，理性、有信息量",
};

function systemPrompt(opts: WritePostOptions): string {
  return `你是小红书爆款笔记写手。语气：${TONE_HINT[opts.tone]}。
${buildDomainGuide(opts.vertical, opts.angle)}
${XHS_PROMPT_GUIDE}
只输出符合规范的内容，不要解释。`;
}

/** Deterministic fallback for the AI/科技 vertical. */
function aiTechFallback(brief: string, angle: AiAngle | null): PostDraft {
  const topic = Array.from(brief.trim()).slice(0, 8).join("") || "AI 工具";
  const byAngle: Record<AiAngle, { title: string; lead: string }> = {
    tutorial: { title: `${topic}｜手把手教程`, lead: "照着做就能复现，建议先收藏⬇️" },
    review: { title: `${topic}｜深度实测`, lead: "实测一周，优缺点一次说清👇" },
    news: { title: `${topic}｜今天的大新闻`, lead: "三点讲清这次更新意味着什么⚡️" },
    opinion: { title: `${topic}｜我的判断`, lead: "聊一个被忽略的点，欢迎来辩🧠" },
  };
  const pick = byAngle[angle ?? "tutorial"];
  return {
    title: `🤖 ${pick.title}`,
    body:
      `${pick.lead}\n\n` +
      `最近在做技术与 AI 自媒体，把 ${topic} 真正跑通后，` +
      `发现关键不在「会用」，而在「用对场景」。\n\n` +
      `1️⃣ 先想清楚要解决的具体任务，别上来就堆 prompt；\n` +
      `2️⃣ 把上下文、约束、输出格式写明确，可复现性翻倍；\n` +
      `3️⃣ 用小步快跑迭代，每次只改一个变量。\n\n` +
      `这套方法我在 LLM、Agent、RAG 几类工具上都验证过。\n` +
      `你最想看哪个工具的拆解？评论区告诉我～`,
    tags: ["#AI工具", "#AI效率", "#科技分享", "#提示词", "#AI自媒体"],
    coverTip: "竖版 3:4，深色界面截图叠大字标题，左上角放工具 logo。",
  };
}

/** Deterministic fallback for the e-commerce vertical. */
function ecommerceFallback(brief: string): PostDraft {
  const subject = brief.trim().slice(0, 12) || "新品";
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

function localFallback(brief: string, opts: WritePostOptions): PostDraft {
  return opts.vertical === "ai_tech"
    ? aiTechFallback(brief, opts.angle)
    : ecommerceFallback(brief);
}

/** Generate one 小红书 post draft from a brief. */
export async function writePost(
  projectId: string,
  brief: string,
  opts: WritePostOptions,
): Promise<PostDraft> {
  const trace = startTrace("content.copywriter", {
    projectId,
    vertical: opts.vertical,
    angle: opts.angle,
    tone: opts.tone,
  });

  if (!config.llm.live) {
    const draft = localFallback(brief, opts);
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
      system: systemPrompt(opts),
      prompt: `领域：${VERTICALS[opts.vertical].label}\n主题与要点：${brief}`,
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
    const draft = localFallback(brief, opts);
    await trace.end({ error: String(err), fallback: draft });
    return draft;
  }
}
