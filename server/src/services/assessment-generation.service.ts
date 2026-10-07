import {

  AptitudeSection,

  AssessmentType,

  Difficulty,

  Prisma,

} from "../generated/prisma";

import { prisma } from "../lib/prisma";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MAX_SOURCE_REFERENCE_LENGTH = 12000;

const MAX_AI_CONFIG_LENGTH = 6000;

const ALLOWED_DIFFICULTIES = new Set([

  Difficulty.EASY,

  Difficulty.MEDIUM,

  Difficulty.HARD,

]);

const ALLOWED_APTITUDE_SECTIONS = new Set([

  AptitudeSection.QUANTITATIVE,

  AptitudeSection.LOGICAL,

  AptitudeSection.VERBAL,

  AptitudeSection.TECHNICAL,

]);

export class AssessmentGenerationError extends Error {

  statusCode: number;

  constructor(message: string, statusCode = 400) {

    super(message);

    this.name = "AssessmentGenerationError";

    this.statusCode = statusCode;

  }

}

interface GeneratedMCQ {

  type: "MCQ";

  section: AptitudeSection;

  difficulty: Difficulty;

  title: string;

  description?: string | null;

  options: Array<{

    key: string;

    text: string;

  }>;

  correctAnswer: string;

  explanation?: string | null;

  topics: string[];

}

interface GeneratedCodingQuestion {

  type: "CODING";

  section: null;

  difficulty: Difficulty;

  title: string;

  description: string;

  constraints: string;

  topics: string[];

  codingLanguage: string;

  starterCode?: string | null;

  testCases: Array<{

    input: unknown;

    expectedOutput: unknown;

    isHidden?: boolean;

    weight?: number;

  }>;

}

type GeneratedQuestion = GeneratedMCQ | GeneratedCodingQuestion;

interface GeneratedAssessmentPayload {

  questions: GeneratedQuestion[];

}

interface GenerationResult {

  assessment: {

    id: string;

    status: string;

    type: string;

    title: string;

    durationMinutes: number;

    difficulty: string;

    questionCount: number;

  };

  questions: Array<{

    id: string;

    questionNumber: number;

    type: string;

    section: string | null;

    difficulty: string;

    title: string;

    status: string;

    testCaseCount: number;

  }>;

}

function isRecord(value: unknown): value is Record<string, unknown> {

  return typeof value === "object" && value !== null && !Array.isArray(value);

}

function truncate(value: unknown, maxLength: number): string {

  if (value === null || value === undefined) {

    return "";

  }

  let serialized: string;

  try {

    serialized =

      typeof value === "string" ? value : JSON.stringify(value);

  } catch {

    return "";

  }

  if (serialized.length <= maxLength) {

    return serialized;

  }

  return `${serialized.slice(0, maxLength)}\n[truncated]`;

}

function cleanText(

  value: unknown,

  fieldName: string,

  required = true,

  maxLength = 12000

): string | null {

  if (value === null || value === undefined) {

    if (required) {

      throw new AssessmentGenerationError(

        `Generated question is missing ${fieldName}`

      );

    }

    return null;

  }

  if (typeof value !== "string") {

    throw new AssessmentGenerationError(

      `Generated question field ${fieldName} must be a string`

    );

  }

  const text = value.trim();

  if (required && !text) {

    throw new AssessmentGenerationError(

      `Generated question field ${fieldName} cannot be empty`

    );

  }

  if (text.length > maxLength) {

    throw new AssessmentGenerationError(

      `Generated question field ${fieldName} is too long`

    );

  }

  return text || null;

}

function cleanTopics(value: unknown): string[] {

  if (!Array.isArray(value)) {

    throw new AssessmentGenerationError(

      "Generated question topics must be an array"

    );

  }

  const topics = value

    .map((topic) => {

      if (typeof topic !== "string") {

        throw new AssessmentGenerationError(

          "Every generated topic must be a string"

        );

      }

      return topic.trim();

    })

    .filter(Boolean);

  if (topics.length === 0) {

    throw new AssessmentGenerationError(

      "Every generated question must contain at least one topic"

    );

  }

  if (topics.length > 10) {

    throw new AssessmentGenerationError(

      "A generated question cannot contain more than 10 topics"

    );

  }

  return [...new Set(topics)];

}

