import type { Response } from "express";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

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
    const acceso = await pool.query(
      `SELECT m.id::TEXT AS matricula_id, oc.id::TEXT AS oferta_curso_id,
         BTRIM(CONCAT_WS(' ', u.nombres, u.apellidos)) AS nombre,
         u.correo, c.nombre AS curso
       FROM matriculas m
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       JOIN cursos c ON c.id = oc.curso_id
       JOIN usuarios u ON u.id = m.estudiante_id
       WHERE m.estudiante_id = $1 AND c.id = $2
         AND u.rol = 'Estudiante' AND u.activo = TRUE
         AND m.estado IN ('Activa', 'Completada')
         AND oc.publicado = TRUE AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
         AND c.estado = 'Activo'
       ORDER BY m.id DESC LIMIT 1`,
      [estudianteId, cursoId]
    );
    const matricula = acceso.rows[0];
    if (!matricula) return res.status(403).json({ message: "No tienes acceso a la asistencia de este curso." });

    const resultado = await pool.query<{
      id: string; numero: number; tema: string; iniciaEn: string; estado: "Presente" | "Falta" | null;
    }>(
      `SELECT sc.id::TEXT AS id, sc.numero_sesion AS numero, sc.tema,
         sc.inicia_en AS "iniciaEn", a.estado
       FROM sesiones_clase sc
       LEFT JOIN asistencias a ON a.sesion_clase_id = sc.id AND a.matricula_id = $1
       WHERE sc.oferta_curso_id = $2 AND sc.estado <> 'Cancelada' AND sc.inicia_en <= NOW()
       ORDER BY sc.inicia_en DESC, sc.numero_sesion DESC, sc.id DESC`,
      [matricula.matricula_id, matricula.oferta_curso_id]
    );
    const asistidas = resultado.rows.filter((sesion) => sesion.estado === "Presente").length;
    const faltas = resultado.rows.filter((sesion) => sesion.estado === "Falta").length;
    const registradas = asistidas + faltas;
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({
      alumno: { nombre: matricula.nombre, correo: matricula.correo },
      curso: { nombre: matricula.curso },
      resumen: { asistidas, faltas, registradas, porcentaje: registradas ? Math.round(asistidas * 100 / registradas) : null },
      historial: resultado.rows,
    });
  } catch (error) {
    console.error("Error consultando asistencia del alumno:", error);
    return res.status(500).json({ message: "No se pudo cargar tu asistencia. Inténtalo nuevamente." });
  }
}
