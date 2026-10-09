import type { Response } from "express";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  deleteObjectFromR2,
  isR2Path,
  stripR2Prefix,
} from "../services/r2.service";

export async function crearModulo(req: AuthenticatedRequest, res: Response) {
  const courseId = Number(req.params.cursoId);
  const title = req.body?.titulo;
  if (!Number.isSafeInteger(courseId) || courseId <= 0 ||
  typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    return res.status(400).json({
    message: "Escribe un título de hasta 200 caracteres.",
  });
}
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const access = await client.query(
        `SELECT c.id FROM cursos c
        WHERE c.id = $1 AND c.estado = 'Activo'
        AND EXISTS (
        SELECT 1 FROM ofertas_curso oc JOIN usuarios u ON u.id = oc.docente_id
        WHERE oc.curso_id = c.id AND u.id = $2 AND u.rol = 'Docente'
        AND u.activo = TRUE AND oc.estado <> 'Cancelado'
        )
        FOR UPDATE OF c`,
        [courseId, req.userId]
      );
      if (!access.rowCount) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "No tienes permiso para crear módulos en este curso." });
      }
      const result = await client.query(
        `INSERT INTO modulos_curso (curso_id, numero, titulo, orden)
        SELECT $1, COALESCE(MAX(numero), 0) + 1,
        $2, COALESCE(MAX(orden), 0) + 1
        FROM modulos_curso WHERE curso_id = $1
        RETURNING id, numero, titulo`,
        [courseId, title.trim()]
);
      await client.query("COMMIT");
      return res.status(201).json({ modulo: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creando módulo:", error);
    return res.status(500).json({ message: "No se pudo guardar el módulo." });
  }
}

export async function eliminarModulo(req: AuthenticatedRequest, res: Response) {
  const courseId = Number(req.params.cursoId), moduleId = Number(req.params.moduloId);
  if (![courseId, moduleId].every(id => Number.isSafeInteger(id) && id > 0)) {
    return res.status(400).json({ message: "Solicitud no válida." });
  }
  let files: string[] = [], sharedFiles = 0;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const found = await client.query(
        `SELECT mc.id FROM modulos_curso mc JOIN cursos c ON c.id = mc.curso_id
         WHERE mc.id = $1 AND c.id = $2 AND mc.activo = TRUE AND c.estado = 'Activo'
         AND EXISTS (
           SELECT 1 FROM ofertas_curso oc JOIN usuarios u ON u.id = oc.docente_id
           WHERE oc.curso_id = c.id AND u.id = $3 AND u.rol = 'Docente'
           AND u.activo = TRUE AND oc.estado <> 'Cancelado'
         ) FOR UPDATE OF c, mc`, [moduleId, courseId, req.userId]
      );
      if (!found.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Módulo no disponible o sin permiso." });
      }
      await client.query("SELECT id FROM contenidos_curso WHERE modulo_id = $1 FOR UPDATE", [moduleId]);
      const paths = await client.query<{ ruta_archivo: string; compartido: boolean }>(
        `WITH archivos AS (
           SELECT BTRIM(ruta_archivo) AS ruta FROM contenidos_curso WHERE modulo_id = $1
           UNION SELECT BTRIM(ae.ruta_archivo) FROM archivos_entrega_actividad ae
           JOIN entregas_actividades ea ON ea.id = ae.entrega_id
           JOIN actividades a ON a.id = ea.actividad_id
           JOIN contenidos_curso cc ON cc.id = a.contenido_id WHERE cc.modulo_id = $1
         ) SELECT ruta AS ruta_archivo, (
           EXISTS (SELECT 1 FROM contenidos_curso WHERE modulo_id <> $1 AND BTRIM(ruta_archivo) = ruta)
           OR EXISTS (SELECT 1 FROM archivos_entrega_actividad ae
             JOIN entregas_actividades ea ON ea.id = ae.entrega_id
             JOIN actividades a ON a.id = ea.actividad_id
             JOIN contenidos_curso cc ON cc.id = a.contenido_id
             WHERE cc.modulo_id <> $1 AND BTRIM(ae.ruta_archivo) = ruta)
           OR EXISTS (SELECT 1 FROM adjuntos_chat WHERE BTRIM(ruta_archivo) = ruta)
           OR EXISTS (SELECT 1 FROM certificados WHERE BTRIM(ruta_archivo) = ruta)
           OR EXISTS (SELECT 1 FROM sesiones_clase WHERE BTRIM(ruta_grabacion) = ruta)
         ) AS compartido FROM archivos WHERE ruta IS NOT NULL AND ruta <> ''`, [moduleId]
      );
      files = paths.rows.filter(file => !file.compartido).map(file => file.ruta_archivo);
      sharedFiles = paths.rows.filter(file => file.compartido).length;
      await client.query(
        `DELETE FROM componentes_calificacion WHERE actividad_id IN (
           SELECT a.id FROM actividades a JOIN contenidos_curso cc ON cc.id = a.contenido_id WHERE cc.modulo_id = $1
         ) OR evaluacion_id IN (
           SELECT e.id FROM evaluaciones e JOIN contenidos_curso cc ON cc.id = e.contenido_id WHERE cc.modulo_id = $1
         )`, [moduleId]
      );
      await client.query("DELETE FROM modulos_curso WHERE id = $1", [moduleId]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error eliminando módulo:", error);
    return res.status(500).json({ message: "No se pudo eliminar el módulo de la base de datos." });
  }
  const pending: string[] = [];
  for (const file of files) {
    if (!isR2Path(file) || !stripR2Prefix(file).trim()) {
      pending.push(file);
      continue;
    }
    try {
      await deleteObjectFromR2(stripR2Prefix(file));
    } catch {
      pending.push(file);
    }
  }
  const notices: string[] = [];
  if (pending.length) notices.push(`Quedaron ${pending.length} archivos sin eliminar. Requieren limpieza manual.`);
  if (sharedFiles) notices.push(`Se conservaron ${sharedFiles} archivos asociados a otros registros.`);
  return res.json({
    moduloId: moduleId,
    message: notices.length
      ? "Módulo y contenidos eliminados de PostgreSQL. " + notices.join(" ")
      : "Módulo, contenidos y archivos eliminados.",
    archivosPendientes: pending,
    archivosCompartidos: sharedFiles,
  });
}