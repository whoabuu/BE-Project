import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import {
  requireAuth,
  requireTPO,
} from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireTPO);

async function getTpoId(userId: string): Promise<string | null> {
  const tpo = await prisma.tPOProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  return tpo?.id ?? null;
}

function verificationStatus(value: unknown): "VERIFIED" | "REJECTED" | null {
  if (value === "VERIFIED" || value === "REJECTED") {
    return value;
  }

  return null;
}

router.get("/students", async (_req: Request, res: Response) => {
  try {
    const students = await prisma.studentProfile.findMany({
      orderBy: [
        {
          verificationStatus: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
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
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    res.json({
      students: students.map((student) => ({
        id: student.id,
        studentCode: student.studentCode,
        userId: student.userId,
        email: student.user.email,
        firstName: student.firstName,
        lastName: student.lastName,
        collegeName: student.collegeName,
        branch: student.branch,
        enrollmentNumber: student.enrollmentNumber,
        graduationYear: student.graduationYear,
        profileCompleted: student.profileCompleted,
        verificationStatus: student.verificationStatus,
        verificationNote: student.verificationNote,
        updatedAt: student.updatedAt,
      })),
    });
  } catch (error) {
    console.error("GET /tpo/students", error);
    res.status(500).json({
      message: "Unable to load students",
    });
  }
});

router.get(
  "/students/:studentId",
  async (req: Request, res: Response) => {
    try {
      const student = await prisma.studentProfile.findUnique({
        where: {
          id: String(req.params.studentId),
        },
        include: {
          skills: {
            include: {
              skill: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
          projects: true,
          educations: true,
          experiences: true,
          resumes: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      });

      if (!student) {
        res.status(404).json({
          message: "Student not found",
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          id: student.userId,
        },
        select: {
          email: true,
        },
      });

      res.json({
        student: {
          ...student,
          email: user?.email ?? "",
        },
      });
    } catch (error) {
      console.error("GET /tpo/students/:studentId", error);
      res.status(500).json({
        message: "Unable to load student details",
      });
    }
  }
);

router.patch(
  "/students/:studentId/verification",
  async (req: Request, res: Response) => {
    try {
      const tpoId = await getTpoId(req.user!.id);

      if (!tpoId) {
        res.status(403).json({
          message: "TPO profile not found",
        });
        return;
      }

      const status = verificationStatus(req.body?.status);

      if (!status) {
        res.status(400).json({
          message: "Status must be VERIFIED or REJECTED",
        });
        return;
      }

      const note =
        typeof req.body?.note === "string"
          ? req.body.note.trim()
          : "";

      if (status === "REJECTED" && !note) {
        res.status(400).json({
          message: "A note is required when rejecting a profile",
        });
        return;
      }

      const student = await prisma.studentProfile.findUnique({
        where: {
          id: String(req.params.studentId),
        },
        select: {
          id: true,
          profileCompleted: true,
        },
      });

      if (!student) {
        res.status(404).json({
          message: "Student not found",
        });
        return;
      }

      if (status === "VERIFIED" && student.profileCompleted < 100) {
        res.status(400).json({
          message:
            "The student profile must be 100% complete before it can be verified",
        });
        return;
      }

      const updated = await prisma.studentProfile.update({
        where: {
          id: student.id,
        },
        data: {
          verificationStatus: status,
          verificationNote: note || null,
          verifiedAt: status === "VERIFIED" ? new Date() : null,
          verifiedByTpoId: status === "VERIFIED" ? tpoId : null,
        },
        select: {
          id: true,
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
        },
      });

      const user = await prisma.user.findUnique({
        where: {
          id: updated.userId,
        },
        select: {
          email: true,
        },
      });

      res.json({
        message:
          status === "VERIFIED"
            ? "Student profile verified"
            : "Student profile rejected",
        student: {
          ...updated,
          email: user?.email ?? "",
        },
      });
    } catch (error) {
      console.error(
        "PATCH /tpo/students/:studentId/verification",
        error
      );
      res.status(500).json({
        message: "Unable to update verification status",
      });
    }
  }
);

export default router;
