import type { Response } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  deleteObjectFromR2,
  getObjectFromR2,
  uploadBufferToR2,
  isR2NotFoundError,
  streamBodyToResponse,
} from "../services/r2.service";

const MAX_BYTES = 20 * 1024 * 1024;
const allowed: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowed[path.extname(file.originalname).toLowerCase()]) {
      return cb(new Error("Formato no permitido. Adjunta un documento válido."));
    }
    cb(null, true);
  },
}).single("archivo");

function ids(req: AuthenticatedRequest) {
  return {
    userId: Number(req.userId),
    courseId: Number(req.params.cursoId),
    contentId: Number(req.params.contenidoId),
  };
}
function valid(...values: number[]) {
  return values.every((n) => Number.isSafeInteger(n) && n > 0);
}
async function studentContext(courseId: number, contentId: number, studentId: number) {
  return pool.query(
    `SELECT a.id AS actividad_id, a.intentos_permitidos, a.puntaje_maximo,
            a.fecha_limite, a.instrucciones, a.tamano_maximo_mb,
            cc.titulo, COALESCE(cc.descripcion, a.instrucciones, '') AS descripcion,
            m.id AS matricula_id
       FROM actividades a
       JOIN contenidos_curso cc ON cc.id = a.contenido_id
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       JOIN cursos c ON c.id = mc.curso_id
       JOIN ofertas_curso oc ON oc.curso_id = c.id
       JOIN matriculas m ON m.oferta_curso_id = oc.id
       JOIN usuarios u ON u.id = m.estudiante_id
      WHERE c.id = $1 AND cc.id = $2 AND m.estudiante_id = $3
        AND m.estado IN ('Activa','Completada')
        AND u.rol = 'Estudiante' AND u.activo = TRUE
        AND cc.tipo = 'actividad' AND a.estado = 'Publicada'
        AND oc.estado <> 'Cancelado' AND oc.publicado = TRUE
      ORDER BY oc.actualizado_en DESC, oc.id DESC LIMIT 1`,
    [courseId, contentId, studentId]
  );
}
async function teacherContext(courseId: number, contentId: number, teacherId: number) {
  return pool.query(
    `SELECT a.id AS actividad_id, a.puntaje_maximo, a.intentos_permitidos,
            cc.titulo, COALESCE(cc.descripcion, a.instrucciones, '') AS descripcion
       FROM actividades a
       JOIN contenidos_curso cc ON cc.id = a.contenido_id
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       JOIN cursos c ON c.id = mc.curso_id
       JOIN ofertas_curso oc ON oc.curso_id = c.id
      WHERE c.id = $1 AND cc.id = $2 AND oc.docente_id = $3
        AND oc.estado <> 'Cancelado' AND cc.tipo = 'actividad'
      ORDER BY oc.actualizado_en DESC, oc.id DESC LIMIT 1`,
    [courseId, contentId, teacherId]
  );
}
async function role(userId: number, expected: string) {
  const r = await pool.query(
    "SELECT id FROM usuarios WHERE id=$1 AND rol=$2 AND activo=TRUE",
    [userId, expected]
  );
  return Boolean(r.rowCount);
}

export async function obtenerMiEntrega(req: AuthenticatedRequest, res: Response) {
  const { userId, courseId, contentId } = ids(req);
  if (!valid(userId, courseId, contentId)) return res.status(400).json({ message: "Parámetros no válidos." });
  try {
    if (!(await role(userId, "Estudiante"))) return res.status(403).json({ message: "Solo los estudiantes pueden consultar sus entregas." });
    const ctx = await studentContext(courseId, contentId, userId);
    if (!ctx.rowCount) return res.status(404).json({ message: "Actividad no disponible o no estás matriculado." });
    const result = await pool.query(
      `SELECT e.id, e.numero_intento, e.texto_entrega AS comentario, e.estado,
              e.entregada_en, e.nota, e.retroalimentacion,
              f.id AS archivo_id, f.nombre_archivo, f.tamano_bytes
         FROM entregas_actividades e
         LEFT JOIN LATERAL (
           SELECT * FROM archivos_entrega_actividad WHERE entrega_id=e.id
           ORDER BY subido_en DESC LIMIT 1
         ) f ON TRUE
        WHERE e.actividad_id=$1 AND e.matricula_id=$2
        ORDER BY e.numero_intento DESC`,
      [ctx.rows[0].actividad_id, ctx.rows[0].matricula_id]
    );
    return res.json({ actividad: ctx.rows[0], entregas: result.rows });
  } catch (error) {
    console.error("obtenerMiEntrega:", error);
    return res.status(500).json({ message: "No se pudo consultar la entrega." });
  }
}

