import type { User } from "../types";

export const dummyUsers: User[] = [
  { id: "u1", name: "Aarav Mehta", email: "aarav@student.edu", role: "STUDENT" },
  { id: "u2", name: "Priya Nair", email: "priya@college.edu", role: "TPO" },
  { id: "u3", name: "Rohan Shah", email: "rohan@techcorp.com", role: "RECRUITER" },
];

export const dummyTopicMastery = [
  { topic: "Arrays", accuracy: 82 },
  { topic: "Dynamic Programming", accuracy: 54 },
  { topic: "Graphs", accuracy: 61 },
  { topic: "Quantitative Aptitude", accuracy: 74 },
  { topic: "SQL", accuracy: 88 },
];

export const dummyReadinessScore = 71;

export const dummyStudentsForTPO = [
  { name: "Aarav Mehta", roll: "CS101", readiness: 71, status: "On Track" },
  { name: "Sneha Kulkarni", roll: "CS102", readiness: 48, status: "At Risk" },
  { name: "Vikram Rao", roll: "CS103", readiness: 39, status: "At Risk" },
  { name: "Ishita Verma", roll: "CS104", readiness: 90, status: "On Track" },
];

export const dummyCandidatesForRecruiter = [
  { id: "c1", roll: "CS101", readiness: 71, topStrength: "Arrays", masked: true },
  { id: "c2", roll: "CS104", readiness: 90, topStrength: "SQL", masked: true },
  { id: "c3", roll: "CS107", readiness: 66, topStrength: "Graphs", masked: true },
];