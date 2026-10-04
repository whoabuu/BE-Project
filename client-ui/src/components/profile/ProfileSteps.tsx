import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type {
  AchievementData,
  AddressData,
  CertificationData,
  EducationData,
  ExperienceData,
  PersonalData,
  PlacementPreferenceData,
  ProjectData,
  SkillData,
  SocialLinkData,
} from "../../services/student.service";

const inputClass = () =>
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

type ArrayUpdater<T> = (
  setter: Dispatch<
    SetStateAction<T[]>
  >,
  index: number,
  value: Partial<T>
) => void;

type ArrayRemover<T> = (
  setter: Dispatch<
    SetStateAction<T[]>
  >,
  index: number
) => void;

/* =========================================================
   PERSONAL
   ========================================================= */

export function PersonalStep({
  value,
  onChange,
}: {
  value: PersonalData;
  onChange: Dispatch<
    SetStateAction<PersonalData>
  >;
}) {
  function update(
    key: keyof PersonalData,
    newValue: PersonalData[keyof PersonalData]
  ) {
    onChange((current) => ({
      ...current,
      [key]: newValue,
    }));
  }

  return (
    <div className="space-y-6">
      <Section
        title="Basic information"
        description="Tell us who you are."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="First name"
          required
          value={value.firstName}
          onChange={(v) =>
            update(
              "firstName",
              v
            )
          }
        />

        <Field
          label="Middle name"
          value={value.middleName}
          onChange={(v) =>
            update(
              "middleName",
              v
            )
          }
        />

        <Field
          label="Last name"
          required
          value={value.lastName}
          onChange={(v) =>
            update(
              "lastName",
              v
            )
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="Date of birth"
          required
          type="date"
          value={value.dateOfBirth}
          onChange={(v) =>
            update(
              "dateOfBirth",
              v
            )
          }
        />

        <Select
          label="Gender"
          required
          value={value.gender}
          onChange={(v) =>
            update(
              "gender",
              v as PersonalData["gender"]
            )
          }
          options={[
            ["", "Select gender"],
            ["MALE", "Male"],
            ["FEMALE", "Female"],
            ["OTHER", "Other"],
            [
              "PREFER_NOT_TO_SAY",
              "Prefer not to say",
            ],
          ]}
        />

        <Field
          label="Phone"
          required
          value={value.phone}
          onChange={(v) =>
            update(
              "phone",
              v
            )
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="Alternate phone"
          value={
            value.alternatePhone
          }
          onChange={(v) =>
            update(
              "alternatePhone",
              v
            )
          }
        />

        <Field
          label="Nationality"
          value={value.nationality}
          onChange={(v) =>
            update(
              "nationality",
              v
            )
          }
        />

        <Field
          label="Domicile state"
          value={
            value.domicileState
          }
          onChange={(v) =>
            update(
              "domicileState",
              v
            )
          }
        />
      </div>

      <TextArea
        label="Short bio"
        value={value.bio}
        onChange={(v) =>
          update(
            "bio",
            v
          )
        }
      />

      <Section
        title="Academic identity"
        description="These fields are used for placement eligibility."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="College"
          required
          value={
            value.collegeName
          }
          onChange={(v) =>
            update(
              "collegeName",
              v
            )
          }
        />

        <Field
          label="University"
          value={
            value.universityName
          }
          onChange={(v) =>
            update(
              "universityName",
              v
            )
          }
        />

        <Field
          label="Branch"
          required
          value={value.branch}
          onChange={(v) =>
            update(
              "branch",
              v
            )
          }
        />

        <Field
          label="Enrollment number"
          required
          value={
            value.enrollmentNumber
          }
          onChange={(v) =>
            update(
              "enrollmentNumber",
              v
            )
          }
        />

        <Field
          label="Graduation year"
          required
          type="number"
          value={String(
            value.graduationYear
          )}
          onChange={(v) =>
            update(
              "graduationYear",
              v
                ? Number(v)
                : ""
            )
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   ADDRESS
   ========================================================= */

export function AddressStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: AddressData[];
  setValues: Dispatch<
    SetStateAction<AddressData[]>
  >;
  update: ArrayUpdater<AddressData>;
  remove: ArrayRemover<AddressData>;
}) {
  return (
    <div className="space-y-6">
      <Section
        title="Your addresses"
        description="Add your current and permanent address."
      />

      {values.map(
        (item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Address {index + 1}
              </h3>

              {values.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    remove(
                      setValues,
                      index
                    )
                  }
                  className="text-sm font-medium text-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              <Field
                label="Address line 1"
                required
                value={
                  item.addressLine1
                }
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      addressLine1:
                        v,
                    }
                  )
                }
              />

              <Field
                label="Address line 2"
                value={
                  item.addressLine2
                }
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      addressLine2:
                        v,
                    }
                  )
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="City"
                  required
                  value={item.city}
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        city: v,
                      }
                    )
                  }
                />

                <Field
                  label="State"
                  required
                  value={item.state}
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        state: v,
                      }
                    )
                  }
                />

                <Field
                  label="Pincode"
                  required
                  value={
                    item.pincode
                  }
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        pincode: v,
                      }
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap gap-5">
                <Checkbox
                  label="Permanent address"
                  checked={
                    item.isPermanent
                  }
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        isPermanent:
                          v,
                      }
                    )
                  }
                />

                <Checkbox
                  label="Current address"
                  checked={
                    item.isCurrent
                  }
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        isCurrent:
                          v,
                      }
                    )
                  }
                />
              </div>
            </div>
          </div>
        )
      )}

      <AddButton
        onClick={() =>
          setValues(
            (items) => [
              ...items,
              {
                addressLine1:
                  "",
                addressLine2:
                  "",
                city: "",
                state: "",
                country:
                  "India",
                pincode:
                  "",
                isPermanent:
                  false,
                isCurrent:
                  false,
              },
            ]
          )
        }
      >
        + Add another address
      </AddButton>
    </div>
  );
}

