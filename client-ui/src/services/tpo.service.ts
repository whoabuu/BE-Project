import api from "./api";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface TPOStudent {
  id: string; studentCode: string; userId: string; email: string;
  firstName: string | null; lastName: string | null; collegeName: string | null;
  branch: string | null; enrollmentNumber: string | null; graduationYear: number | null;
  profileCompleted: number; verificationStatus: VerificationStatus; verificationNote: string | null;
  verifiedAt?: string | null; updatedAt: string;
}

export interface TPOStudentDetails extends TPOStudent {
  phone: string | null; universityName: string | null; middleName?: string | null;
  dateOfBirth?: string | null; gender?: string | null; alternatePhone?: string | null;
  nationality?: string | null; domicileState?: string | null; bio?: string | null;
  addresses: Array<{ addressLine1: string; addressLine2: string | null; city: string; state: string; country: string; pincode: string; isPermanent: boolean; isCurrent: boolean }>;
  skills: Array<{ proficiency: number | null; skill: { name: string; category: string | null } }>;
  projects: Array<{ title: string; description: string | null; technologies: string[]; githubUrl: string | null; liveUrl: string | null }>;
  educations: Array<{ level: string; institution: string | null; course: string | null; cgpa: number | null; percentage: number | null }>;
  experiences: Array<{ companyName: string; role: string | null; type: string; description: string | null }>;
  certifications: Array<{ name: string; issuingOrg: string | null; credentialId: string | null; credentialUrl: string | null }>;
  achievements: Array<{ title: string; description: string | null }>;
  socialLinks: Array<{ platform: string; url: string }>;
  resumes: Array<{ fileName: string | null; status: string; uploadedAt: string; fileUrl: string }>;
  preferences: { preferredRoles?: string[]; preferredLocations?: string[]; expectedSalaryMin?: number | null; expectedSalaryMax?: number | null; willingToRelocate?: boolean; preferredWorkMode?: string | null } | null;
}

export interface TPODashboardData {
  stats: { total: number; pending: number; verified: number; rejected: number };
  recentPending: Array<{ id: string; studentCode: string; firstName: string | null; lastName: string | null; branch: string | null; profileCompleted: number; updatedAt: string }>;
}

export async function getTPODashboard() {
  const response = await api.get("/tpo/dashboard");
  return response.data as TPODashboardData;
}

export async function getTPOStudents() {
  const response = await api.get("/tpo/students");
  return response.data.students as TPOStudent[];
}

export async function getTPOStudent(studentId: string) {
  const response = await api.get(`/tpo/students/${studentId}`);
  return response.data.student as TPOStudentDetails;
}

export async function updateStudentVerification(studentId: string, status: VerificationStatus, note = "") {
  const response = await api.patch(`/tpo/students/${studentId}/verification`, { status, note });
  return response.data.student as TPOStudent;
}

export type AssessmentType = "DSA" | "APTITUDE";
export type AssessmentStatus =
  | "DRAFT"
  | "GENERATED"
  | "VALIDATED"
  | "PUBLISHED"
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED";
export type AssessmentQuestionType = "MCQ" | "CODING";
export type AssessmentQuestionStatus = "GENERATED" | "VALIDATED" | "REJECTED";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type AptitudeSection =
  | "QUANTITATIVE"
  | "LOGICAL"
  | "VERBAL"
  | "TECHNICAL";

