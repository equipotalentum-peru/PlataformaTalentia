import type { Response } from "express";
import multer from "multer";
import path from "node:path";
import { Readable } from "node:stream";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  createCourseContentKey,
  deleteObjectFromR2,
  uploadStreamToR2,
} from "../services/r2.service";

const MAX_FILE_BYTES = 200 * 1024 * 1024;
const FORMAT_MESSAGE = "Formato no permitido. Usa PDF, DOCX, PPTX o MP4.";
const MISMATCH_MESSAGE = "El archivo no corresponde al formato seleccionado.";

const formats: Record<string, { tipo: string; mime: string }> = {
  ".mp4": { tipo: "video", mime: "video/mp4" },
  ".pdf": { tipo: "pdf", mime: "application/pdf" },
  ".docx": {
    tipo: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  ".pptx": {
    tipo: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
};

class UploadValidationError extends Error {}

type R2UploadedFile = Express.Multer.File & { r2Key?: string };

function cleanFileName(rawName: string) {
  return path
    .basename(rawName.replaceAll("\\", "/"))
    .replace(/[\x00-\x1f\x7f]/g, "")
    .slice(0, 255);
}

function hasValidSignature(extension: string, header: Buffer) {
  if (extension === ".mp4") {
    return header.length >= 12 && header.toString("ascii", 4, 8) === "ftyp";
  }

  if (extension === ".pdf") {
    return header.toString("ascii", 0, 5) === "%PDF-";
  }

  // .docx y .pptx son archivos ZIP
  return (
    header.length >= 4 &&
    header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  );
}

/**
 * Motor de almacenamiento de multer que envía el archivo directo a Cloudflare R2
 * mientras llega. No se escribe nada en el disco del servidor.
 * También valida la firma del archivo (primeros bytes) y el tamaño máximo.
 */
const r2Storage: multer.StorageEngine = {
  _handleFile(req, file, callback) {
    const courseId = Number(req.params.cursoId);
    const moduleId = Number(req.params.moduloId);
    const originalName = cleanFileName(file.originalname);
    const extension = path.extname(originalName).toLowerCase();
    const format = formats[extension];

    if (!format) {
      file.stream.resume();
      return callback(new UploadValidationError(FORMAT_MESSAGE));
    }

    const key = createCourseContentKey({ courseId, moduleId, originalName });
    let totalBytes = 0;

    async function* validatedChunks() {
      let header = Buffer.alloc(0);
      let signatureChecked = false;

      for await (const chunk of file.stream as AsyncIterable<Buffer>) {
        totalBytes += chunk.length;

        if (totalBytes > MAX_FILE_BYTES) {
          throw new UploadValidationError("El archivo supera los 200 MB.");
        }

        if (!signatureChecked) {
          header = Buffer.concat([header, chunk]);

          if (header.length >= 12) {
            if (!hasValidSignature(extension, header)) {
              throw new UploadValidationError(MISMATCH_MESSAGE);
            }

            signatureChecked = true;
          }
        }

        yield chunk;
      }

      // Archivos de menos de 12 bytes
      if (!signatureChecked && !hasValidSignature(extension, header)) {
        throw new UploadValidationError(MISMATCH_MESSAGE);
      }
    }

    uploadStreamToR2({
      body: Readable.from(validatedChunks(), { objectMode: false }),
      key,
      contentType: format.mime,
      originalName,
    })
      .then(() => {
        const info: Partial<R2UploadedFile> = {
          size: totalBytes,
          r2Key: key,
          originalname: originalName,
        };

        callback(null, info);
      })
      .catch((error) => {
        file.stream.resume(); // evita que la petición quede colgada
        callback(error);
      });
  },

  _removeFile(_req, file, callback) {
    const key = (file as R2UploadedFile).r2Key;

    if (!key) {
      return callback(null);
    }

    deleteObjectFromR2(key)
      .then(() => callback(null))
      .catch((error) => callback(error));
  },
};

const receive = multer({
  storage: r2Storage,
  defParamCharset: "utf8", // respeta tildes y ñ en el nombre del archivo
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!formats[extension]) {
      return callback(new UploadValidationError(FORMAT_MESSAGE));
    }

    callback(null, true);
  },
}).single("archivo");

