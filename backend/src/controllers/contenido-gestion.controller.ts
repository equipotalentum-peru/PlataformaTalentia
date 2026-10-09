import type { Response } from "express";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { deleteObjectFromR2, isR2Path, stripR2Prefix } from "../services/r2.service";

export async function gestionarContenido(req: AuthenticatedRequest, res: Response) {
  const courseId = Number(req.params.cursoId);
  const contentId = Number(req.params.contenidoId);
  if (![courseId, contentId].every(id => Number.isSafeInteger(id) && id > 0)) return res.status(400).json({ message: "Solicitud no válida." });
  const deleting = req.method === "DELETE";
  const title = req.body?.titulo;
  const state = deleting ? "Oculto" : req.body?.estado;
  if (!deleting && title === undefined && state === undefined) return res.status(400).json({ message: "No hay cambios para guardar." });
  if (title !== undefined && (typeof title !== "string" || !title.trim() || title.trim().length > 200)) return res.status(400).json({ message: "Escribe un título de hasta 200 caracteres." });
  if (!deleting && state !== undefined && !["Borrador", "Publicado"].includes(state)) return res.status(400).json({ message: "Estado no válido." });
  try {
    if (deleting) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const abort = async (status: number, message: string) => {
          await client.query("ROLLBACK");
          return res.status(status).json({ message });
        };

        const found = await client.query(
          `SELECT cc.id, cc.titulo, cc.estado, cc.tipo, cc.ruta_archivo,
             EXISTS (
               SELECT 1 FROM contenidos_curso otro
               WHERE otro.id <> cc.id
                 AND BTRIM(otro.ruta_archivo) = BTRIM(cc.ruta_archivo)
             ) AS compartido,
             (
               EXISTS (SELECT 1 FROM actividades WHERE contenido_id = cc.id)
               OR EXISTS (SELECT 1 FROM evaluaciones WHERE contenido_id = cc.id)
             ) AS vinculado
           FROM contenidos_curso cc
           JOIN modulos_curso mc ON mc.id = cc.modulo_id
           JOIN cursos c ON c.id = mc.curso_id
           WHERE cc.id = $1 AND c.id = $2
             AND mc.activo = TRUE AND c.estado = 'Activo'
             AND EXISTS (
               SELECT 1 FROM ofertas_curso oc
               JOIN usuarios u ON u.id = oc.docente_id
               WHERE oc.curso_id = c.id AND u.id = $3
                 AND u.rol = 'Docente' AND u.activo = TRUE
                 AND oc.estado <> 'Cancelado'
             )
           FOR UPDATE OF cc`,
          [contentId, courseId, req.userId]
        );

        const content = found.rows[0];
        if (!content) return await abort(404, "Contenido no disponible o sin permiso.");

        if (["pdf", "pptx", "docx", "video"].includes(content.tipo)) {
          if (content.compartido || content.vinculado) {
            return await abort(409, "Este archivo tiene otros registros vinculados. No se eliminará.");
          }

          const ruta = String(content.ruta_archivo ?? "").trim();
          if (ruta && (!isR2Path(ruta) || !stripR2Prefix(ruta).trim())) {
            return await abort(409, "Este archivo tiene una ruta antigua o inválida.");
          }

          await client.query("DELETE FROM contenidos_curso WHERE id = $1", [contentId]);
          if (ruta) await deleteObjectFromR2(stripR2Prefix(ruta));
          await client.query("COMMIT");

          return res.json({ contenido: content, eliminadoDefinitivamente: true });
        }

        await client.query("ROLLBACK");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    }
    const result = await pool.query(
      `UPDATE contenidos_curso cc SET titulo = COALESCE($4, cc.titulo), estado = COALESCE($5, cc.estado), actualizado_en = CURRENT_TIMESTAMP
       FROM modulos_curso mc, cursos c
       WHERE cc.id = $1 AND cc.modulo_id = mc.id AND mc.curso_id = c.id AND c.id = $2
         AND mc.activo = TRUE AND c.estado = 'Activo' AND cc.estado <> 'Oculto'
         AND EXISTS (SELECT 1 FROM ofertas_curso oc JOIN usuarios u ON u.id = oc.docente_id
           WHERE oc.curso_id = c.id AND u.id = $3 AND u.rol = 'Docente' AND u.activo = TRUE AND oc.estado <> 'Cancelado')
       RETURNING cc.id, cc.titulo, cc.estado`,
      [contentId, courseId, req.userId, title === undefined ? null : title.trim(), state ?? null]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Contenido no disponible o sin permiso para modificarlo." });
    return res.json({ contenido: result.rows[0] });
  } catch (error) {
    console.error("Error gestionando contenido:", error);
    return res.status(500).json({ message: "No se pudo guardar el cambio." });
  }
}
