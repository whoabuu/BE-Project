import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import {
  Badge,
  Button,
  Card,
  SectionTitle,
} from "../components/UI";
import {
  deleteTPOAssessment,
  getTPOAssessments,
  type TPOAssessment,
} from "../services/tpo.service";
import axios from "axios";

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

function statusTone(status: TPOAssessment["status"]) {
  if (status === "GENERATED" || status === "VALIDATED") return "green";
  if (status === "PUBLISHED" || status === "ACTIVE") return "purple";
  if (status === "CLOSED" || status === "ARCHIVED") return "gray";
  return "orange";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function TPOAssessmentsPage() {
  const [assessments, setAssessments] = useState<TPOAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setAssessments(await getTPOAssessments());
    } catch (err) {
      setError(errorMessage(err, "Unable to load assessments."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  async function handleDelete(assessment: TPOAssessment) {
    if (assessment.status !== "DRAFT") return;

    const confirmed = window.confirm(
      `Delete "${assessment.title}"? This only works for draft assessments.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(assessment.id);
      setError("");
      await deleteTPOAssessment(assessment.id);
      setAssessments((current) =>
        current.filter((item) => item.id !== assessment.id)
      );
    } catch (err) {
      setError(errorMessage(err, "Unable to delete the assessment."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell
      role="TPO"
      title="Assessments"
      subtitle="Create, generate and review placement assessments for your students."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Assessment workspace
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              AI-powered placement assessments
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Configure DSA or Aptitude assessments, generate questions with AI,
              validate them, and publish approved assessments for the student workflow.
            </p>
          </div>
          <Link
            to="/tpo/assessments/create"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Create Assessment
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <SectionTitle
            title="Your assessments"
            sub="Only assessments created by your TPO account are shown here."
          />

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading assessments...
            </div>
          ) : assessments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl text-indigo-600">
                ◉
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                No assessments yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first draft and configure its assessment blueprint.
              </p>
              <Link
                to="/tpo/assessments/create"
                className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create assessment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex flex-col gap-5 py-5 first:pt-2 last:pb-2 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {assessment.title}
                      </h3>
                      <Badge tone={statusTone(assessment.status)}>
                        {assessment.status}
                      </Badge>
                      <Badge tone="gray">{assessment.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {assessment.description || "No description provided."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                      <span>{assessment._count.questions} questions</span>
                      <span>{assessment.durationMinutes} minutes</span>
                      <span>{assessment.difficulty}</span>
                      <span>Updated {formatDate(assessment.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      to={`/tpo/assessments/${assessment.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    {assessment.status === "DRAFT" && (
                      <Button
                        variant="secondary"
                        onClick={() => void handleDelete(assessment)}
                      >
                        {deletingId === assessment.id ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
