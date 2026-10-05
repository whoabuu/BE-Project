import {
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate =
    useNavigate();

  const { register } =
    useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please fill in all fields."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      await register({
        email: email.trim(),
        password,
      });

      navigate(
        "/student/onboarding",
        {
          replace: true,
        }
      );
    } catch (error: unknown) {
      const axiosError =
        error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

      setError(
        axiosError.response?.data
          ?.message ??
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md">

        <div className="mb-8 flex items-center justify-between">
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

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Login
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Student registration
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Create your account
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            After registration you'll complete your
            complete placement profile.
          </p>

          <form
            onSubmit={handleRegister}
            className="mt-7 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="student@example.com"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirm password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create Student Account"}
            </button>

          </form>

        </div>

      </div>
    </main>
  );
}