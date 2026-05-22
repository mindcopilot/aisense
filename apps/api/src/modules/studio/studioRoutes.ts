/**
 * HTTP routes for the Studio conversation.
 */
import { Router } from "express";
import { z } from "zod";
import { studioService } from "./studioService.js";
import { asyncHandler } from "../../http/asyncHandler.js";

const sendSchema = z.object({ text: z.string().min(1) });

export const studioRoutes = Router();

studioRoutes.get(
  "/:projectId/thread",
  asyncHandler(async (req, res) => {
    res.json(await studioService.getThread(req.params.projectId as string));
  }),
);

studioRoutes.post(
  "/:projectId/messages",
  asyncHandler(async (req, res) => {
    const { text } = sendSchema.parse(req.body);
    res.status(201).json(
      await studioService.sendMessage(req.params.projectId as string, text),
    );
  }),
);