function cleanDifficulty(value: unknown): Difficulty {

  if (

    value !== Difficulty.EASY &&

    value !== Difficulty.MEDIUM &&

    value !== Difficulty.HARD

  ) {

    throw new AssessmentGenerationError(

      "Generated question contains an invalid difficulty"

    );

  }

  return value;

}

function cleanSection(value: unknown): AptitudeSection {

  if (

    value !== AptitudeSection.QUANTITATIVE &&

    value !== AptitudeSection.LOGICAL &&

    value !== AptitudeSection.VERBAL &&

    value !== AptitudeSection.TECHNICAL

  ) {

    throw new AssessmentGenerationError(

      "Generated aptitude question contains an invalid section"

    );

  }

  return value;

}

type PrismaJsonInput = Prisma.InputJsonValue | typeof Prisma.JsonNull;

function cleanNestedJsonValue(
  value: unknown,
  fieldName: string
): Prisma.InputJsonValue | null {
  if (value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      cleanNestedJsonValue(item, `${fieldName}[${index}]`)
    ) as Prisma.InputJsonArray;
  }

  if (isRecord(value)) {
    const output: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, item] of Object.entries(value)) {
      output[key] = cleanNestedJsonValue(
        item,
        `${fieldName}.${key}`
      );
    }

    return output as Prisma.InputJsonObject;
  }

  throw new AssessmentGenerationError(
    `Generated ${fieldName} contains an unsupported JSON value`
  );
}

function cleanJsonValue(
  value: unknown,
  fieldName: string
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return cleanNestedJsonValue(value, fieldName) as Prisma.InputJsonValue;
}

function normalizeMCQ(

  raw: unknown,

  expectedDifficulty: Difficulty,

  allowedSections: AptitudeSection[]

): GeneratedMCQ {

  if (!isRecord(raw)) {

    throw new AssessmentGenerationError(

      "Generated MCQ is not a valid object"

    );

  }

  if (raw.type !== "MCQ") {

    throw new AssessmentGenerationError(

      "Aptitude assessment contains a non-MCQ question"

    );

  }

  const section = cleanSection(raw.section);

  if (!allowedSections.includes(section)) {

    throw new AssessmentGenerationError(

      `Generated question section ${section} was not selected in the blueprint`

    );

  }

  const difficulty = cleanDifficulty(raw.difficulty);

  if (difficulty !== expectedDifficulty) {

    throw new AssessmentGenerationError(

      `Generated MCQ difficulty does not match the requested difficulty`

    );

  }

  const title = cleanText(raw.title, "title", true, 500)!;

  const description = cleanText(

    raw.description,

    "description",

    false,

    5000

  );

  if (!Array.isArray(raw.options) || raw.options.length !== 4) {

    throw new AssessmentGenerationError(

      `MCQ "${title}" must contain exactly 4 options`

    );

  }

  const options = raw.options.map((option, index) => {

    if (!isRecord(option)) {

      throw new AssessmentGenerationError(

        `MCQ "${title}" option ${index + 1} is invalid`

      );

    }

    const key = cleanText(

      option.key,

      `option ${index + 1} key`,

      true,

      10

    )!;

    const text = cleanText(

      option.text,

      `option ${index + 1} text`,

      true,

      1000

    )!;

    return {

      key,

      text,

    };

  });

  const optionKeys = options.map((option) => option.key);

  if (new Set(optionKeys).size !== optionKeys.length) {

    throw new AssessmentGenerationError(

      `MCQ "${title}" contains duplicate option keys`

    );

  }

  const correctAnswer = cleanText(

    raw.correctAnswer,

    "correctAnswer",

    true,

    20

  )!;

  if (!optionKeys.includes(correctAnswer)) {

    throw new AssessmentGenerationError(

      `MCQ "${title}" has a correct answer that does not match an option`

    );

  }

  const explanation = cleanText(

    raw.explanation,

    "explanation",

    false,

    3000

  );

  const topics = cleanTopics(raw.topics);

  return {

    type: "MCQ",

    section,

    difficulty,

    title,

    description,

    options,

    correctAnswer,

    explanation,

    topics,

  };

}