const accessQuery = `
  SELECT mc.id
  FROM modulos_curso mc
  JOIN cursos c
    ON c.id = mc.curso_id
  WHERE mc.id = $1
    AND c.id = $2
    AND mc.activo = TRUE
    AND c.estado = 'Activo'
    AND EXISTS (
      SELECT 1
      FROM ofertas_curso oc
      JOIN usuarios u
        ON u.id = oc.docente_id
      WHERE oc.curso_id = c.id
        AND u.id = $3
        AND u.rol = 'Docente'
        AND u.activo = TRUE
        AND oc.estado <> 'Cancelado'
    )`;

export async function subirArchivoContenido(
  req: AuthenticatedRequest,
  res: Response
) {
  const ids = [
    Number(req.params.moduloId),
    Number(req.params.cursoId),
    Number(req.userId),
  ];

  if (!ids.every((id) => Number.isSafeInteger(id) && id > 0)) {
    return res.status(400).json({ message: "Solicitud no válida." });
  }

  let r2Key: string | undefined;
  let saved = false;

  try {
    const access = await pool.query(accessQuery, ids);

    if (!access.rowCount) {
      return res.status(403).json({
        message: "No puedes subir archivos a este módulo.",
      });
    }

    // El archivo viaja directo a Cloudflare R2 durante este paso.
    await new Promise<void>((resolve, reject) =>
      receive(req, res, (error) => (error ? reject(error) : resolve()))
    );

    const file = req.file as R2UploadedFile | undefined;
    r2Key = file?.r2Key;

    if (!file || !r2Key) {
      return res.status(400).json({ message: "Selecciona un archivo." });
    }

    const originalName = file.originalname;
    const extension = path.extname(originalName).toLowerCase();
    const format = formats[extension];

    const title =
      originalName.slice(0, -extension.length).trim().slice(0, 200) ||
      "Archivo";

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const lockedAccess = await client.query(
        `${accessQuery} FOR UPDATE OF mc`,
        ids
      );

      if (!lockedAccess.rowCount) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          message: "No puedes subir archivos a este módulo.",
        });
      }

      const result = await client.query(
        `
          INSERT INTO contenidos_curso (
            modulo_id,
            titulo,
            tipo,
            nombre_archivo,
            ruta_archivo,
            mime_type,
            tamano_bytes,
            orden,
            estado,
            creado_por
          )
          SELECT
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            COALESCE(MAX(orden), 0) + 1,
            'Borrador',
            $8
          FROM contenidos_curso
          WHERE modulo_id = $1
          RETURNING
            id,
            modulo_id,
            titulo,
            tipo,
            orden,
            estado,
            ruta_archivo,
            nombre_archivo,
            mime_type,
            tamano_bytes
        `,
        [
          ids[0],
          title,
          format.tipo,
          originalName,
          `r2://${r2Key}`,
          format.mime,
          file.size,
          ids[2],
        ]
      );

      await client.query("COMMIT");
      saved = true;

      return res.status(201).json({ contenido: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        message: "Sube un solo archivo PDF, DOCX, PPTX o MP4 de hasta 200 MB.",
      });
    }

    console.error("Error subiendo contenido a Cloudflare R2:", error);

    return res.status(500).json({
      message:
        "No se pudo guardar el archivo en Cloudflare R2. Inténtalo nuevamente.",
    });
  } finally {
    // Si el archivo llegó a R2 pero no se pudo registrar en PostgreSQL,
    // se elimina para no dejar archivos huérfanos.
    if (r2Key && !saved) {
      await deleteObjectFromR2(r2Key).catch((cleanupError) => {
        console.error(
          "No se pudo eliminar de R2 el archivo huérfano:",
          cleanupError
        );
      });
    }
  }
}
