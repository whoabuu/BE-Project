import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  getStudentProfile,
  saveAchievements,
  saveAddresses,
  saveCertifications,
  saveEducation,
  saveExperience,
  savePersonal,
  savePreferences,
  saveProjects,
  saveResume,
  saveSkills,
  saveSocialLinks,
  type AchievementData,
  type AddressData,
  type CertificationData,
  type EducationData,
  type ExperienceData,
  type PersonalData,
  type PlacementPreferenceData,
  type ProjectData,
  type SkillData,
  type SocialLinkData,
} from "../services/student.service";

import {
  PersonalStep,
  AddressStep,
  EducationStep,
  SkillsStep,
  ProjectsStep,
  ExperienceStep,
  CertificationStep,
  AchievementStep,
  SocialStep,
  ResumeStep,
  PreferenceStep,
} from "../components/profile/ProfileSteps";

const steps = [
  "Personal",
  "Address",
  "Education",
  "Skills",
  "Projects",
  "Experience",
  "Certifications",
  "Achievements",
  "Social Links",
  "Resume",
  "Preferences",
] as const;

/*
 * Only these seven sections contribute to the completion percentage.
 *
 * 0 Personal
 * 1 Address
 * 2 Education
 * 3 Skills
 * 4 Projects
 * 9 Resume
 * 10 Preferences
 */
const requiredStepIndexes = new Set([
  0,
  1,
  2,
  3,
  4,
  9,
  10,
]);

function emptyPersonal(): PersonalData {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    profilePhoto: "",
    phone: "",
    alternatePhone: "",
    nationality: "Indian",
    domicileState: "",
    bio: "",
    collegeName: "",
    universityName: "",
    branch: "",
    enrollmentNumber: "",
    graduationYear: "",
  };
}

function emptyAddress(): AddressData {
  return {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    isPermanent: true,
    isCurrent: true,
  };
}

function emptyEducation(): EducationData {
  return {
    level: "BACHELORS",
    institution: "",
    board: "",
    university: "",
    course: "",
    specialization: "",
    startYear: "",
    endYear: "",
    percentage: "",
    cgpa: "",
  };
}

function emptySkill(): SkillData {
  return {
    name: "",
    category: "",
    proficiency: "",
  };
}

function emptyProject(): ProjectData {
  return {
    title: "",
    description: "",
    technologies: [],
    githubUrl: "",
    liveUrl: "",
    startDate: "",
    endDate: "",
  };
}

function emptyPreferences(): PlacementPreferenceData {
  return {
    preferredRoles: [],
    preferredLocations: [],
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    willingToRelocate: false,
    preferredWorkMode: "HYBRID",
  };
}

