import { prisma } from "../lib/prisma";
import type {
  AptitudeSection,
  AssessmentQuestion,
  Difficulty,
  TestCase,
} from "../generated/prisma";

export type ValidationSeverity = "ERROR" | "WARNING";
export type ValidationScope = "ASSESSMENT" | "QUESTION" | "TEST_CASE";

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  scope: ValidationScope;
  message: string;
  questionId?: string;
  questionNumber?: number;
  testCaseId?: string;
  field?: string;
}

export interface QuestionValidationResult {
  questionId: string;
  questionNumber: number;
  valid: boolean;
  status: "VALIDATED" | "REJECTED";
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface AssessmentValidationResult {
  assessmentId: string;
  statusBefore: string;
  statusAfter: string;
  valid: boolean;
  validatedAt: string;
  summary: {
    totalQuestions: number;
    passedQuestions: number;
    failedQuestions: number;
    errorCount: number;
    warningCount: number;
  };
  assessmentIssues: ValidationIssue[];
  questions: QuestionValidationResult[];
}

export class AssessmentValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AssessmentValidationError";
    this.statusCode = statusCode;
  }
}

const ALLOWED_APTITUDE_SECTIONS = new Set<AptitudeSection>([
  "QUANTITATIVE",
  "LOGICAL",
  "VERBAL",
  "TECHNICAL",
]);

