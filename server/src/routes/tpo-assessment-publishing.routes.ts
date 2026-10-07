import {
  Router,
  type Request,
  type Response,
} from "express";
import {
  requireAuth,
  requireTPO,
} from "../middleware/auth";
import { prisma } from "../lib/prisma";
import {
  AssessmentPublishingError,
  publishAssessmentForTpo,
} from "../services/assessment-publishing.service";

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

router.post(
  "/:assessmentId/publish",
  async (req: Request, res: Response) => {
    try {
      const assessmentId = String(req.params.assessmentId);

      if (!assessmentId.trim()) {
        res.status(400).json({
          message: "Assessment ID is required",
        });
        return;
      }

      const tpoId = await getTpoId(req.user!.id);

      if (!tpoId) {
        res.status(403).json({
          message: "TPO profile not found",
        });
        return;
      }

      const assessment = await publishAssessmentForTpo(
        tpoId,
        assessmentId
      );

      res.status(200).json({
        message: "Assessment published successfully",
        assessment,
      });
    } catch (error) {
      if (error instanceof AssessmentPublishingError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }

      console.error(
        "POST /tpo/assessments/:assessmentId/publish",
        error
      );

      res.status(500).json({
        message: "Unable to publish assessment",
      });
    }
  }
);

export default router;
