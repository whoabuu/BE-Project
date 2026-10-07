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
  AssessmentValidationError,
  validateAssessmentForTpo,
} from "../services/assessment-validation.service";

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
  "/:assessmentId/validate",
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

      const result = await validateAssessmentForTpo(
        tpoId,
        assessmentId
      );

      res.status(200).json({
        message: result.valid
          ? "Assessment validation passed"
          : "Assessment validation found issues",
        validation: result,
      });
    } catch (error) {
      if (error instanceof AssessmentValidationError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }

      console.error(
        "POST /tpo/assessments/:assessmentId/validate",
        error
      );

      res.status(500).json({
        message: "Unable to validate assessment",
      });
    }
  }
);

export default router;
