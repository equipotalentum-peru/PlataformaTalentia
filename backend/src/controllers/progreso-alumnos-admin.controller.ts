import type { Request, Response } from "express";
import pool from "../config/database";
import { calcularPromedio } from "../services/calificaciones.service";
import { emitirCertificadoCurso } from "../services/certificados.service";
import { getObjectFromR2, isR2NotFoundError, isR2Path, objectExistsInR2, streamBodyToResponse, stripR2Prefix } from "../services/r2.service";

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
         (SELECT json_build_object('id', cert.id::TEXT, 'numero', cert.numero_certificado,
            'visibleAlumno', cert.visible_alumno,
            'rutaArchivo', cert.ruta_archivo,
            'disponible', COALESCE(cert.ruta_archivo LIKE 'r2://%'
              AND LENGTH(BTRIM(SUBSTRING(cert.ruta_archivo FROM 6))) > 0, FALSE))
          FROM certificados cert
          WHERE cert.matricula_id = m.id AND cert.modulo_id IS NULL
            AND cert.tipo = 'Aprobacion'
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
    const registros = await Promise.all(resultado.rows.map(async (fila) => {
      let certificado = null;
      if (fila.certificado) {
        const { rutaArchivo, ...datosCertificado } = fila.certificado;
        certificado = {
          ...datosCertificado,
          disponible: datosCertificado.disponible && await objectExistsInR2(stripR2Prefix(rutaArchivo)),
        };
      }
      const notas = fila.notas as NotaProgreso[];
      const promedio = calcularPromedio(notas);
      const todoCalificado = notas.length > 0 && notas.every((nota) => nota.nota !== null);
      const estado = todoCalificado && promedio !== null
        ? promedio >= 14 ? "Aprobado" : "Desaprobado"
        : "En curso";
      const puedeGenerarCertificado = promedio !== null && promedio >= 14 && !certificado?.disponible;
      return { ...fila, certificado, promedio, estado, puedeGenerarCertificado };
    }));
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
         AND cert.modulo_id IS NULL AND cert.tipo = 'Aprobacion'
       LIMIT 1`,
      [certificadoId, matriculaId]
    );
    return await enviarPdfCertificado(resultado.rows[0], res);
  } catch (error) {
    if (res.headersSent) return;
    if (isR2NotFoundError(error)) return res.status(404).json({ message: "El PDF del certificado no está disponible en Cloudflare R2." });
    console.error("Error descargando certificado para administrador:", error);
    return res.status(500).json({ message: "No se pudo descargar el certificado." });
  }
}

async function enviarPdfCertificado(certificado: { ruta_archivo: string | null; numero_certificado: string } | undefined, res: Response) {
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
}

export async function generarCertificadoProgreso(req: Request, res: Response) {
  const matriculaId = leerFiltroId(req.params.matriculaId);
  if (!matriculaId || !Number.isSafeInteger(Number(matriculaId))) {
    return res.status(400).json({ message: "La matrícula no es válida." });
  }
  try {
    const certificado = await emitirCertificadoCurso(Number(matriculaId), "administrador");
    if (!certificado) return res.status(409).json({ message: "Se requiere un promedio mayor o igual a 14." });
    return await enviarPdfCertificado(certificado, res);
  } catch (error) {
    if (res.headersSent) return;
    console.error("Error generando certificado para administrador:", error);
    return res.status(500).json({ message: "No se pudo generar y descargar el certificado. Inténtalo nuevamente." });
  }
}

export async function desactivarCertificadoProgreso(req: Request, res: Response) {
  return cambiarVisibilidadCertificado(req, res, false);
}

export async function activarCertificadoProgreso(req: Request, res: Response) {
  return cambiarVisibilidadCertificado(req, res, true);
}

async function cambiarVisibilidadCertificado(req: Request, res: Response, visible: boolean) {
  const matriculaId = leerFiltroId(req.params.matriculaId);
  const certificadoId = leerFiltroId(req.params.certificadoId);
  if (!matriculaId || !certificadoId) return res.status(400).json({ message: "El certificado o la matrícula no son válidos." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1::BIGINT)", [matriculaId]);
    const resultado = await client.query(
      `UPDATE certificados SET visible_alumno = $3
       WHERE id = $1 AND matricula_id = $2 AND modulo_id IS NULL AND tipo = 'Aprobacion'
       RETURNING id`,
      [certificadoId, matriculaId, visible]
    );
    await client.query("COMMIT");
    if (!resultado.rowCount) return res.status(404).json({ message: "Certificado no encontrado." });
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({ message: visible ? "Certificado activado para el alumno." : "Certificado desactivado para el alumno." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cambiando la visibilidad del certificado:", error);
    return res.status(500).json({ message: visible ? "No se pudo activar el certificado." : "No se pudo desactivar el certificado." });
  } finally {
    client.release();
  }
}
