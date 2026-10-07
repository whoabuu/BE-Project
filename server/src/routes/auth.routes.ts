import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  comparePassword,
  hashPassword,
  signAccessToken,
} from "../utils/auth";
import { requireAuth } from "../middleware/auth";
import { sendStudentWelcomeEmail } from "../services/email";

const router = Router();

async function getNextStudentCode(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  const rows = await tx.$queryRaw<{ next_id: bigint }[]>`
    SELECT nextval('student_code_seq') AS next_id
  `;

  const nextId = Number(rows[0]?.next_id);

  if (!Number.isInteger(nextId) || nextId < 1001) {
    throw new Error("Unable to generate a valid student ID");
  }

  return `STD${nextId}`;
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters long" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const studentCode = await getNextStudentCode(tx);

      return tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "STUDENT",
          student: {
            create: {
              studentCode,
              verificationStatus: "PENDING",
            },
          },
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
              studentCode: true,
              profileCompleted: true,
              verificationStatus: true,
            },
          },
        },
      });
    });

    void sendStudentWelcomeEmail(user.email, user.student!.studentCode).catch((error) => {
      console.error("Student welcome email failed:", error);
    });

    const token = signAccessToken(user);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

router.post("/tpo/register", async (req, res) => {
  try {
    const { email, password, name, designation, department, registrationKey } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof registrationKey !== "string"
    ) {
      res.status(400).json({ message: "Email, password and registration key are required" });
      return;
    }

    if (!process.env.TPO_REGISTRATION_KEY || registrationKey !== process.env.TPO_REGISTRATION_KEY) {
      res.status(403).json({ message: "Invalid TPO registration key" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || password.length < 8) {
      res.status(400).json({ message: "A valid email and password of at least 8 characters are required" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "TPO",
        isVerified: true,
        tpo: {
          create: {
            name: typeof name === "string" ? name.trim() || null : null,
            designation: typeof designation === "string" ? designation.trim() || null : null,
            department: typeof department === "string" ? department.trim() || null : null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
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

    const token = signAccessToken(user);

    res.status(201).json({
      message: "TPO account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("TPO registration error:", error);
    res.status(500).json({ message: "Failed to create TPO account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            studentCode: true,
            firstName: true,
            lastName: true,
            profileCompleted: true,
            verificationStatus: true,
            verificationNote: true,
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
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: "Your account has been deactivated" });
      return;
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
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
        student: user.student,
        recruiter: user.recruiter,
        tpo: user.tpo,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
            studentCode: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            profileCompleted: true,
            verificationStatus: true,
            verificationNote: true,
            verifiedAt: true,
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
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to retrieve user" });
  }
});

export default router;
