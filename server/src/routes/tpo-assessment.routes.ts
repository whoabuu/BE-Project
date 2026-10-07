import {
  Router,
  type Request,
  type Response,
} from "express";

import { prisma } from "../lib/prisma";

import {
  requireAuth,
  requireTPO,
} from "../middleware/auth";

import {
  AssessmentServiceError,
  createAssessment,
  deleteAssessment,
  getAssessmentForTpo,
  listAssessments,
  normalizeCreateInput,
  normalizeUpdateInput,
  updateAssessment,
} from "../services/assessment.service";

const router = Router();

router.use(
  requireAuth,
  requireTPO
);

async function getTpoId(
  userId: string
): Promise<string | null> {
  const tpo =
    await prisma.tPOProfile.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
      },
    });

  return tpo?.id ?? null;
}

function assessmentId(
  req: Request
): string {
  return String(
    req.params.assessmentId
  );
}

function handleError(
  res: Response,
  error: unknown,
  fallbackMessage: string
): void {
  if (
    error instanceof AssessmentServiceError
  ) {
    res.status(
      error.statusCode
    ).json({
      message: error.message,
    });

    return;
  }

  console.error(
    fallbackMessage,
    error
  );

  res.status(500).json({
    message: fallbackMessage,
  });
}

/*
 * POST /api/tpo/assessments
 *
 * Creates a new DRAFT assessment.
 */
router.post(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const tpoId =
        await getTpoId(
          req.user!.id
        );

      if (!tpoId) {
        res.status(403).json({
          message:
            "TPO profile not found",
        });

        return;
      }

      const input =
        normalizeCreateInput(
          req.body
        );

      const assessment =
        await createAssessment(
          tpoId,
          input
        );

      res.status(201).json({
        message:
          "Assessment draft created",

        assessment,
      });
    } catch (error) {
      handleError(
        res,
        error,
        "Unable to create assessment"
      );
    }
  }
);

/*
 * GET /api/tpo/assessments
 *
 * Lists only assessments created
 * by the authenticated TPO.
 */
router.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const tpoId =
        await getTpoId(
          req.user!.id
        );

      if (!tpoId) {
        res.status(403).json({
          message:
            "TPO profile not found",
        });

        return;
      }

      const assessments =
        await listAssessments(
          tpoId
        );

      res.json({
        assessments,
      });
    } catch (error) {
      handleError(
        res,
        error,
        "Unable to load assessments"
      );
    }
  }
);

/*
 * GET /api/tpo/assessments/:assessmentId
 *
 * Returns a single assessment
 * owned by the authenticated TPO.
 */
router.get(
  "/:assessmentId",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const tpoId =
        await getTpoId(
          req.user!.id
        );

      if (!tpoId) {
        res.status(403).json({
          message:
            "TPO profile not found",
        });

        return;
      }

      const assessment =
        await getAssessmentForTpo(
          tpoId,
          assessmentId(req)
        );

      res.json({
        assessment,
      });
    } catch (error) {
      handleError(
        res,
        error,
        "Unable to load assessment"
      );
    }
  }
);

/*
 * PATCH /api/tpo/assessments/:assessmentId
 *
 * Only DRAFT assessments can be edited.
 */
router.patch(
  "/:assessmentId",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const tpoId =
        await getTpoId(
          req.user!.id
        );

      if (!tpoId) {
        res.status(403).json({
          message:
            "TPO profile not found",
        });

        return;
      }

      const input =
        normalizeUpdateInput(
          req.body
        );

      const assessment =
        await updateAssessment(
          tpoId,
          assessmentId(req),
          input
        );

      res.json({
        message:
          "Assessment draft updated",

        assessment,
      });
    } catch (error) {
      handleError(
        res,
        error,
        "Unable to update assessment"
      );
    }
  }
);

/*
 * DELETE /api/tpo/assessments/:assessmentId
 *
 * Only DRAFT assessments can be deleted.
 */
router.delete(
  "/:assessmentId",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const tpoId =
        await getTpoId(
          req.user!.id
        );

      if (!tpoId) {
        res.status(403).json({
          message:
            "TPO profile not found",
        });

        return;
      }

      const result =
        await deleteAssessment(
          tpoId,
          assessmentId(req)
        );

      res.json({
        message:
          "Assessment draft deleted",

        assessmentId:
          result.id,
      });
    } catch (error) {
      handleError(
        res,
        error,
        "Unable to delete assessment"
      );
    }
  }
);

export default router;