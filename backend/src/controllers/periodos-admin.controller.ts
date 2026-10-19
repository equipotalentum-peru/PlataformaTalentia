
import type { Request, Response } from "express";
import pool from "../config/database";

type DatosPeriodo = {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
};

function validarFechaISO(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}

function leerDatosPeriodo(
  body: unknown
): { datos: DatosPeriodo } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Los datos del periodo no son válidos." };
  }

  const entrada = body as Record<string, unknown>;
  const nombre =
    typeof entrada.nombre === "string"
      ? entrada.nombre.trim()
      : "";
  const fechaInicio = entrada.fechaInicio;
  const fechaFin = entrada.fechaFin;

  if (!nombre || nombre.length > 100) {
    return {
      error: "El nombre es obligatorio y admite hasta 100 caracteres.",
    };
  }

  if (!validarFechaISO(fechaInicio) || !validarFechaISO(fechaFin)) {
    return {
      error: "Selecciona fechas válidas para el inicio y el fin.",
    };
  }

  if (fechaFin < fechaInicio) {
    return {
      error: "La fecha de fin no puede ser anterior a la fecha de inicio.",
    };
  }

  return {
    datos: {
      nombre,
      fechaInicio,
      fechaFin,
    },
  };
}

function leerIdPeriodo(valor: unknown): string | null {
  if (typeof valor !== "string" || !/^[1-9]\d{0,18}$/.test(valor)) {
    return null;
  }

  try {
    return BigInt(valor) <= BigInt("9223372036854775807")
      ? valor
      : null;
  } catch {
    return null;
  }
}

export async function listarPeriodos(
  _req: Request,
  res: Response
) {
  try {
    const resultado = await pool.query(
      `SELECT
         id::TEXT AS id,
         nombre,
         TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio",
         TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS "fechaFin",
         activo
       FROM periodos_academicos
       ORDER BY fecha_inicio DESC, id DESC`
    );

    return res.status(200).json({
      periodos: resultado.rows,
    });
  } catch (error) {
    console.error("Error consultando periodos académicos:", error);

    return res.status(500).json({
      message: "No se pudieron cargar los periodos académicos.",
    });
  }
}

export async function crearPeriodo(
  req: Request,
  res: Response
) {
  const validacion = leerDatosPeriodo(req.body);

  if ("error" in validacion) {
    return res.status(400).json({ message: validacion.error });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO periodos_academicos (
         nombre,
         fecha_inicio,
         fecha_fin,
         activo
       )
       VALUES ($1, $2::DATE, $3::DATE, TRUE)
       RETURNING
         id::TEXT AS id,
         nombre,
         TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio",
         TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS "fechaFin",
         activo`,
      [
        validacion.datos.nombre,
        validacion.datos.fechaInicio,
        validacion.datos.fechaFin,
      ]
    );

    return res.status(201).json({
      message: "El periodo académico se creó correctamente.",
      periodo: resultado.rows[0],
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({
        message: "Ya existe un periodo académico con ese nombre.",
      });
    }

    console.error("Error creando periodo académico:", error);

    return res.status(500).json({
      message: "No se pudo crear el periodo académico.",
    });
  }
}

export async function actualizarPeriodo(
  req: Request,
  res: Response
) {
  const id = leerIdPeriodo(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "El identificador del periodo no es válido.",
    });
  }

  const validacion = leerDatosPeriodo(req.body);

  if ("error" in validacion) {
    return res.status(400).json({ message: validacion.error });
  }

  try {
    const resultado = await pool.query(
      `UPDATE periodos_academicos
       SET nombre = $1,
           fecha_inicio = $2::DATE,
           fecha_fin = $3::DATE,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING
         id::TEXT AS id,
         nombre,
         TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio",
         TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS "fechaFin",
         activo`,
      [
        validacion.datos.nombre,
        validacion.datos.fechaInicio,
        validacion.datos.fechaFin,
        id,
      ]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({
        message: "El periodo académico no existe.",
      });
    }

    return res.status(200).json({
      message: "El periodo académico se actualizó correctamente.",
      periodo: resultado.rows[0],
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({
        message: "Ya existe otro periodo con ese nombre.",
      });
    }

    console.error("Error actualizando periodo académico:", error);

    return res.status(500).json({
      message: "No se pudo actualizar el periodo académico.",
    });
  }
}

export async function cambiarEstadoPeriodo(
  req: Request,
  res: Response
) {
  const id = leerIdPeriodo(req.params.id);
  const activo = req.body?.activo;

  if (!id) {
    return res.status(400).json({
      message: "El identificador del periodo no es válido.",
    });
  }

  if (typeof activo !== "boolean") {
    return res.status(400).json({
      message: "El estado del periodo no es válido.",
    });
  }

  try {
    const resultado = await pool.query(
      `UPDATE periodos_academicos
       SET activo = $1,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id::TEXT AS id, nombre, activo`,
      [activo, id]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({
        message: "El periodo académico no existe.",
      });
    }

    return res.status(200).json({
      message: activo
        ? "El periodo está activo y puede seleccionarse."
        : "El periodo se desactivó. Las ofertas que ya lo usan se conservan.",
      periodo: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error cambiando estado del periodo:", error);

    return res.status(500).json({
      message: "No se pudo cambiar el estado del periodo.",
    });
  }
}


export async function eliminarPeriodo(
  req: Request,
  res: Response
) {
  const id = leerIdPeriodo(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "El identificador del periodo no es válido.",
    });
  }

  try {
    const resultado = await pool.query(
      `DELETE FROM periodos_academicos
       WHERE id = $1
       RETURNING id::TEXT AS id, nombre`,
      [id]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({
        message: "El periodo académico no existe.",
      });
    }

    return res.status(200).json({
      message: "El periodo académico se eliminó correctamente. Las ofertas asociadas se conservaron sin periodo asignado.",
      periodo: resultado.rows[0],
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23503") {
      return res.status(409).json({
        message: "No se puede eliminar este periodo porque tiene registros asociados.",
      });
    }

    console.error("Error eliminando periodo académico:", error);

    return res.status(500).json({
      message: "No se pudo eliminar el periodo académico.",
    });
  }
}