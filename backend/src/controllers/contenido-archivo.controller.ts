import type { Response } from "express";
import { realpath } from "node:fs/promises";
import path from "node:path";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function obtenerArchivoContenido(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const cursoId = Number(req.params.cursoId);
    const contenidoId = Number(req.params.contenidoId);
    const estudianteId = Number(req.userId);

    if (![cursoId, contenidoId, estudianteId].every(
      (id) => Number.isSafeInteger(id) && id > 0
    )) {
      return res.status(400).json({ message: "Solicitud no válida." });
    }

    const result = await pool.query(
      `SELECT cc.ruta_archivo
       FROM contenidos_curso cc
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       JOIN cursos c ON c.id = mc.curso_id
       WHERE cc.id = $1 AND c.id = $2
         AND mc.activo = TRUE
         AND c.estado = 'Activo' AND cc.tipo IN ('pdf', 'pptx', 'docx', 'video')
         AND EXISTS (
           SELECT 1 FROM ofertas_curso oc
           JOIN usuarios u ON u.id = $3
           WHERE oc.curso_id = c.id AND u.activo = TRUE
             AND (
               (u.rol = 'Docente' AND oc.docente_id = u.id
                AND oc.estado <> 'Cancelado' AND cc.estado IN ('Publicado', 'Borrador'))
               OR
               (u.rol = 'Estudiante' AND cc.estado = 'Publicado'
                AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
                AND oc.publicado = TRUE AND EXISTS (
                  SELECT 1 FROM matriculas m WHERE m.oferta_curso_id = oc.id
                    AND m.estudiante_id = u.id AND m.estado IN ('Activa', 'Completada')
                ))
             )
         )`,
      [contenidoId, cursoId, estudianteId]
    );

    const ruta = result.rows[0]?.ruta_archivo;
    if (typeof ruta !== "string" || !ruta.trim()) {
      return res.status(404).json({ message: "Archivo no disponible." });
    }

    const raiz = await realpath(path.resolve(__dirname, "../../materiales"));
    const archivo = await realpath(path.resolve(raiz, ruta));
    const relativa = path.relative(raiz, archivo);
    if (relativa.startsWith("..") || path.isAbsolute(relativa)) {
      return res.status(403).json({ message: "Ruta no permitida." });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(archivo, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({ message: "No se pudo entregar el archivo." });
      }
    });
  } catch (error) {
    console.error("Error entregando contenido:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "No se pudo abrir el archivo." });
    }
  }
}
