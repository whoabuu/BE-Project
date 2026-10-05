import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/auth";
import type { Role } from "../generated/prisma/client";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      res.status(401).json({
        message: "Authorization header is required",
      });
      return;
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        message: "Invalid authorization format",
      });
      return;
    }

    const user = verifyAccessToken(token);

    req.user = user;

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}

export const requireStudent = requireRole("STUDENT");

export const requireRecruiter = requireRole("RECRUITER");

export const requireTPO = requireRole("TPO");

export const requireAdmin = requireRole("ADMIN");