function dateValue(
  value?: string | Date | null
): string {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function hasText(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/* =========================================================
   COMPLETION CHECKS
   ========================================================= */

function personalComplete(
  value: PersonalData
): boolean {
  return Boolean(
    hasText(value.firstName) &&
      hasText(value.lastName) &&
      hasText(value.phone) &&
      hasText(value.dateOfBirth) &&
      hasText(value.gender) &&
      hasText(value.collegeName) &&
      hasText(value.branch) &&
      hasText(value.enrollmentNumber) &&
      value.graduationYear !== "" &&
      Number(value.graduationYear) > 0
  );
}

function addressComplete(
  values: AddressData[]
): boolean {
  return values.some(
    (item) =>
      hasText(item.addressLine1) &&
      hasText(item.city) &&
      hasText(item.state) &&
      hasText(item.pincode)
  );
}

function educationComplete(
  values: EducationData[]
): boolean {
  return values.some(
    (item) =>
      hasText(item.institution) &&
      hasText(item.course)
  );
}

function skillsComplete(
  values: SkillData[]
): boolean {
  return values.some(
    (item) => hasText(item.name)
  );
}

function projectsComplete(
  values: ProjectData[]
): boolean {
  return values.some(
    (item) => hasText(item.title)
  );
}

function experienceComplete(
  values: ExperienceData[]
): boolean {
  return values.some(
    (item) =>
      hasText(item.companyName)
  );
}

function certificationsComplete(
  values: CertificationData[]
): boolean {
  return values.some(
    (item) => hasText(item.name)
  );
}

function achievementsComplete(
  values: AchievementData[]
): boolean {
  return values.some(
    (item) => hasText(item.title)
  );
}

function socialComplete(
  values: SocialLinkData[]
): boolean {
  return values.some(
    (item) =>
      hasText(item.platform) &&
      hasText(item.url)
  );
}

function resumeComplete(
  value:
    | {
        fileUrl: string;
        fileName: string;
      }
    | null
): boolean {
  return Boolean(value?.fileUrl);
}

function preferencesComplete(
  value: PlacementPreferenceData
): boolean {
  return value.preferredRoles.some(
    (role) => hasText(role)
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [serverProgress, setServerProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
  const [verificationNote, setVerificationNote] = useState<string | null>(null);

  const [step, setStep] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [personal, setPersonal] =
    useState<PersonalData>(
      emptyPersonal()
    );

  const [addresses, setAddresses] =
    useState<AddressData[]>([
      emptyAddress(),
    ]);

  const [education, setEducation] =
    useState<EducationData[]>([
      emptyEducation(),
    ]);

  const [skills, setSkills] =
    useState<SkillData[]>([
      emptySkill(),
    ]);

  const [projects, setProjects] =
    useState<ProjectData[]>([
      emptyProject(),
    ]);

  const [experience, setExperience] =
    useState<ExperienceData[]>([]);

  const [certifications, setCertifications] =
    useState<CertificationData[]>([]);

  const [achievements, setAchievements] =
    useState<AchievementData[]>([]);

  const [socialLinks, setSocialLinks] =
    useState<SocialLinkData[]>([]);

  const [resume, setResume] =
    useState<{
      fileUrl: string;
      fileName: string;
    } | null>(null);

  const [preferences, setPreferences] =
    useState<PlacementPreferenceData>(
      emptyPreferences()
    );

  /* =======================================================
     LOAD PROFILE
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const profile =
          await getStudentProfile();

        if (!mounted || !profile) {
          return;
        }

        setServerProgress(Number(profile.profileCompleted ?? 0));
        setVerificationStatus(profile.verificationStatus ?? "PENDING");
        setVerificationNote(profile.verificationNote ?? null);

        setPersonal({
          firstName:
            profile.firstName ?? "",
          middleName:
            profile.middleName ?? "",
          lastName:
            profile.lastName ?? "",
          dateOfBirth:
            dateValue(profile.dateOfBirth),
          gender:
            profile.gender ?? "",
          profilePhoto:
            profile.profilePhoto ?? "",
          phone:
            profile.phone ?? "",
          alternatePhone:
            profile.alternatePhone ?? "",
          nationality:
            profile.nationality ?? "Indian",
          domicileState:
            profile.domicileState ?? "",
          bio:
            profile.bio ?? "",
          collegeName:
            profile.collegeName ?? "",
          universityName:
            profile.universityName ?? "",
          branch:
            profile.branch ?? "",
          enrollmentNumber:
            profile.enrollmentNumber ?? "",
          graduationYear:
            profile.graduationYear ?? "",
        });

        if (
          profile.addresses?.length
        ) {
          setAddresses(
            profile.addresses.map(
              (item: AddressData) => ({
                addressLine1:
                  item.addressLine1 ?? "",
                addressLine2:
                  item.addressLine2 ?? "",
                city:
                  item.city ?? "",
                state:
                  item.state ?? "",
                country:
                  item.country ?? "India",
                pincode:
                  item.pincode ?? "",
                isPermanent:
                  Boolean(
                    item.isPermanent
                  ),
                isCurrent:
                  Boolean(
                    item.isCurrent
                  ),
              })
            )
          );
        }

        if (
          profile.educations?.length
        ) {
          setEducation(
            profile.educations.map(
              (item: EducationData) => ({
                level:
                  item.level,
                institution:
                  item.institution ?? "",
                board:
                  item.board ?? "",
                university:
                  item.university ?? "",
                course:
                  item.course ?? "",
                specialization:
                  item.specialization ?? "",
                startYear:
                  item.startYear ?? "",
                endYear:
                  item.endYear ?? "",
                percentage:
                  item.percentage ?? "",
                cgpa:
                  item.cgpa ?? "",
              })
            )
          );
        }

        if (
          profile.skills?.length
        ) {
          setSkills(
            profile.skills.map(
              (item: {
                skill: {
                  name: string;
                  category:
                    | string
                    | null;
                };
                proficiency:
                  | number
                  | null;
              }) => ({
                name:
                  item.skill?.name ??
                  "",
                category:
                  item.skill?.category ??
                  "",
                proficiency:
                  item.proficiency ??
                  "",
              })
            )
          );
        }

        if (
          profile.projects?.length
        ) {
          setProjects(
            profile.projects.map(
              (item: ProjectData) => ({
                title:
                  item.title ?? "",
                description:
                  item.description ??
                  "",
                technologies:
                  item.technologies ??
                  [],
                githubUrl:
                  item.githubUrl ??
                  "",
                liveUrl:
                  item.liveUrl ??
                  "",
                startDate:
                  dateValue(
                    item.startDate
                  ),
                endDate:
                  dateValue(
                    item.endDate
                  ),
              })
            )
          );
        }

        if (
          profile.experiences?.length
        ) {
          setExperience(
            profile.experiences.map(
              (item: ExperienceData) => ({
                type:
                  item.type,
                companyName:
                  item.companyName ??
                  "",
                role:
                  item.role ?? "",
                description:
                  item.description ??
                  "",
                startDate:
                  dateValue(
                    item.startDate
                  ),
                endDate:
                  dateValue(
                    item.endDate
                  ),
                isCurrent:
                  Boolean(
                    item.isCurrent
                  ),
              })
            )
          );
        }

        if (
          profile.certifications
            ?.length
        ) {
          setCertifications(
            profile.certifications.map(
              (
                item: CertificationData
              ) => ({
                name:
                  item.name ?? "",
                issuingOrg:
                  item.issuingOrg ??
                  "",
                credentialId:
                  item.credentialId ??
                  "",
                credentialUrl:
                  item.credentialUrl ??
                  "",
                issueDate:
                  dateValue(
                    item.issueDate
                  ),
                expiryDate:
                  dateValue(
                    item.expiryDate
                  ),
              })
            )
          );
        }

        if (
          profile.achievements
            ?.length
        ) {
          setAchievements(
            profile.achievements.map(
              (
                item: AchievementData
              ) => ({
                title:
                  item.title ?? "",
                description:
                  item.description ??
                  "",
                date:
                  dateValue(
                    item.date
                  ),
              })
            )
          );
        }

        if (
          profile.socialLinks
            ?.length
        ) {
          setSocialLinks(
            profile.socialLinks.map(
              (
                item: SocialLinkData
              ) => ({
                platform:
                  item.platform ?? "",
                url:
                  item.url ?? "",
              })
            )
          );
        }

        if (
          profile.resumes?.length
        ) {
          const latest =
            profile.resumes[
              profile.resumes.length - 1
            ];

          setResume({
            fileUrl:
              latest.fileUrl,
            fileName:
              latest.fileName ??
              "Resume",
          });
        }

        if (
          profile.preferences
        ) {
          setPreferences({
            preferredRoles:
              profile.preferences
                .preferredRoles ?? [],
            preferredLocations:
              profile.preferences
                .preferredLocations ?? [],
            expectedSalaryMin:
              profile.preferences
                .expectedSalaryMin ??
              "",
            expectedSalaryMax:
              profile.preferences
                .expectedSalaryMax ??
              "",
            willingToRelocate:
              Boolean(
                profile.preferences
                  .willingToRelocate
              ),
            preferredWorkMode:
              profile.preferences
                .preferredWorkMode ??
              "HYBRID",
          });
        }
      } catch {
        if (mounted) {
          setError(
            "Unable to load your profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     COMPLETION STATE
     ======================================================= */

  const completedSteps =
    useMemo(
      () => [
        personalComplete(
          personal
        ),

        addressComplete(
          addresses
        ),

        educationComplete(
          education
        ),

        skillsComplete(
          skills
        ),

        projectsComplete(
          projects
        ),

        experienceComplete(
          experience
        ),

        certificationsComplete(
          certifications
        ),

        achievementsComplete(
          achievements
        ),

        socialComplete(
          socialLinks
        ),

        resumeComplete(
          resume
        ),

        preferencesComplete(
          preferences
        ),
      ],
      [
        personal,
        addresses,
        education,
        skills,
        projects,
        experience,
        certifications,
        achievements,
        socialLinks,
        resume,
        preferences,
      ]
    );

  /*
   * Completion shown to the user is the last value confirmed by the
   * server. Typing into a form or merely moving between steps must never
   * make the persisted profile look more complete than it actually is.
   */
  const progress = serverProgress;

  const currentTitle =
    steps[step];

  const canGoNext =
    step < steps.length - 1;

  /* =======================================================
     UI MESSAGES
     ======================================================= */

  function showError(
    message: string
  ) {
    setError(message);
    setSuccess("");
  }

  function showSuccess(
    message: string
  ) {
    setSuccess(message);
    setError("");
  }

  /* =======================================================
     SAVE CURRENT STEP
     ======================================================= */

  async function saveCurrentStep() {
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      let result:
        | {
            profileCompleted?: number;
          }
        | undefined;

      switch (step) {
        case 0: {
          if (
            !personalComplete(
              personal
            )
          ) {
            showError(
              "Please complete all required personal and academic fields."
            );
            return;
          }

          result =
            await savePersonal(
              personal
            );

          break;
        }

        case 1: {
          const cleanAddresses =
            addresses.filter(
              (item) =>
                hasText(
                  item.addressLine1
                ) ||
                hasText(
                  item.city
                ) ||
                hasText(
                  item.state
                ) ||
                hasText(
                  item.pincode
                ) ||
                hasText(
                  item.addressLine2
                )
            );

          if (
            !addressComplete(
              cleanAddresses
            )
          ) {
            showError(
              "Complete at least one address with address line, city, state and pincode."
            );
            return;
          }

          result =
            await saveAddresses(
              cleanAddresses
            );

          setAddresses(
            cleanAddresses
          );

          break;
        }

        case 2: {
          const cleanEducation =
            education.filter(
              (item) =>
                hasText(
                  item.institution
                ) ||
                hasText(
                  item.course
                ) ||
                hasText(
                  item.board
                ) ||
                hasText(
                  item.university
                ) ||
                hasText(
                  item.specialization
                ) ||
                item.startYear !==
                  "" ||
                item.endYear !==
                  "" ||
                item.percentage !==
                  "" ||
                item.cgpa !== ""
            );

          if (
            !educationComplete(
              cleanEducation
            )
          ) {
            showError(
              "Complete at least one education entry with institution and course."
            );
            return;
          }

          result =
            await saveEducation(
              cleanEducation
            );

          setEducation(
            cleanEducation
          );

          break;
        }

        case 3: {
          const cleanSkills =
            skills.filter(
              (item) =>
                hasText(item.name)
            );

          if (
            cleanSkills.length === 0
          ) {
            showError(
              "Add at least one skill."
            );
            return;
          }

          result =
            await saveSkills(
              cleanSkills
            );

          setSkills(
            cleanSkills
          );

          break;
        }

        case 4: {
          const cleanProjects =
            projects.filter(
              (item) =>
                hasText(item.title)
            );

          if (
            cleanProjects.length === 0
          ) {
            showError(
              "Add at least one project."
            );
            return;
          }

          result =
            await saveProjects(
              cleanProjects
            );

          setProjects(
            cleanProjects
          );

          break;
        }

        case 5: {
          const cleanExperience =
            experience.filter(
              (item) =>
                hasText(
                  item.companyName
                )
            );

          result =
            await saveExperience(
              cleanExperience
            );

          setExperience(
            cleanExperience
          );

          break;
        }

        case 6: {
          const cleanCertifications =
            certifications.filter(
              (item) =>
                hasText(item.name)
            );

          result =
            await saveCertifications(
              cleanCertifications
            );

          setCertifications(
            cleanCertifications
          );

          break;
        }

        case 7: {
          const cleanAchievements =
            achievements.filter(
              (item) =>
                hasText(item.title)
            );

          result =
            await saveAchievements(
              cleanAchievements
            );

          setAchievements(
            cleanAchievements
          );

          break;
        }

        case 8: {
          const cleanSocialLinks =
            socialLinks.filter(
              (item) =>
                hasText(
                  item.platform
                ) &&
                hasText(item.url)
            );

          result =
            await saveSocialLinks(
              cleanSocialLinks
            );

          setSocialLinks(
            cleanSocialLinks
          );

          break;
        }

        case 9: {
          if (!resume) {
            showError(
              "Please upload your resume."
            );
            return;
          }

          result =
            await saveResume({
              fileUrl:
                resume.fileUrl,
              fileName:
                resume.fileName,
              status:
                "UPLOADED",
            });

          break;
        }

        case 10: {
          if (
            !preferencesComplete(
              preferences
            )
          ) {
            showError(
              "Add at least one preferred role."
            );
            return;
          }

          result =
            await savePreferences(
              preferences
            );

          break;
        }
      }

      if (!result) {
        throw new Error(
          `Unable to save ${currentTitle.toLowerCase()}.`
        );
      }

      if (typeof result.profileCompleted === "number") {
        setServerProgress(result.profileCompleted);
      }

      setVerificationStatus("PENDING");
      setVerificationNote(null);

      await refreshUser();

      showSuccess(
        `${currentTitle} saved successfully.`
      );

      if (canGoNext) {
        setStep(
          (current) =>
            current + 1
        );
      } else {
        navigate("/student/profile", {
          replace: true,
        });
      }
    } catch (
      errorValue: unknown
    ) {
      const axiosError =
        errorValue as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

      showError(
        axiosError.response?.data
          ?.message ??
          `Unable to save ${currentTitle.toLowerCase()}.`
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     ARRAY HELPERS
     ======================================================= */

  function updateArrayItem<T>(
    setter: React.Dispatch<
      React.SetStateAction<T[]>
    >,
    index: number,
    value: Partial<T>
  ) {
    setter((items) =>
      items.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...value,
              }
            : item
      )
    );
  }

  function removeItem<T>(
    setter: React.Dispatch<
      React.SetStateAction<T[]>
    >,
    index: number
  ) {
    setter((items) =>
      items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /* =======================================================
     RESUME
     ======================================================= */

  function handleResume(
    file: File
  ) {
    if (
      file.type !==
        "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      showError(
        "Only PDF resumes are supported."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      showError(
        "Resume must be smaller than 5 MB."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result ===
        "string"
      ) {
        setResume({
          fileUrl:
            reader.result,
          fileName:
            file.name,
        });

        showSuccess(
          "Resume selected. Click Save & Continue to save it."
        );
      }
    };

    reader.readAsDataURL(file);
  }

  /* =======================================================
     CURRENT STEP CONTENT
     ======================================================= */

  const stepContent =
    useMemo(() => {
      switch (step) {
        case 0:
          return (
            <PersonalStep
              value={personal}
              onChange={
                setPersonal
              }
            />
          );

        case 1:
          return (
            <AddressStep
              values={addresses}
              setValues={
                setAddresses
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 2:
          return (
            <EducationStep
              values={education}
              setValues={
                setEducation
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 3:
          return (
            <SkillsStep
              values={skills}
              setValues={
                setSkills
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 4:
          return (
            <ProjectsStep
              values={projects}
              setValues={
                setProjects
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 5:
          return (
            <ExperienceStep
              values={experience}
              setValues={
                setExperience
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 6:
          return (
            <CertificationStep
              values={
                certifications
              }
              setValues={
                setCertifications
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 7:
          return (
            <AchievementStep
              values={
                achievements
              }
              setValues={
                setAchievements
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 8:
          return (
            <SocialStep
              values={
                socialLinks
              }
              setValues={
                setSocialLinks
              }
              update={
                updateArrayItem
              }
              remove={
                removeItem
              }
            />
          );

        case 9:
          return (
            <ResumeStep
              resume={resume}
              onUpload={
                handleResume
              }
            />
          );

        case 10:
          return (
            <PreferenceStep
              value={
                preferences
              }
              onChange={
                setPreferences
              }
            />
          );

        default:
          return null;
      }
    }, [
      step,
      personal,
      addresses,
      education,
      skills,
      projects,
      experience,
      certifications,
      achievements,
      socialLinks,
      resume,
      preferences,
    ]);

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading profile...
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 font-bold text-white">
              T
            </div>

            <div>
              <div className="font-bold text-slate-900">
                TalentBridge
              </div>

              <div className="text-[11px] text-slate-500">
                Student Profile
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              navigate("/student", {
                replace: true,
              })
            }
            className="text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[250px_1fr]">
        {/* SIDEBAR */}

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Profile completion
            </p>

            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {progress}%
              </span>

              <span className="text-xs text-slate-500">
                7 required sections
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {steps.map(
              (item, index) => {
                const completed =
                  completedSteps[
                    index
                  ];

                const required =
                  requiredStepIndexes.has(
                    index
                  );

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setStep(index);
                    }}
                    className={[
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                      step === index
                        ? "bg-indigo-50 font-semibold text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                        completed
                          ? "bg-emerald-100 text-emerald-700"
                          : step === index
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {completed
                        ? "✓"
                        : index + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      {item}
                    </span>

                    {!required && (
                      <span className="text-[10px] text-slate-400">
                        Optional
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </nav>
        </aside>

        {/* CONTENT */}

        <section>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Student Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {currentTitle}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete your profile so TalentBridge can build an accurate placement-readiness picture.
            </p>
          </div>

          <div className={[
            "mb-5 rounded-xl border px-4 py-4",
            verificationStatus === "VERIFIED"
              ? "border-emerald-200 bg-emerald-50"
              : verificationStatus === "REJECTED"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50",
          ].join(" ")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Profile verification
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {verificationStatus === "VERIFIED"
                    ? "Your profile has been verified by the TPO."
                    : verificationStatus === "REJECTED"
                      ? "Your profile needs changes before it can be verified."
                      : "Your profile is waiting for TPO verification."}
                </p>
                {verificationStatus === "REJECTED" && verificationNote && (
                  <p className="mt-2 text-sm font-medium text-red-700">
                    TPO note: {verificationNote}
                  </p>
                )}
              </div>
              <span className={[
                "rounded-full px-3 py-1 text-xs font-bold",
                verificationStatus === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-700"
                  : verificationStatus === "REJECTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700",
              ].join(" ")}>
                {verificationStatus}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {stepContent}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={
                step === 0 ||
                saving
              }
              onClick={() =>
                setStep(
                  (current) =>
                    current - 1
                )
              }
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-40"
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveCurrentStep()
              }
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : canGoNext
                  ? "Save & Continue →"
                  : "Complete Profile"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}