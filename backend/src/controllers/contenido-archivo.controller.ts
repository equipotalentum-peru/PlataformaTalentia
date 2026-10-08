import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  getObjectFromR2,
  isR2NotFoundError,
  isR2Path,
  streamBodyToResponse,
  stripR2Prefix,
} from "../services/r2.service";

export async function obtenerArchivoContenido(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const cursoId = Number(req.params.cursoId);
    const contenidoId = Number(req.params.contenidoId);
    const usuarioId = Number(req.userId);

    if (
      ![cursoId, contenidoId, usuarioId].every(
        (id) => Number.isSafeInteger(id) && id > 0
      )
    ) {
      return res.status(400).json({ message: "Solicitud no válida." });
    }

    const result = await pool.query(
      `
        SELECT
          cc.ruta_archivo,
          cc.nombre_archivo,
          cc.mime_type,
          cc.tamano_bytes
        FROM contenidos_curso cc
        JOIN modulos_curso mc
          ON mc.id = cc.modulo_id
        JOIN cursos c
          ON c.id = mc.curso_id
        WHERE cc.id = $1
          AND c.id = $2
          AND mc.activo = TRUE
          AND c.estado = 'Activo'
          AND cc.tipo IN ('pdf', 'pptx', 'docx', 'video')
          AND EXISTS (
            SELECT 1
            FROM ofertas_curso oc
            JOIN usuarios u
              ON u.id = $3
            WHERE oc.curso_id = c.id
              AND u.activo = TRUE
              AND (
                (
                  u.rol = 'Docente'
                  AND oc.docente_id = u.id
                  AND oc.estado <> 'Cancelado'
                  AND cc.estado IN ('Publicado', 'Borrador')
                )
                OR
                (
                  u.rol = 'Estudiante'
                  AND cc.estado = 'Publicado'
                  AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
                  AND oc.publicado = TRUE
                  AND EXISTS (
                    SELECT 1
                    FROM matriculas m
                    WHERE m.oferta_curso_id = oc.id
                      AND m.estudiante_id = u.id
                      AND m.estado IN ('Activa', 'Completada')
                  )
                )
              )
          )
      `,
      [contenidoId, cursoId, usuarioId]
    );

    const row = result.rows[0];

    const ruta =
      typeof row?.ruta_archivo === "string" ? row.ruta_archivo.trim() : "";

    if (!ruta) {
      return res.status(404).json({ message: "Archivo no disponible." });
    }

    // Todo el contenido vive en Cloudflare R2. Una ruta que no empiece con
    // "r2://" es un registro antiguo que aún no se migró (ver
    // scripts/migrar-materiales-a-r2.ts).
    if (!isR2Path(ruta)) {
      console.warn(
        `Contenido ${contenidoId} apunta a una ruta local sin migrar: "${ruta}"`
      );

      return res.status(404).json({
        message:
          "Este archivo todavía no está disponible en la nube. Avisa al administrador.",
      });
    }

    const key = stripR2Prefix(ruta);

    if (!key) {
      return res.status(404).json({ message: "Archivo no disponible." });
    }

    let object;

    try {
      object = await getObjectFromR2(key);
    } catch (error) {
      if (isR2NotFoundError(error)) {
        return res.status(404).json({
          message: "Archivo no disponible en Cloudflare R2.",
        });
      }

      throw error;
    }

    if (!object.Body) {
      return res.status(404).json({
        message: "Archivo no disponible en Cloudflare R2.",
      });
    }

    const mimeType =
      typeof row.mime_type === "string" && row.mime_type.trim()
        ? row.mime_type
        : "application/octet-stream";

    const fileName =
      typeof row.nombre_archivo === "string" && row.nombre_archivo.trim()
        ? row.nombre_archivo
        : "archivo";

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", object.ContentType ?? mimeType);

    const contentLength =
      object.ContentLength ??
      (row.tamano_bytes === null || row.tamano_bytes === undefined
        ? undefined
        : Number(row.tamano_bytes));

    if (Number.isFinite(contentLength)) {
      res.setHeader("Content-Length", String(contentLength));
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );

    streamBodyToResponse(object.Body, res);
  } catch (error) {
    console.error("Error entregando contenido:", error);

    if (!res.headersSent) {
      return res.status(500).json({ message: "No se pudo abrir el archivo." });
    }
  }
}
