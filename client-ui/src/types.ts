export type Role =
  | "STUDENT"
  | "RECRUITER"
  | "TPO"
  | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}