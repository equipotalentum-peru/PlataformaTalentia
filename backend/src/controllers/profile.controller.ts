import type { Response } from "express";
import type { QueryResultRow } from "pg";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type ProfileRow = QueryResultRow & {
  id: string;
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string | null;
  rol: "Estudiante" | "Docente" | "Administrador";
  id_persona: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  telefono: string | null;
  foto_perfil: string | null;
  idioma: string;
  zona_horaria: string;
};

const profileColumns = `
  id, nombres, apellidos, usuario, correo, rol, id_persona,
  TO_CHAR(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
  genero, nacionalidad, direccion, telefono, foto_perfil,
  idioma, zona_horaria
`;

const editableFields = {
  fechaNacimiento: "fecha_nacimiento",
  genero: "genero",
  nacionalidad: "nacionalidad",
  direccion: "direccion",
  telefono: "telefono",
  idioma: "idioma",
  zonaHoraria: "zona_horaria",
} as const;

type EditableField = keyof typeof editableFields;

const maxLengths: Partial<Record<EditableField, number>> = {
  nacionalidad: 80,
  telefono: 20,
  idioma: 50,
  zonaHoraria: 50,
};

function formatProfile(row: ProfileRow) {
  return {
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    usuario: row.usuario,
    correo: row.correo,
    rol: row.rol,
    idPersona: row.id_persona,
    fechaNacimiento: row.fecha_nacimiento,
    genero: row.genero,
    nacionalidad: row.nacionalidad,
    direccion: row.direccion,
    telefono: row.telefono,
    fotoPerfil: row.foto_perfil,
    idioma: row.idioma,
    zonaHoraria: row.zona_horaria,
  };
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await pool.query<ProfileRow>(
      `SELECT ${profileColumns} FROM users WHERE id = $1`,
      [req.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "No se encontró el perfil." });
    }

    return res.status(200).json({ profile: formatProfile(result.rows[0]) });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return res.status(400).json({ message: "Los datos enviados no son válidos." });
  }

  const entries = Object.entries(req.body);

  if (!entries.length) {
    return res.status(400).json({ message: "No se enviaron datos para actualizar." });
  }

  const values: Array<string | null> = [];
  const assignments: string[] = [];

  for (const [field, rawValue] of entries) {
    if (!Object.prototype.hasOwnProperty.call(editableFields, field)) {
      return res.status(400).json({ message: `El campo ${field} no se puede editar.` });
    }

    if (rawValue !== null && typeof rawValue !== "string") {
      return res.status(400).json({ message: `El campo ${field} no es válido.` });
    }

    const value = rawValue === null ? null : rawValue.trim() || null;
    const editableField = field as EditableField;

    if ((field === "idioma" || field === "zonaHoraria") && value === null) {
      return res.status(400).json({ message: `El campo ${field} es obligatorio.` });
    }

    if (field === "genero" && value !== null && value !== "M" && value !== "F") {
      return res.status(400).json({ message: "El género debe ser M o F." });
    }

    const maxLength = maxLengths[editableField];
    if (value && maxLength && value.length > maxLength) {
      return res.status(400).json({ message: `El campo ${field} es demasiado largo.` });
    }

    if (field === "fechaNacimiento" && value) {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00.000Z`)
        : new Date(NaN);

      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return res.status(400).json({ message: "La fecha de nacimiento no es válida." });
      }
    }

    values.push(value);
    assignments.push(`${editableFields[editableField]} = $${values.length}`);
  }

  values.push(req.userId ?? null);

  try {
    const result = await pool.query<ProfileRow>(
      `UPDATE users
       SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING ${profileColumns}`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "No se encontró el perfil." });
    }

    return res.status(200).json({
      message: "Perfil actualizado correctamente.",
      profile: formatProfile(result.rows[0]),
    });
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}
