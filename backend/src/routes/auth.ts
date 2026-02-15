import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import prisma from "../lib/prisma";
import { JwtPayload } from "../types";
import { logAudit } from "../services/audit";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "fallback-refresh-secret";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Rate limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(200),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * POST /auth/login
 */
authRouter.post("/login", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as JwtPayload["role"],
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  // Audit login
  req.user = payload;
  await logAudit(req, "LOGIN", user.username);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

/**
 * POST /auth/refresh
 */
authRouter.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing refresh token" });
    return;
  }

  try {
    const decoded = jwt.verify(parsed.data.refreshToken, REFRESH_SECRET) as JwtPayload;

    // Verify user still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as JwtPayload["role"],
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    res.json({ accessToken, refreshToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

/**
 * POST /auth/logout
 * Client-side logout (just acknowledges; tokens are stateless)
 */
authRouter.post("/logout", (_req: Request, res: Response): void => {
  // In a stateless JWT setup, logout is client-side.
  // For server-side invalidation, use a token blacklist (not implemented for simplicity).
  res.json({ ok: true, message: "Logged out. Discard your tokens." });
});
