/**
 * HTTP routes for the 生文 (content generation) module.
 */
import { Router } from "express";
import { z } from "zod";
import { contentService } from "./contentService.js";
import { asyncHandler } from "../../http/asyncHandler.js";
import { XHS_SPEC, BANNED_WORDS } from "../../content/xiaohongshu.js";
import { VERTICALS, AI_ANGLES } from "../../content/verticals.js";

const generateSchema = z.object({
  brief: z.string().min(1),
  vertical: z.enum(["ecommerce", "ai_tech"]).optional(),
  angle: z.enum(["tutorial", "review", "news", "opinion"]).optional(),
  tone: z.enum(["literary", "lively", "professional"]).optional(),
});

export const contentRoutes = Router();

/** Expose the 小红书 spec + verticals so the UI can render options. */
contentRoutes.get("/spec", (_req, res) => {
  res.json({
    xhs: XHS_SPEC,
    bannedWords: BANNED_WORDS,
    verticals: Object.fromEntries(
      Object.entries(VERTICALS).map(([k, v]) => [k, { label: v.label }]),
    ),
    aiAngles: Object.fromEntries(
      Object.entries(AI_ANGLES).map(([k, v]) => [k, { label: v.label }]),
    ),
  });
});

contentRoutes.get(
  "/:projectId/posts",
  asyncHandler(async (req, res) => {
    res.json(await contentService.listPosts(req.params.projectId as string));
  }),
);

contentRoutes.post(
  "/:projectId/posts",
  asyncHandler(async (req, res) => {
    const input = generateSchema.parse(req.body);
    const post = await contentService.generatePost(
      req.params.projectId as string,
      input,
    );
    res.status(201).json({ post });
  }),
);
