import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const recibirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("Selecciona una imagen JPG, PNG o WebP."));
      return;
    }

    callback(null, true);
  },
}).single("foto");

export function recibirFotoPerfil(req: Request, res: Response, next: NextFunction) {
  recibirFoto(req, res, (error: unknown) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "La foto no debe superar los 5 MB."
          : "Selecciona una sola imagen JPG, PNG o WebP de hasta 5 MB.";

      res.status(400).json({ message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Selecciona una foto." });
      return;
    }

    next();
  });
}