function normalizeCodingQuestion(

  raw: unknown,

  expectedDifficulty: Difficulty

): GeneratedCodingQuestion {

  if (!isRecord(raw)) {

    throw new AssessmentGenerationError(

      "Generated coding question is not a valid object"

    );

  }

  if (raw.type !== "CODING") {

    throw new AssessmentGenerationError(

      "DSA assessment contains a non-coding question"

    );

  }

  if (raw.section !== null) {

    throw new AssessmentGenerationError(

      "DSA coding questions must not have an aptitude section"

    );

  }

  const difficulty = cleanDifficulty(raw.difficulty);

  if (difficulty !== expectedDifficulty) {

    throw new AssessmentGenerationError(

      "Generated coding question difficulty does not match the requested difficulty"

    );

  }

  const title = cleanText(raw.title, "title", true, 500)!;

  const description = cleanText(

    raw.description,

    "description",

    true,

    12000

  )!;

  const constraints = cleanText(

    raw.constraints,

    "constraints",

    true,

    5000

  )!;

  const codingLanguage = cleanText(

    raw.codingLanguage,

    "codingLanguage",

    true,

    50

  )!;

  const starterCode = cleanText(

    raw.starterCode,

    "starterCode",

    false,

    12000

  );

  const topics = cleanTopics(raw.topics);

  if (!Array.isArray(raw.testCases) || raw.testCases.length < 3) {

    throw new AssessmentGenerationError(

      `Coding question "${title}" must contain at least 3 test cases`

    );

  }

  if (raw.testCases.length > 20) {

    throw new AssessmentGenerationError(

      `Coding question "${title}" cannot contain more than 20 test cases`

    );

  }

  const testCases = raw.testCases.map((testCase, index) => {

    if (!isRecord(testCase)) {

      throw new AssessmentGenerationError(

        `Coding question "${title}" test case ${index + 1} is invalid`

      );

    }

    if (!("input" in testCase)) {

      throw new AssessmentGenerationError(

        `Coding question "${title}" test case ${index + 1} has no input`

      );

    }

    if (!("expectedOutput" in testCase)) {

      throw new AssessmentGenerationError(

        `Coding question "${title}" test case ${index + 1} has no expected output`

      );

    }

    const weight =

      typeof testCase.weight === "number" &&

      Number.isFinite(testCase.weight) &&

      testCase.weight > 0

        ? testCase.weight

        : 1;

    const isHidden = index >= 2;

    return {

      input: testCase.input,

      expectedOutput: testCase.expectedOutput,

      isHidden,

      weight,

    };

  });

  return {

    type: "CODING",

    section: null,

    difficulty,

    title,

    description,

    constraints,

    topics,

    codingLanguage,

    starterCode,

    testCases,

  };

}

function normalizeGeneratedPayload(

  value: unknown,

  assessmentType: AssessmentType,

  numberOfQuestions: number,

  difficulty: Difficulty,

  allowedSections: AptitudeSection[]

): GeneratedAssessmentPayload {

  if (!isRecord(value)) {

    throw new AssessmentGenerationError(

      "AI returned an invalid assessment payload"

    );

  }

  if (!Array.isArray(value.questions)) {

    throw new AssessmentGenerationError(

      "AI response does not contain a questions array"

    );

  }

  if (value.questions.length !== numberOfQuestions) {

    throw new AssessmentGenerationError(

      `AI generated ${value.questions.length} questions, expected ${numberOfQuestions}`

    );

  }

  const questions =

    assessmentType === AssessmentType.DSA

      ? value.questions.map((question) =>

          normalizeCodingQuestion(question, difficulty)

        )

      : value.questions.map((question) =>

          normalizeMCQ(question, difficulty, allowedSections)

        );

  const titles = questions.map((question) =>

    question.title.toLowerCase()

  );

  if (new Set(titles).size !== titles.length) {

    throw new AssessmentGenerationError(

      "AI generated duplicate question titles"

    );

  }

  return {

    questions,

  };

}

