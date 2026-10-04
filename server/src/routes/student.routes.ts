import {
  Router,
  type Request,
  type Response,
} from "express";

import { prisma } from "../lib/prisma";

import {
  requireAuth,
  requireStudent,
} from "../middleware/auth";

import {
  updateProfileCompletion,
} from "../utils/profile";

const router = Router();

router.use(
  requireAuth,
  requireStudent
);

/* =========================================================
   HELPERS
   ========================================================= */

function asOptionalString(
  value: unknown
): string | undefined {
  return typeof value ===
    "string" &&
    value.trim()
    ? value.trim()
    : undefined;
}

function asOptionalNumber(
  value: unknown
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : undefined;
}

function asOptionalDate(
  value: unknown
): Date | undefined {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return undefined;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? undefined
    : date;
}

async function resetProfileVerification(studentId: string): Promise<void> {
  await prisma.studentProfile.update({
    where: {
      id: studentId,
    },
    data: {
      verificationStatus: "PENDING",
      verificationNote: null,
      verifiedAt: null,
      verifiedByTpoId: null,
    },
  });
}

async function getStudentId(
  userId: string
): Promise<string | null> {
  const student =
    await prisma.studentProfile.findUnique(
      {
        where: {
          userId,
        },
        select: {
          id: true,
        },
      }
    );

  return student?.id ?? null;
}

/* =========================================================
   GET PROFILE
   ========================================================= */

router.get("/profile", async (req: Request, res: Response) => {
  try {
    const studentId = await getStudentId(req.user!.id);

    if (!studentId) {
      res.status(404).json({
        message: "Student profile not found",
      });
      return;
    }

    /*
     * Always recalculate completion when the profile is loaded.
     *
     * This is important because profileCompleted may contain a stale
     * value from an older version of the completion algorithm.
     */
    const profileCompleted =
      await updateProfileCompletion(studentId);

    const profile =
      await prisma.studentProfile.findUnique({
        where: {
          id: studentId,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
          addresses: true,
          educations: true,
          skills: {
            include: {
              skill: true,
            },
          },
          projects: true,
          experiences: true,
          certifications: true,
          achievements: true,
          socialLinks: true,
          resumes: true,
          preferences: true,
        },
      });

    if (!profile) {
      res.status(404).json({
        message: "Student profile not found",
      });
      return;
    }

    res.json({
      profile: {
        ...profile,
        profileCompleted,
      },
    });
  } catch (error) {
    console.error(
      "GET /students/profile",
      error
    );

    res.status(500).json({
      message: "Unable to load student profile",
    });
  }
});

/* =========================================================
   PERSONAL
   ========================================================= */

router.put(
  "/profile/personal",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const body =
        req.body as Record<
          string,
          unknown
        >;

      const data = {
        firstName:
          asOptionalString(
            body.firstName
          ),

        middleName:
          asOptionalString(
            body.middleName
          ),

        lastName:
          asOptionalString(
            body.lastName
          ),

        dateOfBirth:
          asOptionalDate(
            body.dateOfBirth
          ),

        gender:
          typeof body.gender ===
            "string" &&
          [
            "MALE",
            "FEMALE",
            "OTHER",
            "PREFER_NOT_TO_SAY",
          ].includes(
            body.gender
          )
            ? (body.gender as
                | "MALE"
                | "FEMALE"
                | "OTHER"
                | "PREFER_NOT_TO_SAY")
            : undefined,

        profilePhoto:
          asOptionalString(
            body.profilePhoto
          ),

        phone:
          asOptionalString(
            body.phone
          ),

        alternatePhone:
          asOptionalString(
            body.alternatePhone
          ),

        nationality:
          asOptionalString(
            body.nationality
          ),

        domicileState:
          asOptionalString(
            body.domicileState
          ),

        bio:
          asOptionalString(
            body.bio
          ),

        collegeName:
          asOptionalString(
            body.collegeName
          ),

        universityName:
          asOptionalString(
            body.universityName
          ),

        branch:
          asOptionalString(
            body.branch
          ),

        enrollmentNumber:
          asOptionalString(
            body.enrollmentNumber
          ),

        graduationYear:
          asOptionalNumber(
            body.graduationYear
          ),
      };

      const profile =
        await prisma.studentProfile.update(
          {
            where: {
              id: studentId,
            },
            data,
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Personal information saved",
        profile,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/personal",
        error
      );

      res.status(500).json({
        message:
          "Unable to save personal information",
      });
    }
  }
);

