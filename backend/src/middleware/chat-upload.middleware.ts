import multer from "multer";
import type { ErrorRequestHandler } from "express";

const MAX_TAMANO_ARCHIVO = 50 * 1024 * 1024;

const storage = multer.memoryStorage();

export const recibirAdjuntoChat = multer({
  storage,
  limits: {
    fileSize: MAX_TAMANO_ARCHIVO,
    files: 1,
  },
});

export const manejarErrorSubidaChat: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {
  if (error instanceof Error && error.name === "MulterError") {
    const errorMulter = error as Error & {
      code?: string;
    };

    if (errorMulter.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "El archivo supera el límite permitido de 50 MB.",
      });
    }

    return res.status(400).json({
      message: "No se pudo procesar el archivo adjunto.",
    });
  }

  return next(error);
};
