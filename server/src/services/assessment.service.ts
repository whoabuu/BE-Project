import { prisma } from "../lib/prisma";
import type {
  AptitudeSection,
  AssessmentType,
  Difficulty,
} from "../generated/prisma";

export interface AssessmentBlueprintInput {
  type: AssessmentType;
  title: string;
  description?: string | null;
  numberOfQuestions: number;
  durationMinutes: number;
  difficulty: Difficulty;
  aptitudeSections?: AptitudeSection[];
  dsaTopics?: string[];
  instructions?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export interface AssessmentBlueprintUpdateInput {
  type?: AssessmentType;
  title?: string;
  description?: string | null;
  numberOfQuestions?: number;
  durationMinutes?: number;
  difficulty?: Difficulty;
  aptitudeSections?: AptitudeSection[];
  dsaTopics?: string[];
  instructions?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export class AssessmentServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AssessmentServiceError";
    this.statusCode = statusCode;
  }
}

const DSA_QUESTION_COUNT = 3;
const DSA_DURATION_MINUTES = 90;

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_INSTRUCTIONS_LENGTH = 10000;
const MAX_DSA_TOPICS = 20;
const MAX_APTITUDE_SECTIONS = 4;

const APTITUDE_SECTIONS: AptitudeSection[] = [
  "QUANTITATIVE",
  "LOGICAL",
  "VERBAL",
  "TECHNICAL",
];

function cleanOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function cleanStringArray(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function cleanAptitudeSections(
  value: unknown
): AptitudeSection[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  return [
    ...new Set(
      value.filter(
        (item): item is AptitudeSection =>
          typeof item === "string" &&
          APTITUDE_SECTIONS.includes(item as AptitudeSection)
      )
    ),
  ];
}

function parseDate(
  value: unknown,
  fieldName: string
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new AssessmentServiceError(
      `${fieldName} must be a valid date`
    );
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AssessmentServiceError(
      `${fieldName} must be a valid date`
    );
  }

  return date;
}

function validateTitle(title: unknown): string {
  if (typeof title !== "string") {
    throw new AssessmentServiceError("Title is required");
  }

  const cleaned = title.trim();

  if (!cleaned) {
    throw new AssessmentServiceError("Title is required");
  }

  if (cleaned.length > MAX_TITLE_LENGTH) {
    throw new AssessmentServiceError(
      `Title must be ${MAX_TITLE_LENGTH} characters or fewer`
    );
  }

  return cleaned;
}

