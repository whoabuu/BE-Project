import api from "./api";

export interface PersonalData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender:
    | "MALE"
    | "FEMALE"
    | "OTHER"
    | "PREFER_NOT_TO_SAY"
    | "";

  profilePhoto: string;

  phone: string;
  alternatePhone: string;

  nationality: string;
  domicileState: string;

  bio: string;

  collegeName: string;
  universityName: string;
  branch: string;
  enrollmentNumber: string;
  graduationYear: number | "";
}

export interface AddressData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;

  isPermanent: boolean;
  isCurrent: boolean;
}

export interface EducationData {
  level:
    | "SSC"
    | "HSC"
    | "DIPLOMA"
    | "BACHELORS"
    | "MASTERS"
    | "PHD";

  institution: string;
  board: string;
  university: string;
  course: string;
  specialization: string;

  startYear: number | "";
  endYear: number | "";

  percentage: number | "";
  cgpa: number | "";
}

export interface SkillData {
  name: string;
  category: string;
  proficiency: number | "";
}

export interface ProjectData {
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
  startDate: string;
  endDate: string;
}

export interface ExperienceData {
  type:
    | "INTERNSHIP"
    | "FULL_TIME"
    | "PART_TIME"
    | "FREELANCE";

  companyName: string;
  role: string;
  description: string;

  startDate: string;
  endDate: string;

  isCurrent: boolean;
}

export interface CertificationData {
  name: string;
  issuingOrg: string;
  credentialId: string;
  credentialUrl: string;

  issueDate: string;
  expiryDate: string;
}

export interface AchievementData {
  title: string;
  description: string;
  date: string;
}

export interface SocialLinkData {
  platform: string;
  url: string;
}

export interface PlacementPreferenceData {
  preferredRoles: string[];
  preferredLocations: string[];

  expectedSalaryMin: number | "";
  expectedSalaryMax: number | "";

  willingToRelocate: boolean;

  preferredWorkMode: string;
}

export async function getStudentProfile() {
  const response =
    await api.get("/students/profile");

  return response.data.profile;
}

export async function savePersonal(
  data: PersonalData
) {
  const response =
    await api.put(
      "/students/profile/personal",
      data
    );

  return response.data;
}

export async function saveAddresses(
  addresses: AddressData[]
) {
  const response =
    await api.put(
      "/students/profile/addresses",
      {
        addresses,
      }
    );

  return response.data;
}

export async function saveEducation(
  education: EducationData[]
) {
  const response =
    await api.put(
      "/students/profile/education",
      {
        education,
      }
    );

  return response.data;
}

export async function saveSkills(
  skills: SkillData[]
) {
  const response =
    await api.put(
      "/students/profile/skills",
      {
        skills,
      }
    );

  return response.data;
}

export async function saveProjects(
  projects: ProjectData[]
) {
  const response =
    await api.put(
      "/students/profile/projects",
      {
        projects,
      }
    );

  return response.data;
}

export async function saveExperience(
  experiences: ExperienceData[]
) {
  const response =
    await api.put(
      "/students/profile/experience",
      {
        experiences,
      }
    );

  return response.data;
}

export async function saveCertifications(
  certifications: CertificationData[]
) {
  const response =
    await api.put(
      "/students/profile/certifications",
      {
        certifications,
      }
    );

  return response.data;
}

export async function saveAchievements(
  achievements: AchievementData[]
) {
  const response =
    await api.put(
      "/students/profile/achievements",
      {
        achievements,
      }
    );

  return response.data;
}

export async function saveSocialLinks(
  socialLinks: SocialLinkData[]
) {
  const response =
    await api.put(
      "/students/profile/social-links",
      {
        socialLinks,
      }
    );

  return response.data;
}

export async function saveResume(
  data: {
    fileUrl: string;
    fileName: string;
    status?: "UPLOADED";
  }
) {
  const response =
    await api.put(
      "/students/profile/resume",
      data
    );

  return response.data;
}

export async function savePreferences(
  data: PlacementPreferenceData
) {
  const response =
    await api.put(
      "/students/profile/preferences",
      data
    );

  return response.data;
}