import { Navigate, Outlet, useLocation } from "react-router-dom";

import {
  useAuth,
  type AuthUser,
} from "../../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: AuthUser["role"][];
}

function getDefaultRoute(role: AuthUser["role"]): string {
  switch (role) {
    case "STUDENT":
      return "/student";

    case "RECRUITER":
      return "/recruiter";

    case "TPO":
      return "/tpo";

    case "ADMIN":
      return "/settings";

    default:
      return "/";
  }
}

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to={getDefaultRoute(user.role)}
        replace
      />
    );
  }

  return <Outlet />;
}