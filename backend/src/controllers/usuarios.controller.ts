import type { NextFunction, Response } from "express";
import { escapeIdentifier } from "pg";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import pool from "../config/database";

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    next();
  } catch (error) {
    console.error("Error al validar administrador:", error);
    return res.status(500).json({ message: "No se pudo validar el acceso." });
  }
}

const columnasUsuario = `id, nombres AS nombre,
  correo, CASE WHEN rol = 'Estudiante' THEN 'Alumno' ELSE rol END AS rol,
  ultimo_acceso_en AS actividad,
  CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END AS estado`;

function idUsuario(req: AuthenticatedRequest) {
  const id = req.params.id;
  return typeof id === "string" && /^[1-9]\d{0,18}$/.test(id) &&
    BigInt(id) <= BigInt("9223372036854775807") ? id : null;
}

export async function listarUsuarios(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT ${columnasUsuario}
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

export async function obtenerUsuario(req: AuthenticatedRequest, res: Response) {
  const id = idUsuario(req);
  if (!id) return res.status(400).json({ message: "Usuario no válido." });
  try {
    const result = await pool.query(
      `SELECT ${columnasUsuario}, usuario, dni, telefono,
       id_persona AS "idPersona", direccion, genero,
       fecha_nacimiento::text AS "fechaNacimiento", creado_en AS "creadoEn"
       FROM usuarios WHERE id = $1`, [id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Usuario no encontrado." });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al consultar usuario:", error);
    return res.status(500).json({ message: "No se pudo consultar el usuario." });
  }
}

export async function modificarUsuario(req: AuthenticatedRequest, res: Response) {
  const id = idUsuario(req);
  if (!id) return res.status(400).json({ message: "Usuario no válido." });
  const { nombre, correo, rol, telefono, activo } = req.body ?? {};
  const rolBD = rol === "Alumno" ? "Estudiante" : rol;
  if (req.method === "PUT" && (
    typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 100 ||
    typeof correo !== "string" || correo.trim().length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()) ||
    !["Estudiante", "Docente", "Administrador"].includes(rolBD) ||
    typeof telefono !== "string" || telefono.trim().length > 20
  )) return res.status(400).json({ message: "Revisa nombre, correo, rol y teléfono." });
  if (req.method === "PATCH" && typeof activo !== "boolean") {
    return res.status(400).json({ message: "Estado no válido." });
  }

  let client;
  let confirmado = false;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const admins = await client.query(
      `SELECT id FROM usuarios WHERE rol = 'Administrador' AND activo = TRUE
       ORDER BY id FOR UPDATE`
    );
    if (!admins.rows.some((admin) => String(admin.id) === req.userId)) {
      return res.status(403).json({ message: "No tienes permiso para modificar usuarios." });
    }
    const target = await client.query(
      "SELECT id, rol, activo FROM usuarios WHERE id = $1 FOR UPDATE", [id]
    );
    if (!target.rowCount) return res.status(404).json({ message: "Usuario no encontrado." });
    const pierdeAccesoAdmin = req.method === "DELETE" ||
      (req.method === "PATCH" && !activo) ||
      (req.method === "PUT" && rolBD !== "Administrador");
    if (id === req.userId && pierdeAccesoAdmin) {
      return res.status(409).json({ message: "No puedes eliminar, desactivar ni quitar el rol de administrador de tu propia cuenta." });
    }
    if (target.rows[0].rol === "Administrador" && target.rows[0].activo &&
        admins.rowCount === 1 && pierdeAccesoAdmin) {
      return res.status(409).json({ message: "Debe quedar al menos un administrador activo." });
    }

    if (req.method === "DELETE") {
      const referencias = await client.query(
        `SELECT n.nspname AS esquema, t.relname AS tabla, a.attname AS columna
         FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         JOIN LATERAL unnest(c.conkey, c.confkey) AS k(local_col, ref_col) ON TRUE
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.local_col
         JOIN pg_attribute r ON r.attrelid = c.confrelid AND r.attnum = k.ref_col
         WHERE c.contype = 'f' AND c.confrelid = 'usuarios'::regclass
           AND r.attname = 'id'`
      );
      for (const ref of referencias.rows) {
        const existe = await client.query(
          `SELECT 1 FROM ${escapeIdentifier(ref.esquema)}.${escapeIdentifier(ref.tabla)}
           WHERE ${escapeIdentifier(ref.columna)} = $1 LIMIT 1`, [id]
        );
        if (existe.rowCount) return res.status(409).json({
          message: "Este usuario tiene registros asociados y no se puede eliminar. Puedes desactivarlo.",
        });
      }
      await client.query("DELETE FROM usuarios WHERE id = $1", [id]);
    } else if (req.method === "PATCH") {
      await client.query(
        "UPDATE usuarios SET activo = $1, actualizado_en = NOW() WHERE id = $2", [activo, id]
      );
    } else {
      const duplicado = await client.query(
        "SELECT id FROM usuarios WHERE LOWER(correo) = LOWER($1) AND id <> $2",
        [correo.trim(), id]
      );
      if (duplicado.rowCount) return res.status(409).json({ message: "El correo ya pertenece a otro usuario." });
      await client.query(
        `UPDATE usuarios SET
         nombres = $1,
         correo = $2, rol = $3, telefono = $4, actualizado_en = NOW()
         WHERE id = $5`,
        [nombre.trim(), correo.trim().toLowerCase(), rolBD, telefono.trim() || null, id]
      );
    }
    await client.query("COMMIT");
    confirmado = true;
    return res.json({ message: req.method === "DELETE" ? "Usuario eliminado." : "Usuario actualizado." });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") return res.status(409).json({ message: "El correo ya está registrado." });
    if (code === "23503") return res.status(409).json({ message: "El usuario tiene registros asociados. Puedes desactivarlo." });
    console.error("Error al modificar usuario:", error);
    return res.status(500).json({ message: "No se pudo guardar el cambio." });
  } finally {
    if (client) {
      try {
        if (!confirmado) await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    }
  }
}
