import type { Response } from "express";
import multer from "multer";
import path from "node:path";
import { tmpdir } from "node:os";
import { open, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { deleteObjectFromR2, uploadFileToR2 } from "../services/r2.service";
import { obtenerRubrica } from "../services/rubricas.service";

const receive = multer({
  dest: tmpdir(), defParamCharset: "utf8",
  limits: { fileSize: 200 * 1024 * 1024, files: 1, fields: 1, fieldSize: 128 * 1024, parts: 2 },
}).single("rubrica");
const documents = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "rar"];
const images = ["png", "jpg", "jpeg"];
const videos = ["mp4"];
type Criterion = { nombre: string; descripcion?: string; puntaje_maximo: number };
class ActivityInputError extends Error {}
const accessQuery = `SELECT mc.id FROM modulos_curso mc JOIN cursos c ON c.id = mc.curso_id
  WHERE mc.id = $1 AND c.id = $2 AND mc.activo = TRUE AND c.estado = 'Activo'
    AND EXISTS (
      SELECT 1 FROM ofertas_curso oc JOIN usuarios u ON u.id = oc.docente_id
      WHERE oc.curso_id = c.id AND u.id = $3 AND u.rol = 'Docente'
        AND u.activo = TRUE AND oc.estado <> 'Cancelado'
    )`;
const configurationQuery = `SELECT a.*, cc.modulo_id, cc.titulo,
    COALESCE(cc.descripcion, a.instrucciones, '') AS descripcion,
    cc.estado AS estado_contenido
  FROM actividades a
  JOIN contenidos_curso cc ON cc.id = a.contenido_id
  JOIN modulos_curso mc ON mc.id = cc.modulo_id
  WHERE cc.id = $1 AND mc.curso_id = $2 AND cc.tipo = 'actividad'
    AND cc.estado IN ('Borrador', 'Publicado')`;

export async function obtenerConfiguracionActividad(req: AuthenticatedRequest, res: Response) {
  const courseId = Number(req.params.cursoId);
  const contentId = Number(req.params.contenidoId);
  const userId = Number(req.userId);
  if (![courseId, contentId, userId].every(id => Number.isSafeInteger(id) && id > 0)) {
    return res.status(400).json({ message: "Parámetros no válidos." });
  }
  try {
    const result = await pool.query(configurationQuery, [contentId, courseId]);
    const activity = result.rows[0];
    if (!activity) return res.status(404).json({ message: "Actividad no disponible." });
    const access = await pool.query(accessQuery, [activity.modulo_id, courseId, userId]);
    if (!access.rowCount) return res.status(403).json({ message: "No puedes editar esta actividad." });
    return res.json({
      actividad: activity,
      rubrica: await obtenerRubrica(Number(activity.id)),
    });
  } catch (error) {
    console.error("Error consultando configuración de actividad:", error);
    return res.status(500).json({ message: "No se pudo cargar la actividad." });
  }
}

export async function crearActividad(req: AuthenticatedRequest, res: Response) {
  return guardarActividad(req, res, false);
}

export async function actualizarActividad(req: AuthenticatedRequest, res: Response) {
  return guardarActividad(req, res, true);
}

