import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { getStudentProfile } from "../services/student.service";

type Status = "PENDING" | "VERIFIED" | "REJECTED";
type AnyRecord = Record<string, any>;

function value(v: unknown) {
  if (v === null || v === undefined || v === "") return "Not provided";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "Not provided";
  return String(v);
}
function date(v: unknown) {
  if (!v) return "Not provided";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? value(v) : d.toLocaleDateString("en-IN");
}
function statusClass(s: Status) {
  return s === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : s === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">{title}</h2><div className="mt-5">{children}</div></section>;
}
function Grid({ children }: { children: ReactNode }) { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><div className="mt-1 break-words text-sm font-medium text-slate-800">{children}</div></div>; }
function Empty({ text }: { text: string }) { return <p className="text-sm text-slate-500">{text}</p>; }

export default function StudentProfileViewPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getStudentProfile().then((data) => { if (active) setProfile(data); }).catch(() => { if (active) setError("Unable to load your saved profile."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <AppShell title="My Profile" subtitle="Your saved TalentBridge profile."><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading your profile...</div></AppShell>;
  if (error || !profile) return <AppShell title="My Profile" subtitle="Your saved TalentBridge profile."><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Profile not found."}</div></AppShell>;

  const status = (profile.verificationStatus ?? "PENDING") as Status;
  const name = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ") || "Student";

  return <AppShell title="My Profile" subtitle="This is the information saved when you created and completed your account.">
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Student profile</p><h1 className="mt-2 text-2xl font-bold text-slate-900">{name}</h1><p className="mt-1 font-mono text-sm font-semibold text-slate-500">{profile.studentCode}</p></div>
          <div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(status)}`}>{status}</span><button type="button" onClick={() => navigate("/student/edit-profile")} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Edit profile</button></div>
        </div>
        <div className="mt-5"><div className="flex justify-between text-sm"><span className="text-slate-500">Profile completion</span><b>{profile.profileCompleted ?? 0}%</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${profile.profileCompleted ?? 0}%` }} /></div></div>
        {status === "PENDING" && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Your profile is waiting for TPO verification. Any profile update will remain pending until the TPO verifies the latest information.</div>}
        {status === "REJECTED" && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><b>TPO note:</b> {profile.verificationNote || "Please review and update your profile."}</div>}
      </section>

      <Section title="Personal & academic information"><Grid><Field label="Student ID">{value(profile.studentCode)}</Field><Field label="Full name">{name}</Field><Field label="Email">{value(profile.user?.email)}</Field><Field label="Date of birth">{date(profile.dateOfBirth)}</Field><Field label="Gender">{value(profile.gender)}</Field><Field label="Phone">{value(profile.phone)}</Field><Field label="Alternate phone">{value(profile.alternatePhone)}</Field><Field label="Nationality">{value(profile.nationality)}</Field><Field label="Domicile state">{value(profile.domicileState)}</Field><Field label="College">{value(profile.collegeName)}</Field><Field label="University">{value(profile.universityName)}</Field><Field label="Branch">{value(profile.branch)}</Field><Field label="Enrollment number">{value(profile.enrollmentNumber)}</Field><Field label="Graduation year">{value(profile.graduationYear)}</Field></Grid>{profile.bio && <div className="mt-5"><Field label="Bio">{profile.bio}</Field></div>}</Section>

      <Section title="Addresses">{profile.addresses?.length ? <div className="grid gap-4 lg:grid-cols-2">{profile.addresses.map((a: AnyRecord) => <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="font-semibold text-slate-900">{a.isPermanent ? "Permanent" : a.isCurrent ? "Current" : "Address"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{[a.addressLine1,a.addressLine2,a.city,a.state,a.pincode,a.country].filter(Boolean).join(", ")}</p></div>)}</div> : <Empty text="No address saved." />}</Section>

      <Section title="Education">{profile.educations?.length ? <div className="space-y-3">{profile.educations.map((e: AnyRecord) => <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><Grid><Field label="Level">{value(e.level)}</Field><Field label="Institution">{value(e.institution)}</Field><Field label="Course">{value(e.course)}</Field><Field label="Specialization">{value(e.specialization)}</Field><Field label="Years">{e.startYear || e.endYear ? `${e.startYear ?? "?"} - ${e.endYear ?? "?"}` : "Not provided"}</Field><Field label="Result">{e.cgpa != null ? `${e.cgpa} CGPA` : e.percentage != null ? `${e.percentage}%` : "Not provided"}</Field></Grid></div>)}</div> : <Empty text="No education records saved." />}</Section>

      <Section title="Skills">{profile.skills?.length ? <div className="flex flex-wrap gap-2">{profile.skills.map((s: AnyRecord) => <span key={s.id} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">{s.skill?.name}{s.proficiency != null ? ` · ${s.proficiency}%` : ""}</span>)}</div> : <Empty text="No skills saved." />}</Section>

      <Section title="Projects">{profile.projects?.length ? <div className="space-y-3">{profile.projects.map((p: AnyRecord) => <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><h3 className="font-semibold text-slate-900">{p.title}</h3><p className="mt-1 text-sm text-slate-600">{value(p.description)}</p>{p.technologies?.length > 0 && <p className="mt-2 text-xs font-medium text-slate-500">{p.technologies.join(" · ")}</p>}</div>)}</div> : <Empty text="No projects saved." />}</Section>

      <Section title="Experience">{profile.experiences?.length ? <div className="space-y-3">{profile.experiences.map((x: AnyRecord) => <div key={x.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><h3 className="font-semibold text-slate-900">{x.role || x.type}</h3><p className="text-sm text-slate-600">{x.companyName}</p></div>)}</div> : <Empty text="No experience saved." />}</Section>

      <div className="grid gap-5 lg:grid-cols-2"><Section title="Certifications">{profile.certifications?.length ? <div className="space-y-3">{profile.certifications.map((c: AnyRecord) => <div key={c.id}><p className="font-semibold text-slate-900">{c.name}</p><p className="text-sm text-slate-500">{value(c.issuingOrg)}</p></div>)}</div> : <Empty text="No certifications saved." />}</Section><Section title="Achievements">{profile.achievements?.length ? <div className="space-y-3">{profile.achievements.map((a: AnyRecord) => <div key={a.id}><p className="font-semibold text-slate-900">{a.title}</p><p className="text-sm text-slate-500">{value(a.description)}</p></div>)}</div> : <Empty text="No achievements saved." />}</Section></div>

      <Section title="Social links">{profile.socialLinks?.length ? <div className="space-y-2">{profile.socialLinks.map((l: AnyRecord) => <div key={l.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3"><span className="text-sm font-semibold text-slate-700">{l.platform}</span><a className="truncate text-sm text-indigo-600 hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.url}</a></div>)}</div> : <Empty text="No social links saved." />}</Section>

      <div className="grid gap-5 lg:grid-cols-2"><Section title="Resume">{profile.resumes?.length ? <div><p className="font-semibold text-slate-900">{profile.resumes[0].fileName || "Resume"}</p><p className="mt-1 text-sm text-slate-500">Status: {value(profile.resumes[0].status)}</p></div> : <Empty text="No resume saved." />}</Section><Section title="Placement preferences">{profile.preferences ? <Grid><Field label="Preferred roles">{value(profile.preferences.preferredRoles)}</Field><Field label="Locations">{value(profile.preferences.preferredLocations)}</Field><Field label="Work mode">{value(profile.preferences.preferredWorkMode)}</Field><Field label="Willing to relocate">{value(profile.preferences.willingToRelocate)}</Field></Grid> : <Empty text="No placement preferences saved." />}</Section></div>
    </div>
  </AppShell>;
}