/* =========================================================
   EDUCATION
   ========================================================= */

export function EducationStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: EducationData[];
  setValues: Dispatch<
    SetStateAction<EducationData[]>
  >;
  update: ArrayUpdater<EducationData>;
  remove: ArrayRemover<EducationData>;
}) {
  return (
    <div className="space-y-6">
      <Section
        title="Education"
        description="Add your academic history."
      />

      {values.map(
        (item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                Education {index + 1}
              </h3>

              {values.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    remove(
                      setValues,
                      index
                    )
                  }
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Level"
                value={item.level}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      level:
                        v as EducationData["level"],
                    }
                  )
                }
                options={[
                  ["SSC", "SSC"],
                  ["HSC", "HSC"],
                  [
                    "DIPLOMA",
                    "Diploma",
                  ],
                  [
                    "BACHELORS",
                    "Bachelors",
                  ],
                  [
                    "MASTERS",
                    "Masters",
                  ],
                  ["PHD", "PhD"],
                ]}
              />

              <Field
                label="Institution"
                value={
                  item.institution
                }
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      institution:
                        v,
                    }
                  )
                }
              />

              <Field
                label="Board"
                value={item.board}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      board: v,
                    }
                  )
                }
              />

              <Field
                label="University"
                value={
                  item.university
                }
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      university:
                        v,
                    }
                  )
                }
              />

              <Field
                label="Course"
                value={item.course}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      course: v,
                    }
                  )
                }
              />

              <Field
                label="Specialization"
                value={
                  item.specialization
                }
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      specialization:
                        v,
                    }
                  )
                }
              />

              <Field
                label="Start year"
                type="number"
                value={String(
                  item.startYear
                )}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      startYear:
                        v
                          ? Number(v)
                          : "",
                    }
                  )
                }
              />

              <Field
                label="End year"
                type="number"
                value={String(
                  item.endYear
                )}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      endYear:
                        v
                          ? Number(v)
                          : "",
                    }
                  )
                }
              />

              <Field
                label="Percentage"
                type="number"
                value={String(
                  item.percentage
                )}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      percentage:
                        v
                          ? Number(v)
                          : "",
                    }
                  )
                }
              />

              <Field
                label="CGPA"
                type="number"
                value={String(
                  item.cgpa
                )}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      cgpa:
                        v
                          ? Number(v)
                          : "",
                    }
                  )
                }
              />
            </div>
          </div>
        )
      )}

      <AddButton
        onClick={() =>
          setValues(
            (items) => [
              ...items,
              {
                level:
                  "BACHELORS",
                institution:
                  "",
                board: "",
                university:
                  "",
                course: "",
                specialization:
                  "",
                startYear:
                  "",
                endYear: "",
                percentage:
                  "",
                cgpa: "",
              },
            ]
          )
        }
      >
        + Add education
      </AddButton>
    </div>
  );
}