function validateDescription(
  value: unknown
): string | null | undefined {
  const cleaned = cleanOptionalText(value);

  if (
    cleaned !== undefined &&
    cleaned !== null &&
    cleaned.length > MAX_DESCRIPTION_LENGTH
  ) {
    throw new AssessmentServiceError(
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`
    );
  }

  if (
    value !== undefined &&
    value !== null &&
    typeof value !== "string"
  ) {
    throw new AssessmentServiceError(
      "Description must be text"
    );
  }

  return cleaned;
}

function validateInstructions(
  value: unknown
): string | null | undefined {
  const cleaned = cleanOptionalText(value);

  if (
    cleaned !== undefined &&
    cleaned !== null &&
    cleaned.length > MAX_INSTRUCTIONS_LENGTH
  ) {
    throw new AssessmentServiceError(
      `Instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or fewer`
    );
  }

  if (
    value !== undefined &&
    value !== null &&
    typeof value !== "string"
  ) {
    throw new AssessmentServiceError(
      "Instructions must be text"
    );
  }

  return cleaned;
}

function validateInteger(
  value: unknown,
  fieldName: string,
  minimum: number
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum
  ) {
    throw new AssessmentServiceError(
      `${fieldName} must be an integer greater than or equal to ${minimum}`
    );
  }

  return value;
}

function validateDifficulty(value: unknown): Difficulty {
  if (
    value !== "EASY" &&
    value !== "MEDIUM" &&
    value !== "HARD"
  ) {
    throw new AssessmentServiceError(
      "Difficulty must be EASY, MEDIUM, or HARD"
    );
  }

  return value;
}

function validateType(value: unknown): AssessmentType {
  if (value !== "DSA" && value !== "APTITUDE") {
    throw new AssessmentServiceError(
      "Assessment type must be DSA or APTITUDE"
    );
  }

  return value;
}

function validateConfiguration(input: {
  type: AssessmentType;
  numberOfQuestions: number;
  durationMinutes: number;
  aptitudeSections: AptitudeSection[];
  dsaTopics: string[];
}): void {
  /*
   * DSA rules:
   * - Exactly 3 questions
   * - Exactly 90 minutes
   * - Coding only
   * - No aptitude sections
   */
  if (input.type === "DSA") {
    if (input.numberOfQuestions !== DSA_QUESTION_COUNT) {
      throw new AssessmentServiceError(
        "DSA assessments must contain exactly 3 coding questions"
      );
    }

    if (input.durationMinutes !== DSA_DURATION_MINUTES) {
      throw new AssessmentServiceError(
        "DSA assessments must have a duration of exactly 90 minutes"
      );
    }

    if (input.aptitudeSections.length > 0) {
      throw new AssessmentServiceError(
        "DSA assessments cannot contain aptitude sections"
      );
    }

    if (input.dsaTopics.length > MAX_DSA_TOPICS) {
      throw new AssessmentServiceError(
        `A maximum of ${MAX_DSA_TOPICS} DSA topics is allowed`
      );
    }

    return;
  }

  /*
   * Aptitude rules:
   * - 1 to 100 questions
   * - 5 to 240 minutes
   * - At least one aptitude section
   * - DSA coding topics do not belong here
   */
  if (
    input.numberOfQuestions < 1 ||
    input.numberOfQuestions > 100
  ) {
    throw new AssessmentServiceError(
      "Aptitude assessments must contain between 1 and 100 questions"
    );
  }

  if (
    input.durationMinutes < 5 ||
    input.durationMinutes > 240
  ) {
    throw new AssessmentServiceError(
      "Aptitude duration must be between 5 and 240 minutes"
    );
  }

  if (input.aptitudeSections.length === 0) {
    throw new AssessmentServiceError(
      "Select at least one aptitude section"
    );
  }

  if (
    input.aptitudeSections.length > MAX_APTITUDE_SECTIONS
  ) {
    throw new AssessmentServiceError(
      `A maximum of ${MAX_APTITUDE_SECTIONS} aptitude sections is allowed`
    );
  }

  if (input.dsaTopics.length > 0) {
    throw new AssessmentServiceError(
      "Aptitude assessments cannot contain DSA coding topics"
    );
  }
}

function validateSchedule(
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined
): void {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new AssessmentServiceError(
      "endsAt must be later than startsAt"
    );
  }
}

export function normalizeCreateInput(
  body: unknown
): AssessmentBlueprintInput {
  if (!body || typeof body !== "object") {
    throw new AssessmentServiceError(
      "Request body must be an object"
    );
  }

  const data = body as Record<string, unknown>;

  const type = validateType(data.type);
  const title = validateTitle(data.title);

  const description = validateDescription(
    data.description
  );

  const instructions = validateInstructions(
    data.instructions
  );

  const difficulty = validateDifficulty(
    data.difficulty
  );

  const numberOfQuestions = validateInteger(
    data.numberOfQuestions,
    "numberOfQuestions",
    1
  );

  const durationMinutes = validateInteger(
    data.durationMinutes,
    "durationMinutes",
    1
  );

  if (
    data.aptitudeSections !== undefined &&
    !Array.isArray(data.aptitudeSections)
  ) {
    throw new AssessmentServiceError(
      "aptitudeSections must be an array"
    );
  }

  if (
    data.dsaTopics !== undefined &&
    !Array.isArray(data.dsaTopics)
  ) {
    throw new AssessmentServiceError(
      "dsaTopics must be an array"
    );
  }

  const aptitudeSections =
    cleanAptitudeSections(data.aptitudeSections) ?? [];

  const dsaTopics =
    cleanStringArray(data.dsaTopics) ?? [];

  if (
    data.aptitudeSections !== undefined &&
    aptitudeSections.length !==
      (data.aptitudeSections as unknown[]).length
  ) {
    throw new AssessmentServiceError(
      "aptitudeSections contains an invalid section"
    );
  }

  if (
    data.dsaTopics !== undefined &&
    dsaTopics.length !==
      (data.dsaTopics as unknown[]).length
  ) {
    throw new AssessmentServiceError(
      "dsaTopics must contain only non-empty strings"
    );
  }

  if (dsaTopics.length > MAX_DSA_TOPICS) {
    throw new AssessmentServiceError(
      `A maximum of ${MAX_DSA_TOPICS} DSA topics is allowed`
    );
  }

  const startsAt = parseDate(
    data.startsAt,
    "startsAt"
  );

  const endsAt = parseDate(
    data.endsAt,
    "endsAt"
  );

  validateConfiguration({
    type,
    numberOfQuestions,
    durationMinutes,
    aptitudeSections,
    dsaTopics,
  });

  validateSchedule(startsAt, endsAt);

  return {
    type,
    title,
    description,
    numberOfQuestions,
    durationMinutes,
    difficulty,
    aptitudeSections,
    dsaTopics,
    instructions,
    startsAt,
    endsAt,
  };
}

export function normalizeUpdateInput(
  body: unknown
): AssessmentBlueprintUpdateInput {
  if (!body || typeof body !== "object") {
    throw new AssessmentServiceError(
      "Request body must be an object"
    );
  }

  const data = body as Record<string, unknown>;

  const result: AssessmentBlueprintUpdateInput = {};

  if (data.type !== undefined) {
    result.type = validateType(data.type);
  }

  if (data.title !== undefined) {
    result.title = validateTitle(data.title);
  }

  if (data.description !== undefined) {
    result.description = validateDescription(
      data.description
    );
  }

  if (data.instructions !== undefined) {
    result.instructions = validateInstructions(
      data.instructions
    );
  }

  if (data.difficulty !== undefined) {
    result.difficulty = validateDifficulty(
      data.difficulty
    );
  }

  if (data.numberOfQuestions !== undefined) {
    result.numberOfQuestions = validateInteger(
      data.numberOfQuestions,
      "numberOfQuestions",
      1
    );
  }

  if (data.durationMinutes !== undefined) {
    result.durationMinutes = validateInteger(
      data.durationMinutes,
      "durationMinutes",
      1
    );
  }

  if (data.aptitudeSections !== undefined) {
    if (!Array.isArray(data.aptitudeSections)) {
      throw new AssessmentServiceError(
        "aptitudeSections must be an array"
      );
    }

    result.aptitudeSections =
      cleanAptitudeSections(
        data.aptitudeSections
      ) ?? [];

    if (
      result.aptitudeSections.length !==
      data.aptitudeSections.length
    ) {
      throw new AssessmentServiceError(
        "aptitudeSections contains an invalid section"
      );
    }
  }

  if (data.dsaTopics !== undefined) {
    if (!Array.isArray(data.dsaTopics)) {
      throw new AssessmentServiceError(
        "dsaTopics must be an array"
      );
    }

    result.dsaTopics =
      cleanStringArray(data.dsaTopics) ?? [];

    if (
      result.dsaTopics.length !==
      data.dsaTopics.length
    ) {
      throw new AssessmentServiceError(
        "dsaTopics must contain only non-empty strings"
      );
    }
  }

  if (data.startsAt !== undefined) {
    result.startsAt = parseDate(
      data.startsAt,
      "startsAt"
    );
  }

  if (data.endsAt !== undefined) {
    result.endsAt = parseDate(
      data.endsAt,
      "endsAt"
    );
  }

  if (Object.keys(result).length === 0) {
    throw new AssessmentServiceError(
      "At least one field is required to update an assessment"
    );
  }

  if (
    result.dsaTopics &&
    result.dsaTopics.length > MAX_DSA_TOPICS
  ) {
    throw new AssessmentServiceError(
      `A maximum of ${MAX_DSA_TOPICS} DSA topics is allowed`
    );
  }

  if (
    result.startsAt !== undefined ||
    result.endsAt !== undefined
  ) {
    validateSchedule(
      result.startsAt,
      result.endsAt
    );
  }

  return result;
}

function buildBlueprintData(
  input: AssessmentBlueprintInput
) {
  return {
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    numberOfQuestions: input.numberOfQuestions,
    durationMinutes: input.durationMinutes,
    difficulty: input.difficulty,
    aptitudeSections:
      input.aptitudeSections ?? [],
    dsaTopics: input.dsaTopics ?? [],
  };
}

function buildAssessmentData(
  input: AssessmentBlueprintInput
) {
  return {
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    durationMinutes: input.durationMinutes,
    difficulty: input.difficulty,
    status: "DRAFT" as const,
    instructions: input.instructions ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
  };
}

export async function createAssessment(
  tpoId: string,
  input: AssessmentBlueprintInput
) {
  return prisma.$transaction(async (tx) => {
    const blueprint =
      await tx.assessmentBlueprint.create({
        data: buildBlueprintData(input),
      });

    return tx.assessment.create({
      data: {
        blueprintId: blueprint.id,
        createdByTpoId: tpoId,
        ...buildAssessmentData(input),
      },
      include: {
        blueprint: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });
  });
}

export async function listAssessments(
  tpoId: string
) {
  return prisma.assessment.findMany({
    where: {
      createdByTpoId: tpoId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      blueprint: true,
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
  });
}

export async function getAssessmentForTpo(
  tpoId: string,
  assessmentId: string
) {
  const assessment =
    await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        createdByTpoId: tpoId,
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

  if (!assessment) {
    throw new AssessmentServiceError(
      "Assessment not found",
      404
    );
  }

  return assessment;
}

export async function updateAssessment(
  tpoId: string,
  assessmentId: string,
  input: AssessmentBlueprintUpdateInput
) {
  return prisma.$transaction(async (tx) => {
    const existing =
      await tx.assessment.findFirst({
        where: {
          id: assessmentId,
          createdByTpoId: tpoId,
        },

        include: {
          blueprint: true,
        },
      });

    if (!existing) {
      throw new AssessmentServiceError(
        "Assessment not found",
        404
      );
    }

    if (existing.status !== "DRAFT") {
      throw new AssessmentServiceError(
        "Only DRAFT assessments can be edited"
      );
    }

    const merged: AssessmentBlueprintInput = {
      type: input.type ?? existing.type,

      title:
        input.title ??
        existing.title,

      description:
        input.description !== undefined
          ? input.description
          : existing.description,

      numberOfQuestions:
        input.numberOfQuestions ??
        existing.blueprint.numberOfQuestions,

      durationMinutes:
        input.durationMinutes ??
        existing.durationMinutes,

      difficulty:
        input.difficulty ??
        existing.difficulty,

      aptitudeSections:
        input.aptitudeSections !== undefined
          ? input.aptitudeSections
          : existing.blueprint.aptitudeSections,

      dsaTopics:
        input.dsaTopics !== undefined
          ? input.dsaTopics
          : existing.blueprint.dsaTopics,

      instructions:
        input.instructions !== undefined
          ? input.instructions
          : existing.instructions,

      startsAt:
        input.startsAt !== undefined
          ? input.startsAt
          : existing.startsAt,

      endsAt:
        input.endsAt !== undefined
          ? input.endsAt
          : existing.endsAt,
    };

    validateConfiguration({
      type: merged.type,
      numberOfQuestions:
        merged.numberOfQuestions,
      durationMinutes:
        merged.durationMinutes,
      aptitudeSections:
        merged.aptitudeSections ?? [],
      dsaTopics:
        merged.dsaTopics ?? [],
    });

    validateSchedule(
      merged.startsAt,
      merged.endsAt
    );

    await tx.assessmentBlueprint.update({
      where: {
        id: existing.blueprintId,
      },

      data: buildBlueprintData(merged),
    });

    return tx.assessment.update({
      where: {
        id: existing.id,
      },

      data: buildAssessmentData(merged),

      include: {
        blueprint: true,

        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });
  });
}

export async function deleteAssessment(
  tpoId: string,
  assessmentId: string
) {
  return prisma.$transaction(async (tx) => {
    const existing =
      await tx.assessment.findFirst({
        where: {
          id: assessmentId,
          createdByTpoId: tpoId,
        },

        select: {
          id: true,
          blueprintId: true,
          status: true,
        },
      });

    if (!existing) {
      throw new AssessmentServiceError(
        "Assessment not found",
        404
      );
    }

    if (existing.status !== "DRAFT") {
      throw new AssessmentServiceError(
        "Only DRAFT assessments can be deleted"
      );
    }

    const attempts =
      await tx.assessmentAttempt.count({
        where: {
          assessmentId: existing.id,
        },
      });

    if (attempts > 0) {
      throw new AssessmentServiceError(
        "This assessment has student attempts and cannot be deleted"
      );
    }

    await tx.assessment.delete({
      where: {
        id: existing.id,
      },
    });

    await tx.assessmentBlueprint.delete({
      where: {
        id: existing.blueprintId,
      },
    });

    return {
      id: existing.id,
    };
  });
}