import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import {
  createTPOAssessment,
  type AptitudeSection,
  type AssessmentType,
  type Difficulty,
} from "../services/tpo.service";
import axios from "axios";

const aptitudeOptions: Array<{
  value: AptitudeSection;
  label: string;
  description: string;
}> = [
  { value: "QUANTITATIVE", label: "Quantitative", description: "Numerical and mathematical reasoning" },
  { value: "LOGICAL", label: "Logical", description: "Patterns, deduction and analytical reasoning" },
  { value: "VERBAL", label: "Verbal", description: "Reading, vocabulary and language reasoning" },
  { value: "TECHNICAL", label: "Technical", description: "Technical placement MCQs including DSA, DBMS, OS, CN and OOP" },
];

const defaultTopics = ["Arrays", "Strings", "Hashing", "Two Pointers", "Sliding Window", "Stacks", "Queues", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Greedy"];

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

export default function TPOAssessmentCreatePage() {
  const navigate = useNavigate();
  const [type, setType] = useState<AssessmentType>("DSA");
  const [title, setTitle] = useState("DSA Placement Practice");
  const [description, setDescription] = useState("Placement-oriented DSA coding assessment");
  const [numberOfQuestions, setNumberOfQuestions] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [aptitudeSections, setAptitudeSections] = useState<AptitudeSection[]>([]);
  const [dsaTopics, setDsaTopics] = useState<string[]>(["Arrays", "Strings", "Hashing"]);
  const [instructions, setInstructions] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const topicSuggestions = useMemo(
    () => defaultTopics.filter((topic) => !dsaTopics.includes(topic)),
    [dsaTopics]
  );

  function changeType(nextType: AssessmentType) {
    setType(nextType);
    setError("");

    if (nextType === "DSA") {
      setNumberOfQuestions(3);
      setDurationMinutes(90);
      setAptitudeSections([]);
      if (dsaTopics.length === 0) setDsaTopics(["Arrays", "Strings", "Hashing"]);
    } else {
      setNumberOfQuestions(20);
      setDurationMinutes(30);
      setDsaTopics([]);
      setAptitudeSections(["QUANTITATIVE", "LOGICAL", "VERBAL", "TECHNICAL"]);
    }
  }

  function toggleSection(section: AptitudeSection) {
    setAptitudeSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  }

  function addTopic(topic: string) {
    const cleaned = topic.trim();
    if (!cleaned || dsaTopics.includes(cleaned) || dsaTopics.length >= 20) return;
    setDsaTopics((current) => [...current, cleaned]);
    setCustomTopic("");
  }

  function removeTopic(topic: string) {
    setDsaTopics((current) => current.filter((item) => item !== topic));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (type === "APTITUDE" && aptitudeSections.length === 0) {
      setError("Select at least one aptitude section.");
      return;
    }

    if (type === "DSA" && dsaTopics.length === 0) {
      setError("Select at least one DSA topic.");
      return;
    }

    try {
      setSubmitting(true);
      const assessment = await createTPOAssessment({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        numberOfQuestions,
        durationMinutes,
        difficulty,
        aptitudeSections: type === "APTITUDE" ? aptitudeSections : [],
        dsaTopics: type === "DSA" ? dsaTopics : [],
        instructions: instructions.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });

      navigate(`/tpo/assessments/${assessment.id}`);
    } catch (err) {
      setError(errorMessage(err, "Unable to create the assessment draft."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      role="TPO"
      title="Create Assessment"
      subtitle="Configure the assessment blueprint before generating questions."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/tpo/assessments"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Back to assessments
          </Link>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
            Draft configuration
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              01 · Assessment type
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Choose the assessment</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Students see only DSA and Aptitude. DSA is coding-only; DSA MCQs belong under Aptitude → Technical.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(["DSA", "APTITUDE"] as AssessmentType[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeType(option)}
                  className={`rounded-2xl border p-4 text-left transition ${type === option ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900">{option === "DSA" ? "DSA" : "Aptitude"}</span>
                    <span className={`h-4 w-4 rounded-full border-2 ${type === option ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`} />
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-500">
                    {option === "DSA" ? "3 coding problems · 90 minutes" : "MCQs across placement aptitude sections"}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              02 · Basic details
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Assessment information</h2>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="e.g. DSA Placement Practice" />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={5000} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="What this assessment measures" />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Instructions</span>
                <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={3} maxLength={10000} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Instructions students should see before the assessment" />
              </label>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">03 · Configuration</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Rules and content</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Questions</span>
              <input type="number" min={type === "DSA" ? 3 : 1} max={type === "DSA" ? 3 : 100} value={numberOfQuestions} disabled={type === "DSA"} onChange={(event) => setNumberOfQuestions(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-100" />
              {type === "DSA" && <span className="mt-1 block text-xs text-slate-500">DSA is fixed at exactly 3 coding questions.</span>}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Duration (minutes)</span>
              <input type="number" min={type === "DSA" ? 90 : 5} max={type === "DSA" ? 90 : 240} value={durationMinutes} disabled={type === "DSA"} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-100" />
              {type === "DSA" && <span className="mt-1 block text-xs text-slate-500">DSA is fixed at exactly 90 minutes.</span>}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Difficulty</span>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </label>
          </div>

          {type === "DSA" ? (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">DSA topics</h3>
                  <p className="mt-1 text-sm text-slate-500">These guide AI generation. Questions remain original variations.</p>
                </div>
                <span className="text-xs font-semibold text-slate-400">{dsaTopics.length}/20</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {dsaTopics.map((topic) => (
                  <button key={topic} type="button" onClick={() => removeTopic(topic)} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                    {topic} ×
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {topicSuggestions.slice(0, 8).map((topic) => (
                  <button key={topic} type="button" onClick={() => addTopic(topic)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                    + {topic}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTopic(customTopic); } }} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Add another DSA topic" />
                <button type="button" onClick={() => addTopic(customTopic)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Add</button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div>
                <h3 className="font-bold text-slate-900">Aptitude sections</h3>
                <p className="mt-1 text-sm text-slate-500">Technical includes DSA MCQs and other technical placement topics.</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {aptitudeOptions.map((section) => {
                  const selected = aptitudeSections.includes(section.value);
                  return (
                    <button key={section.value} type="button" onClick={() => toggleSection(section.value)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-900">{section.label}</span>
                        <span className={`h-4 w-4 rounded border ${selected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"}`} />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{section.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">04 · Schedule</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Optional availability window</h2>
          <p className="mt-1 text-sm text-slate-500">Leave both empty to keep the draft unscheduled. Start/end validation is handled by the backend.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Starts at</span>
              <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Ends at</span>
              <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/tpo/assessments" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Creating draft..." : "Create Draft"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
