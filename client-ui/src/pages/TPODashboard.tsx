import { dummyStudentsForTPO } from "../data/dummyData.ts";
import DashboardShell from "../components/DashboardShell.tsx";

export default function TPODashboard() {
  return (
    <DashboardShell title="TPO Dashboard" subtitle="Cohort readiness overview">
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-sand">
              <th className="py-2">Name</th>
              <th className="py-2">Roll No.</th>
              <th className="py-2">Readiness</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {dummyStudentsForTPO.map((s) => (
              <tr key={s.roll} className="border-b border-sand last:border-0">
                <td className="py-3 text-ink">{s.name}</td>
                <td className="py-3 text-muted">{s.roll}</td>
                <td className="py-3 text-ink">{s.readiness}</td>
                <td className="py-3">
                  <span
                    className={`badge ${
                      s.status === "At Risk" ? "bg-blush text-ink" : "bg-sage text-ink"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}