function parseAIResponse(content: unknown): unknown {

  if (typeof content !== "string" || !content.trim()) {

    throw new AssessmentGenerationError(

      "AI provider returned an empty response",

      502

    );

  }

  let jsonText = content.trim();

  if (jsonText.startsWith("```")) {

    jsonText = jsonText

      .replace(/^```(?:json)?\s*/i, "")

      .replace(/\s*```$/, "")

      .trim();

  }

  try {

    return JSON.parse(jsonText);

  } catch {

    throw new AssessmentGenerationError(

      "AI provider returned invalid JSON",

      502

    );

  }

}

function buildAptitudeDistribution(

  numberOfQuestions: number,

  sections: AptitudeSection[]

): Record<AptitudeSection, number> {

  const distribution = {} as Record<AptitudeSection, number>;

  for (const section of sections) {

    distribution[section] = 0;

  }

  const base = Math.floor(numberOfQuestions / sections.length);

  let remainder = numberOfQuestions % sections.length;

  for (const section of sections) {

    distribution[section] = base;

    if (remainder > 0) {

      distribution[section] += 1;

      remainder -= 1;

    }

  }

  return distribution;

}

function buildPrompt(assessment: {

  type: AssessmentType;

  title: string;

  description: string | null;

  numberOfQuestions: number;

  durationMinutes: number;

  difficulty: Difficulty;

  aptitudeSections: AptitudeSection[];

  dsaTopics: string[];

  sourcePatterns: unknown;

  aiGenerationConfig: unknown;

}): string {

  const sourceReference = truncate(

    assessment.sourcePatterns,

    MAX_SOURCE_REFERENCE_LENGTH

  );

  const aiConfig = truncate(

    assessment.aiGenerationConfig,

    MAX_AI_CONFIG_LENGTH

  );

  if (assessment.type === AssessmentType.DSA) {

    return `

You are the assessment-generation engine for TalentBridge, a placement intelligence platform.

Generate a NEW DSA coding assessment.

ASSESSMENT BLUEPRINT

- Type: DSA

- Title: ${assessment.title}

- Description: ${assessment.description ?? "Placement-oriented DSA assessment"}

- Questions: exactly ${assessment.numberOfQuestions}

- Duration: ${assessment.durationMinutes} minutes

- Difficulty: ${assessment.difficulty}

- DSA topics requested: ${

      assessment.dsaTopics.length > 0

        ? assessment.dsaTopics.join(", ")

        : "Use a realistic placement-oriented mix of core DSA topics."

    }

STRICT CONTENT RULES

1. Generate exactly ${assessment.numberOfQuestions} coding problems.

2. Every question must have type "CODING".

3. Every question must have section null.

4. Do NOT generate MCQs.

5. Do NOT mention any company name.

6. Do NOT claim that a question came from a particular company.

7. Generate original variations inspired by common placement-assessment patterns.

8. Do not copy source questions verbatim.

9. Every problem must be self-contained.

10. Every problem must contain:

   - title

   - description

   - constraints

   - topics

   - codingLanguage

   - starterCode

   - at least 3 deterministic test cases

11. Test cases must have deterministic expected outputs.

12. For each coding question, make the first 2 test cases visible sample cases (isHidden: false) and make all remaining test cases hidden evaluation cases (isHidden: true).

13. Students must be able to see the visible sample test-case input and expected output, but hidden evaluation cases must never be exposed to students.

14. Use ${assessment.difficulty} difficulty consistently.

15. Prefer algorithmically meaningful problems over trivial syntax exercises.

16. Avoid requiring external libraries or external network access.

17. Use Python as the coding language unless the generation configuration explicitly specifies another language.

REFERENCE MATERIAL

The following is INTERNAL reference material only. Use it to understand patterns, topics and difficulty. Never expose or attribute it to students.

${sourceReference || "No internal reference material was provided."}

GENERATION CONFIGURATION

${aiConfig || "No additional AI generation configuration was provided."}

Return ONLY valid JSON matching this exact structure:

{

  "questions": [

    {

      "type": "CODING",

      "section": null,

      "difficulty": "${assessment.difficulty}",

      "title": "string",

      "description": "string",

      "constraints": "string",

      "topics": ["string"],

      "codingLanguage": "Python",

      "starterCode": "string",

      "testCases": [

        {

          "input": "JSON-compatible value",

          "expectedOutput": "JSON-compatible value",

          "isHidden": false,

          "weight": 1

        }

      ]

    }

  ]

}

`.trim();

  }

  const distribution = buildAptitudeDistribution(

    assessment.numberOfQuestions,

    assessment.aptitudeSections

  );

  const distributionText = assessment.aptitudeSections

    .map((section) => `${section}: ${distribution[section]}`)

    .join("\n");

  return `

You are the assessment-generation engine for TalentBridge, a placement intelligence platform.

Generate a NEW aptitude assessment.

ASSESSMENT BLUEPRINT

- Type: APTITUDE

- Title: ${assessment.title}

- Description: ${assessment.description ?? "Placement-oriented aptitude assessment"}

- Questions: exactly ${assessment.numberOfQuestions}

- Duration: ${assessment.durationMinutes} minutes

- Difficulty: ${assessment.difficulty}

SELECTED SECTIONS AND TARGET COUNTS

${distributionText}

STRICT CONTENT RULES

1. Generate exactly ${assessment.numberOfQuestions} questions.

2. Every question must have type "MCQ".

3. Every question must belong to one of the selected sections.

4. Use exactly 4 options per question.

5. Exactly one option must be correct.

6. correctAnswer must match one option key.

7. Provide an explanation.

8. Provide at least one topic.

9. Generate new variations inspired by realistic placement assessments.

10. Do not copy source questions verbatim.

11. Do NOT mention any company name.

12. Do NOT claim that a question came from a particular company.

13. DSA coding questions are NOT allowed here.

14. DSA MCQs are allowed only through the TECHNICAL section.

15. Questions should test actual reasoning rather than obscure trivia.

16. Keep the requested difficulty consistent.

SECTION GUIDANCE

QUANTITATIVE:

- percentages

- ratios

- averages

- profit and loss

- time and work

- time, speed and distance

- probability

- permutations and combinations

- number systems

- algebra

- data interpretation

LOGICAL:

- sequences

- arrangements

- syllogisms

- coding-decoding

- blood relations

- logical deductions

- pattern recognition

- puzzles

VERBAL:

- grammar

- sentence correction

- vocabulary

- reading comprehension

- para-jumbles

- sentence completion

- verbal reasoning

TECHNICAL:

- programming fundamentals

- OOP

- DSA theory

- complexity

- DBMS

- SQL

- operating systems

- computer networks

- programming languages

REFERENCE MATERIAL

The following is INTERNAL reference material only. Use it to understand patterns, topics and difficulty. Never expose or attribute it to students.

${sourceReference || "No internal reference material was provided."}

GENERATION CONFIGURATION

${aiConfig || "No additional AI generation configuration was provided."}

Return ONLY valid JSON matching this exact structure:

{

  "questions": [

    {

      "type": "MCQ",

      "section": "QUANTITATIVE",

      "difficulty": "${assessment.difficulty}",

      "title": "string",

      "description": "string",

      "options": [

        { "key": "A", "text": "string" },

        { "key": "B", "text": "string" },

        { "key": "C", "text": "string" },

        { "key": "D", "text": "string" }

      ],

      "correctAnswer": "A",

      "explanation": "string",

      "topics": ["string"]

    }

  ]

}

`.trim();

}

