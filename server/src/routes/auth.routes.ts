import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  comparePassword,
  hashPassword,
  signAccessToken,
} from "../utils/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * POST /api/auth/register
 *
 * Creates a new student account and an empty student profile.
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400).json({
        message: "Email is required",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      res.status(409).json({
        message: "An account with this email already exists",
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "STUDENT",

        student: {
          create: {},
        },
      },

      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = signAccessToken(user);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Failed to create account",
    });
  }
});

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },

      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        message: "Your account has been deactivated",
      });
      return;
    }

    const passwordMatches = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = signAccessToken(user);

    res.json({
      message: "Login successful",
      token,

      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Failed to login",
    });
  }
});

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's account.
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },

      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,

        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            profileCompleted: true,
          },
        },

        recruiter: {
          select: {
            id: true,
            name: true,
            designation: true,
            companyName: true,
          },
        },

        tpo: {
          select: {
            id: true,
            name: true,
            designation: true,
            department: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      message: "Failed to retrieve user",
    });
  }
});

export default router;