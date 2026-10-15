import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database";

export type AuthenticatedRequest = Request & {
  userId?: string;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("Falta configurar JWT_SECRET en el archivo .env");
}

export async function requireAuth(
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
  } catch {
    return res.status(401).json({ message: "Sesión no válida." });
  }

  try {
    const user = await pool.query("SELECT activo FROM usuarios WHERE id = $1", [req.userId]);
    if (!user.rowCount || !user.rows[0].activo) {
      res.clearCookie("talentia_token");
      return res.status(401).json({ message: "La cuenta está inactiva o ya no existe." });
    }
    next();
  } catch (error) {
    console.error("Error al validar sesión:", error);
    return res.status(500).json({ message: "No se pudo validar la sesión." });
  }
}
