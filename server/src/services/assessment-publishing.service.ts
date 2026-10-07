import { prisma } from "../lib/prisma";

export class AssessmentPublishingError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = "AssessmentPublishingError";
  }
}

export async function publishAssessmentForTpo(
  tpoId: string,
  assessmentId: string
) {
  return prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.findFirst({
      where: {
        id: assessmentId,
        createdByTpoId: tpoId,
      },
      include: {
        blueprint: true,
        questions: {
          select: {
            id: true,
            questionNumber: true,
            status: true,
          },
          orderBy: {
            questionNumber: "asc",
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new AssessmentPublishingError(
        "Assessment not found",
        404
      );
    }

    if (assessment.status !== "VALIDATED") {
      throw new AssessmentPublishingError(
        "Only VALIDATED assessments can be published",
        409
      );
    }

    if (assessment._count.attempts > 0) {
      throw new AssessmentPublishingError(
        "An assessment with student attempts cannot be published",
        409
      );
    }

    if (
      assessment.questions.length !==
      assessment.blueprint.numberOfQuestions
    ) {
      throw new AssessmentPublishingError(
        `Assessment has ${assessment.questions.length} questions, but the blueprint requires ${assessment.blueprint.numberOfQuestions}`,
        409
      );
    }

    const rejectedQuestion = assessment.questions.find(
      (question) => question.status !== "VALIDATED"
    );

    if (rejectedQuestion) {
      throw new AssessmentPublishingError(
        `Question ${rejectedQuestion.questionNumber} is not validated and cannot be published`,
        409
      );
    }

    const publishedAt = new Date();

    const published = await tx.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        status: "PUBLISHED",
        publishedAt,
      },
      include: {
        blueprint: true,
        questions: {
          orderBy: {
            questionNumber: "asc",
          },
          select: {
            id: true,
            questionNumber: true,
            type: true,
            section: true,
            difficulty: true,
            title: true,
            description: true,
            options: true,
            explanation: true,
            codingLanguage: true,
            starterCode: true,
            constraints: true,
            topics: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                testCases: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    return published;
  });
}
