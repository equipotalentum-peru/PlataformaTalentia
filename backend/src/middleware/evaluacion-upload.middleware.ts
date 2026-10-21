import type { NextFunction, Response } from "express";
import multer from "multer";
import path from "node:path";
import { tmpdir } from "node:os";
import { unlink } from "node:fs/promises";
import type { AuthenticatedRequest } from "./auth.middleware";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 20;

export const formatosArchivoEvaluacion: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
};

const parser = multer({
  dest: tmpdir(),
  defParamCharset: "utf8",
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: MAX_FILES,
    fields: 1,
    fieldSize: 2 * 1024 * 1024,
    parts: MAX_FILES + 1,
    fieldNameSize: 100,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!formatosArchivoEvaluacion[extension]) {
      return callback(new Error("Formato no permitido. Adjunta un documento PDF, Office, TXT, CSV, ZIP o una imagen JPG/PNG."));
    }
    callback(null, true);
  },
}).any();

function archivosRecibidos(req: AuthenticatedRequest): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : [];
}

/** Recibe los archivos en temporal; el controlador solo los sube a R2
 * después de comprobar que cada archivo pertenece a una pregunta habilitada. */
export function recibirArchivosEvaluacion(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  parser(req, res, (error: unknown) => {
    if (!error) return next();

    const files = archivosRecibidos(req);
    void Promise.all(
      files.map((file) => unlink(file.path).catch(() => undefined))
    ).finally(() => {
      if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE"
          ? "Cada archivo debe pesar como máximo 100 MB."
          : "La solicitud supera el límite de archivos o campos permitidos.";
        return res.status(400).json({ message });
      }
      return res.status(400).json({
        message: error instanceof Error ? error.message : "No se pudieron recibir los archivos.",
      });
    });
  });
}