async function callGroq(prompt: string): Promise<unknown> {

  const apiKey = process.env.GROQ_API_KEY;

  const model =

    process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";

  if (!apiKey) {

    throw new AssessmentGenerationError(

      "GROQ_API_KEY is not configured on the server",

      503

    );

  }

  const response = await fetch(GROQ_URL, {

    method: "POST",

    headers: {

      Authorization: `Bearer ${apiKey}`,

      "Content-Type": "application/json",

    },

    body: JSON.stringify({

      model,

      temperature: 0.35,

      max_completion_tokens: 30000,

      response_format: {

        type: "json_object",

      },

      messages: [

        {

          role: "system",

          content:

            "You are a strict JSON-only assessment generation engine. Never return markdown or explanatory text outside the JSON object.",

        },

        {

          role: "user",

          content: prompt,

        },

      ],

    }),

  });

  if (!response.ok) {

    const errorText = await response.text();

    console.error("Groq generation error:", {

      status: response.status,

      body: errorText.slice(0, 2000),

    });

    throw new AssessmentGenerationError(

      `AI generation failed with provider status ${response.status}`,

      502

    );

  }

  const data = (await response.json()) as {

    choices?: Array<{

      message?: {

        content?: unknown;

      };

    }>;

  };

  const content = data.choices?.[0]?.message?.content;

  return parseAIResponse(content);

}

