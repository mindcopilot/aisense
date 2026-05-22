/**
 * HTTP routes for the marketing-automation module.
 */
import { Router } from "express";
import { z } from "zod";
import { marketingService } from "./marketingService.js";
import { asyncHandler } from "../../http/asyncHandler.js";

const runSchema = z.object({ brief: z.string().min(1) });

const scheduleSchema = z.object({
  brief: z.string().min(1),
  intervalMinutes: z.number().int().min(1),
});

export const marketingRoutes = Router();

// ----- campaigns -----

marketingRoutes.get(
  "/campaigns",
  asyncHandler(async (_req, res) => {
    res.json(await marketingService.listCampaigns());
  }),
);

marketingRoutes.post(
  "/campaigns",
  asyncHandler(async (req, res) => {
    const { brief } = runSchema.parse(req.body);
    res.status(201).json(await marketingService.runCampaign(brief));
  }),
);

marketingRoutes.get(
  "/campaigns/:id",
  asyncHandler(async (req, res) => {
    res.json(await marketingService.getCampaign(req.params.id as string));
  }),
);

// ----- schedules -----

marketingRoutes.get(
  "/schedules",
  asyncHandler(async (_req, res) => {
    res.json(await marketingService.listSchedules());
  }),
);

marketingRoutes.post(
  "/schedules",
  asyncHandler(async (req, res) => {
    const { brief, intervalMinutes } = scheduleSchema.parse(req.body);
    res.status(201).json(
      await marketingService.createSchedule(brief, intervalMinutes),
    );
  }),
);

marketingRoutes.delete(
  "/schedules/:id",
  asyncHandler(async (req, res) => {
    await marketingService.cancelSchedule(req.params.id as string);
    res.status(204).end();
  }),
);