async function guardarActividad(req: AuthenticatedRequest, res: Response, editing: boolean) {
  const courseId = Number(req.params.cursoId);
  const contentId = Number(req.params.contenidoId);
  let moduleId = Number(req.params.moduloId);
  const userId = Number(req.userId);
  if (![editing ? contentId : moduleId, courseId, userId].every(id => Number.isSafeInteger(id) && id > 0)) {
    return res.status(400).json({ message: "Parámetros no válidos." });
  }
  let r2Key: string | undefined;
  let previousPath: string | null = null;
  let saved = false;
  try {
  if (editing) {
    const current = await pool.query(configurationQuery, [contentId, courseId]);
    if (!current.rowCount) return res.status(404).json({ message: "Actividad no disponible." });
    moduleId = Number(current.rows[0].modulo_id);
  }
  const ids = [moduleId, courseId, userId];
  const access = await pool.query(accessQuery, ids);
  if (!access.rowCount) return res.status(403).json({ message: "No puedes crear actividades en este módulo." });
  await pool.query("SELECT ruta_archivo, nombre_archivo, mime_type, tamano_bytes FROM rubricas LIMIT 0");
  let b = req.body ?? {};
  if (req.is("multipart/form-data")) {
    await new Promise<void>((resolve, reject) => receive(req, res, error => error ? reject(error) : resolve()));
    try { b = JSON.parse(req.body?.datos); }
    catch { throw new ActivityInputError("La configuración de la actividad no es válida."); }
  }
  if (!b || typeof b !== "object" || Array.isArray(b)) throw new ActivityInputError("Configuración no válida.");
  const titulo = typeof b.titulo === "string" ? b.titulo.trim() : "";
  const descripcion = typeof b.descripcion === "string" ? b.descripcion : "";
  const permisos = [b.permitir_archivo, b.permitir_enlace, b.permitir_imagen, b.permitir_video];
  const formatos: unknown[] = Array.isArray(b.formatos_permitidos)
    ? b.formatos_permitidos
    : [];
  const extensiones = [...documents, ...images, ...videos];
  const fecha = b.fecha_limite ?? null;

  if (![courseId, moduleId].every(id => Number.isSafeInteger(id) && id > 0) ||
      !titulo || titulo.length > 200 || typeof b.descripcion !== "string" || descripcion.length > 20000 ||
      !["Borrador", "Publicado"].includes(b.estado)) {
    return res.status(400).json({ message: "Revisa el título, la descripción y el estado." });
  }
  if (!Number.isInteger(b.intentos_permitidos) || b.intentos_permitidos < 1 || b.intentos_permitidos > 5 ||
      typeof b.calificada !== "boolean" || !Number.isFinite(b.puntaje_maximo) ||
      b.puntaje_maximo < 0 || b.puntaje_maximo > 100 ||
      Math.abs(b.puntaje_maximo * 100 - Math.round(b.puntaje_maximo * 100)) > 1e-8 ||
      !Number.isFinite(b.tamano_maximo_mb) || b.tamano_maximo_mb <= 0 || b.tamano_maximo_mb > 200) {
    return res.status(400).json({ message: "Revisa los intentos, la puntuación y el tamaño máximo." });
  }
  if (!permisos.every(value => typeof value === "boolean") || !permisos.some(Boolean) ||
      !formatos.every(value => typeof value === "string" && extensiones.includes(value)) ||
      ((b.permitir_archivo || b.permitir_imagen || b.permitir_video) && !formatos.length) ||
      (fecha !== null && (typeof fecha !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(fecha) || !Number.isFinite(Date.parse(fecha))))) {
    return res.status(400).json({ message: "Revisa los tipos de entrega, formatos y fecha límite." });
  }
  const enabledFormats = [...(b.permitir_archivo ? documents : []), ...(b.permitir_imagen ? images : []), ...(b.permitir_video ? videos : [])];
  const selectedFormats = [...new Set((formatos as string[]).filter(format => enabledFormats.includes(format)))];
  if ([b.permitir_archivo && !selectedFormats.some(format => documents.includes(format)),
       b.permitir_imagen && !selectedFormats.some(format => images.includes(format)),
       b.permitir_video && !selectedFormats.some(format => videos.includes(format))].some(Boolean)) {
    throw new ActivityInputError("Selecciona al menos un formato para cada tipo de archivo habilitado.");
  }
  if (!editing && b.estado === "Publicado" && fecha && Date.parse(fecha) <= Date.now()) {
    throw new ActivityInputError("La fecha de entrega debe ser posterior a la fecha actual.");
  }
  const rubric = b.rubrica ?? null;
  const criteria: Criterion[] = rubric?.tipo === "criterios" && Array.isArray(rubric.criterios) ? rubric.criterios : [];
  if (rubric !== null && (typeof rubric !== "object" || Array.isArray(rubric) || !["pdf", "criterios", ...(editing ? ["conservar"] : [])].includes(rubric.tipo))) throw new ActivityInputError("Tipo de rúbrica no válido.");
  if (rubric?.tipo === "criterios" && (!criteria.length || criteria.length > 20 || criteria.some(item =>
    typeof item?.nombre !== "string" || !item.nombre.trim() || item.nombre.trim().length > 200 ||
    (item.descripcion !== undefined && (typeof item.descripcion !== "string" || item.descripcion.length > 2000)) ||
    typeof item.puntaje_maximo !== "number" || !Number.isFinite(item.puntaje_maximo) || item.puntaje_maximo < 0 ||
    Math.abs(item.puntaje_maximo * 100 - Math.round(item.puntaje_maximo * 100)) > 1e-8
  ) || criteria.reduce((sum, item) => sum + Math.round(item.puntaje_maximo * 100), 0) !== Math.round(b.puntaje_maximo * 100))) {
    throw new ActivityInputError("Los criterios deben tener nombres y sumar la puntuación máxima.");
  }
  if (Boolean(req.file) !== (rubric?.tipo === "pdf")) throw new ActivityInputError("Adjunta el PDF de la rúbrica o selecciona otra opción.");
  if (req.file) {
    const handle = await open(req.file.path, "r");
    const header = Buffer.alloc(5);
    try { await handle.read(header, 0, 5, 0); } finally { await handle.close(); }
    if (!req.file.originalname.toLowerCase().endsWith(".pdf") || req.file.size === 0 || header.toString("ascii") !== "%PDF-") {
      throw new ActivityInputError("El archivo de rúbrica debe ser un PDF válido.");
    }
    r2Key = `courses/${courseId}/modules/${moduleId}/rubrics/${randomUUID()}.pdf`;
    await uploadFileToR2({ filePath: req.file.path, key: r2Key, contentType: "application/pdf", contentLength: req.file.size, originalName: req.file.originalname });
  }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const acceso = await client.query(
        `${accessQuery} FOR UPDATE OF mc`, ids
      );
      if (!acceso.rowCount) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "No puedes crear actividades en este módulo." });
      }
      let actividadId: number;
      let savedContentId: number;
      if (editing) {
        const current = await client.query(`${configurationQuery} FOR UPDATE OF a, cc`, [contentId, courseId]);
        const activity = current.rows[0];
        if (!activity || Number(activity.modulo_id) !== moduleId) {
          await client.query("ROLLBACK");
          return res.status(404).json({ message: "Actividad no disponible." });
        }
        const unchangedDeadline = (activity.fecha_limite ? new Date(activity.fecha_limite).getTime() : null) === (fecha ? Date.parse(fecha) : null);
        if (b.estado === "Publicado" && fecha && Date.parse(fecha) <= Date.now() &&
            !(unchangedDeadline && activity.estado_contenido === "Publicado")) {
          throw new ActivityInputError("La fecha de entrega debe ser posterior a la fecha actual.");
        }
        const history = await client.query(
          `SELECT COALESCE(MAX(numero_intento), 0) AS intentos, MAX(nota) AS nota,
             COALESCE(BOOL_OR(nota IS NOT NULL OR estado = 'Calificada'), FALSE) AS calificada
           FROM entregas_actividades WHERE actividad_id = $1 AND numero_intento > 0`, [activity.id]
        );
        if (b.intentos_permitidos < Number(history.rows[0].intentos)) throw new ActivityInputError("No puedes reducir los intentos por debajo de los ya utilizados.");
        if (history.rows[0].calificada && (!b.calificada || b.puntaje_maximo < Number(history.rows[0].nota ?? 0))) {
          throw new ActivityInputError("Conserva la calificación y una puntuación máxima que incluya las notas guardadas.");
        }
        const previous = await client.query("SELECT id, ruta_archivo FROM rubricas WHERE actividad_id = $1 FOR UPDATE", [activity.id]);
        if (rubric?.tipo === "conservar" && previous.rows[0] && !previous.rows[0].ruta_archivo) {
          const total = await client.query("SELECT COALESCE(SUM(puntaje_maximo), 0) AS total FROM criterios_rubrica WHERE rubrica_id = $1", [previous.rows[0].id]);
          if (Math.round(Number(total.rows[0].total) * 100) !== Math.round(b.puntaje_maximo * 100)) throw new ActivityInputError("Ajusta los criterios de la rúbrica a la nueva puntuación máxima.");
        }
        if (rubric?.tipo !== "conservar") previousPath = previous.rows[0]?.ruta_archivo ?? null;
        await client.query("UPDATE contenidos_curso SET titulo=$2, descripcion=$3, estado=$4, actualizado_en=CURRENT_TIMESTAMP WHERE id=$1", [contentId, titulo, descripcion, b.estado]);
        await client.query(
          `UPDATE actividades SET instrucciones=$2, fecha_limite=$3, intentos_permitidos=$4,
             puntaje_maximo=$5, permitir_archivo=$6, permitir_enlace=$7, permitir_imagen=$8,
             permitir_video=$9, formatos_permitidos=$10, tamano_maximo_mb=$11, calificada=$12,
             estado=$13, actualizado_en=CURRENT_TIMESTAMP WHERE id=$1`,
          [activity.id, descripcion, fecha, b.intentos_permitidos, b.puntaje_maximo, ...permisos,
           selectedFormats.join(","), b.tamano_maximo_mb, b.calificada, b.estado === "Publicado" ? "Publicada" : "Oculta"]
        );
        actividadId = Number(activity.id);
        savedContentId = contentId;
      } else {
      const contenido = await client.query(
        `INSERT INTO contenidos_curso (modulo_id, titulo, tipo, descripcion, estado, orden, creado_por)
         SELECT $1, $2, 'actividad', $3, $4, COALESCE(MAX(orden), 0) + 1, $5
         FROM contenidos_curso WHERE modulo_id = $1 RETURNING id`,
        [moduleId, titulo, descripcion, b.estado, req.userId]
      );
      const actividad = await client.query(
        `INSERT INTO actividades (contenido_id, instrucciones, fecha_limite, intentos_permitidos,
           puntaje_maximo, permitir_archivo, permitir_enlace, permitir_imagen, permitir_video,
           formatos_permitidos, tamano_maximo_mb, calificada, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [contenido.rows[0].id, descripcion, fecha, b.intentos_permitidos,
         b.puntaje_maximo, ...permisos, selectedFormats.join(","),
         b.tamano_maximo_mb, b.calificada, b.estado === "Publicado" ? "Publicada" : "Oculta"]
      );
      actividadId = Number(actividad.rows[0].id);
      savedContentId = Number(contenido.rows[0].id);
      }
      if (rubric?.tipo === "conservar") {
        await client.query("UPDATE rubricas SET titulo=$2, actualizado_en=CURRENT_TIMESTAMP WHERE actividad_id=$1", [actividadId, titulo]);
      } else if (rubric) {
        const result = await client.query(
          `INSERT INTO rubricas (actividad_id, titulo, ruta_archivo, nombre_archivo, mime_type, tamano_bytes)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (actividad_id) DO UPDATE SET titulo=EXCLUDED.titulo,
             ruta_archivo=EXCLUDED.ruta_archivo, nombre_archivo=EXCLUDED.nombre_archivo,
             mime_type=EXCLUDED.mime_type, tamano_bytes=EXCLUDED.tamano_bytes,
             actualizado_en=CURRENT_TIMESTAMP RETURNING id`,
          [actividadId, titulo, r2Key ? `r2://${r2Key}` : null,
           req.file ? path.basename(req.file.originalname.replaceAll("\\", "/")).replace(/[\x00-\x1f\x7f]/g, "").slice(0, 255) : null,
           req.file ? "application/pdf" : null, req.file?.size ?? null]
        );
        if (editing) await client.query("DELETE FROM criterios_rubrica WHERE rubrica_id=$1", [result.rows[0].id]);
        for (const [index, criterion] of criteria.entries()) {
          await client.query(
            "INSERT INTO criterios_rubrica (rubrica_id,nombre,descripcion,puntaje_maximo,orden) VALUES ($1,$2,$3,$4,$5)",
            [result.rows[0].id, criterion.nombre.trim(), criterion.descripcion?.trim() ?? "", criterion.puntaje_maximo, index + 1]
          );
        }
      } else if (editing) {
        await client.query("DELETE FROM rubricas WHERE actividad_id=$1", [actividadId]);
      }
      await client.query("COMMIT");
      saved = true;
      let aviso: string | undefined;
      if (previousPath?.startsWith("r2://")) {
        try {
          const used = await client.query(
            `SELECT EXISTS (
               SELECT 1 FROM rubricas WHERE BTRIM(ruta_archivo)=$1
               UNION ALL SELECT 1 FROM contenidos_curso WHERE BTRIM(ruta_archivo)=$1
               UNION ALL SELECT 1 FROM archivos_entrega_actividad WHERE BTRIM(ruta_archivo)=$1
               UNION ALL SELECT 1 FROM adjuntos_chat WHERE BTRIM(ruta_archivo)=$1
               UNION ALL SELECT 1 FROM certificados WHERE BTRIM(ruta_archivo)=$1
               UNION ALL SELECT 1 FROM sesiones_clase WHERE BTRIM(ruta_grabacion)=$1
             ) AS compartido`, [previousPath]
          );
          if (!used.rows[0].compartido) await deleteObjectFromR2(previousPath.slice(5));
        } catch (error) {
          console.error("No se pudo limpiar la rúbrica anterior:", error);
          aviso = "Actividad guardada. No se pudo eliminar el PDF anterior de Cloudflare; queda pendiente su limpieza.";
        }
      }
      return res.status(editing ? 200 : 201).json({ contenidoId: savedContentId, actividadId, ...(aviso ? { aviso } : {}) });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof ActivityInputError || error instanceof multer.MulterError) {
      return res.status(400).json({ message: error instanceof ActivityInputError ? error.message : "Adjunta un único PDF de hasta 200 MB con la configuración de la actividad." });
    }
    if ((error as { code?: string }).code === "42703") {
      return res.status(503).json({ message: "Falta ejecutar backend/migrations/rubricas-pdf.sql en PostgreSQL." });
    }
    console.error("Error creando actividad:", error);
    return res.status(500).json({ message: "No se pudo guardar la actividad." });
  } finally {
    if (r2Key && !saved) await deleteObjectFromR2(r2Key).catch(error => console.error("No se pudo limpiar el PDF de rúbrica:", error));
    if (req.file?.path) await unlink(req.file.path).catch(error => { if (error.code !== "ENOENT") console.error("No se pudo limpiar el archivo temporal:", error); });
  }
}
