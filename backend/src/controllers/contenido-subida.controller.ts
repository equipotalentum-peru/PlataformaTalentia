import type { Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, open, copyFile, unlink } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

const formats: Record<string, { tipo: string; mime: string }> = {
  ".pdf": { tipo: "pdf", mime: "application/pdf" },
  ".docx": { tipo: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ".pptx": { tipo: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
};
const receive = multer({
  dest: tmpdir(), limits: { fileSize: 200 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter: (_req, file, callback) => {
    if (!formats[path.extname(file.originalname).toLowerCase()]) return callback(new Error("Formato no permitido. Usa PDF, DOCX o PPTX."));
    callback(null, true);
  },
}).single("archivo");

const accessQuery = `SELECT mc.id FROM modulos_curso mc JOIN cursos c ON c.id = mc.curso_id
  WHERE mc.id = $1 AND c.id = $2 AND mc.activo = TRUE AND c.estado = 'Activo'
  AND EXISTS (SELECT 1 FROM ofertas_curso oc JOIN usuarios u ON u.id = oc.docente_id
    WHERE oc.curso_id = c.id AND u.id = $3 AND u.rol = 'Docente' AND u.activo = TRUE
      AND oc.estado <> 'Cancelado')`;

export async function subirArchivoContenido(req: AuthenticatedRequest, res: Response) {
  const ids = [Number(req.params.moduloId), Number(req.params.cursoId), Number(req.userId)];
  if (!ids.every(id => Number.isSafeInteger(id) && id > 0)) return res.status(400).json({ message: "Solicitud no válida." });
  let temporary: string | undefined;
  let saved: string | undefined;
  let committed = false;
  try {
    const access = await pool.query(accessQuery, ids);
    if (!access.rowCount) return res.status(403).json({ message: "No puedes subir archivos a este módulo." });
    await new Promise<void>((resolve, reject) => receive(req, res, error => error ? reject(error) : resolve()));
    temporary = req.file?.path;
    if (!req.file || !temporary) return res.status(400).json({ message: "Selecciona un archivo." });
    const extension = path.extname(req.file.originalname).toLowerCase();
    const format = formats[extension];
    const handle = await open(temporary, "r");
    const header = Buffer.alloc(5);
    try { await handle.read(header, 0, 5, 0); } finally { await handle.close(); }
    const valid = extension === ".pdf" ? header.toString() === "%PDF-" : header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    if (!valid) return res.status(400).json({ message: "El archivo no corresponde al formato seleccionado." });
    const originalName = path.basename(req.file.originalname.replaceAll("\\", "/")).replace(/[\x00-\x1f\x7f]/g, "").slice(0, 255);
    const title = originalName.slice(0, -extension.length).trim().slice(0, 200) || "Archivo";
    const directory = path.resolve(__dirname, "../../materiales/subidos");
    await mkdir(directory, { recursive: true });
    const storedName = `${randomUUID()}${extension}`;
    saved = path.join(directory, storedName);
    await copyFile(temporary, saved, constants.COPYFILE_EXCL);
    await unlink(temporary);
    temporary = undefined;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const access = await client.query(`${accessQuery} FOR UPDATE OF mc`, ids);
      if (!access.rowCount) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "No puedes subir archivos a este módulo." });
      }
      const result = await client.query(
        `INSERT INTO contenidos_curso (modulo_id, titulo, tipo, nombre_archivo, ruta_archivo, mime_type, tamano_bytes, orden, estado)
         SELECT $1, $2, $3, $4, $5, $6, $7, COALESCE(MAX(orden), 0) + 1, 'Borrador'
         FROM contenidos_curso WHERE modulo_id = $1
         RETURNING id, modulo_id, titulo, tipo, orden, estado, ruta_archivo`,
        [ids[0], title, format.tipo, originalName, `subidos/${storedName}`, format.mime, req.file.size]
      );
      await client.query("COMMIT");
      committed = true;
      return res.status(201).json({ contenido: result.rows[0] });
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  } catch (error) {
    if (error instanceof multer.MulterError || (error instanceof Error && error.message.startsWith("Formato no permitido"))) {
      return res.status(400).json({ message: "Sube un solo archivo PDF, DOCX o PPTX de hasta 200 MB." });
    }
    console.error("Error subiendo contenido:", error);
    return res.status(500).json({ message: "No se pudo guardar el archivo. Inténtalo nuevamente." });
  } finally {
    if (temporary) await unlink(temporary).catch(() => undefined);
    if (saved && !committed) await unlink(saved).catch(() => undefined);
  }
}
