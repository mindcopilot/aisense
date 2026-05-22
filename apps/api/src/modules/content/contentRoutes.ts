/**
 * HTTP routes for the 生文 (content generation) module.
 */
import { Router } from "express";
import { z } from "zod";
import { contentService } from "./contentService.js";
import { asyncHandler } from "../../http/asyncHandler.js";
import { XHS_SPEC, BANNED_WORDS } from "../../content/xiaohongshu.js";

const generateSchema = z.object({
  brief: z.string().min(1),
  tone: z.enum(["literary", "lively", "professional"]).optional(),
});

export const contentRoutes = Router();

/** Expose the 小红书 spec so the UI can show limits client-side. */
contentRoutes.get("/spec", (_req, res) => {
  res.json({ xhs: XHS_SPEC, bannedWords: BANNED_WORDS });
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
    const { brief, tone } = generateSchema.parse(req.body);
    const post = await contentService.generatePost(
      req.params.projectId as string,
      brief,
      tone,
    );
    res.status(201).json({ post });
  }),
);
