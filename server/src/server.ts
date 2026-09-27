import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import { prisma } from "./lib/prisma";

const app = express();
const port = Number(process.env.PORT ?? 5001);
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error", error);
  res.status(500).json({ message: "Internal server error" });
});

const server = app.listen(port, async () => {
  console.log(`TalentBridge API running at http://localhost:${port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
