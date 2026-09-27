import { useState } from "react";
import { dummyCandidatesForRecruiter } from "../data/dummyData.ts";
import DashboardShell from "../components/DashboardShell.tsx";

export default function RecruiterDashboard() {
  const [blind, setBlind] = useState(true);

  return (
    <DashboardShell title="Recruiter Dashboard" subtitle="Verified candidate scorecards">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-ink">Blind Shortlisting</span>
        <button
          onClick={() => setBlind(!blind)}
          className={`w-11 h-6 rounded-full transition-colors ${
            blind ? "bg-sage" : "bg-clay"
          } relative`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-soft transition-transform ${
              blind ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {dummyCandidatesForRecruiter.map((c) => (
          <div key={c.id} className="card">
            <p className="font-medium text-ink">{blind ? c.roll : `Candidate ${c.roll}`}</p>
            <p className="text-sm text-muted mt-1">Top strength: {c.topStrength}</p>
            <p className="text-2xl font-semibold text-ink mt-3">{c.readiness}</p>
            <span className="badge bg-butter text-ink mt-2 inline-block">Verified</span>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}