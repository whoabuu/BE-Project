import { useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import {
  getTPOStudents,
  updateStudentVerification,
  type TPOStudent,
  type VerificationStatus,
} from "../services/tpo.service";

function statusClasses(status: VerificationStatus) {
  if (status === "VERIFIED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

export default function TPOStudentsPage() {
  const [students, setStudents] = useState<TPOStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function loadStudents() {
    try {
      setError("");
      const value = await getTPOStudents();
      setStudents(value);
    } catch (errorValue: unknown) {
      const axiosError = errorValue as {
        response?: { data?: { message?: string } };
      };

      setError(
        axiosError.response?.data?.message ??
          "Unable to load student profiles."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  async function verify(
    studentId: string,
    status: "VERIFIED" | "REJECTED",
    rejectionNote = ""
  ) {
    try {
      setBusyId(studentId);
      setError("");

      const updated = await updateStudentVerification(
        studentId,
        status,
        rejectionNote
      );

      setStudents((current) =>
        current.map((student) =>
          student.id === studentId
            ? updated
            : student
        )
      );

      setNoteFor(null);
      setNote("");
    } catch (errorValue: unknown) {
      const axiosError = errorValue as {
        response?: { data?: { message?: string } };
      };

      setError(
        axiosError.response?.data?.message ??
          "Unable to update verification status."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <AppShell
      role="TPO"
      title="Student Management"
      subtitle="Review profile completion and verify student evidence."
    >
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <p className="text-sm text-slate-500">
            {students.length} student profile{students.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-500">
            Loading student profiles...
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">
            No student profiles are available yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((student) => {
              const name =
                [student.firstName, student.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                "Unnamed student";

              const busy = busyId === student.id;

              return (
                <div
                  key={student.id}
                  className="p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses(
                            student.verificationStatus
                          )}`}
                        >
                          {student.verificationStatus}
                        </span>
                      </div>

                      <p className="mt-1 font-mono text-xs font-semibold text-indigo-600">
                        {student.studentCode}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {student.email}
                      </p>

                      <p className="mt-2 text-sm text-slate-700">
                        {student.branch || "Branch not provided"} ·{" "}
                        {student.collegeName || "College not provided"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                          Completion: {student.profileCompleted}%
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                          Enrollment: {student.enrollmentNumber || "Not provided"}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                          Graduation: {student.graduationYear || "Not provided"}
                        </span>
                      </div>

                      {student.verificationStatus === "REJECTED" &&
                        student.verificationNote && (
                          <p className="mt-3 text-sm text-red-600">
                            <span className="font-semibold">Previous note:</span>{" "}
                            {student.verificationNote}
                          </p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || student.profileCompleted < 100}
                        onClick={() =>
                          void verify(student.id, "VERIFIED")
                        }
                        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          student.profileCompleted < 100
                            ? "The profile must be 100% complete before verification."
                            : undefined
                        }
                      >
                        {busy ? "Saving..." : "Verify"}
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setNoteFor(student.id);
                          setNote("");
                        }}
                        className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {noteFor === student.id && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                      <label className="block text-sm font-semibold text-red-900">
                        Reason for rejection
                      </label>

                      <textarea
                        value={note}
                        onChange={(event) =>
                          setNote(event.target.value)
                        }
                        rows={3}
                        placeholder="Tell the student what needs to be corrected."
                        className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNoteFor(null);
                            setNote("");
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={!note.trim() || busy}
                          onClick={() =>
                            void verify(
                              student.id,
                              "REJECTED",
                              note.trim()
                            )
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                          Submit rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
