import { prisma } from "../lib/prisma";

export async function updateProfileCompletion(studentId: string): Promise<number> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      educations: { select: { id: true } },
      skills: { select: { id: true } },
      projects: { select: { id: true } },
      experiences: { select: { id: true } },
      certifications: { select: { id: true } },
      achievements: { select: { id: true } },
      addresses: { select: { id: true } },
      resumes: { select: { id: true } },
      socialLinks: { select: { id: true } },
      preferences: { select: { id: true } },
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  // These are the fields needed for a placement-ready profile.
  // Experience, certifications, achievements and social links are optional and
  // therefore do not block completion for a fresher.
  const checks = [
    Boolean(student.firstName && student.lastName && student.phone),
    Boolean(student.dateOfBirth && student.gender),
    Boolean(student.collegeName && student.branch && student.enrollmentNumber && student.graduationYear),
    student.addresses.length > 0,
    student.educations.length > 0,
    student.skills.length > 0,
    student.projects.length > 0,
    student.resumes.length > 0,
    Boolean(student.preferences),
  ];

  const completed = checks.filter(Boolean).length;
  const percentage = Math.round((completed / checks.length) * 100);

  await prisma.studentProfile.update({
    where: { id: studentId },
    data: { profileCompleted: percentage },
  });

  return percentage;
}
