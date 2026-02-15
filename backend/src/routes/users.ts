import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth";
import { logAudit } from "../services/audit";

export const usersRouter = Router();

// All user management routes require ADMIN
usersRouter.use(authenticate, requireRole("ADMIN"));

const createUserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(200),
  role: z.enum(["VIEWER", "MOD", "ADMIN"]),
});

const updateUserSchema = z.object({
  role: z.enum(["VIEWER", "MOD", "ADMIN"]).optional(),
  password: z.string().min(6).max(200).optional(),
});

/**
 * GET /users — List all users
 */
usersRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  await logAudit(req, "LIST_USERS");
  res.json(users);
});

/**
 * POST /users — Create a new user
 */
usersRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { username, password, role } = parsed.data;

  // Check if username already exists
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, passwordHash, role },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  await logAudit(req, "CREATE_USER", username, { role });
  res.status(201).json(user);
});

/**
 * PATCH /users/:id — Update user role and/or password
 */
usersRouter.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });

    await logAudit(req, "UPDATE_USER", user.username, {
      fields: Object.keys(parsed.data),
    });
    res.json(user);
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

/**
 * DELETE /users/:id — Delete a user
 */
usersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  // Prevent self-deletion
  if (req.user?.userId === id) {
    res.status(400).json({ error: "Cannot delete yourself" });
    return;
  }

  try {
    const user = await prisma.user.delete({ where: { id } });
    await logAudit(req, "DELETE_USER", user.username);
    res.json({ ok: true, message: `User ${user.username} deleted` });
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});
