import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireStudent(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "STUDENT") {
    res.status(403).json({ message: "Student access required" });
    return;
  }
  next();
}
