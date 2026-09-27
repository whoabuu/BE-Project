import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { signAccessToken } from "../utils/auth";

const router = Router();

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: unknown; password?: unknown };

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "A valid email is required" });
      return;
    }

    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "STUDENT",
        student: { create: {} },
      },
      select: {
        id: true,
        email: true,
        role: true,
        student: { select: { id: true, profileCompleted: true } },
      },
    });

    const token = signAccessToken(user);

    res.status(201).json({
      message: "Student account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("POST /auth/register", error);
    res.status(500).json({ message: "Unable to create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: unknown; password?: unknown };

    if (!isValidEmail(email) || typeof password !== "string") {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { student: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: "This account is inactive" });
      return;
    }

    const token = signAccessToken(user);
    const { passwordHash: _passwordHash, ...safeUser } = user;

    res.json({ message: "Login successful", token, user: safeUser });
  } catch (error) {
    console.error("POST /auth/login", error);
    res.status(500).json({ message: "Unable to login" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        student: { select: { id: true, profileCompleted: true } },
        recruiter: true,
        tpo: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("GET /auth/me", error);
    res.status(500).json({ message: "Unable to load account" });
  }
});

export default router;
