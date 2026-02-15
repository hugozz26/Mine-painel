import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import { pluginFetch } from "../services/pluginProxy";
import { logAudit } from "../services/audit";

export const mcRouter = Router();

// All MC routes require authentication
mcRouter.use(authenticate);

// --- Allowed commands (backend-level whitelist, independent of plugin's) ---
const BACKEND_ALLOWED_COMMANDS = ["say", "kick", "ban", "tempban", "whitelist add", "whitelist remove"];

// --- Schemas ---
const whitelistSchema = z.object({
  name: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
});

const commandSchema = z.object({
  command: z.string().min(1).max(50),
  args: z.array(z.string().max(500)).default([]),
});

/**
 * GET /mc/health
 */
mcRouter.get("/health", async (req: Request, res: Response): Promise<void> => {
  const result = await pluginFetch({
    path: "/api/health",
    actor: req.user!.username,
  });
  res.status(result.status).json(result.data);
});

/**
 * GET /mc/players
 */
mcRouter.get("/players", async (req: Request, res: Response): Promise<void> => {
  const result = await pluginFetch({
    path: "/api/players",
    actor: req.user!.username,
  });
  res.status(result.status).json(result.data);
});

/**
 * GET /mc/player/:uuid
 */
mcRouter.get("/player/:uuid", async (req: Request, res: Response): Promise<void> => {
  const result = await pluginFetch({
    path: `/api/player/${req.params.uuid}`,
    actor: req.user!.username,
  });
  res.status(result.status).json(result.data);
});

/**
 * GET /mc/player/:uuid/inventory (MOD/ADMIN only)
 */
mcRouter.get(
  "/player/:uuid/inventory",
  requireRole("MOD"),
  async (req: Request, res: Response): Promise<void> => {
    await logAudit(req, "VIEW_INVENTORY", req.params.uuid);
    const result = await pluginFetch({
      path: `/api/player/${req.params.uuid}/inventory`,
      actor: req.user!.username,
    });
    res.status(result.status).json(result.data);
  }
);

/**
 * GET /mc/player/:uuid/enderchest (MOD/ADMIN only)
 */
mcRouter.get(
  "/player/:uuid/enderchest",
  requireRole("MOD"),
  async (req: Request, res: Response): Promise<void> => {
    await logAudit(req, "VIEW_ENDERCHEST", req.params.uuid);
    const result = await pluginFetch({
      path: `/api/player/${req.params.uuid}/enderchest`,
      actor: req.user!.username,
    });
    res.status(result.status).json(result.data);
  }
);

/**
 * GET /mc/whitelist
 */
mcRouter.get("/whitelist", async (req: Request, res: Response): Promise<void> => {
  const result = await pluginFetch({
    path: "/api/whitelist",
    actor: req.user!.username,
  });
  res.status(result.status).json(result.data);
});

/**
 * POST /mc/whitelist/add (MOD/ADMIN)
 */
mcRouter.post(
  "/whitelist/add",
  requireRole("MOD"),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = whitelistSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid player name" });
      return;
    }

    await logAudit(req, "WHITELIST_ADD", parsed.data.name);

    const result = await pluginFetch({
      method: "POST",
      path: "/api/whitelist/add",
      body: parsed.data,
      actor: req.user!.username,
    });
    res.status(result.status).json(result.data);
  }
);

/**
 * POST /mc/whitelist/remove (MOD/ADMIN)
 */
mcRouter.post(
  "/whitelist/remove",
  requireRole("MOD"),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = whitelistSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid player name" });
      return;
    }

    await logAudit(req, "WHITELIST_REMOVE", parsed.data.name);

    const result = await pluginFetch({
      method: "POST",
      path: "/api/whitelist/remove",
      body: parsed.data,
      actor: req.user!.username,
    });
    res.status(result.status).json(result.data);
  }
);

/**
 * POST /mc/command (MOD/ADMIN, whitelisted commands only)
 */
mcRouter.post(
  "/command",
  requireRole("MOD"),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = commandSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid command payload" });
      return;
    }

    const { command, args } = parsed.data;

    // Backend-level command whitelist check
    const fullCmd = args.length > 0 ? `${command} ${args.join(" ")}` : command;
    const isAllowed = BACKEND_ALLOWED_COMMANDS.some((allowed) =>
      fullCmd.toLowerCase().startsWith(allowed.toLowerCase())
    );

    if (!isAllowed) {
      await logAudit(req, "COMMAND_DENIED", undefined, { command: fullCmd });
      res.status(403).json({ error: `Command not allowed: ${command}` });
      return;
    }

    await logAudit(req, "COMMAND_EXEC", undefined, { command: fullCmd });

    const result = await pluginFetch({
      method: "POST",
      path: "/api/command",
      body: { command, args },
      actor: req.user!.username,
    });
    res.status(result.status).json(result.data);
  }
);
