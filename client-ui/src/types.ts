export type Role = "STUDENT" | "TPO" | "RECRUITER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}