/* =========================================================
   ADDRESSES
   ========================================================= */

router.put(
  "/profile/addresses",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const addresses: Record<
        string,
        unknown
      >[] = Array.isArray(
        req.body?.addresses
      )
        ? req.body.addresses
        : [];

      const data =
        addresses.map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => {
            const addressLine1 =
              asOptionalString(
                entry.addressLine1
              );

            const city =
              asOptionalString(
                entry.city
              );

            const state =
              asOptionalString(
                entry.state
              );

            const pincode =
              asOptionalString(
                entry.pincode
              );

            if (
              !addressLine1 ||
              !city ||
              !state ||
              !pincode
            ) {
              throw new Error(
                "Address line, city, state and pincode are required"
              );
            }

            return {
              studentId,

              addressLine1,

              addressLine2:
                asOptionalString(
                  entry.addressLine2
                ),

              city,

              state,

              country:
                asOptionalString(
                  entry.country
                ) ?? "India",

              pincode,

              isPermanent:
                entry.isPermanent ===
                true,

              isCurrent:
                entry.isCurrent ===
                true,
            };
          }
        );

      const permanentCount =
        data.filter(
          (item) =>
            item.isPermanent
        ).length;

      const currentCount =
        data.filter(
          (item) =>
            item.isCurrent
        ).length;

      if (
        permanentCount > 1 ||
        currentCount > 1
      ) {
        res.status(400).json({
          message:
            "Only one permanent address and one current address can be selected",
        });

        return;
      }

      const saved =
        await prisma.$transaction(
          async (tx) => {
            await tx.address.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              data.length > 0
            ) {
              await tx.address.createMany(
                {
                  data,
                }
              );
            }

            return tx.address.findMany(
              {
                where: {
                  studentId,
                },
                orderBy: {
                  createdAt:
                    "asc",
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Addresses saved",
        addresses: saved,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/addresses",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save addresses";

      res
        .status(
          message.includes(
            "required"
          ) ||
            message.includes(
              "Only one"
            )
            ? 400
            : 500
        )
        .json({
          message,
        });
    }
  }
);

/* =========================================================
   EDUCATION
   ========================================================= */

router.put(
  "/profile/education",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const entries =
        Array.isArray(
          req.body?.education
        )
          ? req.body.education
          : [];

      const validLevels = [
        "SSC",
        "HSC",
        "DIPLOMA",
        "BACHELORS",
        "MASTERS",
        "PHD",
      ] as const;

      const data =
        entries.map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => {
            if (
              !validLevels.includes(
                entry.level as
                  (typeof validLevels)[number]
              )
            ) {
              throw new Error(
                "Invalid education level"
              );
            }

            return {
              studentId,

              level:
                entry.level as
                  (typeof validLevels)[number],

              institution:
                asOptionalString(
                  entry.institution
                ),

              board:
                asOptionalString(
                  entry.board
                ),

              university:
                asOptionalString(
                  entry.university
                ),

              course:
                asOptionalString(
                  entry.course
                ),

              specialization:
                asOptionalString(
                  entry.specialization
                ),

              startYear:
                asOptionalNumber(
                  entry.startYear
                ),

              endYear:
                asOptionalNumber(
                  entry.endYear
                ),

              percentage:
                asOptionalNumber(
                  entry.percentage
                ),

              cgpa:
                asOptionalNumber(
                  entry.cgpa
                ),
            };
          }
        );

      const education =
        await prisma.$transaction(
          async (tx) => {
            await tx.education.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              data.length > 0
            ) {
              await tx.education.createMany(
                {
                  data,
                }
              );
            }

            return tx.education.findMany(
              {
                where: {
                  studentId,
                },
                orderBy: {
                  endYear:
                    "desc",
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Education saved",
        education,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/education",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save education";

      res
        .status(
          message ===
            "Invalid education level"
            ? 400
            : 500
        )
        .json({
          message,
        });
    }
  }
);

/* =========================================================
   SKILLS
   ========================================================= */

router.put(
  "/profile/skills",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const skills: unknown[] =
        Array.isArray(
          req.body?.skills
        )
          ? req.body.skills
          : [];

      const cleaned =
        skills
          .map(
            (item: unknown) => {
              if (
                typeof item ===
                "string"
              ) {
                return {
                  name:
                    item.trim(),
                  proficiency:
                    undefined,
                  category:
                    undefined,
                };
              }

              const value =
                item as Record<
                  string,
                  unknown
                >;

              return {
                name:
                  asOptionalString(
                    value.name
                  ) ?? "",

                category:
                  asOptionalString(
                    value.category
                  ),

                proficiency:
                  asOptionalNumber(
                    value.proficiency
                  ),
              };
            }
          )
          .filter(
            (
              item: {
                name: string;
                category?:
                  string;
                proficiency?:
                  number;
              }
            ) =>
              Boolean(
                item.name
              )
          );

      const result =
        await prisma.$transaction(
          async (tx) => {
            const skillIds: Array<{
              skillId: string;
              proficiency?:
                number;
            }> = [];

            for (
              const item of cleaned
            ) {
              const skill =
                await tx.skill.upsert(
                  {
                    where: {
                      name:
                        item.name,
                    },

                    update: {
                      category:
                        item.category,
                    },

                    create: {
                      name:
                        item.name,
                      category:
                        item.category,
                    },
                  }
                );

              skillIds.push({
                skillId:
                  skill.id,
                proficiency:
                  item.proficiency,
              });
            }

            await tx.studentSkill.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              skillIds.length >
              0
            ) {
              await tx.studentSkill.createMany(
                {
                  data:
                    skillIds.map(
                      (item) => ({
                        studentId,
                        skillId:
                          item.skillId,
                        proficiency:
                          item.proficiency,
                      })
                    ),
                }
              );
            }

            return tx.studentSkill.findMany(
              {
                where: {
                  studentId,
                },
                include: {
                  skill: true,
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Skills saved",
        skills: result,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/skills",
        error
      );

      res.status(500).json({
        message:
          "Unable to save skills",
      });
    }
  }
);

/* =========================================================
   PROJECTS
   ========================================================= */

router.put(
  "/profile/projects",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const projects =
        Array.isArray(
          req.body?.projects
        )
          ? req.body.projects
          : [];

      const data =
        projects.map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => {
            const title =
              asOptionalString(
                entry.title
              );

            if (!title) {
              throw new Error(
                "Project title is required"
              );
            }

            const technologies =
              Array.isArray(
                entry.technologies
              )
                ? entry.technologies
                    .filter(
                      (
                        x
                      ): x is string =>
                        typeof x ===
                          "string" &&
                        Boolean(
                          x.trim()
                        )
                    )
                    .map(
                      (x) =>
                        x.trim()
                    )
                : [];

            return {
              studentId,

              title,

              description:
                asOptionalString(
                  entry.description
                ),

              technologies,

              githubUrl:
                asOptionalString(
                  entry.githubUrl
                ),

              liveUrl:
                asOptionalString(
                  entry.liveUrl
                ),

              startDate:
                asOptionalDate(
                  entry.startDate
                ),

              endDate:
                asOptionalDate(
                  entry.endDate
                ),
            };
          }
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.project.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              data.length > 0
            ) {
              await tx.project.createMany(
                {
                  data,
                }
              );
            }

            return tx.project.findMany(
              {
                where: {
                  studentId,
                },
                orderBy: {
                  createdAt:
                    "asc",
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Projects saved",
        projects: result,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/projects",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save projects";

      res
        .status(
          message ===
            "Project title is required"
            ? 400
            : 500
        )
        .json({
          message,
        });
    }
  }
);

/* =========================================================
   EXPERIENCE
   ========================================================= */

router.put(
  "/profile/experience",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const experiences =
        Array.isArray(
          req.body?.experiences
        )
          ? req.body.experiences
          : [];

      const validTypes = [
        "INTERNSHIP",
        "FULL_TIME",
        "PART_TIME",
        "FREELANCE",
      ] as const;

      const data =
        experiences.map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => {
            const companyName =
              asOptionalString(
                entry.companyName
              );

            if (!companyName) {
              throw new Error(
                "Company name is required"
              );
            }

            if (
              !validTypes.includes(
                entry.type as
                  (typeof validTypes)[number]
              )
            ) {
              throw new Error(
                "Invalid experience type"
              );
            }

            return {
              studentId,

              type:
                entry.type as
                  (typeof validTypes)[number],

              companyName,

              role:
                asOptionalString(
                  entry.role
                ),

              description:
                asOptionalString(
                  entry.description
                ),

              startDate:
                asOptionalDate(
                  entry.startDate
                ),

              endDate:
                asOptionalDate(
                  entry.endDate
                ),

              isCurrent:
                entry.isCurrent ===
                true,
            };
          }
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.experience.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              data.length > 0
            ) {
              await tx.experience.createMany(
                {
                  data,
                }
              );
            }

            return tx.experience.findMany(
              {
                where: {
                  studentId,
                },
                orderBy: {
                  startDate:
                    "desc",
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Experience saved",
        experiences: result,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/experience",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save experience";

      res
        .status(
          message.startsWith(
            "Invalid experience"
          ) ||
            message ===
              "Company name is required"
            ? 400
            : 500
        )
        .json({
          message,
        });
    }
  }
);

/* =========================================================
   CERTIFICATIONS
   ========================================================= */

router.put(
  "/profile/certifications",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const certifications =
        Array.isArray(
          req.body?.certifications
        )
          ? req.body.certifications
          : [];

      const data =
        certifications.map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => {
            const name =
              asOptionalString(
                entry.name
              );

            if (!name) {
              throw new Error(
                "Certification name is required"
              );
            }

            return {
              studentId,

              name,

              issuingOrg:
                asOptionalString(
                  entry.issuingOrg
                ),

              credentialId:
                asOptionalString(
                  entry.credentialId
                ),

              credentialUrl:
                asOptionalString(
                  entry.credentialUrl
                ),

              issueDate:
                asOptionalDate(
                  entry.issueDate
                ),

              expiryDate:
                asOptionalDate(
                  entry.expiryDate
                ),
            };
          }
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.certification.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              data.length > 0
            ) {
              await tx.certification.createMany(
                {
                  data,
                }
              );
            }

            return tx.certification.findMany(
              {
                where: {
                  studentId,
                },
                orderBy: {
                  issueDate:
                    "desc",
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Certifications saved",
        certifications:
          result,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/certifications",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save certifications";

      res
        .status(
          message ===
            "Certification name is required"
            ? 400
            : 500
        )
        .json({
          message,
        });
    }
  }
);

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

router.put(
  "/profile/achievements",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const achievements =
        Array.isArray(
          req.body?.achievements
        )
          ? req.body.achievements
          : [];

      const data =
        achievements.map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => {
            const title =
              asOptionalString(
                entry.title
              );

            if (!title) {
              throw new Error(
                "Achievement title is required"
              );
            }

            return {
              studentId,

              title,

              description:
                asOptionalString(
                  entry.description
                ),

              date:
                asOptionalDate(
                  entry.date
                ),
            };
          }
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.achievement.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              data.length > 0
            ) {
              await tx.achievement.createMany(
                {
                  data,
                }
              );
            }

            return tx.achievement.findMany(
              {
                where: {
                  studentId,
                },
                orderBy: {
                  date: "desc",
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Achievements saved",
        achievements: result,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/achievements",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save achievements";

      res
        .status(
          message ===
            "Achievement title is required"
            ? 400
            : 500
        )
        .json({
          message,
        });
    }
  }
);

/* =========================================================
   SOCIAL LINKS
   ========================================================= */

router.put(
  "/profile/social-links",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const links =
        Array.isArray(
          req.body?.socialLinks
        )
          ? req.body.socialLinks
          : [];

      const data =
        links.map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => {
            const platform =
              asOptionalString(
                entry.platform
              );

            const url =
              asOptionalString(
                entry.url
              );

            if (
              !platform ||
              !url
            ) {
              throw new Error(
                "Platform and URL are required"
              );
            }

            return {
              studentId,
              platform,
              url,
            };
          }
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            await tx.socialLink.deleteMany(
              {
                where: {
                  studentId,
                },
              }
            );

            if (
              data.length > 0
            ) {
              await tx.socialLink.createMany(
                {
                  data,
                }
              );
            }

            return tx.socialLink.findMany(
              {
                where: {
                  studentId,
                },
                orderBy: {
                  platform:
                    "asc",
                },
              }
            );
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Social links saved",
        socialLinks: result,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/social-links",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to save social links";

      res
        .status(
          message ===
            "Platform and URL are required"
            ? 400
            : 500
        )
        .json({
          message,
        });
    }
  }
);

/* =========================================================
   RESUME
   ========================================================= */

router.put(
  "/profile/resume",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const fileUrl =
        asOptionalString(
          req.body?.fileUrl
        );

      if (!fileUrl) {
        res.status(400).json({
          message:
            "fileUrl is required",
        });

        return;
      }

      const status =
        typeof req.body?.status ===
          "string" &&
        [
          "UPLOADED",
          "ANALYZING",
          "ANALYZED",
          "FAILED",
        ].includes(
          req.body.status
        )
          ? (req.body.status as
              | "UPLOADED"
              | "ANALYZING"
              | "ANALYZED"
              | "FAILED")
          : "UPLOADED";

      const resume =
        await prisma.resume.create(
          {
            data: {
              studentId,

              fileUrl,

              fileName:
                asOptionalString(
                  req.body?.fileName
                ),

              status,

              atsScore:
                asOptionalNumber(
                  req.body?.atsScore
                ),

              analyzedAt:
                status ===
                "ANALYZED"
                  ? asOptionalDate(
                      req.body?.analyzedAt
                    ) ??
                    new Date()
                  : undefined,
            },
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.status(201).json({
        message:
          "Resume saved",
        resume,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/resume",
        error
      );

      res.status(500).json({
        message:
          "Unable to save resume",
      });
    }
  }
);

/* =========================================================
   PREFERENCES
   ========================================================= */

router.put(
  "/profile/preferences",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const studentId =
        await getStudentId(
          req.user!.id
        );

      if (!studentId) {
        res.status(404).json({
          message:
            "Student profile not found",
        });
        return;
      }

      const preferredRoles =
        Array.isArray(
          req.body?.preferredRoles
        )
          ? req.body.preferredRoles
              .filter(
                (
                  x: unknown
                ): x is string =>
                  typeof x ===
                    "string" &&
                  Boolean(
                    x.trim()
                  )
              )
              .map(
                (x: string) =>
                  x.trim()
              )
          : [];

      const preferredLocations =
        Array.isArray(
          req.body
            ?.preferredLocations
        )
          ? req.body.preferredLocations
              .filter(
                (
                  x: unknown
                ): x is string =>
                  typeof x ===
                    "string" &&
                  Boolean(
                    x.trim()
                  )
              )
              .map(
                (x: string) =>
                  x.trim()
              )
          : [];

      if (
        preferredRoles.length ===
        0
      ) {
        res.status(400).json({
          message:
            "At least one preferred role is required",
        });

        return;
      }

      const preference =
        await prisma.placementPreference.upsert(
          {
            where: {
              studentId,
            },

            update: {
              preferredRoles,

              preferredLocations,

              expectedSalaryMin:
                asOptionalNumber(
                  req.body
                    ?.expectedSalaryMin
                ),

              expectedSalaryMax:
                asOptionalNumber(
                  req.body
                    ?.expectedSalaryMax
                ),

              willingToRelocate:
                req.body
                  ?.willingToRelocate ===
                true,

              preferredWorkMode:
                asOptionalString(
                  req.body
                    ?.preferredWorkMode
                ),
            },

            create: {
              studentId,

              preferredRoles,

              preferredLocations,

              expectedSalaryMin:
                asOptionalNumber(
                  req.body
                    ?.expectedSalaryMin
                ),

              expectedSalaryMax:
                asOptionalNumber(
                  req.body
                    ?.expectedSalaryMax
                ),

              willingToRelocate:
                req.body
                  ?.willingToRelocate ===
                true,

              preferredWorkMode:
                asOptionalString(
                  req.body
                    ?.preferredWorkMode
                ),
            },
          }
        );

      const profileCompleted =
        await updateProfileCompletion(
          studentId
        );

      await resetProfileVerification(studentId);

      res.json({
        message:
          "Placement preferences saved",
        preference,
        profileCompleted,
      });
    } catch (error) {
      console.error(
        "PUT /students/profile/preferences",
        error
      );

      res.status(500).json({
        message:
          "Unable to save placement preferences",
      });
    }
  }
);

export default router;