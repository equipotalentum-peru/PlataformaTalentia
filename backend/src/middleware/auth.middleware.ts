import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  userId?: string;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("Falta configurar JWT_SECRET en el archivo .env");
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.talentia_token;

  if (typeof token !== "string") {
    return res.status(401).json({ message: "Debes iniciar sesión." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (
      typeof payload === "string" ||
      (typeof payload.userId !== "string" &&
        typeof payload.userId !== "number")
    ) {
      return res.status(401).json({ message: "Sesión no válida." });
    }

    req.userId = String(payload.userId);
    next();
  } catch {
    return res.status(401).json({ message: "Sesión no válida." });
  }
}
