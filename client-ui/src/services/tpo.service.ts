import api from "./api";

export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface TPOStudent {
  id: string;
  studentCode: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  collegeName: string | null;
  branch: string | null;
  enrollmentNumber: string | null;
  graduationYear: number | null;
  profileCompleted: number;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  updatedAt: string;
}

export interface TPOStudentDetails extends TPOStudent {
  phone: string | null;
  universityName: string | null;
  skills: Array<{
    proficiency: number | null;
    skill: {
      name: string;
      category: string | null;
    };
  }>;
  projects: Array<{
    title: string;
    description: string | null;
  }>;
  educations: Array<{
    level: string;
    institution: string | null;
    course: string | null;
    cgpa: number | null;
    percentage: number | null;
  }>;
  experiences: Array<{
    companyName: string;
    role: string | null;
    type: string;
  }>;
  resumes: Array<{
    fileName: string | null;
    status: string;
    uploadedAt: string;
  }>;
}

export async function getTPOStudents() {
  const response = await api.get("/tpo/students");
  return response.data.students as TPOStudent[];
}

export async function getTPOStudent(studentId: string) {
  const response = await api.get(`/tpo/students/${studentId}`);
  return response.data.student as TPOStudentDetails;
}

export async function updateStudentVerification(
  studentId: string,
  status: VerificationStatus,
  note = ""
) {
  const response = await api.patch(
    `/tpo/students/${studentId}/verification`,
    {
      status,
      note,
    }
  );

  return response.data.student as TPOStudent;
}
