import { Request } from "express";
import prisma from "../lib/prisma";

/**
 * Get real client IP, considering X-Forwarded-For from reverse proxy.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * Record an audit log entry.
 */
export async function logAudit(
  req: Request,
  action: string,
  target?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const actorUsername = req.user?.username || "anonymous";
  const actorRole = req.user?.role || "UNKNOWN";
  const ip = getClientIp(req);

  try {
    await prisma.auditLog.create({
      data: {
        actorUsername,
        actorRole,
        ip,
        action,
        target: target || null,
        detailsJson: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    console.error("[Audit] Failed to write audit log:", err);
  }
}