/* =========================================================
   SKILLS
   ========================================================= */

export function SkillsStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: SkillData[];
  setValues: Dispatch<
    SetStateAction<SkillData[]>
  >;
  update: ArrayUpdater<SkillData>;
  remove: ArrayRemover<SkillData>;
}) {
  return (
    <div className="space-y-5">
      <Section
        title="Skills"
        description="Add the skills you want TalentBridge to evaluate."
      />

      {values.map(
        (item, index) => (
          <div
            key={index}
            className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_150px_auto]"
          >
            <Field
              label="Skill"
              value={item.name}
              onChange={(v) =>
                update(
                  setValues,
                  index,
                  {
                    name: v,
                  }
                )
              }
            />

            <Field
              label="Category"
              value={
                item.category
              }
              onChange={(v) =>
                update(
                  setValues,
                  index,
                  {
                    category: v,
                  }
                )
              }
            />

            <Field
              label="Proficiency"
              type="number"
              value={String(
                item.proficiency
              )}
              onChange={(v) =>
                update(
                  setValues,
                  index,
                  {
                    proficiency:
                      v
                        ? Number(v)
                        : "",
                  }
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                remove(
                  setValues,
                  index
                )
              }
              className="self-end rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        )
      )}

      <AddButton
        onClick={() =>
          setValues(
            (items) => [
              ...items,
              {
                name: "",
                category: "",
                proficiency:
                  "",
              },
            ]
          )
        }
      >
        + Add skill
      </AddButton>
    </div>
  );
}

/* =========================================================
   PROJECTS
   ========================================================= */

export function ProjectsStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: ProjectData[];
  setValues: Dispatch<
    SetStateAction<ProjectData[]>
  >;
  update: ArrayUpdater<ProjectData>;
  remove: ArrayRemover<ProjectData>;
}) {
  return (
    <div className="space-y-6">
      <Section
        title="Projects"
        description="Projects provide evidence for your technical skills."
      />

      {values.map(
        (item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 p-5"
          >
            <div className="mb-4 flex justify-between">
              <h3 className="font-semibold">
                Project {index + 1}
              </h3>

              <button
                type="button"
                onClick={() =>
                  remove(
                    setValues,
                    index
                  )
                }
                className="text-sm text-red-600"
              >
                Remove
              </button>
            </div>

            <div className="space-y-4">
              <Field
                label="Project title"
                required
                value={item.title}
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      title: v,
                    }
                  )
                }
              />

              <TextArea
                label="Description"
                value={
                  item.description
                }
                onChange={(v) =>
                  update(
                    setValues,
                    index,
                    {
                      description:
                        v,
                    }
                  )
                }
              />

              <TagEditor
                label="Technologies"
                values={
                  item.technologies
                }
                onChange={(
                  technologies
                ) =>
                  update(
                    setValues,
                    index,
                    {
                      technologies,
                    }
                  )
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="GitHub URL"
                  value={
                    item.githubUrl
                  }
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        githubUrl:
                          v,
                      }
                    )
                  }
                />

                <Field
                  label="Live URL"
                  value={
                    item.liveUrl
                  }
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        liveUrl: v,
                      }
                    )
                  }
                />

                <Field
                  label="Start date"
                  type="date"
                  value={
                    item.startDate
                  }
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        startDate:
                          v,
                      }
                    )
                  }
                />

                <Field
                  label="End date"
                  type="date"
                  value={
                    item.endDate
                  }
                  onChange={(v) =>
                    update(
                      setValues,
                      index,
                      {
                        endDate:
                          v,
                      }
                    )
                  }
                />
              </div>
            </div>
          </div>
        )
      )}

      <AddButton
        onClick={() =>
          setValues(
            (items) => [
              ...items,
              {
                title: "",
                description:
                  "",
                technologies:
                  [],
                githubUrl:
                  "",
                liveUrl: "",
                startDate:
                  "",
                endDate: "",
              },
            ]
          )
        }
      >
        + Add project
      </AddButton>
    </div>
  );
}

/* =========================================================
   EXPERIENCE
   ========================================================= */

