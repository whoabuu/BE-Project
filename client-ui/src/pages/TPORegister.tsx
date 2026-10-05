import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function TPORegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", name: "", designation: "", department: "", registrationKey: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      setLoading(true);
      const response = await api.post("/auth/tpo/register", form);
      localStorage.setItem("talentbridge_token", response.data.token);
      navigate("/tpo", { replace: true });
      window.location.reload();
    } catch (errorValue: unknown) {
      const error = errorValue as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message ?? "Unable to create TPO account.");
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
        <div className="mb-8">
          <div className="text-sm font-semibold text-indigo-600">TalentBridge</div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Create TPO account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">TPO accounts are protected by an institution-issued registration key.</p>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} required />
            <Field label="Official email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
            <Field label="Designation" value={form.designation} onChange={(v) => update("designation", v)} placeholder="Training & Placement Officer" />
            <Field label="Department" value={form.department} onChange={(v) => update("department", v)} placeholder="Training & Placement" />
            <Field label="Password" type="password" value={form.password} onChange={(v) => update("password", v)} required />
            <Field label="Registration key" type="password" value={form.registrationKey} onChange={(v) => update("registrationKey", v)} required />
          </div>

          <button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Creating account..." : "Create TPO account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/" className="font-semibold text-indigo-600">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
    </label>
  );
}
