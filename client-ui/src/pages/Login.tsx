import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  Role,
} from "../types";

function getDashboardRoute(
  role: Role
): string {
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

const roleDescriptions: Record<
  "STUDENT" | "TPO" | "RECRUITER",
  string
> = {
  STUDENT:
    "Build skills, assessments, resume evidence and placement readiness.",

  TPO:
    "Manage students, placement drives, eligibility and institutional insights.",

  RECRUITER:
    "Discover verified candidates and manage your hiring pipeline.",
};

export default function Login() {
  const navigate =
    useNavigate();

  const {
    login,
  } = useAuth();

  const [role, setRole] =
    useState<Role>("STUDENT");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      const user =
        await login({
          email:
            email.trim(),
          password,
        });

      if (
        user.role !== role
      ) {
        setError(
          `This account belongs to the ${user.role.toLowerCase()} workspace.`
        );

        return;
      }

      navigate(
        getDashboardRoute(
          user.role
        ),
        {
          replace: true,
        }
      );
    } catch (
      errorValue: unknown
    ) {
      const axiosError =
        errorValue as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

      setError(
        axiosError.response?.data
          ?.message ??
          "Unable to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedRole =
    role === "ADMIN"
      ? "STUDENT"
      : role;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-900 sm:px-6 lg:px-8">

      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">

        {/* LANDING / HERO */}

        <section className="hidden w-[54%] flex-col justify-between bg-slate-950 p-10 text-white lg:flex xl:p-14">

          <div>

            <div className="flex items-center gap-3">

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-950/30">
                T
              </div>

              <div>

                <div className="font-bold">
                  TalentBridge
                </div>

                <div className="text-xs text-slate-400">
                  Placement Intelligence
                </div>

              </div>

            </div>

            <div className="mt-24 max-w-xl">

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
                From profile to placement
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
                Turn your placement journey into measurable progress.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                TalentBridge brings student profiles, skills, assessments, resumes, interviews and opportunities into one structured placement workspace.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-3 gap-3">

            {[
              [
                "Profile",
                "Verified evidence",
              ],
              [
                "Skills",
                "Clear skill gaps",
              ],
              [
                "Jobs",
                "Relevant opportunities",
              ],
            ].map(
              ([
                title,
                text,
              ]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >

                  <div className="text-sm font-bold">
                    {title}
                  </div>

                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    {text}
                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* LOGIN */}

        <section className="flex w-full items-center bg-white p-6 sm:p-10 lg:w-[46%] lg:p-12">

          <div className="mx-auto w-full max-w-md">

            <div className="mb-8 lg:hidden">

              <div className="flex items-center gap-3">

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 font-bold text-white">
                  T
                </div>

                <div>

                  <div className="font-bold text-slate-900">
                    TalentBridge
                  </div>

                  <div className="text-xs text-slate-500">
                    Placement Intelligence
                  </div>

                </div>

              </div>

            </div>

            <div>

              <p className="text-sm font-semibold text-indigo-600">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Sign in to your workspace
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Continue your placement journey from where you left off.
              </p>

            </div>

            <div className="mt-8">

              <div className="grid grid-cols-3 gap-2">

                {(
                  [
                    "STUDENT",
                    "TPO",
                    "RECRUITER",
                  ] as const
                ).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setRole(item);
                        setError("");
                      }}
                      className={[
                        "rounded-xl border px-3 py-3 text-xs font-bold transition",

                        role === item
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                      ].join(
                        " "
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                {
                  roleDescriptions[
                    selectedRole
                  ]
                }
              </p>

            </div>

            <form
              onSubmit={
                handleLogin
              }
              className="mt-7 space-y-5"
            >

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50"
                />

              </div>

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50"
                />

              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>

            </form>

            <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">

              Don't have an account?

              <button
                type="button"
                onClick={() =>
                  navigate(role === "TPO" ? "/tpo/register" : "/register")
                }
                className="ml-1 font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {role === "TPO" ? "Create TPO account" : "Create one"}
              </button>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}