import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type EstadoAsistencia = "Presente" | "Falta";

type EstadoAsistenciaVisible = EstadoAsistencia | "Sin registrar";

type FechaCalendario = {
  fecha: string;
  numero: number;
  diaSemana: string;
  puedeRegistrar: boolean;
};

function validarId(value: unknown) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validarFechaISO(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const fecha = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === value;
}

function nombreDiaSemana(dia: number): string {
  const nombres = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  return nombres[dia] ?? "Día";
}

async function obtenerOfertaDocente(docenteId: number, cursoId: number) {
  const result = await pool.query(
    `SELECT oc.id AS oferta_curso_id
     FROM ofertas_curso oc
     INNER JOIN cursos c ON c.id = oc.curso_id
     INNER JOIN usuarios d ON d.id = oc.docente_id
     WHERE oc.docente_id = $1
       AND c.id = $2
       AND d.rol = 'Docente'
       AND d.activo = TRUE
       AND c.estado = 'Activo'
       AND oc.publicado = TRUE
       AND oc.estado <> 'Cancelado'
     ORDER BY oc.actualizado_en DESC, oc.id DESC
     LIMIT 1`,
    [docenteId, cursoId]
  );

  return result.rows[0] ?? null;
}

async function obtenerFechasCalendario(ofertaCursoId: number): Promise<FechaCalendario[]> {
  const result = await pool.query<{
    fecha: string;
    numero: number;
    dia_semana: number;
    puede_registrar: boolean;
  }>(
    `WITH calendario AS (
       SELECT
         generado.fecha::DATE AS fecha,
         ROW_NUMBER() OVER (ORDER BY generado.fecha)::INTEGER AS numero,
         EXTRACT(ISODOW FROM generado.fecha)::INTEGER AS dia_semana
       FROM ofertas_curso oc
       INNER JOIN periodos_academicos p ON p.id = oc.periodo_id
       CROSS JOIN LATERAL generate_series(
         p.fecha_inicio::TIMESTAMP,
         p.fecha_fin::TIMESTAMP,
         INTERVAL '1 day'
       ) AS generado(fecha)
       WHERE oc.id = $1
         AND EXTRACT(ISODOW FROM generado.fecha)::SMALLINT = ANY(
           COALESCE(oc.dias_clase, ARRAY[]::SMALLINT[])
         )
     )
     SELECT
       TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
       numero,
       dia_semana,
       fecha <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::DATE AS puede_registrar
     FROM calendario
     ORDER BY fecha ASC`,
    [ofertaCursoId]
  );

  return result.rows.map((row) => ({
    fecha: row.fecha,
    numero: Number(row.numero),
    diaSemana: nombreDiaSemana(Number(row.dia_semana)),
    puedeRegistrar: row.puede_registrar,
  }));
}

/* =========================================================
   DOCENTE: OBTENER ASISTENCIA POR CALENDARIO ACADÉMICO
========================================================= */
export async function obtenerAsistenciaDocente(req: AuthenticatedRequest, res: Response) {
  try {
    const docenteId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);

    if (!docenteId || !cursoId) {
      return res.status(400).json({ message: "Solicitud no válida." });
    }

    const acceso = await obtenerOfertaDocente(docenteId, cursoId);
    if (!acceso) {
      return res.status(403).json({
        message: "No tienes permiso para gestionar la asistencia de este curso.",
      });
    }

    const ofertaCursoId = Number(acceso.oferta_curso_id);
    const fechas = await obtenerFechasCalendario(ofertaCursoId);
    const fechasISO = fechas.map((fecha) => fecha.fecha);
    const fechasPasadas = fechas.filter((fecha) => fecha.puedeRegistrar).map((fecha) => fecha.fecha);

    // Conserva el comportamiento existente: las fechas ya transcurridas
    // comienzan como Presente y el docente puede cambiarlas a Falta.
    // Nunca se crea una asistencia predeterminada para fechas futuras.
    if (fechasPasadas.length > 0) {
      await pool.query(
        `INSERT INTO asistencias (
           fecha_asistencia,
           matricula_id,
           estado,
           marcado_en
         )
         SELECT
           fechas.fecha,
           m.id,
           'Presente',
           CURRENT_TIMESTAMP
         FROM UNNEST($2::DATE[]) AS fechas(fecha)
         INNER JOIN matriculas m ON m.oferta_curso_id = $1
         INNER JOIN usuarios e ON e.id = m.estudiante_id
         WHERE m.estado IN ('Activa', 'Completada')
           AND e.rol = 'Estudiante'
           AND e.activo = TRUE
         ON CONFLICT (matricula_id, fecha_asistencia)
         DO NOTHING`,
        [ofertaCursoId, fechasPasadas]
      );
    }

    const estudiantesResult = await pool.query<{
      matricula_id: string;
      estudiante_id: string;
      nombre: string;
    }>(
      `SELECT
         m.id::TEXT AS matricula_id,
         e.id::TEXT AS estudiante_id,
         TRIM(CONCAT_WS(' ', e.nombres, e.apellidos)) AS nombre
       FROM matriculas m
       INNER JOIN usuarios e ON e.id = m.estudiante_id
       WHERE m.oferta_curso_id = $1
         AND m.estado IN ('Activa', 'Completada')
         AND e.rol = 'Estudiante'
         AND e.activo = TRUE
       ORDER BY e.apellidos ASC, e.nombres ASC, m.id ASC`,
      [ofertaCursoId]
    );

    const asistenciasResult = await pool.query<{
      matricula_id: string;
      fecha_asistencia: string;
      estado: EstadoAsistencia;
    }>(
      `SELECT
         a.matricula_id::TEXT AS matricula_id,
         TO_CHAR(a.fecha_asistencia, 'YYYY-MM-DD') AS fecha_asistencia,
         a.estado
       FROM asistencias a
       INNER JOIN matriculas m ON m.id = a.matricula_id
       WHERE m.oferta_curso_id = $1
         AND m.estado IN ('Activa', 'Completada')
         AND a.fecha_asistencia = ANY($2::DATE[])`,
      [ofertaCursoId, fechasISO]
    );

    const estados = new Map<string, EstadoAsistencia>();
    for (const row of asistenciasResult.rows) {
      estados.set(`${row.matricula_id}:${row.fecha_asistencia}`, row.estado);
    }

    const estudiantes = estudiantesResult.rows.map((row) => {
      const matriculaId = Number(row.matricula_id);
      return {
        matriculaId,
        estudianteId: Number(row.estudiante_id),
        nombre: row.nombre,
        asistencias: fechas.map((fecha) => ({
          fechaAsistencia: fecha.fecha,
          puedeRegistrar: fecha.puedeRegistrar,
          estado: (
            estados.get(`${row.matricula_id}:${fecha.fecha}`)
            ?? (fecha.puedeRegistrar ? "Presente" : "Sin registrar")
          ) as EstadoAsistenciaVisible,
        })),
      };
    });

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ fechas, estudiantes });
  } catch (error) {
    console.error("Error obteniendo asistencia por calendario:", error);
    return res.status(500).json({ message: "No se pudo obtener la asistencia." });
  }
}