export function ExperienceStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: ExperienceData[];
  setValues: Dispatch<
    SetStateAction<ExperienceData[]>
  >;
  update: ArrayUpdater<ExperienceData>;
  remove: ArrayRemover<ExperienceData>;
}) {
  return (
    <OptionalList
      title="Experience"
      description="Internships, jobs, freelancing and other professional experience."
      emptyText="No professional experience added. That's completely valid for a fresher."
      addText="+ Add experience"
      values={values}
      setValues={setValues}
      remove={remove}
      createEmpty={() => ({
        type:
          "INTERNSHIP" as ExperienceData["type"],
        companyName: "",
        role: "",
        description: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
      })}
      render={(item, index) => (
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Experience type"
            value={item.type}
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  type:
                    v as ExperienceData["type"],
                }
              )
            }
            options={[
              [
                "INTERNSHIP",
                "Internship",
              ],
              [
                "FULL_TIME",
                "Full-time",
              ],
              [
                "PART_TIME",
                "Part-time",
              ],
              [
                "FREELANCE",
                "Freelance",
              ],
            ]}
          />

          <Field
            label="Company"
            required
            value={
              item.companyName
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  companyName:
                    v,
                }
              )
            }
          />

          <Field
            label="Role"
            value={item.role}
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  role: v,
                }
              )
            }
          />

          <Checkbox
            label="Currently working here"
            checked={
              item.isCurrent
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  isCurrent:
                    v,
                }
              )
            }
          />

          <Field
            label="Start date"
            type="date"
            value={
              item.startDate
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  startDate: v,
                }
              )
            }
          />

          <Field
            label="End date"
            type="date"
            value={
              item.endDate
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  endDate: v,
                }
              )
            }
          />

          <div className="md:col-span-2">
            <TextArea
              label="Description"
              value={
                item.description
              }
              onChange={(v) =>
                update(
                  setValues,
                  index,
                  {
                    description:
                      v,
                  }
                )
              }
            />
          </div>
        </div>
      )}
    />
  );
}

/* =========================================================
   CERTIFICATIONS
   ========================================================= */

export function CertificationStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: CertificationData[];
  setValues: Dispatch<
    SetStateAction<CertificationData[]>
  >;
  update: ArrayUpdater<CertificationData>;
  remove: ArrayRemover<CertificationData>;
}) {
  return (
    <OptionalList
      title="Certifications"
      description="Add certifications that strengthen your profile."
      emptyText="No certifications added."
      addText="+ Add certification"
      values={values}
      setValues={setValues}
      remove={remove}
      createEmpty={() => ({
        name: "",
        issuingOrg: "",
        credentialId: "",
        credentialUrl: "",
        issueDate: "",
        expiryDate: "",
      })}
      render={(item, index) => (
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Certification"
            required
            value={item.name}
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  name: v,
                }
              )
            }
          />

          <Field
            label="Issuing organization"
            value={
              item.issuingOrg
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  issuingOrg:
                    v,
                }
              )
            }
          />

          <Field
            label="Credential ID"
            value={
              item.credentialId
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  credentialId:
                    v,
                }
              )
            }
          />

          <Field
            label="Credential URL"
            value={
              item.credentialUrl
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  credentialUrl:
                    v,
                }
              )
            }
          />

          <Field
            label="Issue date"
            type="date"
            value={
              item.issueDate
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  issueDate: v,
                }
              )
            }
          />

          <Field
            label="Expiry date"
            type="date"
            value={
              item.expiryDate
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  expiryDate:
                    v,
                }
              )
            }
          />
        </div>
      )}
    />
  );
}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

export function AchievementStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: AchievementData[];
  setValues: Dispatch<
    SetStateAction<AchievementData[]>
  >;
  update: ArrayUpdater<AchievementData>;
  remove: ArrayRemover<AchievementData>;
}) {
  return (
    <OptionalList
      title="Achievements"
      description="Competitions, awards, hackathons and other achievements."
      emptyText="No achievements added."
      addText="+ Add achievement"
      values={values}
      setValues={setValues}
      remove={remove}
      createEmpty={() => ({
        title: "",
        description: "",
        date: "",
      })}
      render={(item, index) => (
        <div className="space-y-4">
          <Field
            label="Title"
            required
            value={item.title}
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  title: v,
                }
              )
            }
          />

          <TextArea
            label="Description"
            value={
              item.description
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  description:
                    v,
                }
              )
            }
          />

          <Field
            label="Date"
            type="date"
            value={item.date}
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  date: v,
                }
              )
            }
          />
        </div>
      )}
    />
  );
}

