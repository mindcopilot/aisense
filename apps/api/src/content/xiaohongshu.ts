/**
 * 小红书发文规范 (Xiaohongshu publishing spec).
 *
 * Single source of truth for what a compliant 笔记 looks like — limits, the
 * banned-word list (China advertising-law 绝对化用语), and a linter. Both the
 * LLM prompt and the post-generation validation derive from here, so the rule
 * set lives in exactly one place.
 */
import type { XhsValidation, XhsValidationIssue } from "@looma/shared";

export const XHS_SPEC = {
  title: {
    /** Hard cap — 小红书 truncates titles beyond 20 characters. */
    max: 20,
    /** Below this a title rarely hooks readers. */
    recommendedMin: 8,
  },
  body: {
    /** 小红书 笔记 body hard limit. */
    max: 1000,
    recommendedMin: 120,
  },
  tags: {
    min: 3,
    max: 10,
  },
} as const;

/**
 * 绝对化用语 / 违禁词 — forbidden by China's advertising law and demoted by the
 * 小红书 algorithm. Multi-character phrases only, to avoid false positives.
 */
export const BANNED_WORDS = [
  "最佳", "最好", "最优", "最高级", "最先进", "最大", "最低",
  "第一", "国家级", "全球领先", "顶级", "极品", "绝无仅有",
  "100%", "纯天然", "根治", "特效", "万能", "独家", "唯一",
  "史上", "首选", "永久", "立竿见影",
] as const;

/** Count user-perceived characters (code points), so emoji count as one. */
export function charLength(text: string): number {
  return Array.from(text.trim()).length;
}

function findBannedWords(text: string): string[] {
  return BANNED_WORDS.filter((word) => text.includes(word));
}

/** Lint a draft post against {@link XHS_SPEC}. */
export function validateXhsPost(draft: {
  title: string;
  body: string;
  tags: string[];
}): XhsValidation {
  const issues: XhsValidationIssue[] = [];
  const titleLength = charLength(draft.title);
  const bodyLength = charLength(draft.body);
  const tagCount = draft.tags.length;

  if (titleLength === 0) {
    issues.push({ level: "error", field: "title", message: "标题不能为空" });
  } else if (titleLength > XHS_SPEC.title.max) {
    issues.push({
      level: "error",
      field: "title",
      message: `标题 ${titleLength} 字，超过 ${XHS_SPEC.title.max} 字上限`,
    });
  } else if (titleLength < XHS_SPEC.title.recommendedMin) {
    issues.push({
      level: "warning",
      field: "title",
      message: `标题偏短，建议不少于 ${XHS_SPEC.title.recommendedMin} 字以增强钩子`,
    });
  }

  if (bodyLength > XHS_SPEC.body.max) {
    issues.push({
      level: "error",
      field: "body",
      message: `正文 ${bodyLength} 字，超过 ${XHS_SPEC.body.max} 字上限`,
    });
  } else if (bodyLength < XHS_SPEC.body.recommendedMin) {
    issues.push({
      level: "warning",
      field: "body",
      message: `正文偏短，建议不少于 ${XHS_SPEC.body.recommendedMin} 字`,
    });
  }

  if (tagCount < XHS_SPEC.tags.min) {
    issues.push({
      level: "error",
      field: "tags",
      message: `话题标签至少 ${XHS_SPEC.tags.min} 个`,
    });
  } else if (tagCount > XHS_SPEC.tags.max) {
    issues.push({
      level: "warning",
      field: "tags",
      message: `话题标签建议不超过 ${XHS_SPEC.tags.max} 个`,
    });
  }
  for (const tag of draft.tags) {
    if (!tag.startsWith("#")) {
      issues.push({
        level: "warning",
        field: "tags",
        message: `话题「${tag}」应以 # 开头`,
      });
    }
  }

  const banned = findBannedWords(`${draft.title}\n${draft.body}`);
  for (const word of banned) {
    issues.push({
      level: "error",
      field: draft.title.includes(word) ? "title" : "body",
      message: `命中违禁/绝对化用语「${word}」，违反广告法且会被限流`,
    });
  }

  return {
    ok: !issues.some((i) => i.level === "error"),
    titleLength,
    bodyLength,
    tagCount,
    issues,
  };
}

/** The spec rendered as prompt guidance for the copywriting LLM. */
export const XHS_PROMPT_GUIDE = `小红书笔记发布规范：
- 标题：${XHS_SPEC.title.recommendedMin}-${XHS_SPEC.title.max} 字，首句即钩子，可用 1-2 个 emoji。
- 正文：${XHS_SPEC.body.recommendedMin}-${XHS_SPEC.body.max} 字，口语化、真实体验感，短段落分行，emoji 适量，关键词前置。
- 话题标签：${XHS_SPEC.tags.min}-${XHS_SPEC.tags.max} 个，均以 # 开头，紧扣品类与人群。
- 结尾自然引导互动（评论 / 收藏）。
- 严禁绝对化用语与违禁词（如：${BANNED_WORDS.slice(0, 8).join("、")} 等），违反广告法且会被限流。`;
