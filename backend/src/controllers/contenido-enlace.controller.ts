import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

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

/** Crea un enlace web como contenido persistente del módulo. */
export async function crearEnlaceContenido(
  req: AuthenticatedRequest,
  res: Response
) {
  const courseId = Number(req.params.cursoId);
  const moduleId = Number(req.params.moduloId);
  const userId = Number(req.userId);
  const rawTitle = req.body?.titulo;
  const rawUrl = req.body?.url;

  if (![courseId, moduleId, userId].every(
    (id) => Number.isSafeInteger(id) && id > 0
  )) {
    return res.status(400).json({ message: "Solicitud no válida." });
  }

  if (typeof rawTitle !== "string" || !rawTitle.trim() || rawTitle.trim().length > 200) {
    return res.status(400).json({
      message: "Escribe un título de hasta 200 caracteres.",
    });
  }

  if (typeof rawUrl !== "string" || !rawUrl.trim() || rawUrl.trim().length > 2048) {
    return res.status(400).json({ message: "Ingresa una URL válida de hasta 2048 caracteres." });
  }

  let url: string;
  try {
    const parsed = new URL(rawUrl.trim());
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.hostname) {
      return res.status(400).json({
        message: "La URL debe comenzar con http:// o https://.",
      });
    }
    url = parsed.toString();
  } catch {
    return res.status(400).json({
      message: "Ingresa una URL válida que comience con http:// o https://.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Bloqueamos el módulo durante la asignación del orden para evitar duplicados.
    const access = await client.query(
      `${accessQuery} FOR UPDATE OF mc`,
      [moduleId, courseId, userId]
    );

    if (!access.rowCount) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "No puedes agregar enlaces a este módulo.",
      });
    }

    const result = await client.query(
      `
        INSERT INTO contenidos_curso (
          modulo_id,
          titulo,
          tipo,
          url_enlace,
          orden,
          estado,
          creado_por
        )
        SELECT
          $1,
          $2,
          'enlace',
          $3,
          COALESCE(MAX(cc.orden), 0) + 1,
          'Borrador',
          $4
        FROM contenidos_curso cc
        WHERE cc.modulo_id = $1
        RETURNING
          id,
          modulo_id,
          titulo,
          tipo,
          url_enlace,
          orden,
          estado
      `,
      [moduleId, rawTitle.trim(), url, userId]
    );

    await client.query("COMMIT");
    return res.status(201).json({ contenido: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Error guardando enlace de contenido:", error);
    return res.status(500).json({
      message: "No se pudo guardar el enlace. Inténtalo nuevamente.",
    });
  } finally {
    client.release();
  }
}
