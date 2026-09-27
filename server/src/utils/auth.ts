import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/client";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function signAccessToken(user: { id: string; email: string; role: Role }): string {
  return jwt.sign(
    { email: user.email, role: user.role },
    getJwtSecret(),
    { subject: user.id, expiresIn: "7d" }
  );
}

export function verifyAccessToken(token: string): { id: string; email: string; role: Role } {
  const payload = jwt.verify(token, getJwtSecret());

  if (typeof payload === "string" || !payload.sub || typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }

  const role = payload.role;
  if (role !== "STUDENT" && role !== "RECRUITER" && role !== "TPO" && role !== "ADMIN") {
    throw new Error("Invalid token role");
  }

  return {
    id: payload.sub,
    email: payload.email,
    role,
  };
}
