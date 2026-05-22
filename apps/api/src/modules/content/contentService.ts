/**
 * Content domain service — the 生文 module.
 *
 * Coordinates: the copywriting LLM ↔ the 小红书 spec linter ↔ post
 * persistence. A thin coordinator; the publishing rules live in
 * content/xiaohongshu and the LLM call in llm/copywriter.
 */
import { nanoid } from "nanoid";
import type { PostTone, XhsPost } from "@looma/shared";
import { postRepository } from "../../db/repositories/postRepository.js";
import { projectRepository } from "../../db/repositories/projectRepository.js";
import { writePost } from "../../llm/copywriter.js";
import { validateXhsPost } from "../../content/xiaohongshu.js";
import { NotFoundError, ValidationError } from "../projects/projectService.js";

export const contentService = {
  listPosts(projectId: string): Promise<XhsPost[]> {
    return postRepository.listByProject(projectId);
  },

  /**
   * Generate one 小红书 post for a project: run the copywriter, lint the
   * draft against the publishing spec, persist, and return it. The post is
   * stored even when validation fails so the user can see and fix the issues.
   */
  async generatePost(
    projectId: string,
    brief: string,
    tone: PostTone = "literary",
  ): Promise<XhsPost> {
    const trimmed = brief.trim();
    if (!trimmed) throw new ValidationError("请填写产品与卖点");

    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError("项目不存在");

    const draft = await writePost(projectId, trimmed, tone);
    const validation = validateXhsPost(draft);

    return postRepository.insert({
      id: `post-${nanoid(10)}`,
      projectId,
      brief: trimmed,
      tone,
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      coverTip: draft.coverTip,
      validation,
    });
  },
};