/* =========================================================
   SOCIAL LINKS
   ========================================================= */

export function SocialStep({
  values,
  setValues,
  update,
  remove,
}: {
  values: SocialLinkData[];
  setValues: Dispatch<
    SetStateAction<SocialLinkData[]>
  >;
  update: ArrayUpdater<SocialLinkData>;
  remove: ArrayRemover<SocialLinkData>;
}) {
  return (
    <OptionalList
      title="Social links"
      description="Connect your professional profiles."
      emptyText="No social links added."
      addText="+ Add social link"
      values={values}
      setValues={setValues}
      remove={remove}
      createEmpty={() => ({
        platform: "LinkedIn",
        url: "",
      })}
      render={(item, index) => (
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Platform"
            value={
              item.platform
            }
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  platform: v,
                }
              )
            }
            options={[
              [
                "LinkedIn",
                "LinkedIn",
              ],
              [
                "GitHub",
                "GitHub",
              ],
              [
                "Portfolio",
                "Portfolio",
              ],
              [
                "LeetCode",
                "LeetCode",
              ],
              [
                "CodeChef",
                "CodeChef",
              ],
            ]}
          />

          <Field
            label="Profile URL"
            required
            value={item.url}
            onChange={(v) =>
              update(
                setValues,
                index,
                {
                  url: v,
                }
              )
            }
          />
        </div>
      )}
    />
  );
}

/* =========================================================
   RESUME
   ========================================================= */

