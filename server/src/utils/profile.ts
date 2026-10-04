import { prisma } from "../lib/prisma";

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export async function updateProfileCompletion(
  studentId: string
): Promise<number> {
  const student = await prisma.studentProfile.findUnique({
    where: {
      id: studentId,
    },
    include: {
      addresses: {
        select: {
          id: true,
          addressLine1: true,
          city: true,
          state: true,
          pincode: true,
        },
      },

      educations: {
        select: {
          id: true,
          level: true,
          institution: true,
          course: true,
        },
      },

      skills: {
        select: {
          id: true,
          skill: {
            select: {
              name: true,
            },
          },
        },
      },

      projects: {
        select: {
          id: true,
          title: true,
        },
      },

      resumes: {
        select: {
          id: true,
          fileUrl: true,
        },
      },

      preferences: {
        select: {
          id: true,
          preferredRoles: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  /*
   * Phase 2 has exactly 7 REQUIRED sections.
   *
   * Optional:
   * - Experience
   * - Certifications
   * - Achievements
   * - Social Links
   *
   * These must NEVER affect the completion percentage.
   */

  // 1. PERSONAL
  const personalComplete =
    hasText(student.firstName) &&
    hasText(student.lastName) &&
    hasText(student.phone) &&
    Boolean(student.dateOfBirth) &&
    Boolean(student.gender) &&
    hasText(student.collegeName) &&
    hasText(student.branch) &&
    hasText(student.enrollmentNumber) &&
    student.graduationYear !== null &&
    student.graduationYear !== undefined;

  // 2. ADDRESS
  const addressComplete = student.addresses.some(
    (address) =>
      hasText(address.addressLine1) &&
      hasText(address.city) &&
      hasText(address.state) &&
      hasText(address.pincode)
  );

  // 3. EDUCATION
  const educationComplete = student.educations.some(
    (education) =>
      hasText(education.institution) &&
      hasText(education.course)
  );

  // 4. SKILLS
  const skillsComplete = student.skills.some(
    (item) => hasText(item.skill?.name)
  );

  // 5. PROJECTS
  const projectsComplete = student.projects.some(
    (project) => hasText(project.title)
  );

  // 6. RESUME
  const resumeComplete = student.resumes.some(
    (resume) => hasText(resume.fileUrl)
  );

  // 7. PREFERENCES
  const preferencesComplete =
    Boolean(student.preferences) &&
    Array.isArray(student.preferences?.preferredRoles) &&
    student.preferences.preferredRoles.length > 0;

  const requiredSections = [
    personalComplete,
    addressComplete,
    educationComplete,
    skillsComplete,
    projectsComplete,
    resumeComplete,
    preferencesComplete,
  ];

  const completedSections =
    requiredSections.filter(Boolean).length;

  const percentage = Math.round(
    (completedSections / requiredSections.length) * 100
  );

  await prisma.studentProfile.update({
    where: {
      id: studentId,
    },
    data: {
      profileCompleted: percentage,
    },
  });

  return percentage;
}