export async function enviarEntrega(req: AuthenticatedRequest, res: Response) {
  const { userId, courseId, contentId } = ids(req);
  if (!valid(userId, courseId, contentId)) return res.status(400).json({ message: "Parámetros no válidos." });
  try {
    if (!(await role(userId, "Estudiante"))) return res.status(403).json({ message: "Solo los estudiantes pueden entregar actividades." });
    const ctx = await studentContext(courseId, contentId, userId);
    if (!ctx.rowCount) return res.status(404).json({ message: "Actividad no disponible o no estás matriculado." });

    await new Promise<void>((resolve, reject) => upload(req, res, (err) => err ? reject(err) : resolve()));
    const file = req.file;
    const comentario = typeof req.body?.comentario === "string" ? req.body.comentario.trim().slice(0, 5000) : "";
    if (!file && !comentario) return res.status(400).json({ message: "Adjunta un documento o escribe un comentario." });

    const { actividad_id: activityId, matricula_id: enrollmentId, intentos_permitidos: attempts } = ctx.rows[0];
    const count = await pool.query(
      "SELECT COUNT(*)::int AS total FROM entregas_actividades WHERE actividad_id=$1 AND matricula_id=$2",
      [activityId, enrollmentId]
    );
    if (Number(count.rows[0].total) >= Number(attempts)) return res.status(409).json({ message: "Ya alcanzaste el máximo de intentos permitidos." });

    let r2Key: string | null = null;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const nextAttempt = Number(count.rows[0].total) + 1;
      const inserted = await client.query(
        `INSERT INTO entregas_actividades (actividad_id, matricula_id, numero_intento, texto_entrega, estado, entregada_en)
         VALUES ($1,$2,$3,$4,'Entregada',CURRENT_TIMESTAMP) RETURNING id`,
        [activityId, enrollmentId, nextAttempt, comentario || null]
      );
      const entregaId = Number(inserted.rows[0].id);
      if (file) {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = path.basename(file.originalname).replace(/[\x00-\x1f\x7f]/g, "").slice(0, 255);
        r2Key = `activity-submissions/course-${courseId}/activity-${activityId}/student-${userId}/${randomUUID()}${extension}`;
        await uploadBufferToR2({ buffer: file.buffer, key: r2Key, contentType: allowed[extension], contentLength: file.size });
        await client.query(
          `INSERT INTO archivos_entrega_actividad (entrega_id,nombre_archivo,ruta_archivo,mime_type,tamano_bytes)
           VALUES ($1,$2,$3,$4,$5)`,
          [entregaId, safeName, `r2://${r2Key}`, allowed[extension], file.size]
        );
      }
      await client.query("COMMIT");
      return res.status(201).json({ message: "Entrega enviada correctamente.", entregaId });
    } catch (error) {
      await client.query("ROLLBACK");
      if (r2Key) await deleteObjectFromR2(r2Key).catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof multer.MulterError) return res.status(400).json({ message: "El archivo supera 20 MB o la solicitud contiene demasiados campos." });
    if (error instanceof Error && /Formato no permitido/.test(error.message)) return res.status(400).json({ message: error.message });
    console.error("enviarEntrega:", error);
    return res.status(500).json({ message: "No se pudo guardar la entrega." });
  }
}

