import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { getTPOStudents, type TPOStudent, type VerificationStatus } from "../services/tpo.service";

const tabs: Array<{ label: string; value: "ALL" | VerificationStatus }> = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
];

function statusClasses(status: VerificationStatus) {
  if (status === "VERIFIED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

export default function TPOStudentsPage() {
  const [students, setStudents] = useState<TPOStudent[]>([]);
  const [tab, setTab] = useState<"ALL" | VerificationStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTPOStudents().then(setStudents).catch((value: unknown) => {
      const errorValue = value as { response?: { data?: { message?: string } } };
      setError(errorValue.response?.data?.message ?? "Unable to load students.");
    }).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const statusMatch = tab === "ALL" || student.verificationStatus === tab;
      const text = [student.studentCode, student.firstName, student.lastName, student.email, student.branch, student.collegeName, student.enrollmentNumber].filter(Boolean).join(" ").toLowerCase();
      return statusMatch && (!query || text.includes(query));
    });
  }, [students, tab, search]);

  return (
    <AppShell role="TPO" title="Student Verification" subtitle="Review pending profiles and manage student verification.">
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Student profiles</h2>
              <p className="mt-1 text-sm text-slate-500">Open a student to review the complete profile before verification.</p>
            </div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student ID, name, email..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 lg:max-w-sm" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((item) => <button key={item.value} onClick={() => setTab(item.value)} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${tab === item.value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item.label} <span className="ml-1 opacity-70">{item.value === "ALL" ? students.length : students.filter((s) => s.verificationStatus === item.value).length}</span></button>)}
          </div>
        </div>

        {loading ? <div className="p-8 text-sm text-slate-500">Loading students...</div> : visible.length === 0 ? <div className="p-8 text-sm text-slate-500">No students match this view.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-4">Student ID</th><th className="px-5 py-4">Student</th><th className="px-5 py-4">Branch</th><th className="px-5 py-4">Completion</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((student) => <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono font-semibold text-indigo-600">{student.studentCode}</td>
                  <td className="px-5 py-4"><p className="font-semibold text-slate-900">{[student.firstName, student.lastName].filter(Boolean).join(" ") || "Unnamed student"}</p><p className="mt-1 text-xs text-slate-500">{student.email}</p></td>
                  <td className="px-5 py-4 text-slate-600">{student.branch || "Not provided"}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{student.profileCompleted}%</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses(student.verificationStatus)}`}>{student.verificationStatus}</span></td>
                  <td className="px-5 py-4 text-right"><Link to={`/tpo/students/${student.id}`} className="rounded-lg border border-slate-300 px-3.5 py-2 font-semibold text-slate-700 hover:bg-white">View details</Link></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