/* =========================================================
   DOCENTE: GUARDAR ASISTENCIA POR FECHA
========================================================= */
export async function guardarAsistenciaDocente(req: AuthenticatedRequest, res: Response) {
  const client = await pool.connect();
  let transaccionAbierta = false;

  try {
    const docenteId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);

    if (!docenteId || !cursoId) {
      return res.status(400).json({ message: "Solicitud no válida." });
    }

    const acceso = await obtenerOfertaDocente(docenteId, cursoId);
    if (!acceso) {
      return res.status(403).json({
        message: "No tienes permiso para modificar la asistencia de este curso.",
      });
    }

    const registrosRaw = Array.isArray(req.body?.registros) ? req.body.registros : [];
    if (registrosRaw.length === 0) {
      return res.status(400).json({
        message: "No hay fechas de asistencia pasadas para guardar.",
      });
    }

    const registros = new Map<string, {
      fecha_asistencia: string;
      matricula_id: number;
      estado: EstadoAsistencia;
    }>();

    for (const item of registrosRaw) {
      const fechaAsistencia = item?.fechaAsistencia;
      const matriculaId = validarId(item?.matriculaId);
      const estado = item?.estado;

      if (
        !validarFechaISO(fechaAsistencia) ||
        !matriculaId ||
        (estado !== "Presente" && estado !== "Falta")
      ) {
        return res.status(400).json({
          message: "Existe un registro de asistencia no válido.",
        });
      }

      registros.set(`${matriculaId}:${fechaAsistencia}`, {
        fecha_asistencia: fechaAsistencia,
        matricula_id: matriculaId,
        estado,
      });
    }

    const datos = Array.from(registros.values());
    const ofertaCursoId = Number(acceso.oferta_curso_id);

    await client.query("BEGIN");
    transaccionAbierta = true;

    const result = await client.query(
      `WITH datos AS (
         SELECT *
         FROM jsonb_to_recordset($1::JSONB) AS x(
           fecha_asistencia DATE,
           matricula_id BIGINT,
           estado VARCHAR(20)
         )
       )
       INSERT INTO asistencias (
         fecha_asistencia,
         matricula_id,
         estado,
         marcado_en
       )
       SELECT
         d.fecha_asistencia,
         d.matricula_id,
         d.estado,
         CURRENT_TIMESTAMP
       FROM datos d
       INNER JOIN matriculas m
         ON m.id = d.matricula_id
        AND m.oferta_curso_id = $2
        AND m.estado IN ('Activa', 'Completada')
       INNER JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       INNER JOIN periodos_academicos p ON p.id = oc.periodo_id
       WHERE d.fecha_asistencia BETWEEN p.fecha_inicio AND p.fecha_fin
         AND d.fecha_asistencia <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::DATE
         AND EXTRACT(ISODOW FROM d.fecha_asistencia)::SMALLINT = ANY(
           COALESCE(oc.dias_clase, ARRAY[]::SMALLINT[])
         )
       ON CONFLICT (matricula_id, fecha_asistencia)
       DO UPDATE SET
         estado = EXCLUDED.estado,
         marcado_en = CURRENT_TIMESTAMP
       RETURNING matricula_id, fecha_asistencia, estado`,
      [JSON.stringify(datos), ofertaCursoId]
    );

    if (Number(result.rowCount ?? 0) !== datos.length) {
      await client.query("ROLLBACK");
      transaccionAbierta = false;
      return res.status(400).json({
        message: "Algunas asistencias no corresponden a fechas del calendario de este curso, están en el futuro o pertenecen a otra matrícula.",
      });
    }

    await client.query("COMMIT");
    transaccionAbierta = false;

    return res.status(200).json({
      message: "Asistencia guardada correctamente.",
    });
  } catch (error) {
    if (transaccionAbierta) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    console.error("Error guardando asistencia por calendario:", error);
    return res.status(500).json({ message: "No se pudo guardar la asistencia." });
  } finally {
    client.release();
  }
}
