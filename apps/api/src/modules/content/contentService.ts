/**
 * Content domain service — the 生文 module.
 *
 * Coordinates: the copywriting LLM ↔ the 小红书 spec linter ↔ post
 * persistence. A thin coordinator; publishing rules live in
 * content/xiaohongshu, domain guidance in content/verticals.
 */
import { nanoid } from "nanoid";
import type { AiAngle, PostTone, PostVertical, XhsPost } from "@looma/shared";
import { postRepository } from "../../db/repositories/postRepository.js";
import { projectRepository } from "../../db/repositories/projectRepository.js";
import { writePost } from "../../llm/copywriter.js";
import { validateXhsPost } from "../../content/xiaohongshu.js";
import { NotFoundError, ValidationError } from "../projects/projectService.js";

export interface GeneratePostInput {
  brief: string;
  vertical?: PostVertical;
  angle?: AiAngle;
  tone?: PostTone;
}

export const contentService = {
  listPosts(projectId: string): Promise<XhsPost[]> {
    return postRepository.listByProject(projectId);
  },

  /**
   * Generate one post: run the copywriter for the chosen vertical/angle, lint
   * the draft against the 小红书 spec, persist, and return it. Posts are
   * stored even when validation fails so the user can see and fix issues.
   */
  async generatePost(projectId: string, input: GeneratePostInput): Promise<XhsPost> {
    const brief = input.brief.trim();
    if (!brief) throw new ValidationError("请填写主题与要点");

    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("项目不存在");

    const vertical: PostVertical = input.vertical ?? "ecommerce";
    // Angle only applies to the AI/科技 vertical.
    const angle: AiAngle | null = vertical === "ai_tech" ? input.angle ?? "tutorial" : null;
    const tone: PostTone =
      input.tone ?? (vertical === "ai_tech" ? "professional" : "literary");

    const draft = await writePost(projectId, brief, { vertical, angle, tone });
    const validation = validateXhsPost(draft);

    return postRepository.insert({
      id: `post-${nanoid(10)}`,
      projectId,
      brief,
      vertical,
      angle,
      tone,
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      coverTip: draft.coverTip,
      validation,
    });
  },
};
