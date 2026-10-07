import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { getTPOStudent, updateStudentVerification, type TPOStudentDetails, type VerificationStatus } from "../services/tpo.service";

export default function TPOStudentDetailsPage() {
  const { studentId = "" } = useParams();
  const [student, setStudent] = useState<TPOStudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;
    getTPOStudent(studentId).then(setStudent).catch(() => setError("Unable to load student details.")).finally(() => setLoading(false));
  }, [studentId]);

  async function decide(status: VerificationStatus) {
    if (!student) return;
    if (status === "REJECTED" && !note.trim()) { setError("A rejection reason is required."); return; }
    try {
      setBusy(true); setError("");
      const updated = await updateStudentVerification(student.id, status, note.trim());
      setStudent((current) => current ? { ...current, ...updated } : current);
      setRejecting(false); setNote("");
    } catch (value: unknown) {
      const errorValue = value as { response?: { data?: { message?: string } } };
      setError(errorValue.response?.data?.message ?? "Unable to update verification.");
    } finally { setBusy(false); }
  }

  if (loading) return <AppShell role="TPO" title="Student Details" subtitle="Review complete student information"><div className="rounded-2xl bg-white p-8">Loading...</div></AppShell>;
  if (!student) return <AppShell role="TPO" title="Student Details" subtitle="Review complete student information"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || "Student not found."}</div></AppShell>;

  const name = [student.firstName, student.lastName].filter(Boolean).join(" ") || "Unnamed student";

  return (
    <AppShell role="TPO" title="Student Details" subtitle={`${student.studentCode} · ${name}`}>
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/tpo/students" className="text-sm font-semibold text-indigo-600">← Back to students</Link>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${student.verificationStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : student.verificationStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{student.verificationStatus}</span>
      </div>

      <Section title="Verification">
        <div className="grid gap-4 sm:grid-cols-3"><Info label="Student ID" value={student.studentCode} /><Info label="Profile completion" value={`${student.profileCompleted}%`} /><Info label="Email" value={student.email} /></div>
        {student.verificationNote && <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"><b>TPO note:</b> {student.verificationNote}</div>}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {student.verificationStatus === "PENDING" && <div className="flex flex-wrap gap-3"><button disabled={busy || student.profileCompleted < 100} onClick={() => void decide("VERIFIED")} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Saving..." : "Verify profile"}</button><button disabled={busy} onClick={() => setRejecting(true)} className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600">Reject profile</button></div>}
          {student.profileCompleted < 100 && student.verificationStatus === "PENDING" && <p className="mt-3 text-xs text-amber-700">Verification is available only after the profile reaches 100% completion.</p>}
          {rejecting && <div className="mt-4"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Explain what the student needs to correct." className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-400" /><div className="mt-3 flex justify-end gap-2"><button onClick={() => setRejecting(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={busy || !note.trim()} onClick={() => void decide("REJECTED")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Submit rejection</button></div></div>}
        </div>
      </Section>

      <Section title="Personal & Academic"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Info label="Phone" value={student.phone} /><Info label="College" value={student.collegeName} /><Info label="University" value={student.universityName} /><Info label="Branch" value={student.branch} /><Info label="Enrollment number" value={student.enrollmentNumber} /><Info label="Graduation year" value={student.graduationYear} /></div></Section>
      <Section title="Addresses"><List items={student.addresses?.map((a) => `${a.addressLine1}${a.addressLine2 ? `, ${a.addressLine2}` : ""}, ${a.city}, ${a.state}, ${a.country} - ${a.pincode}`) ?? []} empty="No addresses saved." /></Section>
      <Section title="Education"><List items={student.educations?.map((e) => `${e.level}: ${e.institution || "Institution not provided"}${e.course ? ` · ${e.course}` : ""}${e.cgpa != null ? ` · CGPA ${e.cgpa}` : ""}${e.percentage != null ? ` · ${e.percentage}%` : ""}`) ?? []} empty="No education records." /></Section>
      <Section title="Skills"><div className="flex flex-wrap gap-2">{student.skills?.length ? student.skills.map((s) => <span key={`${s.skill.name}-${s.skill.category}`} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">{s.skill.name}{s.proficiency != null ? ` · ${s.proficiency}%` : ""}</span>) : <span className="text-sm text-slate-500">No skills saved.</span>}</div></Section>
      <Section title="Projects"><List items={student.projects?.map((p) => `${p.title}${p.technologies?.length ? ` · ${p.technologies.join(", ")}` : ""}${p.description ? ` — ${p.description}` : ""}`) ?? []} empty="No projects saved." /></Section>
      <Section title="Experience"><List items={student.experiences?.map((e) => `${e.companyName} · ${e.role || "Role not provided"} · ${e.type}${e.description ? ` — ${e.description}` : ""}`) ?? []} empty="No experience saved." /></Section>
      <Section title="Certifications"><List items={student.certifications?.map((c) => `${c.name}${c.issuingOrg ? ` · ${c.issuingOrg}` : ""}${c.credentialId ? ` · ${c.credentialId}` : ""}`) ?? []} empty="No certifications saved." /></Section>
      <Section title="Achievements"><List items={student.achievements?.map((a) => `${a.title}${a.description ? ` — ${a.description}` : ""}`) ?? []} empty="No achievements saved." /></Section>
      <Section title="Social links"><List items={student.socialLinks?.map((s) => `${s.platform}: ${s.url}`) ?? []} empty="No social links saved." /></Section>
      <Section title="Resume"><List items={student.resumes?.map((r) => `${r.fileName || "Resume"} · ${r.status} · ${new Date(r.uploadedAt).toLocaleDateString()}`) ?? []} empty="No resume uploaded." /></Section>
      <Section title="Placement preferences"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Info label="Preferred roles" value={student.preferences?.preferredRoles?.join(", ")} /><Info label="Preferred locations" value={student.preferences?.preferredLocations?.join(", ")} /><Info label="Expected salary" value={student.preferences ? `${student.preferences.expectedSalaryMin ?? "-"} - ${student.preferences.expectedSalaryMax ?? "-"}` : null} /></div></Section>

      <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5"><p className="font-bold text-indigo-900">Student readiness</p><p className="mt-1 text-sm text-indigo-700">Readiness is intentionally blank until assessments, interviews and placement activity are implemented.</p></div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>{children}</section>; }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-900">{value == null || value === "" ? "Not provided" : String(value)}</p></div>; }
function List({ items, empty }: { items: string[]; empty: string }) { return items.length ? <div className="space-y-2">{items.map((item, i) => <div key={`${item}-${i}`} className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item}</div>)}</div> : <p className="text-sm text-slate-500">{empty}</p>; }
