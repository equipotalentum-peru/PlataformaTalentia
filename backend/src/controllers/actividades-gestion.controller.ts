import type { Response } from "express";
import multer from "multer";
import path from "node:path";
import { tmpdir } from "node:os";
import { open, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { deleteObjectFromR2, uploadFileToR2 } from "../services/r2.service";

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

export async function crearActividad(req: AuthenticatedRequest, res: Response) {
  const courseId = Number(req.params.cursoId);
  const moduleId = Number(req.params.moduloId);
  const ids = [moduleId, courseId, Number(req.userId)];
  if (!ids.every(id => Number.isSafeInteger(id) && id > 0)) {
    return res.status(400).json({ message: "Parámetros no válidos." });
  }
  let r2Key: string | undefined;
  let saved = false;
  try {
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
  if (b.estado === "Publicado" && fecha && Date.parse(fecha) <= Date.now()) {
    throw new ActivityInputError("La fecha de entrega debe ser posterior a la fecha actual.");
  }
  const rubric = b.rubrica ?? null;
  const criteria: Criterion[] = rubric?.tipo === "criterios" && Array.isArray(rubric.criterios) ? rubric.criterios : [];
  if (rubric !== null && (typeof rubric !== "object" || Array.isArray(rubric) || !["pdf", "criterios"].includes(rubric.tipo))) throw new ActivityInputError("Tipo de rúbrica no válido.");
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
      if (rubric) {
        const result = await client.query(
          `INSERT INTO rubricas (actividad_id, titulo, ruta_archivo, nombre_archivo, mime_type, tamano_bytes)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [actividad.rows[0].id, titulo, r2Key ? `r2://${r2Key}` : null,
           req.file ? path.basename(req.file.originalname.replaceAll("\\", "/")).replace(/[\x00-\x1f\x7f]/g, "").slice(0, 255) : null,
           req.file ? "application/pdf" : null, req.file?.size ?? null]
        );
        for (const [index, criterion] of criteria.entries()) {
          await client.query(
            "INSERT INTO criterios_rubrica (rubrica_id,nombre,descripcion,puntaje_maximo,orden) VALUES ($1,$2,$3,$4,$5)",
            [result.rows[0].id, criterion.nombre.trim(), criterion.descripcion?.trim() ?? "", criterion.puntaje_maximo, index + 1]
          );
        }
      }
      await client.query("COMMIT");
      saved = true;
      return res.status(201).json({ contenidoId: contenido.rows[0].id, actividadId: actividad.rows[0].id });
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