export function ResumeStep({
  resume,
  onUpload,
}: {
  resume:
    | {
        fileUrl: string;
        fileName: string;
      }
    | null;

  onUpload: (
    file: File
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <Section
        title="Resume"
        description="Upload your latest PDF resume."
      />

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
        <div className="text-4xl">
          📄
        </div>

        <div className="mt-3 font-semibold text-slate-900">
          {resume
            ? resume.fileName
            : "Choose your resume"}
        </div>

        <p className="mt-1 text-sm text-slate-500">
          PDF only · Maximum 5 MB
        </p>

        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const file =
              event.target.files?.[0];

            if (file) {
              onUpload(file);
            }
          }}
        />
      </label>

      {resume && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Resume selected:{" "}
          <strong>
            {resume.fileName}
          </strong>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PREFERENCES
   ========================================================= */

export function PreferenceStep({
  value,
  onChange,
}: {
  value: PlacementPreferenceData;

  onChange: Dispatch<
    SetStateAction<PlacementPreferenceData>
  >;
}) {
  const [
    roleInput,
    setRoleInput,
  ] = useState("");

  const [
    locationInput,
    setLocationInput,
  ] = useState("");

  function addRole() {
    const role =
      roleInput.trim();

    if (
      !role ||
      value.preferredRoles.includes(
        role
      )
    ) {
      return;
    }

    onChange((current) => ({
      ...current,
      preferredRoles: [
        ...current.preferredRoles,
        role,
      ],
    }));

    setRoleInput("");
  }

  function addLocation() {
    const location =
      locationInput.trim();

    if (
      !location ||
      value.preferredLocations.includes(
        location
      )
    ) {
      return;
    }

    onChange((current) => ({
      ...current,
      preferredLocations: [
        ...current.preferredLocations,
        location,
      ],
    }));

    setLocationInput("");
  }

  return (
    <div className="space-y-6">
      <Section
        title="Placement preferences"
        description="Tell TalentBridge what opportunities you're targeting."
      />

      <TagInput
        label="Preferred roles"
        value={roleInput}
        setValue={setRoleInput}
        placeholder="e.g. Software Engineer"
        onAdd={addRole}
      />

      <TagList
        items={
          value.preferredRoles
        }
        onRemove={(item) =>
          onChange(
            (current) => ({
              ...current,
              preferredRoles:
                current.preferredRoles.filter(
                  (x) =>
                    x !== item
                ),
            })
          )
        }
      />

      <TagInput
        label="Preferred locations"
        value={locationInput}
        setValue={
          setLocationInput
        }
        placeholder="e.g. Pune"
        onAdd={addLocation}
      />

      <TagList
        items={
          value.preferredLocations
        }
        onRemove={(item) =>
          onChange(
            (current) => ({
              ...current,
              preferredLocations:
                current.preferredLocations.filter(
                  (x) =>
                    x !== item
                ),
            })
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Minimum expected salary"
          type="number"
          value={String(
            value.expectedSalaryMin
          )}
          onChange={(v) =>
            onChange(
              (current) => ({
                ...current,
                expectedSalaryMin:
                  v
                    ? Number(v)
                    : "",
              })
            )
          }
        />

        <Field
          label="Maximum expected salary"
          type="number"
          value={String(
            value.expectedSalaryMax
          )}
          onChange={(v) =>
            onChange(
              (current) => ({
                ...current,
                expectedSalaryMax:
                  v
                    ? Number(v)
                    : "",
              })
            )
          }
        />
      </div>

      <Select
        label="Preferred work mode"
        value={
          value.preferredWorkMode
        }
        onChange={(v) =>
          onChange(
            (current) => ({
              ...current,
              preferredWorkMode:
                v,
            })
          )
        }
        options={[
          [
            "ONSITE",
            "On-site",
          ],
          [
            "HYBRID",
            "Hybrid",
          ],
          [
            "REMOTE",
            "Remote",
          ],
        ]}
      />

      <Checkbox
        label="I am willing to relocate"
        checked={
          value.willingToRelocate
        }
        onChange={(v) =>
          onChange(
            (current) => ({
              ...current,
              willingToRelocate:
                v,
            })
          )
        }
      />
    </div>
  );
}

/* =========================================================
   OPTIONAL LIST
   ========================================================= */

function OptionalList<T>({
  title,
  description,
  emptyText,
  addText,
  values,
  setValues,
  remove,
  createEmpty,
  render,
}: {
  title: string;
  description: string;
  emptyText: string;
  addText: string;
  values: T[];
  setValues: Dispatch<
    SetStateAction<T[]>
  >;
  remove: ArrayRemover<T>;
  createEmpty: () => T;
  render: (
    item: T,
    index: number
  ) => ReactNode;
}) {
  return (
    <div className="space-y-5">
      <Section
        title={title}
        description={description}
      />

      {values.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        values.map(
          (item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 p-5"
            >
              <div className="mb-5 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    remove(
                      setValues,
                      index
                    )
                  }
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              </div>

              {render(
                item,
                index
              )}
            </div>
          )
        )
      )}

      <AddButton
        onClick={() =>
          setValues(
            (items) => [
              ...items,
              createEmpty(),
            ]
          )
        }
      >
        {addText}
      </AddButton>
    </div>
  );
}

/* =========================================================
   PROJECT TECHNOLOGY EDITOR
   ========================================================= */

function TagEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (
    values: string[]
  ) => void;
}) {
  const [input, setInput] =
    useState("");

  function add() {
    const value =
      input.trim();

    if (
      !value ||
      values.includes(value)
    ) {
      return;
    }

    onChange([
      ...values,
      value,
    ]);

    setInput("");
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) =>
            setInput(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key ===
              "Enter"
            ) {
              event.preventDefault();
              add();
            }
          }}
          placeholder="React, Node.js, PostgreSQL"
          className={inputClass()}
        />

        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          Add
        </button>
      </div>

      <TagList
        items={values}
        onRemove={(item) =>
          onChange(
            values.filter(
              (value) =>
                value !== item
            )
          )
        }
      />
    </div>
  );
}

/* =========================================================
   TAG INPUT
   ========================================================= */

function TagInput({
  label,
  value,
  setValue,
  placeholder,
  onAdd,
}: {
  label: string;
  value: string;
  setValue: (
    value: string
  ) => void;
  placeholder: string;
  onAdd: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) =>
            setValue(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key ===
              "Enter"
            ) {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder={
            placeholder
          }
          className={inputClass()}
        />

        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   BASIC UI
   ========================================================= */

function Section({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className={inputClass()}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        rows={4}
        className={`${inputClass()} resize-y`}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: [
    string,
    string
  ][];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className={inputClass()}
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {
                optionLabel
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
      />

      {label}
    </label>
  );
}

function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
    >
      {children}
    </button>
  );
}

function TagList({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (
    item: string
  ) => void;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(
        (item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
          >
            {item}

            <button
              type="button"
              onClick={() =>
                onRemove(item)
              }
              className="font-bold"
            >
              ×
            </button>
          </span>
        )
      )}
    </div>
  );
}