export interface TPOAssessmentBlueprint {
  id: string;
  type: AssessmentType;
  title: string;
  description: string | null;
  numberOfQuestions: number;
  durationMinutes: number;
  difficulty: Difficulty;
  aptitudeSections: AptitudeSection[];
  dsaTopics: string[];
  sourcePatterns?: unknown;
  aiGenerationConfig?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface TPOAssessmentQuestion {
  id: string;
  questionNumber: number;
  type: AssessmentQuestionType;
  section: AptitudeSection | null;
  difficulty: Difficulty;
  title: string;
  description: string | null;
  options?: unknown;
  explanation: string | null;
  codingLanguage: string | null;
  starterCode?: unknown;
  constraints: string | null;
  topics: string[];
  status: AssessmentQuestionStatus;
  createdAt: string;
  updatedAt: string;
  _count: {
    testCases: number;
  };
}

export interface TPOAssessment {
  id: string;
  blueprintId: string;
  createdByTpoId: string;
  type: AssessmentType;
  title: string;
  description: string | null;
  durationMinutes: number;
  difficulty: Difficulty;
  status: AssessmentStatus;
  instructions: string | null;
  startsAt: string | null;
  endsAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  blueprint: TPOAssessmentBlueprint;
  questions?: TPOAssessmentQuestion[];
  _count: {
    questions: number;
    attempts: number;
  };
}

export interface CreateTPOAssessmentInput {
  type: AssessmentType;
  title: string;
  description?: string;
  numberOfQuestions: number;
  durationMinutes: number;
  difficulty: Difficulty;
  aptitudeSections: AptitudeSection[];
  dsaTopics: string[];
  instructions?: string;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateTPOAssessmentInput {
  type?: AssessmentType;
  title?: string;
  description?: string | null;
  numberOfQuestions?: number;
  durationMinutes?: number;
  difficulty?: Difficulty;
  aptitudeSections?: AptitudeSection[];
  dsaTopics?: string[];
  instructions?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface GeneratedAssessmentQuestionSummary {
  id: string;
  questionNumber: number;
  type: AssessmentQuestionType;
  title: string;
  section: AptitudeSection | null;
  difficulty: Difficulty;
  testCaseCount: number;
}

export interface GeneratedAssessmentSummary {
  id: string;
  status: AssessmentStatus;
  type: AssessmentType;
  title: string;
  durationMinutes: number;
  difficulty: Difficulty;
  questionCount: number;
}

export interface GenerateTPOAssessmentResponse {
  message: string;
  assessment: GeneratedAssessmentSummary;
  questions: GeneratedAssessmentQuestionSummary[];
}

export async function getTPOAssessments() {
  const response = await api.get("/tpo/assessments");
  return response.data.assessments as TPOAssessment[];
}

export async function getTPOAssessment(assessmentId: string) {
  const response = await api.get(`/tpo/assessments/${assessmentId}`);
  return response.data.assessment as TPOAssessment;
}

export async function createTPOAssessment(input: CreateTPOAssessmentInput) {
  const response = await api.post("/tpo/assessments", input);
  return response.data.assessment as TPOAssessment;
}

export async function updateTPOAssessment(
  assessmentId: string,
  input: UpdateTPOAssessmentInput
) {
  const response = await api.patch(`/tpo/assessments/${assessmentId}`, input);
  return response.data.assessment as TPOAssessment;
}

export async function deleteTPOAssessment(assessmentId: string) {
  const response = await api.delete(`/tpo/assessments/${assessmentId}`);
  return response.data as { message: string; assessmentId: string };
}

export async function generateTPOAssessment(assessmentId: string) {
  const response = await api.post(`/tpo/assessments/${assessmentId}/generate`);
  return response.data as GenerateTPOAssessmentResponse;
}

export type ValidationSeverity = "ERROR" | "WARNING";
export type ValidationScope = "ASSESSMENT" | "QUESTION" | "TEST_CASE";

export interface TPOAssessmentValidationIssue {
  code: string;
  severity: ValidationSeverity;
  scope: ValidationScope;
  message: string;
  questionId?: string;
  questionNumber?: number;
  testCaseId?: string;
  field?: string;
}

export interface TPOAssessmentQuestionValidation {
  questionId: string;
  questionNumber: number;
  valid: boolean;
  status: "VALIDATED" | "REJECTED";
  errors: TPOAssessmentValidationIssue[];
  warnings: TPOAssessmentValidationIssue[];
}

export interface TPOAssessmentValidationResult {
  assessmentId: string;
  statusBefore: AssessmentStatus;
  statusAfter: AssessmentStatus;
  valid: boolean;
  validatedAt: string;
  summary: {
    totalQuestions: number;
    passedQuestions: number;
    failedQuestions: number;
    errorCount: number;
    warningCount: number;
  };
  assessmentIssues: TPOAssessmentValidationIssue[];
  questions: TPOAssessmentQuestionValidation[];
}

export interface ValidateTPOAssessmentResponse {
  message: string;
  validation: TPOAssessmentValidationResult;
}

export async function validateTPOAssessment(assessmentId: string) {
  const response = await api.post(
    `/tpo/assessments/${assessmentId}/validate`
  );
  return response.data as ValidateTPOAssessmentResponse;
}


export interface PublishTPOAssessmentResponse {
  message: string;
  assessment: TPOAssessment;
}

export async function publishTPOAssessment(assessmentId: string) {
  const response = await api.post(
    `/tpo/assessments/${assessmentId}/publish`
  );
  return response.data as PublishTPOAssessmentResponse;
}
