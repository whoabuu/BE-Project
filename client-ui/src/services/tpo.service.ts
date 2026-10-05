import api from "./api";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface TPOStudent {
  id: string; studentCode: string; userId: string; email: string;
  firstName: string | null; lastName: string | null; collegeName: string | null;
  branch: string | null; enrollmentNumber: string | null; graduationYear: number | null;
  profileCompleted: number; verificationStatus: VerificationStatus; verificationNote: string | null;
  verifiedAt?: string | null; updatedAt: string;
}

export interface TPOStudentDetails extends TPOStudent {
  phone: string | null; universityName: string | null; middleName?: string | null;
  dateOfBirth?: string | null; gender?: string | null; alternatePhone?: string | null;
  nationality?: string | null; domicileState?: string | null; bio?: string | null;
  addresses: Array<{ addressLine1: string; addressLine2: string | null; city: string; state: string; country: string; pincode: string; isPermanent: boolean; isCurrent: boolean }>;
  skills: Array<{ proficiency: number | null; skill: { name: string; category: string | null } }>;
  projects: Array<{ title: string; description: string | null; technologies: string[]; githubUrl: string | null; liveUrl: string | null }>;
  educations: Array<{ level: string; institution: string | null; course: string | null; cgpa: number | null; percentage: number | null }>;
  experiences: Array<{ companyName: string; role: string | null; type: string; description: string | null }>;
  certifications: Array<{ name: string; issuingOrg: string | null; credentialId: string | null; credentialUrl: string | null }>;
  achievements: Array<{ title: string; description: string | null }>;
  socialLinks: Array<{ platform: string; url: string }>;
  resumes: Array<{ fileName: string | null; status: string; uploadedAt: string; fileUrl: string }>;
  preferences: { preferredRoles?: string[]; preferredLocations?: string[]; expectedSalaryMin?: number | null; expectedSalaryMax?: number | null; willingToRelocate?: boolean; preferredWorkMode?: string | null } | null;
}

export interface TPODashboardData {
  stats: { total: number; pending: number; verified: number; rejected: number };
  recentPending: Array<{ id: string; studentCode: string; firstName: string | null; lastName: string | null; branch: string | null; profileCompleted: number; updatedAt: string }>;
}

export async function getTPODashboard() {
  const response = await api.get("/tpo/dashboard");
  return response.data as TPODashboardData;
}

export async function getTPOStudents() {
  const response = await api.get("/tpo/students");
  return response.data.students as TPOStudent[];
}

export async function getTPOStudent(studentId: string) {
  const response = await api.get(`/tpo/students/${studentId}`);
  return response.data.student as TPOStudentDetails;
}

export async function updateStudentVerification(studentId: string, status: VerificationStatus, note = "") {
  const response = await api.patch(`/tpo/students/${studentId}/verification`, { status, note });
  return response.data.student as TPOStudent;
}
