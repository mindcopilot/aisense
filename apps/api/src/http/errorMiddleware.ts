/**
 * Central error handler — maps domain + validation errors to HTTP statuses.
 */
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { NotFoundError, ValidationError } from "../modules/projects/projectService.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "请求参数无效", details: err.issues });
    return;
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  console.error("[api] unhandled error", err);
  res.status(500).json({ error: "服务器内部错误" });
}
