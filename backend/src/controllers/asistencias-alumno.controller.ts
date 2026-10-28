import type { Response } from "express";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type EstadoAsistencia = "Presente" | "Falta" | null;

function nombreDiaSemana(dia: number): string {
  const nombres = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  return nombres[dia] ?? "Día";
}

export async function obtenerAsistenciaAlumno(req: AuthenticatedRequest, res: Response) {
  const estudianteId = Number(req.userId);
  const cursoId = Number(req.params.cursoId);

  if (!Number.isSafeInteger(estudianteId) || estudianteId <= 0) {
    return res.status(401).json({ message: "Sesión no válida." });
  }
  if (!Number.isSafeInteger(cursoId) || cursoId <= 0) {
    return res.status(400).json({ message: "Curso no válido." });
  }

  try {
    const acceso = await pool.query<{
      matricula_id: string;
      oferta_curso_id: string;
      nombre: string;
      correo: string;
      curso: string;
    }>(
      `SELECT
         m.id::TEXT AS matricula_id,
         oc.id::TEXT AS oferta_curso_id,
         BTRIM(u.nombres) AS nombre,
         u.correo,
         c.nombre AS curso
       FROM matriculas m
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       JOIN cursos c ON c.id = oc.curso_id
       JOIN usuarios u ON u.id = m.estudiante_id
       WHERE m.estudiante_id = $1
         AND c.id = $2
         AND u.rol = 'Estudiante'
         AND u.activo = TRUE
         AND m.estado IN ('Activa', 'Completada')
         AND oc.publicado = TRUE
         AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
         AND c.estado = 'Activo'
       ORDER BY m.id DESC
       LIMIT 1`,
      [estudianteId, cursoId]
    );

    const matricula = acceso.rows[0];
    if (!matricula) {
      return res.status(403).json({ message: "No tienes acceso a la asistencia de este curso." });
    }

    const resultado = await pool.query<{
      fecha: string;
      numero: number;
      dia_semana: number;
      estado: EstadoAsistencia;
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
         WHERE oc.id = $2
           AND EXTRACT(ISODOW FROM generado.fecha)::SMALLINT = ANY(
             COALESCE(oc.dias_clase, ARRAY[]::SMALLINT[])
           )
           AND generado.fecha::DATE <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::DATE
       )
       SELECT
         TO_CHAR(calendario.fecha, 'YYYY-MM-DD') AS fecha,
         calendario.numero,
         calendario.dia_semana,
         a.estado
       FROM calendario
       LEFT JOIN asistencias a
         ON a.matricula_id = $1
        AND a.fecha_asistencia = calendario.fecha
       ORDER BY calendario.fecha DESC`,
      [matricula.matricula_id, matricula.oferta_curso_id]
    );

    const asistidas = resultado.rows.filter((dia) => dia.estado === "Presente").length;
    const faltas = resultado.rows.filter((dia) => dia.estado === "Falta").length;
    const registradas = asistidas + faltas;
    const totalProgramadas = resultado.rows.length;

    res.setHeader("Cache-Control", "private, no-store");
    return res.json({
      alumno: { nombre: matricula.nombre, correo: matricula.correo },
      curso: { nombre: matricula.curso },
      resumen: {
        asistidas,
        faltas,
        registradas,
        totalProgramadas,
        porcentaje: totalProgramadas ? Math.round(asistidas * 100 / totalProgramadas) : null,
      },
      historial: resultado.rows.map((dia) => ({
        id: dia.fecha,
        fecha: dia.fecha,
        numero: Number(dia.numero),
        diaSemana: nombreDiaSemana(Number(dia.dia_semana)),
        estado: dia.estado,
      })),
    });
  } catch (error) {
    console.error("Error consultando asistencia del alumno:", error);
    return res.status(500).json({ message: "No se pudo cargar tu asistencia. Inténtalo nuevamente." });
  }
}
