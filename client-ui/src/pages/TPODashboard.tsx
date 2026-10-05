import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import api from "../services/api";

interface DashboardData {
  stats: { total: number; pending: number; verified: number; rejected: number };
  recentPending: Array<{ id: string; studentCode: string; firstName: string | null; lastName: string | null; branch: string | null; profileCompleted: number; updatedAt: string }>;
}

export default function TPODashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/tpo/dashboard").then((response) => setData(response.data)).catch(() => setError("Unable to load TPO dashboard."));
  }, []);

  const cards = data ? [
    ["Total students", data.stats.total, "text-slate-900"],
    ["Pending verification", data.stats.pending, "text-amber-600"],
    ["Verified", data.stats.verified, "text-emerald-600"],
    ["Rejected", data.stats.rejected, "text-red-600"],
  ] : [];

  return (
    <AppShell role="TPO" title="TPO Dashboard" subtitle="Student verification and placement overview">
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, color]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-4xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div><h2 className="font-bold text-slate-900">Pending verification</h2><p className="mt-1 text-sm text-slate-500">Students waiting for profile review.</p></div>
          <Link to="/tpo/students" className="text-sm font-semibold text-indigo-600">View all →</Link>
        </div>
        {!data ? <div className="p-6 text-sm text-slate-500">Loading...</div> : data.recentPending.length === 0 ? <div className="p-6 text-sm text-slate-500">No pending student profiles.</div> : (
          <div className="divide-y divide-slate-100">
            {data.recentPending.map((student) => <Link key={student.id} to={`/tpo/students/${student.id}`} className="flex flex-col gap-3 p-5 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-slate-900">{[student.firstName, student.lastName].filter(Boolean).join(" ") || "Unnamed student"}</p><p className="mt-1 font-mono text-xs text-indigo-600">{student.studentCode}</p><p className="mt-1 text-sm text-slate-500">{student.branch || "Branch not provided"}</p></div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Completion {student.profileCompleted}%</span>
            </Link>)}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
        <p className="font-bold text-indigo-900">Student readiness</p>
        <p className="mt-1 text-sm leading-6 text-indigo-700">Readiness is intentionally blank for this phase. It will be calculated after assessments, interviews and placement activity are implemented.</p>
      </div>
    </AppShell>
  );
}
