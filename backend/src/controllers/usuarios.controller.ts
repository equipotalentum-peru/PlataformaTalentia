import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import pool from "../config/database";

export async function listarUsuarios(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const admin = await pool.query(
      `SELECT id FROM usuarios
       WHERE id = $1 AND rol = 'Administrador' AND activo = TRUE`,
      [req.userId]
    );

    if (!admin.rowCount) {
      return res.status(403).json({
        message: "No tienes permiso para consultar usuarios.",
      });
    }

    const result = await pool.query(
      `SELECT
         id,
         CONCAT_WS(' ', nombres, apellidos) AS nombre,
         correo,
         CASE WHEN rol = 'Estudiante' THEN 'Alumno' ELSE rol END AS rol,
         ultimo_acceso_en AS actividad,
         CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END AS estado
       FROM usuarios
       ORDER BY creado_en DESC, id DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error al consultar usuarios:", error);
    return res.status(500).json({
      message: "No se pudo cargar la lista de usuarios.",
    });
  }
}