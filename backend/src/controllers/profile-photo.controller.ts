import type { Response } from "express";
import sharp from "sharp";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function uploadProfilePhoto(req: AuthenticatedRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "Selecciona una foto." });
  }

  let foto: Buffer;

  try {
    const imagen = sharp(req.file.buffer, {
      limitInputPixels: 25_000_000,
      animated: false,
    });
    const metadata = await imagen.metadata();

    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
      return res.status(400).json({ message: "Selecciona una imagen JPG, PNG o WebP." });
    }

    foto = await imagen
      .rotate()
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer();
  } catch {
    return res.status(400).json({
      message: "La imagen no es válida o supera las dimensiones permitidas.",
    });
  }

  try {
    const result = await pool.query<{ version: string }>(
      `UPDATE users
       SET foto_perfil = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING EXTRACT(EPOCH FROM updated_at)::text AS version`,
      [foto, req.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "No se encontró el perfil." });
    }

    return res.status(200).json({
      message: "Foto actualizada correctamente.",
      fotoPerfil: `/api/profile/photo?v=${result.rows[0].version}`,
    });
  } catch (error) {
    console.error("Error al guardar foto de perfil:", error);
    return res.status(500).json({ message: "No se pudo guardar la foto." });
  }
}

export async function deleteProfilePhoto(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await pool.query(
      `UPDATE users
       SET foto_perfil = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [req.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "No se encontró el perfil." });
    }

    return res.status(200).json({
      message: "Foto eliminada correctamente.",
      fotoPerfil: null,
    });
  } catch (error) {
    console.error("Error al eliminar foto de perfil:", error);
    return res.status(500).json({ message: "No se pudo eliminar la foto." });
  }
}

export async function getProfilePhoto(req: AuthenticatedRequest, res: Response) {
  res.setHeader("Cache-Control", "private, no-store");

  try {
    const result = await pool.query<{
      foto_perfil: Buffer | null;
    }>(
      "SELECT foto_perfil FROM users WHERE id = $1",
      [req.userId]
    );
    const perfil = result.rows[0];

    if (!perfil?.foto_perfil) {
      return res.status(404).json({ message: "No hay foto de perfil." });
    }

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(perfil.foto_perfil);
  } catch (error) {
    console.error("Error al obtener foto de perfil:", error);
    return res.status(500).json({ message: "No se pudo cargar la foto." });
  }
}
