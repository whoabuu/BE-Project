import { useAuth } from "../context/AuthContext.tsx";
import { dummyTopicMastery, dummyReadinessScore } from "../data/dummyData.ts";
import DashboardShell from "../components/DashboardShell.tsx";

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <DashboardShell title="Student Dashboard" subtitle={`Welcome back, ${user?.name ?? "Student"}`}>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-muted">Readiness Score</p>
          <p className="text-4xl font-semibold mt-2 text-ink">{dummyReadinessScore}</p>
          <span className="badge bg-butter text-ink mt-3 inline-block">On Track</span>
        </div>

        <div className="card md:col-span-2">
          <p className="text-sm text-muted mb-3">Topic Mastery</p>
          <div className="space-y-3">
            {dummyTopicMastery.map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm text-ink mb-1">
                  <span>{t.topic}</span>
                  <span className="text-muted">{t.accuracy}%</span>
                </div>
                <div className="w-full bg-sand rounded-full h-2">
                  <div
                    className="bg-blush h-2 rounded-full"
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}