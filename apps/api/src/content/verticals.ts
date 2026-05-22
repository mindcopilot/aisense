/**
 * Content verticals — the domain layer on top of the generic 小红书 spec.
 *
 * The 小红书 format rules (lengths, banned words) live in `xiaohongshu.ts`.
 * This module adds *what to write about*: per-vertical prompt guidance, seed
 * tags, and — for the AI/科技 vertical — per-angle structure. Adding a new
 * vertical means adding one entry here; nothing else needs to change.
 */
import type { AiAngle, PostVertical } from "@looma/shared";

export interface VerticalDef {
  label: string;
  /** Domain guidance appended to the copywriter system prompt. */
  guide: string;
  /** Seed tags woven into generated posts for this vertical. */
  seedTags: string[];
}

export const VERTICALS: Record<PostVertical, VerticalDef> = {
  ecommerce: {
    label: "电商种草",
    guide:
      "你写电商种草笔记：聚焦产品体验、面料/质感、使用场景与搭配，" +
      "真实体验感优先，自然引导收藏与互动。",
    seedTags: ["#好物分享", "#种草", "#新品安利"],
  },
  ai_tech: {
    label: "AI · 科技",
    guide:
      "你写 AI / 科技自媒体笔记，面向想用 AI 提效的从业者与爱好者。要求：" +
      "信息密度高、可信、可复现；准确使用术语（LLM、Agent、RAG、多模态、" +
      "上下文窗口、MCP 等），不滥用；强调对读者的实际价值；" +
      "拒绝标题党与夸大，结论克制；必要时给出具体步骤、对比或数据。",
    seedTags: ["#AI工具", "#AI效率", "#科技分享", "#提示词"],
  },
};

export interface AngleDef {
  label: string;
  /** Structural guidance for this angle. */
  guide: string;
}

/** Content angles for the ai_tech vertical. */
export const AI_ANGLES: Record<AiAngle, AngleDef> = {
  tutorial: {
    label: "教程实操",
    guide:
      "体裁=分步教程：给出可照做复现的步骤，包含关键设置或示例 prompt，" +
      "每步一句话说清「做什么 + 为什么」，结尾给一个进阶提示。",
  },
  review: {
    label: "工具测评",
    guide:
      "体裁=工具测评：横向对比同类工具，分点列优点、短板与适用场景，" +
      "给出明确但克制的选型结论，避免一边倒。",
  },
  news: {
    label: "资讯快讯",
    guide:
      "体裁=资讯快讯：突出时效，用 3 个要点讲清「发生了什么」，" +
      "并补一句「对读者/行业意味着什么」。",
  },
  opinion: {
    label: "深度观点",
    guide:
      "体裁=深度观点：提出一个有信息量、可被讨论的判断，给出 2-3 条支撑，" +
      "承认不确定性，避免空泛口号。",
  },
};

/**
 * Compose the domain-specific portion of the copywriter system prompt for a
 * given vertical (+ angle, when ai_tech).
 */
export function buildDomainGuide(
  vertical: PostVertical,
  angle: AiAngle | null,
): string {
  const v = VERTICALS[vertical];
  if (vertical === "ai_tech" && angle) {
    return `${v.guide}\n${AI_ANGLES[angle].guide}`;
  }
  return v.guide;
}