async function getOwnedAssessment(

  assessmentId: string,

  tpoId: string

) {

  const assessment = await prisma.assessment.findFirst({

    where: {

      id: assessmentId,

      createdByTpoId: tpoId,

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

  if (!assessment) {

    throw new AssessmentGenerationError(

      "Assessment not found",

      404

    );

  }

  return assessment;

}

export async function generateAssessmentQuestions(

  assessmentId: string,

  tpoId: string

): Promise<GenerationResult> {

  const assessment = await getOwnedAssessment(

    assessmentId,

    tpoId

  );

  if (

    assessment.status !== "DRAFT" &&

    assessment.status !== "GENERATED"

  ) {

    throw new AssessmentGenerationError(

      "Only DRAFT or GENERATED assessments can be regenerated",

      409

    );

  }

  if (assessment._count.attempts > 0) {

    throw new AssessmentGenerationError(

      "This assessment already has attempts and cannot be regenerated",

      409

    );

  }

  if (

    assessment.blueprint.numberOfQuestions <= 0 ||

    assessment.blueprint.numberOfQuestions > 100

  ) {

    throw new AssessmentGenerationError(

      "Assessment question count is outside the supported generation range"

    );

  }

  if (!ALLOWED_DIFFICULTIES.has(assessment.blueprint.difficulty)) {

    throw new AssessmentGenerationError(

      "Assessment blueprint contains an unsupported difficulty"

    );

  }

  if (assessment.type === AssessmentType.DSA) {

    if (assessment.blueprint.numberOfQuestions !== 3) {

      throw new AssessmentGenerationError(

        "DSA assessments must contain exactly 3 coding questions"

      );

    }

    if (assessment.durationMinutes !== 90) {

      throw new AssessmentGenerationError(

        "DSA assessments must have a 90-minute duration"

      );

    }

    if (assessment.blueprint.aptitudeSections.length > 0) {

      throw new AssessmentGenerationError(

        "DSA assessments cannot contain aptitude sections"

      );

    }

  } else {

    if (assessment.blueprint.aptitudeSections.length === 0) {

      throw new AssessmentGenerationError(

        "Aptitude assessments must contain at least one aptitude section"

      );

    }

    for (const section of assessment.blueprint.aptitudeSections) {

      if (!ALLOWED_APTITUDE_SECTIONS.has(section)) {

        throw new AssessmentGenerationError(

          `Unsupported aptitude section: ${section}`

        );

      }

    }

  }

  const prompt = buildPrompt({

    type: assessment.type,

    title: assessment.title,

    description: assessment.description,

    numberOfQuestions: assessment.blueprint.numberOfQuestions,

    durationMinutes: assessment.durationMinutes,

    difficulty: assessment.difficulty,

    aptitudeSections: assessment.blueprint.aptitudeSections,

    dsaTopics: assessment.blueprint.dsaTopics,

    sourcePatterns: assessment.blueprint.sourcePatterns,

    aiGenerationConfig: assessment.blueprint.aiGenerationConfig,

  });

  console.log(

    `Generating assessment ${assessment.id} using ${process.env.GROQ_MODEL ?? "openai/gpt-oss-120b"}`

  );

  const rawPayload = await callGroq(prompt);

  const normalized = normalizeGeneratedPayload(

    rawPayload,

    assessment.type,

    assessment.blueprint.numberOfQuestions,

    assessment.difficulty,

    assessment.blueprint.aptitudeSections

  );

  const generatedAt = new Date();

  const generationMetadata = {

    provider: "groq",

    model:

      process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",

    generatedAt: generatedAt.toISOString(),

    phase: "7C",

    note:

      "AI-generated placement-style content. Full semantic and executable validation occurs in Phase 7D.",

  };

  const savedAssessment = await prisma.$transaction(

    async (tx) => {

      const currentAttemptCount =

        await tx.assessmentAttempt.count({

          where: {

            assessmentId: assessment.id,

          },

        });

      if (currentAttemptCount > 0) {

        throw new AssessmentGenerationError(

          "Assessment cannot be regenerated after an attempt exists",

          409

        );

      }

      await tx.assessmentQuestion.deleteMany({

        where: {

          assessmentId: assessment.id,

        },

      });

      for (

        let index = 0;

        index < normalized.questions.length;

        index += 1

      ) {

        const question = normalized.questions[index];

        if (question.type === "MCQ") {

          await tx.assessmentQuestion.create({

            data: {

              assessmentId: assessment.id,

              questionNumber: index + 1,

              type: "MCQ",

              section: question.section,

              difficulty: question.difficulty,

              title: question.title,

              description: question.description,

              options: cleanJsonValue(

                question.options,

                "options"

              ),

              correctAnswer: cleanJsonValue(

                question.correctAnswer,

                "correctAnswer"

              ),

              explanation: question.explanation,

              codingLanguage: null,

              starterCode: Prisma.JsonNull,

              constraints: null,

              topics: question.topics,

              sourceMetadata: cleanJsonValue(

                generationMetadata,

                "sourceMetadata"

              ),

              status: "GENERATED",

            },

          });

          continue;

        }

        const createdQuestion =

          await tx.assessmentQuestion.create({

            data: {

              assessmentId: assessment.id,

              questionNumber: index + 1,

              type: "CODING",

              section: null,

              difficulty: question.difficulty,

              title: question.title,

              description: question.description,

              options: Prisma.JsonNull,

              correctAnswer: Prisma.JsonNull,

              explanation: null,

              codingLanguage: question.codingLanguage,

              starterCode: question.starterCode

                ? cleanJsonValue(

                    question.starterCode,

                    "starterCode"

                  )

                : Prisma.JsonNull,

              constraints: question.constraints,

              topics: question.topics,

              sourceMetadata: cleanJsonValue(

                generationMetadata,

                "sourceMetadata"

              ),

              status: "GENERATED",

            },

          });

        for (const [testCaseIndex, testCase] of question.testCases.entries()) {

          await tx.testCase.create({

            data: {

              questionId: createdQuestion.id,

              input: cleanJsonValue(

                testCase.input,

                "testCase.input"

              ),

              expectedOutput: cleanJsonValue(

                testCase.expectedOutput,

                "testCase.expectedOutput"

              ),

              isHidden: testCaseIndex >= 2,

              weight: testCase.weight ?? 1,

            },

          });

        }

      }

      return tx.assessment.update({

        where: {

          id: assessment.id,

        },

        data: {

          status: "GENERATED",

        },

        include: {

          questions: {

            orderBy: {

              questionNumber: "asc",

            },

            include: {

              _count: {

                select: {

                  testCases: true,

                },

              },

            },

          },

        },

      });

    }

  );

  return {

    assessment: {

      id: savedAssessment.id,

      status: savedAssessment.status,

      type: savedAssessment.type,

      title: savedAssessment.title,

      durationMinutes: savedAssessment.durationMinutes,

      difficulty: savedAssessment.difficulty,

      questionCount: savedAssessment.questions.length,

    },

    questions: savedAssessment.questions.map((question) => ({

      id: question.id,

      questionNumber: question.questionNumber,

      type: question.type,

      section: question.section,

      difficulty: question.difficulty,

      title: question.title,

      status: question.status,

      testCaseCount: question._count.testCases,

    })),

  };

}
