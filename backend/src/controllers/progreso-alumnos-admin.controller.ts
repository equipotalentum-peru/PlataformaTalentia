import type { Request, Response } from "express";
import pool from "../config/database";
import { calcularPromedio } from "../services/calificaciones.service";
import { requisitosCertificacionSql } from "../services/certificacion-eligibilidad.service";
import { getObjectFromR2, isR2NotFoundError, isR2Path, streamBodyToResponse, stripR2Prefix } from "../services/r2.service";

type NotaProgreso = {
  id: string;
  nombre: string;
  porcentaje: number | null;
  puntajeMaximo: number | null;
  nota: number | null;
};

function leerFiltroId(valor: unknown): string | null | false {
  if (valor === undefined || valor === "") return null;
  if (typeof valor !== "string" || !/^[1-9]\d{0,18}$/.test(valor)) return false;
  return BigInt(valor) <= BigInt("9223372036854775807") ? valor : false;
}

export async function listarCursosProgreso(req: Request, res: Response) {
  const periodoId = leerFiltroId(req.query.periodoId);
  if (periodoId === false) {
    return res.status(400).json({ message: "El periodo no es válido." });
  }

  try {
    const resultado = await pool.query(
      `SELECT c.id::TEXT AS id, c.nombre, c.codigo
       FROM cursos c
       WHERE $1::BIGINT IS NULL OR EXISTS (
         SELECT 1 FROM ofertas_curso oc
         WHERE oc.curso_id = c.id AND oc.periodo_id = $1
       )
       ORDER BY c.nombre, c.codigo, c.id`,
      [periodoId]
    );
    return res.json({ cursos: resultado.rows });
  } catch (error) {
    console.error("Error consultando cursos para progreso de alumnos:", error);
    return res.status(500).json({ message: "No se pudieron cargar los cursos." });
  }
}

export async function listarAlumnosProgreso(req: Request, res: Response) {
  const periodoId = leerFiltroId(req.query.periodoId);
  const cursoId = leerFiltroId(req.query.cursoId);
  if (periodoId === false || cursoId === false) {
    return res.status(400).json({ message: "El periodo o el curso no son válidos." });
  }

  try {
    const resultado = await pool.query(
      `SELECT DISTINCT u.id::TEXT AS id,
         BTRIM(CONCAT_WS(' ', u.nombres, u.apellidos)) AS nombre,
         COALESCE(NULLIF(u.id_persona, ''), u.usuario) AS codigo
       FROM usuarios u
       JOIN matriculas m ON m.estudiante_id = u.id
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       WHERE ($1::BIGINT IS NULL OR oc.periodo_id = $1)
         AND ($2::BIGINT IS NULL OR oc.curso_id = $2)
       ORDER BY nombre, codigo, id`,
      [periodoId, cursoId]
    );
    return res.json({ alumnos: resultado.rows });
  } catch (error) {
    console.error("Error consultando alumnos para progreso de alumnos:", error);
    return res.status(500).json({ message: "No se pudieron cargar los alumnos." });
  }
}

