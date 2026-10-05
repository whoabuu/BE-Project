import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginUser,
  logout as logoutUser,
  register as registerUser,
} from "../services/auth.service";

export type AuthRole =
  | "STUDENT"
  | "RECRUITER"
  | "TPO"
  | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  name: string;

  isVerified: boolean;
  isActive: boolean;
  createdAt: string;

  student?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePhoto: string | null;
    profileCompleted: number;
    studentCode?: string;
    verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
    verificationNote?: string | null;
    verifiedAt?: string | null;
  } | null;

  recruiter?: {
    id: string;
    name: string | null;
    designation: string | null;
    companyName: string | null;
  } | null;

  tpo?: {
    id: string;
    name: string | null;
    designation: string | null;
    department: string | null;
  } | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (data: LoginData) => Promise<AuthUser>;

  register: (
    data: RegisterData
  ) => Promise<AuthUser>;

  logout: () => void;

  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

function normalizeUser(
  user: Omit<AuthUser, "name"> & {
    name?: string;
  }
): AuthUser {
  let name = user.name ?? "";

  if (!name && user.student) {
    name = [
      user.student.firstName,
      user.student.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (!name && user.recruiter) {
    name = user.recruiter.name ?? "";
  }

  if (!name && user.tpo) {
    name = user.tpo.name ?? "";
  }

  if (!name) {
    name = user.email;
  }

  return {
    ...user,
    name,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refreshUser = async () => {
    const token =
      localStorage.getItem(
        "talentbridge_token"
      );

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response =
        await getCurrentUser();

      setUser(
        normalizeUser(response.user)
      );
    } catch {
      localStorage.removeItem(
        "talentbridge_token"
      );

      setUser(null);
    }
  };

  useEffect(() => {
    async function initializeAuth() {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    }

    void initializeAuth();
  }, []);

  const login = async (
    data: LoginData
  ) => {
    const response =
      await loginUser(data);

    const normalized =
      normalizeUser(response.user);

    setUser(normalized);

    return normalized;
  };

  const register = async (
    data: RegisterData
  ) => {
    const response =
      await registerUser(data);

    const normalized =
      normalizeUser(response.user);

    setUser(normalized);

    return normalized;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated:
          Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}