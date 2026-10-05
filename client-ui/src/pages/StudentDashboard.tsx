import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/AppShell";
import { getStudentProfile } from "../services/student.service";

interface StudentProfileSummary {
  profileCompleted: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationNote: string | null;
  skills?: Array<unknown>;
  projects?: Array<unknown>;
  experiences?: Array<unknown>;
  educations?: Array<unknown>;
  certifications?: Array<unknown>;
  achievements?: Array<unknown>;
  resumes?: Array<unknown>;
  preferences?: unknown;
}

function statusClasses(status: StudentProfileSummary["verificationStatus"]) {
  if (status === "VERIFIED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function StudentDashboard() {
  const { user } = useAuth();
  return <StudentDashboardContent user={user} />;
}

function StudentDashboardContent({ user }: { user: { name?: string } | null }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const value = await getStudentProfile();
        if (mounted) {
          setProfile(value);
        }
      } catch {
        if (mounted) {
          setError("Unable to load your dashboard data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const completion = profile?.profileCompleted ?? 0;
  const verificationStatus = profile?.verificationStatus ?? "PENDING";

  const evidence = [
    ["Skills", profile?.skills?.length ?? 0],
    ["Projects", profile?.projects?.length ?? 0],
    ["Education", profile?.educations?.length ?? 0],
    ["Experience", profile?.experiences?.length ?? 0],
  ];

  return (
    <AppShell
      title="Student Dashboard"
      subtitle={`Welcome back, ${user?.name ?? "Student"}`}
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading your profile data...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Profile completion</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">
                {completion}%
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/student/profile")}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Update profile →
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Profile verification</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {verificationStatus === "VERIFIED"
                      ? "Verified profile"
                      : verificationStatus === "REJECTED"
                        ? "Changes requested"
                        : "Waiting for TPO verification"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {verificationStatus === "VERIFIED"
                      ? "Your profile can be treated as verified evidence."
                      : "A TPO member reviews the profile after you complete and save it."}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(
                    verificationStatus
                  )}`}
                >
                  {verificationStatus}
                </span>
              </div>

              {verificationStatus === "REJECTED" && profile?.verificationNote && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <span className="font-bold">TPO note:</span>{" "}
                  {profile.verificationNote}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Profile evidence
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  These counts come directly from your saved profile.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-400">
                No fabricated readiness score
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {evidence.map(([label, count]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm font-bold text-indigo-900">
              Placement readiness
            </p>
            <p className="mt-1 text-sm leading-6 text-indigo-700">
              Assessment, interview and job-application data are not stored
              in the current database schema yet, so the dashboard does not
              invent a readiness score. Human beings have already invented
              enough fake numbers.
            </p>
          </div>
        </>
      )}
    </AppShell>
  );
}