export async function listarProgresoAlumnos(req: Request, res: Response) {
  const periodoId = leerFiltroId(req.query.periodoId);
  const cursoId = leerFiltroId(req.query.cursoId);
  const alumnoId = leerFiltroId(req.query.alumnoId);
  if (periodoId === false || cursoId === false || alumnoId === false) {
    return res.status(400).json({ message: "Los filtros no son válidos." });
  }
  if (!periodoId && !cursoId && !alumnoId) return res.json({ registros: [] });

  try {
    const resultado = await pool.query(
      `SELECT m.id::TEXT AS id, oc.id::TEXT AS "ofertaId",
         COALESCE(p.nombre, 'Periodo sin asignar') AS periodo,
         c.nombre AS curso, c.codigo AS "codigoCurso",
         BTRIM(CONCAT_WS(' ', u.nombres, u.apellidos)) AS alumno,
         COALESCE(NULLIF(u.id_persona, ''), u.usuario) AS "codigoAlumno",
         (SELECT json_build_object('id', cert.id::TEXT, 'numero', cert.numero_certificado)
          FROM certificados cert
          WHERE cert.matricula_id = m.id AND cert.modulo_id IS NULL
            AND (${requisitosCertificacionSql})
            AND cert.tipo = 'Aprobacion' AND cert.ruta_archivo LIKE 'r2://%'
            AND LENGTH(BTRIM(SUBSTRING(cert.ruta_archivo FROM 6))) > 0
          ORDER BY cert.emitido_en DESC, cert.id DESC LIMIT 1) AS certificado,
         COALESCE(json_agg(json_build_object(
           'id', comp.id::TEXT, 'nombre', comp.nombre,
           'porcentaje', comp.porcentaje, 'puntajeMaximo', comp.puntaje_maximo,
           'nota', cal.nota
         ) ORDER BY comp.id) FILTER (WHERE comp.id IS NOT NULL), '[]'::json) AS notas
       FROM matriculas m
       JOIN usuarios u ON u.id = m.estudiante_id
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       JOIN cursos c ON c.id = oc.curso_id
       LEFT JOIN periodos_academicos p ON p.id = oc.periodo_id
       LEFT JOIN componentes_calificacion comp ON comp.oferta_curso_id = oc.id
       LEFT JOIN calificaciones cal ON cal.componente_id = comp.id AND cal.matricula_id = m.id
       WHERE ($1::BIGINT IS NULL OR oc.periodo_id = $1)
         AND ($2::BIGINT IS NULL OR oc.curso_id = $2)
         AND ($3::BIGINT IS NULL OR m.estudiante_id = $3)
       GROUP BY m.id, m.oferta_curso_id, oc.id, c.nombre, c.codigo, u.nombres, u.apellidos,
         u.id_persona, u.usuario, p.nombre, p.fecha_inicio
       ORDER BY p.fecha_inicio DESC NULLS LAST, c.nombre, alumno, m.id`,
      [periodoId, cursoId, alumnoId]
    );
    const registros = resultado.rows.map((fila) => {
      const notas = fila.notas as NotaProgreso[];
      const promedio = calcularPromedio(notas);
      const todoCalificado = notas.length > 0 && notas.every((nota) => nota.nota !== null);
      const estado = todoCalificado && promedio !== null
        ? promedio >= 14 ? "Aprobado" : "Desaprobado"
        : "En curso";
      return { ...fila, promedio, estado };
    });
    return res.json({ registros });
  } catch (error) {
    console.error("Error consultando el progreso de alumnos:", error);
    return res.status(500).json({ message: "No se pudo cargar el progreso de los alumnos." });
  }
}

export async function descargarCertificadoProgreso(req: Request, res: Response) {
  const matriculaId = leerFiltroId(req.params.matriculaId);
  const certificadoId = leerFiltroId(req.params.certificadoId);
  if (!matriculaId || !certificadoId) {
    return res.status(400).json({ message: "El certificado o la matrícula no son válidos." });
  }

  try {
    const resultado = await pool.query(
      `SELECT cert.ruta_archivo, cert.numero_certificado
       FROM certificados cert
       JOIN matriculas m ON m.id = cert.matricula_id
       WHERE cert.id = $1 AND m.id = $2
         AND (${requisitosCertificacionSql})
         AND cert.modulo_id IS NULL AND cert.tipo = 'Aprobacion'
       LIMIT 1`,
      [certificadoId, matriculaId]
    );
    const certificado = resultado.rows[0];
    const ruta = String(certificado?.ruta_archivo ?? "").trim();
    if (!certificado || !isR2Path(ruta) || !stripR2Prefix(ruta).trim()) {
      return res.status(404).json({ message: "Sin certificado disponible." });
    }

    const object = await getObjectFromR2(stripR2Prefix(ruta));
    if (!object.Body) {
      return res.status(404).json({ message: "El PDF del certificado no está disponible." });
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", "application/pdf");
    if (object.ContentLength !== undefined) res.setHeader("Content-Length", String(object.ContentLength));
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(`${certificado.numero_certificado}.pdf`)}`);
    streamBodyToResponse(object.Body, res);
  } catch (error) {
    if (res.headersSent) return;
    if (isR2NotFoundError(error)) {
      return res.status(404).json({ message: "El PDF del certificado no está disponible en Cloudflare R2." });
    }
    console.error("Error descargando certificado para administrador:", error);
    return res.status(500).json({ message: "No se pudo descargar el certificado." });
  }
}
