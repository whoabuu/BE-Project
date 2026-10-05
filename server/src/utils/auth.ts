import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/client";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return secret;
}

type AccessTokenPayload = {
  id: string;
  email: string;
  role: Role;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function signAccessToken(user: {
  id: string;
  email: string;
  role: Role;
}): string {
  const secret = getJwtSecret();

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = getJwtSecret();

  const decoded = jwt.verify(token, secret);

  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }

  const payload = decoded as Record<string, unknown>;

  if (
    typeof payload.id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  if (
    payload.role !== "STUDENT" &&
    payload.role !== "RECRUITER" &&
    payload.role !== "TPO" &&
    payload.role !== "ADMIN"
  ) {
    throw new Error("Invalid user role");
  }

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role as Role,
  };
}