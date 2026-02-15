import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth";

export const auditRouter = Router();

// Only ADMIN can view audit logs
auditRouter.use(authenticate, requireRole("ADMIN"));

/**
 * GET /audit?page=1&limit=50
 * Returns paginated audit logs (newest first).
 */
auditRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  res.json({
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
