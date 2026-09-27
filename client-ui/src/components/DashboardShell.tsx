import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          <p className="text-muted text-sm mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          Log out
        </button>
      </div>
      {children}
    </div>
  );
}