export async function listarEntregasDocente(req: AuthenticatedRequest, res: Response) {
  const { userId, courseId, contentId } = ids(req);
  if (!valid(userId, courseId, contentId)) return res.status(400).json({ message: "Parámetros no válidos." });
  try {
    if (!(await role(userId, "Docente"))) return res.status(403).json({ message: "Solo los docentes pueden consultar entregas." });
    const ctx = await teacherContext(courseId, contentId, userId);
    if (!ctx.rowCount) return res.status(404).json({ message: "La actividad no pertenece a un curso asignado." });
    const result = await pool.query(
      `SELECT m.estudiante_id AS alumno_id, m.id AS matricula_id,
              TRIM(CONCAT(COALESCE(u.nombres,''),' ',COALESCE(u.apellidos,''))) AS alumno,
              e.id AS entrega_id, e.numero_intento, e.estado, e.entregada_en,
              e.nota, e.retroalimentacion, f.id AS archivo_id, f.nombre_archivo,
              f.tamano_bytes
         FROM modulos_curso mc
         JOIN contenidos_curso cc ON cc.modulo_id=mc.id
         JOIN cursos c ON c.id=mc.curso_id
         JOIN ofertas_curso oc ON oc.curso_id=c.id AND oc.docente_id=$3 AND oc.estado <> 'Cancelado'
         JOIN matriculas m ON m.oferta_curso_id=oc.id AND m.estado IN ('Activa','Completada')
         JOIN usuarios u ON u.id=m.estudiante_id AND u.rol='Estudiante' AND u.activo=TRUE
         LEFT JOIN LATERAL (
           SELECT * FROM actividades WHERE contenido_id=cc.id LIMIT 1
         ) a ON TRUE
         LEFT JOIN LATERAL (
           SELECT * FROM entregas_actividades
            WHERE actividad_id=a.id AND matricula_id=m.id
            ORDER BY numero_intento DESC LIMIT 1
         ) e ON TRUE
         LEFT JOIN LATERAL (
           SELECT * FROM archivos_entrega_actividad WHERE entrega_id=e.id
           ORDER BY subido_en DESC LIMIT 1
         ) f ON TRUE
        WHERE c.id=$1 AND cc.id=$2
        ORDER BY u.apellidos NULLS LAST,u.nombres`,
      [courseId, contentId, userId]
    );
    return res.json({ actividad: ctx.rows[0], alumnos: result.rows });
  } catch (error) {
    console.error("listarEntregasDocente:", error);
    return res.status(500).json({ message: "No se pudieron cargar las entregas." });
  }
}

