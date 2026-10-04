import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { getStudentProfile } from "../services/student.service";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface StudentSettingsProfile {
  profileCompleted: number;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
}

function statusClasses(status: VerificationStatus) {
  if (status === "VERIFIED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState<StudentSettingsProfile | null>(null);

  useEffect(() => {
    if (user?.role !== "STUDENT") {
      return;
    }

    void getStudentProfile()
      .then(setProfile)
      .catch(() => {
        setProfile(null);
      });
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <AppShell
      role={user?.role === "TPO" ? "TPO" : user?.role === "RECRUITER" ? "RECRUITER" : "STUDENT"}
      title="Settings"
      subtitle="Manage your account and profile access."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Account
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Account information
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Name
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {user?.name}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Role
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {user?.role}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Security
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Session
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Logging out removes the local TalentBridge access token from this
            browser.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </section>

        {user?.role === "STUDENT" && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Student profile
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Profile completion
                  </h2>
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {profile?.profileCompleted ?? user.student?.profileCompleted ?? 0}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{
                    width: `${profile?.profileCompleted ?? user.student?.profileCompleted ?? 0}%`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/student/profile")}
                className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                View profile
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Verification
              </p>

              <div className="mt-3 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">
                  TPO verification
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(
                    profile?.verificationStatus ?? "PENDING"
                  )}`}
                >
                  {profile?.verificationStatus ?? "PENDING"}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Editing any profile section after verification sends the
                profile back to PENDING so the TPO can review the changed data.
              </p>

              {profile?.verificationStatus === "REJECTED" &&
                profile.verificationNote && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <span className="font-bold">TPO note:</span>{" "}
                    {profile.verificationNote}
                  </div>
                )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
