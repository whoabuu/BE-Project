import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireTPO } from "../middleware/auth";
import {
  sendProfileRejectionEmail,
  sendProfileVerificationEmail,
} from "../services/email";

const router = Router();
router.use(requireAuth, requireTPO);

async function getTpoId(userId: string): Promise<string | null> {
  const tpo = await prisma.tPOProfile.findUnique({ where: { userId }, select: { id: true } });
  return tpo?.id ?? null;
}

function verificationStatus(value: unknown): "VERIFIED" | "REJECTED" | null {
  return value === "VERIFIED" || value === "REJECTED" ? value : null;
}

router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const [total, pending, verified, rejected, recentPending] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.studentProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.studentProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.studentProfile.count({ where: { verificationStatus: "REJECTED" } }),
      prisma.studentProfile.findMany({
        where: { verificationStatus: "PENDING" },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
          branch: true,
          profileCompleted: true,
          updatedAt: true,
        },
      }),
    ]);

    res.json({ stats: { total, pending, verified, rejected }, recentPending });
  } catch (error) {
    console.error("GET /tpo/dashboard", error);
    res.status(500).json({ message: "Unable to load TPO dashboard" });
  }
});

router.get("/students", async (_req: Request, res: Response) => {
  try {
    const students = await prisma.studentProfile.findMany({
      orderBy: [{ verificationStatus: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        studentCode: true,
        userId: true,
        firstName: true,
        lastName: true,
        collegeName: true,
        branch: true,
        enrollmentNumber: true,
        graduationYear: true,
        profileCompleted: true,
        verificationStatus: true,
        verificationNote: true,
        updatedAt: true,
        user: { select: { email: true } },
      },
    });

    res.json({
      students: students.map((student) => ({
        ...student,
        email: student.user.email,
        user: undefined,
      })),
    });
  } catch (error) {
    console.error("GET /tpo/students", error);
    res.status(500).json({ message: "Unable to load students" });
  }
});

router.get("/students/:studentId", async (req: Request, res: Response) => {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: String(req.params.studentId) },
      include: {
        user: { select: { email: true } },
        addresses: true,
        educations: true,
        skills: { include: { skill: { select: { name: true, category: true } } } },
        projects: true,
        experiences: true,
        certifications: true,
        achievements: true,
        socialLinks: true,
        resumes: { orderBy: { uploadedAt: "desc" } },
        preferences: true,
      },
    });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    const { user, ...profile } = student;
    res.json({ student: { ...profile, email: user.email } });
  } catch (error) {
    console.error("GET /tpo/students/:studentId", error);
    res.status(500).json({ message: "Unable to load student details" });
  }
});

router.patch("/students/:studentId/verification", async (req: Request, res: Response) => {
  try {
    const tpoId = await getTpoId(req.user!.id);

    if (!tpoId) {
      res.status(403).json({ message: "TPO profile not found" });
      return;
    }

    const status = verificationStatus(req.body?.status);
    const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";

    if (!status) {
      res.status(400).json({ message: "Status must be VERIFIED or REJECTED" });
      return;
    }

    if (status === "REJECTED" && !note) {
      res.status(400).json({ message: "A note is required when rejecting a profile" });
      return;
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: String(req.params.studentId) },
      select: {
        id: true,
        studentCode: true,
        userId: true,
        firstName: true,
        lastName: true,
        profileCompleted: true,
      },
    });

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    if (status === "VERIFIED" && student.profileCompleted < 100) {
      res.status(400).json({
        message: "The student profile must be 100% complete before it can be verified",
      });
      return;
    }

    const updated = await prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        verificationStatus: status,
        verificationNote: note || null,
        verifiedAt: status === "VERIFIED" ? new Date() : null,
        verifiedByTpoId: status === "VERIFIED" ? tpoId : null,
      },
      select: {
        id: true,
        studentCode: true,
        userId: true,
        firstName: true,
        lastName: true,
        collegeName: true,
        branch: true,
        enrollmentNumber: true,
        graduationYear: true,
        profileCompleted: true,
        verificationStatus: true,
        verificationNote: true,
        verifiedAt: true,
        updatedAt: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { email: true },
    });

    if (user?.email) {
      const studentName = [updated.firstName, updated.lastName].filter(Boolean).join(" ");
      const emailTask = status === "VERIFIED"
        ? sendProfileVerificationEmail(user.email, updated.studentCode, studentName)
        : sendProfileRejectionEmail(user.email, updated.studentCode, studentName, note);

      void emailTask.catch((error) => {
        console.error(`Profile ${status.toLowerCase()} email failed:`, error);
      });
    }

    res.json({
      message: status === "VERIFIED" ? "Student profile verified" : "Student profile rejected",
      student: { ...updated, email: user?.email ?? "" },
    });
  } catch (error) {
    console.error("PATCH /tpo/students/:studentId/verification", error);
    res.status(500).json({ message: "Unable to update verification status" });
  }
});

export default router;