export async function obtenerEntregaAlumnoDocente(req: AuthenticatedRequest, res: Response) {
  const { userId, courseId, contentId } = ids(req);
  const studentId = Number(req.params.alumnoId);
  if (!valid(userId, courseId, contentId, studentId)) return res.status(400).json({ message: "Parámetros no válidos." });
  try {
    if (!(await role(userId, "Docente"))) return res.status(403).json({ message: "Solo los docentes pueden revisar entregas." });
    const ctx = await teacherContext(courseId, contentId, userId);
    if (!ctx.rowCount) return res.status(404).json({ message: "Actividad no encontrada." });
    const result = await pool.query(
      `SELECT e.id AS entrega_id, e.numero_intento, e.estado, e.entregada_en,
              e.texto_entrega AS comentario, e.nota, e.retroalimentacion,
              m.id AS matricula_id, m.estudiante_id AS alumno_id,
              TRIM(CONCAT(COALESCE(u.nombres,''),' ',COALESCE(u.apellidos,''))) AS alumno,
              f.id AS archivo_id, f.nombre_archivo, f.tamano_bytes
         FROM modulos_curso mc
         JOIN contenidos_curso cc ON cc.modulo_id=mc.id
         JOIN cursos c ON c.id=mc.curso_id
         JOIN ofertas_curso oc ON oc.curso_id=c.id AND oc.docente_id=$3 AND oc.estado <> 'Cancelado'
         JOIN matriculas m ON m.oferta_curso_id=oc.id AND m.estudiante_id=$4 AND m.estado IN ('Activa','Completada')
         JOIN usuarios u ON u.id=m.estudiante_id
         JOIN actividades a ON a.contenido_id=cc.id
         LEFT JOIN LATERAL (
           SELECT * FROM entregas_actividades WHERE actividad_id=a.id AND matricula_id=m.id
           ORDER BY numero_intento DESC LIMIT 1
         ) e ON TRUE
         LEFT JOIN LATERAL (
           SELECT * FROM archivos_entrega_actividad WHERE entrega_id=e.id
           ORDER BY subido_en DESC LIMIT 1
         ) f ON TRUE
        WHERE c.id=$1 AND cc.id=$2 LIMIT 1`,
      [courseId, contentId, userId, studentId]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Alumno no matriculado en este curso." });
    return res.json({ actividad: ctx.rows[0], entrega: result.rows[0] });
  } catch (error) {
    console.error("obtenerEntregaAlumnoDocente:", error);
    return res.status(500).json({ message: "No se pudo cargar la entrega." });
  }
}

export async function calificarEntrega(req: AuthenticatedRequest, res: Response) {
  const userId = Number(req.userId);
  const courseId = Number(req.params.cursoId);
  const contentId = Number(req.params.contenidoId);
  const entregaId = Number(req.params.entregaId);
  const nota = Number(req.body?.nota);
  const retroalimentacion = typeof req.body?.retroalimentacion === "string" ? req.body.retroalimentacion.trim().slice(0, 5000) : null;
  if (!valid(userId, courseId, contentId, entregaId) || !Number.isFinite(nota)) return res.status(400).json({ message: "Nota o parámetros no válidos." });
  try {
    if (!(await role(userId, "Docente"))) return res.status(403).json({ message: "Solo los docentes pueden calificar." });
    const ctx = await teacherContext(courseId, contentId, userId);
    if (!ctx.rowCount) return res.status(404).json({ message: "Actividad no encontrada." });
    const max = Number(ctx.rows[0].puntaje_maximo ?? 20);
    if (nota < 0 || nota > max) return res.status(400).json({ message: `La nota debe estar entre 0 y ${max}.` });
    const saved = await pool.query(
      `UPDATE entregas_actividades e
          SET nota=$1, retroalimentacion=$2, calificado_por=$3,
              calificado_en=CURRENT_TIMESTAMP, estado='Calificada', actualizado_en=CURRENT_TIMESTAMP
         FROM actividades a, contenidos_curso cc, modulos_curso mc, cursos c,
              matriculas m, ofertas_curso oc
        WHERE e.id=$4 AND e.actividad_id=a.id AND a.contenido_id=cc.id
          AND cc.id=$5 AND cc.modulo_id=mc.id AND mc.curso_id=c.id
          AND c.id=$6 AND m.id=e.matricula_id
          AND oc.id=m.oferta_curso_id AND oc.curso_id=c.id
          AND oc.docente_id=$3 AND oc.estado <> 'Cancelado'
        RETURNING e.id, e.nota, e.retroalimentacion, e.calificado_en`,
      [nota, retroalimentacion, userId, entregaId, contentId, courseId]
    );
    if (!saved.rowCount) return res.status(404).json({ message: "Entrega no encontrada para esta actividad." });
    return res.json({ message: "Calificación guardada.", calificacion: saved.rows[0] });
  } catch (error) {
    console.error("calificarEntrega:", error);
    return res.status(500).json({ message: "No se pudo guardar la calificación." });
  }
}

export async function descargarArchivoEntrega(req: AuthenticatedRequest, res: Response) {
  const userId = Number(req.userId);
  const archivoId = Number(req.params.archivoId);
  if (!valid(userId, archivoId)) return res.status(400).json({ message: "Parámetros no válidos." });
  try {
    const result = await pool.query(
      `SELECT f.ruta_archivo, f.nombre_archivo, f.mime_type
         FROM archivos_entrega_actividad f
         JOIN entregas_actividades e ON e.id=f.entrega_id
         JOIN actividades a ON a.id=e.actividad_id
         JOIN contenidos_curso cc ON cc.id=a.contenido_id
         JOIN modulos_curso mc ON mc.id=cc.modulo_id
         JOIN cursos c ON c.id=mc.curso_id
         JOIN matriculas m ON m.id=e.matricula_id
         JOIN ofertas_curso oc ON oc.id=m.oferta_curso_id
         JOIN usuarios u ON u.id=$2 AND u.activo=TRUE
        WHERE f.id=$1 AND (
          (u.rol='Estudiante' AND m.estudiante_id=u.id)
          OR (u.rol='Docente' AND oc.docente_id=u.id)
        ) LIMIT 1`,
      [archivoId, userId]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Archivo no encontrado o sin permiso." });
    const route = String(result.rows[0].ruta_archivo ?? "");
    if (!route.startsWith("r2://")) return res.status(404).json({ message: "El archivo no está en R2." });
    let object;
    try { object = await getObjectFromR2(route.slice(5)); }
    catch (error) { if (isR2NotFoundError(error)) return res.status(404).json({ message: "Archivo no disponible." }); throw error; }
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", result.rows[0].mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(result.rows[0].nombre_archivo)}`);
    streamBodyToResponse(object.Body, res);
  } catch (error) {
    console.error("descargarArchivoEntrega:", error);
    if (!res.headersSent) return res.status(500).json({ message: "No se pudo descargar el archivo." });
  }
}
