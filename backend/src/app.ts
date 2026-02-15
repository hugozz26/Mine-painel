import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { mcRouter } from "./routes/mc";
import { auditRouter } from "./routes/audit";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Security headers
app.use(helmet());

// CORS — only allow the web panel origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));

// Routes
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/mc", mcRouter);
app.use("/audit", auditRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "minepanel-backend" });
});

// Global error handler
app.use(errorHandler);

export default app;