const SUPPORTED_CODING_LANGUAGES = new Set([
  "python",
  "java",
  "c++",
  "cpp",
  "javascript",
  "typescript",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedText(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

function addIssue(
  target: ValidationIssue[],
  issue: Omit<ValidationIssue, "severity"> & { severity?: ValidationSeverity }
): void {
  target.push({
    ...issue,
    severity: issue.severity ?? "ERROR",
  });
}

function validateTestCases(
  question: AssessmentQuestion & { testCases: TestCase[] },
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  if (question.testCases.length < 3) {
    addIssue(errors, {
      code: "INSUFFICIENT_TEST_CASES",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "testCases",
      message: "A coding question must contain at least 3 test cases.",
    });
  }

  if (question.testCases.length > 20) {
    addIssue(errors, {
      code: "TOO_MANY_TEST_CASES",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "testCases",
      message: "A coding question cannot contain more than 20 test cases.",
    });
  }

  const signatures = new Set<string>();
  let visibleTestCaseCount = 0;
  let hiddenTestCaseCount = 0;

  for (const [index, testCase] of question.testCases.entries()) {
    const prefix = `Test case ${index + 1}`;

    if (testCase.input === undefined) {
      addIssue(errors, {
        code: "MISSING_TEST_INPUT",
        scope: "TEST_CASE",
        questionId: question.id,
        questionNumber: question.questionNumber,
        testCaseId: testCase.id,
        field: "input",
        message: `${prefix} has no input value.`,
      });
    }

    if (testCase.expectedOutput === undefined) {
      addIssue(errors, {
        code: "MISSING_EXPECTED_OUTPUT",
        scope: "TEST_CASE",
        questionId: question.id,
        questionNumber: question.questionNumber,
        testCaseId: testCase.id,
        field: "expectedOutput",
        message: `${prefix} has no expected output value.`,
      });
    }

    const signature = safeJsonSignature({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
    });

    if (signature && signatures.has(signature)) {
      addIssue(errors, {
        code: "DUPLICATE_TEST_CASE",
        scope: "TEST_CASE",
        questionId: question.id,
        questionNumber: question.questionNumber,
        testCaseId: testCase.id,
        message: `${prefix} duplicates another test case input/output pair.`,
      });
    }

    if (signature) {
      signatures.add(signature);
    }

    if (!Number.isFinite(testCase.weight) || testCase.weight <= 0) {
      addIssue(errors, {
        code: "INVALID_TEST_WEIGHT",
        scope: "TEST_CASE",
        questionId: question.id,
        questionNumber: question.questionNumber,
        testCaseId: testCase.id,
        field: "weight",
        message: `${prefix} must have a positive finite weight.`,
      });
    }

    if (testCase.isHidden) {
      hiddenTestCaseCount += 1;
    } else {
      visibleTestCaseCount += 1;
    }
  }

  if (visibleTestCaseCount === 0) {
    addIssue(errors, {
      code: "MISSING_VISIBLE_SAMPLE_TEST_CASE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "testCases",
      message: "A coding question must contain at least one visible sample test case for students.",
    });
  }

  if (hiddenTestCaseCount === 0) {
    addIssue(errors, {
      code: "MISSING_HIDDEN_TEST_CASE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "testCases",
      message: "A coding question must contain at least one hidden evaluation test case.",
    });
  }
}

function safeJsonSignature(value: unknown): string | null {
  try {
    return JSON.stringify(value) ?? null;
  } catch {
    return null;
  }
}

function validateCodingQuestion(
  question: AssessmentQuestion & { testCases: TestCase[] },
  expectedDifficulty: Difficulty,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  if (question.type !== "CODING") {
    addIssue(errors, {
      code: "INVALID_QUESTION_TYPE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "type",
      message: "DSA assessments may contain coding questions only.",
    });
  }

  if (question.section !== null) {
    addIssue(errors, {
      code: "INVALID_DSA_SECTION",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "section",
      message: "DSA coding questions must not have an aptitude section.",
    });
  }

  if (question.difficulty !== expectedDifficulty) {
    addIssue(errors, {
      code: "DIFFICULTY_MISMATCH",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "difficulty",
      message: `Question difficulty must match the assessment difficulty (${expectedDifficulty}).`,
    });
  }

  if (!normalizedText(question.title)) {
    addIssue(errors, {
      code: "MISSING_TITLE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "title",
      message: "Coding question title is required.",
    });
  }

  if (!normalizedText(question.description)) {
    addIssue(errors, {
      code: "MISSING_DESCRIPTION",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "description",
      message: "Coding question description is required.",
    });
  }

  if (!normalizedText(question.constraints)) {
    addIssue(errors, {
      code: "MISSING_CONSTRAINTS",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "constraints",
      message: "Coding question constraints are required.",
    });
  }

  if (!question.topics.length) {
    addIssue(errors, {
      code: "MISSING_TOPICS",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "topics",
      message: "Coding question must contain at least one topic.",
    });
  }

  const language = normalizedText(question.codingLanguage);
  if (!language) {
    addIssue(errors, {
      code: "MISSING_CODING_LANGUAGE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "codingLanguage",
      message: "Coding language is required.",
    });
  } else if (!SUPPORTED_CODING_LANGUAGES.has(language)) {
    addIssue(warnings, {
      code: "UNRECOGNIZED_CODING_LANGUAGE",
      severity: "WARNING",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "codingLanguage",
      message: `Coding language "${question.codingLanguage}" is not in the currently supported validation list and should be reviewed before publishing.`,
    });
  }

  if (!normalizedText(question.starterCode as unknown)) {
    addIssue(errors, {
      code: "MISSING_STARTER_CODE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "starterCode",
      message: "Coding question starter code is required for the current DSA assessment flow.",
    });
  }

  validateTestCases(question, errors, warnings);

  const description = normalizedText(question.description);
  if (!description.includes("input")) {
    addIssue(warnings, {
      code: "INPUT_DESCRIPTION_REVIEW",
      severity: "WARNING",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "description",
      message: "Description does not explicitly mention input. Review the problem statement manually.",
    });
  }

  if (!description.includes("output") && !description.includes("return")) {
    addIssue(warnings, {
      code: "OUTPUT_DESCRIPTION_REVIEW",
      severity: "WARNING",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "description",
      message: "Description does not explicitly mention output/return behavior. Review the problem statement manually.",
    });
  }
}

function validateMcqQuestion(
  question: AssessmentQuestion & { testCases: TestCase[] },
  expectedDifficulty: Difficulty,
  allowedSections: AptitudeSection[],
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  if (question.type !== "MCQ") {
    addIssue(errors, {
      code: "INVALID_QUESTION_TYPE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "type",
      message: "Aptitude assessments may contain MCQs only.",
    });
  }

  if (!question.section || !ALLOWED_APTITUDE_SECTIONS.has(question.section)) {
    addIssue(errors, {
      code: "MISSING_OR_INVALID_SECTION",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "section",
      message: "Aptitude MCQ must have a valid aptitude section.",
    });
  } else if (!allowedSections.includes(question.section)) {
    addIssue(errors, {
      code: "SECTION_NOT_SELECTED",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "section",
      message: `Question section ${question.section} was not selected in the assessment blueprint.`,
    });
  }

  if (question.difficulty !== expectedDifficulty) {
    addIssue(errors, {
      code: "DIFFICULTY_MISMATCH",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "difficulty",
      message: `Question difficulty must match the assessment difficulty (${expectedDifficulty}).`,
    });
  }

  if (!normalizedText(question.title)) {
    addIssue(errors, {
      code: "MISSING_TITLE",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "title",
      message: "MCQ title is required.",
    });
  }

  if (!normalizedText(question.description)) {
    addIssue(errors, {
      code: "MISSING_DESCRIPTION",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "description",
      message: "MCQ description is required.",
    });
  }

  if (!question.topics.length) {
    addIssue(errors, {
      code: "MISSING_TOPICS",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "topics",
      message: "MCQ must contain at least one topic.",
    });
  }

  const options = question.options;
  if (!Array.isArray(options) || options.length !== 4) {
    addIssue(errors, {
      code: "INVALID_OPTION_COUNT",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "options",
      message: "Every MCQ must contain exactly 4 options.",
    });
  } else {
    const keys: string[] = [];

    options.forEach((option, index) => {
      if (!isRecord(option)) {
        addIssue(errors, {
          code: "INVALID_OPTION",
          scope: "QUESTION",
          questionId: question.id,
          questionNumber: question.questionNumber,
          field: "options",
          message: `Option ${index + 1} is not a valid option object.`,
        });
        return;
      }

      const key = normalizedText(option.key);
      const text = normalizedText(option.text);

      if (!key || !text) {
        addIssue(errors, {
          code: "INCOMPLETE_OPTION",
          scope: "QUESTION",
          questionId: question.id,
          questionNumber: question.questionNumber,
          field: "options",
          message: `Option ${index + 1} must contain a key and text.`,
        });
      }

      keys.push(key);
    });

    if (new Set(keys).size !== keys.length) {
      addIssue(errors, {
        code: "DUPLICATE_OPTION_KEYS",
        scope: "QUESTION",
        questionId: question.id,
        questionNumber: question.questionNumber,
        field: "options",
        message: "MCQ option keys must be unique.",
      });
    }

    const correctAnswer = normalizedText(question.correctAnswer as unknown);
    if (!correctAnswer) {
      addIssue(errors, {
        code: "MISSING_CORRECT_ANSWER",
        scope: "QUESTION",
        questionId: question.id,
        questionNumber: question.questionNumber,
        field: "correctAnswer",
        message: "MCQ must contain a correct answer.",
      });
    } else if (!keys.includes(correctAnswer)) {
      addIssue(errors, {
        code: "CORRECT_ANSWER_NOT_IN_OPTIONS",
        scope: "QUESTION",
        questionId: question.id,
        questionNumber: question.questionNumber,
        field: "correctAnswer",
        message: "MCQ correct answer does not match any option key.",
      });
    }
  }

  if (question.explanation === null || !normalizedText(question.explanation)) {
    addIssue(warnings, {
      code: "MISSING_EXPLANATION",
      severity: "WARNING",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "explanation",
      message: "MCQ explanation is missing. Consider adding one before publishing.",
    });
  }

  if (question.testCases.length > 0) {
    addIssue(errors, {
      code: "MCQ_HAS_TEST_CASES",
      scope: "QUESTION",
      questionId: question.id,
      questionNumber: question.questionNumber,
      field: "testCases",
      message: "Aptitude MCQs must not have coding test cases.",
    });
  }
}

function validateAssessmentConfiguration(
  assessment: {
    type: "DSA" | "APTITUDE";
    title: string;
    numberOfQuestions: number;
    durationMinutes: number;
    difficulty: Difficulty;
    aptitudeSections: AptitudeSection[];
    dsaTopics: string[];
  },
  issues: ValidationIssue[]
): void {
  if (!normalizedText(assessment.title)) {
    addIssue(issues, {
      code: "MISSING_ASSESSMENT_TITLE",
      scope: "ASSESSMENT",
      field: "title",
      message: "Assessment title is required.",
    });
  }

  if (assessment.type === "DSA") {
    if (assessment.numberOfQuestions !== 3) {
      addIssue(issues, {
        code: "DSA_QUESTION_COUNT",
        scope: "ASSESSMENT",
        field: "numberOfQuestions",
        message: "DSA assessment must contain exactly 3 questions.",
      });
    }

    if (assessment.durationMinutes !== 90) {
      addIssue(issues, {
        code: "DSA_DURATION",
        scope: "ASSESSMENT",
        field: "durationMinutes",
        message: "DSA assessment must have a 90-minute duration.",
      });
    }

    if (assessment.aptitudeSections.length > 0) {
      addIssue(issues, {
        code: "DSA_APTITUDE_SECTIONS",
        scope: "ASSESSMENT",
        field: "aptitudeSections",
        message: "DSA assessment cannot contain aptitude sections.",
      });
    }
  } else {
    if (assessment.numberOfQuestions < 1 || assessment.numberOfQuestions > 100) {
      addIssue(issues, {
        code: "APTITUDE_QUESTION_COUNT",
        scope: "ASSESSMENT",
        field: "numberOfQuestions",
        message: "Aptitude assessment must contain between 1 and 100 questions.",
      });
    }

    if (assessment.durationMinutes < 5 || assessment.durationMinutes > 240) {
      addIssue(issues, {
        code: "APTITUDE_DURATION",
        scope: "ASSESSMENT",
        field: "durationMinutes",
        message: "Aptitude duration must be between 5 and 240 minutes.",
      });
    }

    if (assessment.aptitudeSections.length === 0) {
      addIssue(issues, {
        code: "NO_APTITUDE_SECTIONS",
        scope: "ASSESSMENT",
        field: "aptitudeSections",
        message: "At least one aptitude section must be selected.",
      });
    }

    for (const section of assessment.aptitudeSections) {
      if (!ALLOWED_APTITUDE_SECTIONS.has(section)) {
        addIssue(issues, {
          code: "INVALID_APTITUDE_SECTION",
          scope: "ASSESSMENT",
          field: "aptitudeSections",
          message: `Unsupported aptitude section: ${section}.`,
        });
      }
    }

    if (assessment.dsaTopics.length > 0) {
      addIssue(issues, {
        code: "APTITUDE_DSA_TOPICS",
        scope: "ASSESSMENT",
        field: "dsaTopics",
        message: "Aptitude assessments cannot contain DSA coding topics.",
      });
    }
  }
}

export async function validateAssessmentForTpo(
  tpoId: string,
  assessmentId: string
): Promise<AssessmentValidationResult> {
  const assessment = await prisma.assessment.findFirst({
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
        include: {
          testCases: {
            orderBy: {
              createdAt: "asc",
            },
          },
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
    throw new AssessmentValidationError("Assessment not found", 404);
  }

  if (assessment.status !== "GENERATED") {
    throw new AssessmentValidationError(
      "Only GENERATED assessments can be validated",
      409
    );
  }

  if (assessment._count.attempts > 0) {
    throw new AssessmentValidationError(
      "An assessment with student attempts cannot be validated again",
      409
    );
  }

  const assessmentIssues: ValidationIssue[] = [];
  const questionResults: QuestionValidationResult[] = [];

  validateAssessmentConfiguration(
    {
      type: assessment.type,
      title: assessment.title,
      numberOfQuestions: assessment.blueprint.numberOfQuestions,
      durationMinutes: assessment.durationMinutes,
      difficulty: assessment.difficulty,
      aptitudeSections: assessment.blueprint.aptitudeSections,
      dsaTopics: assessment.blueprint.dsaTopics,
    },
    assessmentIssues
  );

  if (assessment.questions.length !== assessment.blueprint.numberOfQuestions) {
    addIssue(assessmentIssues, {
      code: "QUESTION_COUNT_MISMATCH",
      scope: "ASSESSMENT",
      field: "questions",
      message: `Generated ${assessment.questions.length} questions, but the blueprint requires ${assessment.blueprint.numberOfQuestions}.`,
    });
  }

  const titleMap = new Map<string, number[]>();
  for (const question of assessment.questions) {
    const title = normalizedText(question.title);
    if (!title) continue;
    const numbers = titleMap.get(title) ?? [];
    numbers.push(question.questionNumber);
    titleMap.set(title, numbers);
  }

  for (const [title, numbers] of titleMap.entries()) {
    if (numbers.length > 1) {
      addIssue(assessmentIssues, {
        code: "DUPLICATE_QUESTION_TITLES",
        scope: "ASSESSMENT",
        field: "questions",
        message: `Duplicate question title detected for question numbers ${numbers.join(", ")}.`,
      });
    }
    void title;
  }

  for (const question of assessment.questions) {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (assessment.type === "DSA") {
      validateCodingQuestion(
        question,
        assessment.difficulty,
        errors,
        warnings
      );
    } else {
      validateMcqQuestion(
        question,
        assessment.difficulty,
        assessment.blueprint.aptitudeSections,
        errors,
        warnings
      );
    }

    const duplicateTitle = titleMap.get(normalizedText(question.title));
    if (duplicateTitle && duplicateTitle.length > 1) {
      addIssue(errors, {
        code: "DUPLICATE_QUESTION_TITLE",
        scope: "QUESTION",
        questionId: question.id,
        questionNumber: question.questionNumber,
        field: "title",
        message: "Question title duplicates another generated question.",
      });
    }

    questionResults.push({
      questionId: question.id,
      questionNumber: question.questionNumber,
      valid: errors.length === 0,
      status: errors.length === 0 ? "VALIDATED" : "REJECTED",
      errors,
      warnings,
    });
  }

  const allQuestionsValid = questionResults.length > 0 && questionResults.every(
    (result) => result.valid
  );

  const assessmentValid = assessmentIssues.length === 0 && allQuestionsValid;
  const statusAfter = assessmentValid ? "VALIDATED" : "GENERATED";
  const validatedAt = new Date().toISOString();

  const errorCount =
    assessmentIssues.length +
    questionResults.reduce((sum, result) => sum + result.errors.length, 0);

  const warningCount = questionResults.reduce(
    (sum, result) => sum + result.warnings.length,
    0
  );

  await prisma.$transaction(async (tx) => {
    for (const result of questionResults) {
      await tx.assessmentQuestion.update({
        where: {
          id: result.questionId,
        },
        data: {
          status: result.status,
        },
      });
    }

    await tx.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        status: statusAfter,
      },
    });
  });

  return {
    assessmentId: assessment.id,
    statusBefore: assessment.status,
    statusAfter,
    valid: assessmentValid,
    validatedAt,
    summary: {
      totalQuestions: assessment.questions.length,
      passedQuestions: questionResults.filter((result) => result.valid).length,
      failedQuestions: questionResults.filter((result) => !result.valid).length,
      errorCount,
      warningCount,
    },
    assessmentIssues,
    questions: questionResults,
  };
}
