/**
 * HTTP routes for projects. Translates requests to service calls; all domain
 * logic lives in projectService.
 */
import { Router } from "express";
import { z } from "zod";
import { projectService } from "./projectService.js";
import { asyncHandler } from "../../http/asyncHandler.js";

const createSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
});

export const projectRoutes = Router();

projectRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await projectService.list());
  }),
);

projectRoutes.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    res.status(201).json(await projectService.create(body));
  }),
);

projectRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await projectService.getDetail(req.params.id as string));
  }),
);
