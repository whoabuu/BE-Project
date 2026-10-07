import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import AppShell from "../components/AppShell";
import { Badge, Button, Card, SectionTitle } from "../components/UI";
import {
  deleteTPOAssessment,
  generateTPOAssessment,
  getTPOAssessment,
  publishTPOAssessment,
  validateTPOAssessment,
  type TPOAssessment,
  type TPOAssessmentQuestion,
  type TPOAssessmentValidationResult,
} from "../services/tpo.service";

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

function sectionLabel(section: TPOAssessmentQuestion["section"]) {
  if (!section) return "DSA";
  return section.charAt(0) + section.slice(1).toLowerCase();
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: TPOAssessment["status"]) {
  if (status === "VALIDATED" || status === "ACTIVE") return "green";
  if (status === "GENERATED" || status === "PUBLISHED") return "purple";
  return "orange";
}

function issueTone(severity: "ERROR" | "WARNING") {
  return severity === "ERROR"
    ? "border-red-200 bg-red-50 text-red-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

function optionLabel(option: unknown) {
  if (
    option &&
    typeof option === "object" &&
    !Array.isArray(option)
  ) {
    const record = option as Record<string, unknown>;
    const key = typeof record.key === "string" ? record.key : "";
    const text = typeof record.text === "string" ? record.text : "";
    return key ? `${key}. ${text}` : text || JSON.stringify(option);
  }

  return String(option);
}

export default function TPOAssessmentDetailsPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<TPOAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [validation, setValidation] = useState<TPOAssessmentValidationResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAssessment = useCallback(async () => {
    if (!assessmentId) return;

    try {
      setLoading(true);
      setError("");
      setAssessment(await getTPOAssessment(assessmentId));
    } catch (err) {
      setError(errorMessage(err, "Unable to load this assessment."));
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void loadAssessment();
  }, [loadAssessment]);

  async function handleGenerate() {
    if (!assessmentId || !assessment) return;

    try {
      setGenerating(true);
      setError("");
      setSuccess("");
      setValidation(null);

      const result = await generateTPOAssessment(assessmentId);
      const refreshedAssessment = await getTPOAssessment(assessmentId);
      setAssessment(refreshedAssessment);
      setSuccess(`Generated ${result.questions.length} questions successfully.`);
    } catch (err) {
      setError(errorMessage(err, "Unable to generate assessment questions."));
    } finally {
      setGenerating(false);
    }
  }

  async function handleValidate() {
    if (!assessmentId || !assessment || assessment.status !== "GENERATED") return;

    try {
      setValidating(true);
      setError("");
      setSuccess("");

      const result = await validateTPOAssessment(assessmentId);
      setValidation(result.validation);

      const refreshedAssessment = await getTPOAssessment(assessmentId);
      setAssessment(refreshedAssessment);

      if (result.validation.valid) {
        setSuccess(
          "Validation passed. The assessment is ready for the Phase 7E publishing workflow."
        );
      } else {
        setSuccess(
          "Validation completed. Review the reported issues before regenerating the assessment."
        );
      }
    } catch (err) {
      setError(errorMessage(err, "Unable to validate this assessment."));
    } finally {
      setValidating(false);
    }
  }

  async function handlePublish() {
    if (!assessmentId || !assessment || assessment.status !== "VALIDATED") {
      return;
    }

    const confirmed = window.confirm(
      `Publish "${assessment.title}"? Students will be able to see it according to the assessment schedule.`
    );

    if (!confirmed) return;

    try {
      setPublishing(true);
      setError("");
      setSuccess("");

      const result = await publishTPOAssessment(assessmentId);
      setAssessment(result.assessment);
      setSuccess(
        "Assessment published successfully. It is now ready for the student-facing publishing lifecycle."
      );
    } catch (err) {
      setError(errorMessage(err, "Unable to publish the assessment."));
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!assessmentId || !assessment || assessment.status !== "DRAFT") return;

    if (!window.confirm(`Delete "${assessment.title}"?`)) return;

    try {
      setDeleting(true);
      setError("");
      await deleteTPOAssessment(assessmentId);
      navigate("/tpo/assessments");
    } catch (err) {
      setError(errorMessage(err, "Unable to delete the assessment."));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppShell role="TPO" title="Assessment" subtitle="Loading assessment details...">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Loading assessment...
        </div>
      </AppShell>
    );
  }

  if (!assessment) {
    return (
      <AppShell role="TPO" title="Assessment" subtitle="Assessment details">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Assessment not found."}
        </div>
        <Link
          to="/tpo/assessments"
          className="mt-4 inline-block text-sm font-semibold text-indigo-600"
        >
          ← Back to assessments
        </Link>
      </AppShell>
    );
  }

  const hasQuestions = Boolean(assessment.questions?.length);
  const canValidate = assessment.status === "GENERATED" && hasQuestions;

  return (
    <AppShell
      role="TPO"
      title={assessment.title}
      subtitle="Review generated content, run validation, and prepare the assessment for publishing."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/tpo/assessments"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Back to assessments
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge tone="gray">{assessment.type}</Badge>
            <Badge tone={statusTone(assessment.status)}>{assessment.status}</Badge>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="!p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Questions</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{assessment._count.questions}</p>
            <p className="mt-1 text-xs text-slate-500">Configured: {assessment.blueprint.numberOfQuestions}</p>
          </Card>
          <Card className="!p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{assessment.durationMinutes}</p>
            <p className="mt-1 text-xs text-slate-500">minutes</p>
          </Card>
          <Card className="!p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Difficulty</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{assessment.difficulty}</p>
            <p className="mt-1 text-xs text-slate-500">AI generation target</p>
          </Card>
          <Card className="!p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attempts</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{assessment._count.attempts}</p>
            <p className="mt-1 text-xs text-slate-500">Student attempts</p>
          </Card>
        </div>

        <Card>
          <SectionTitle
            title="Assessment blueprint"
            sub="The configuration used by the AI generation engine."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {assessment.description || "No description provided."}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Instructions</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {assessment.instructions || "No student instructions configured yet."}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Aptitude sections</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {assessment.blueprint.aptitudeSections.length === 0 ? (
                  <span className="text-sm text-slate-500">None</span>
                ) : (
                  assessment.blueprint.aptitudeSections.map((section) => (
                    <Badge key={section}>{sectionLabel(section)}</Badge>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">DSA topics</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {assessment.blueprint.dsaTopics.length === 0 ? (
                  <span className="text-sm text-slate-500">None</span>
                ) : (
                  assessment.blueprint.dsaTopics.map((topic) => (
                    <Badge key={topic} tone="gray">{topic}</Badge>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Start</p>
              <p className="mt-2 text-sm text-slate-700">{formatDate(assessment.startsAt)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">End</p>
              <p className="mt-2 text-sm text-slate-700">{formatDate(assessment.endsAt)}</p>
            </div>
          </div>
        </Card>

        {(assessment.status === "DRAFT" || assessment.status === "GENERATED") && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-indigo-950">AI question generation</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-indigo-800">
                  Generate new placement-style questions through the configured AI provider. Regeneration is available until validation succeeds or student attempts exist.
                </p>
              </div>
              <Button onClick={() => void handleGenerate()}>
                {generating
                  ? "Generating..."
                  : assessment.status === "GENERATED"
                    ? "Regenerate Questions"
                    : "Generate Questions"}
              </Button>
            </div>
          </div>
        )}

        {assessment.status === "GENERATED" && (
          <Card>
            <SectionTitle
              title="7D validation"
              sub="Run deterministic structural and content checks before the assessment can move to the publishing phase."
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-bold text-slate-900">Validate generated assessment</p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    Validation checks the blueprint, question types, difficulty, sections, required content, MCQ options, duplicate questions, and coding test-case structure. Actual student-code execution will be handled by the later isolated coding runner.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleValidate()}
                  disabled={!canValidate || validating}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {validating ? "Validating..." : "Validate Assessment"}
                </button>
              </div>
            </div>
          </Card>
        )}

        {assessment.status === "VALIDATED" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-emerald-950">Validation passed</p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-800">
                  All generated questions passed the current Phase 7D checks. Review the complete assessment above before publishing it to students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={publishing}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {publishing ? "Publishing..." : "Publish Assessment"}
              </button>
            </div>
          </div>
        )}

        {assessment.status === "PUBLISHED" && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <p className="font-bold text-purple-950">Assessment published</p>
            <p className="mt-1 text-sm leading-6 text-purple-800">
              This assessment has been approved and published. Student-facing availability will be connected to the later assessment-attempt workflow and schedule.
            </p>
            {assessment.publishedAt && (
              <p className="mt-2 text-xs font-semibold text-purple-700">
                Published {formatDate(assessment.publishedAt)}
              </p>
            )}
          </div>
        )}

        {validation && (
          <Card>
            <SectionTitle
              title="Validation report"
              sub={`Validated ${formatDate(validation.validatedAt)}`}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Result</p>
                <p className={`mt-2 font-bold ${validation.valid ? "text-emerald-600" : "text-red-600"}`}>
                  {validation.valid ? "PASSED" : "FAILED"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Questions</p>
                <p className="mt-2 font-bold text-slate-900">{validation.summary.totalQuestions}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Passed</p>
                <p className="mt-2 font-bold text-emerald-600">{validation.summary.passedQuestions}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Failed</p>
                <p className="mt-2 font-bold text-red-600">{validation.summary.failedQuestions}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Warnings</p>
                <p className="mt-2 font-bold text-amber-600">{validation.summary.warningCount}</p>
              </div>
            </div>

            {validation.assessmentIssues.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Assessment-level issues</p>
                {validation.assessmentIssues.map((issue, index) => (
                  <div key={`${issue.code}-${index}`} className={`rounded-xl border p-3 text-sm ${issueTone(issue.severity)}`}>
                    <span className="font-bold">{issue.severity}</span>
                    <span className="mx-2">·</span>
                    {issue.message}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Question validation</p>
              {validation.questions.map((question) => (
                <div key={question.questionId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Q{question.questionNumber}</span>
                      <Badge tone={question.valid ? "green" : "orange"}>{question.status}</Badge>
                    </div>
                    <span className="text-xs text-slate-500">
                      {question.errors.length} errors · {question.warnings.length} warnings
                    </span>
                  </div>

                  {question.errors.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {question.errors.map((issue, index) => (
                        <div key={`${issue.code}-${index}`} className={`rounded-lg border p-3 text-sm ${issueTone(issue.severity)}`}>
                          <span className="font-semibold">{issue.code}</span>
                          <span className="mx-2">·</span>
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.warnings.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {question.warnings.map((issue, index) => (
                        <div key={`${issue.code}-${index}`} className={`rounded-lg border p-3 text-sm ${issueTone(issue.severity)}`}>
                          <span className="font-semibold">{issue.code}</span>
                          <span className="mx-2">·</span>
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.errors.length === 0 && question.warnings.length === 0 && (
                    <p className="mt-3 text-sm font-medium text-emerald-700">
                      No validation issues found for this question.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <SectionTitle
            title="Generated questions"
            sub={hasQuestions
              ? "Review the generated content. Hidden test-case values are not exposed here."
              : "No questions have been generated yet."}
          />

          {!hasQuestions ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="font-semibold text-slate-800">Nothing generated yet</p>
              <p className="mt-2 text-sm text-slate-500">Create the questions using the Generate button above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessment.questions!.map((question) => (
                <article key={question.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          Q{question.questionNumber}
                        </span>
                        <Badge>{question.type}</Badge>
                        <Badge tone="gray">{sectionLabel(question.section)}</Badge>
                        <Badge tone={question.status === "VALIDATED" ? "green" : question.status === "REJECTED" ? "orange" : "purple"}>
                          {question.status}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">{question.title}</h3>
                      {question.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {question.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-700">{question._count.testCases} test cases</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {question.difficulty} · {question.codingLanguage || "MCQ"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {question.topics.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Topics</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {question.topics.map((topic) => (
                            <Badge key={topic} tone="gray">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {question.constraints && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Constraints</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {question.constraints}
                        </p>
                      </div>
                    )}
                  </div>

                  {question.type === "MCQ" && Array.isArray(question.options) && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Options</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(question.options as unknown[]).map((option, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            {optionLabel(option)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <div>
            {assessment.status === "DRAFT" && (
              <Button variant="secondary" onClick={() => void handleDelete()}>
                {deleting ? "Deleting..." : "Delete Draft"}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/tpo/assessments"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </Link>
            {assessment.status === "VALIDATED" ? (
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={publishing}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {publishing ? "Publishing..." : "Publish Assessment"}
              </button>
            ) : assessment.status === "PUBLISHED" ? (
              <span className="inline-flex items-center justify-center rounded-xl bg-purple-50 px-5 py-3 text-sm font-semibold text-purple-700">
                Published
              </span>
            ) : (
              <span className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
                Publish available after validation
              </span>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
