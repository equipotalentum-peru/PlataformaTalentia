import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function obtenerMisCursos(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId = Number(req.userId);

    if (!Number.isInteger(estudianteId) || estudianteId <= 0) {
      return res.status(401).json({
        message: "Sesión no válida.",
      });
    }

    const usuarioResult = await pool.query(
      `SELECT id, rol
       FROM usuarios
       WHERE id = $1
       LIMIT 1`,
      [estudianteId]
    );

    if (!usuarioResult.rowCount) {
      return res.status(401).json({
        message: "Usuario no encontrado.",
      });
    }

    if (usuarioResult.rows[0].rol !== "Estudiante") {
      return res.status(403).json({
        message: "Este recurso es exclusivo para estudiantes.",
      });
    }

    const result = await pool.query(
      `SELECT
        c.id,
        c.nombre,
        c.codigo,
        c.imagen_portada AS imagen,
        COALESCE(
          ROUND(AVG(pc.progreso))::INTEGER,
          0
        ) AS progreso
       FROM matriculas m
       INNER JOIN ofertas_curso oc
         ON oc.id = m.oferta_curso_id
       INNER JOIN cursos c
         ON c.id = oc.curso_id
       LEFT JOIN progreso_contenido pc
         ON pc.matricula_id = m.id
       WHERE m.estudiante_id = $1
         AND m.estado IN ('Activa', 'Completada')
         AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
         AND oc.publicado = TRUE
         AND c.estado = 'Activo'
       GROUP BY
         c.id,
         c.nombre,
         c.codigo,
         c.imagen_portada
       ORDER BY c.id`,
      [estudianteId]
    );

    return res.status(200).json({
      cursos: result.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo cursos del estudiante:",
      error
    );

    return res.status(500).json({
      message: "No se pudieron obtener los cursos.",
    });
  }
}


export async function obtenerModulosCurso(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId = Number(req.userId);
    const cursoId = Number(req.params.cursoId);

    if (!Number.isInteger(estudianteId) || estudianteId <= 0) {
      return res.status(401).json({
        message: "Sesión no válida.",
      });
    }

    if (!Number.isInteger(cursoId) || cursoId <= 0) {
      return res.status(400).json({
        message: "Curso no válido.",
      });
    }

    const accesoResult = await pool.query(
      `SELECT
        c.id,
        c.nombre,
        c.codigo,
        c.imagen_portada AS imagen
       FROM matriculas m
       INNER JOIN ofertas_curso oc
         ON oc.id = m.oferta_curso_id
       INNER JOIN cursos c
         ON c.id = oc.curso_id
       INNER JOIN usuarios u
         ON u.id = m.estudiante_id
       WHERE m.estudiante_id = $1
         AND c.id = $2
         AND u.rol = 'Estudiante'
         AND m.estado IN ('Activa', 'Completada')
         AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
         AND oc.publicado = TRUE
         AND c.estado = 'Activo'
       LIMIT 1`,
      [estudianteId, cursoId]
    );

    if (!accesoResult.rowCount) {
      return res.status(403).json({
        message: "No estás matriculado en este curso.",
      });
    }

const modulosResult = await pool.query(
  `SELECT
     mc.id,
     mc.numero,
     mc.titulo,
     mc.descripcion,
     mc.orden,
     COALESCE(
       (
         SELECT json_agg(
           json_build_object(
             'id', cc.id,
             'titulo', cc.titulo,
             'tipo', cc.tipo,
             'descripcion', cc.descripcion,
             'orden', cc.orden,
             'rutaArchivo', cc.ruta_archivo,
             'urlEnlace', cc.url_enlace
           )
           ORDER BY cc.orden, cc.id
         )
         FROM contenidos_curso cc
         WHERE cc.modulo_id = mc.id
           AND cc.estado = 'Publicado'
       ),
       '[]'::json
     ) AS contenidos
   FROM modulos_curso mc
   WHERE mc.curso_id = $1
     AND mc.activo = TRUE
   ORDER BY mc.orden, mc.id`,
  [cursoId]
);

    return res.status(200).json({
      curso: accesoResult.rows[0],
      modulos: modulosResult.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo módulos del curso:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener los módulos del curso.",
    });
  }
}