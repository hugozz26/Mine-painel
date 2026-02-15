import { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware.
 * Catches unhandled errors and returns a safe JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[Error]", err.message);
  res.status(500).json({ error: "Internal server error" });
}
