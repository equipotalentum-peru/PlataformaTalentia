import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

import {
  emitirCertificadoCurso,
} from "../services/certificados.service";

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
      ROUND(
        100.0 * COUNT(DISTINCT cc.id) FILTER (
          WHERE pc.estado = 'Completado'
             OR pc.progreso >= 100
        )
        / NULLIF(
            COUNT(DISTINCT cc.id),
            0
          )
      )::INTEGER,
      0
    ) AS progreso

   FROM matriculas m

   INNER JOIN ofertas_curso oc
     ON oc.id = m.oferta_curso_id

   INNER JOIN cursos c
     ON c.id = oc.curso_id

   LEFT JOIN modulos_curso mc
     ON mc.curso_id = c.id
    AND mc.activo = TRUE

   LEFT JOIN contenidos_curso cc
     ON cc.modulo_id = mc.id
    AND cc.estado = 'Publicado'
    AND cc.obligatorio = TRUE

   LEFT JOIN progreso_contenido pc
     ON pc.matricula_id = m.id
    AND pc.contenido_id = cc.id

   WHERE m.estudiante_id = $1
     AND m.estado IN (
       'Activa',
       'Completada'
     )
     AND oc.estado IN (
       'Programado',
       'En curso',
       'Finalizado'
     )
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
  `WITH contexto AS (
     SELECT
       c.id,
       c.nombre,
       c.codigo,
       c.imagen_portada AS imagen,
       u.rol,

       CASE
         WHEN u.rol = 'Estudiante'
         THEN (
           SELECT m.id

           FROM matriculas m

           INNER JOIN ofertas_curso oc_m
             ON oc_m.id = m.oferta_curso_id

           WHERE oc_m.curso_id = c.id
             AND m.estudiante_id = u.id
             AND m.estado IN (
               'Activa',
               'Completada'
             )
             AND oc_m.publicado = TRUE
             AND oc_m.estado IN (
               'Programado',
               'En curso',
               'Finalizado'
             )

           ORDER BY m.id DESC
           LIMIT 1
         )

         ELSE NULL
       END AS matricula_id

     FROM cursos c

     INNER JOIN usuarios u
       ON u.id = $1

     WHERE c.id = $2
       AND c.estado = 'Activo'
       AND u.activo = TRUE

       AND (
         (
           u.rol = 'Docente'

           AND EXISTS (
             SELECT 1

             FROM ofertas_curso oc

             WHERE oc.curso_id = c.id
               AND oc.docente_id = u.id
               AND oc.estado <> 'Cancelado'
           )
         )

         OR

         (
           u.rol = 'Estudiante'

           AND EXISTS (
             SELECT 1

             FROM matriculas m

             INNER JOIN ofertas_curso oc
               ON oc.id = m.oferta_curso_id

             WHERE oc.curso_id = c.id
               AND m.estudiante_id = u.id
               AND m.estado IN (
                 'Activa',
                 'Completada'
               )
               AND oc.publicado = TRUE
               AND oc.estado IN (
                 'Programado',
                 'En curso',
                 'Finalizado'
               )
           )
         )
       )

     LIMIT 1
   )

   SELECT
     contexto.*,

     CASE
       WHEN contexto.rol = 'Estudiante'
       THEN COALESCE(
         (
           SELECT
             ROUND(
               100.0 *
               COUNT(cc.id) FILTER (
                 WHERE pc.estado = 'Completado'
                    OR pc.progreso >= 100
               )
               /
               NULLIF(
                 COUNT(cc.id),
                 0
               )
             )::INTEGER

           FROM modulos_curso mc

           INNER JOIN contenidos_curso cc
             ON cc.modulo_id = mc.id
            AND cc.estado = 'Publicado'
            AND cc.obligatorio = TRUE

           LEFT JOIN progreso_contenido pc
             ON pc.matricula_id = contexto.matricula_id
            AND pc.contenido_id = cc.id

           WHERE mc.curso_id = contexto.id
             AND mc.activo = TRUE
         ),
         0
       )

       ELSE 0
     END AS progreso

   FROM contexto`,
  [estudianteId, cursoId]
);

if (!accesoResult.rowCount) {
  return res.status(403).json({
    message: "No tienes acceso a este curso.",
  });
}

const rol =
  accesoResult.rows[0].rol;

const matriculaId =
  accesoResult.rows[0].matricula_id === null
    ? null
    : Number(
        accesoResult.rows[0].matricula_id
      );

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
             'urlEnlace', cc.url_enlace,
             'estado', cc.estado,

             'completado',
             COALESCE(
               pc.estado = 'Completado'
               OR pc.progreso >= 100,
               FALSE
             )
           )
           ORDER BY
             cc.orden,
             cc.id
         )

         FROM contenidos_curso cc

         LEFT JOIN progreso_contenido pc
           ON pc.matricula_id = $3
          AND pc.contenido_id = cc.id

         WHERE cc.modulo_id = mc.id

           AND (
             cc.estado = 'Publicado'
             OR (
               $2 = 'Docente'
               AND cc.estado = 'Borrador'
             )
           )
       ),
       '[]'::json
     ) AS contenidos

   FROM modulos_curso mc

   WHERE mc.curso_id = $1
     AND mc.activo = TRUE
     

   ORDER BY
     mc.orden,
     mc.id`,
  [
    cursoId,
    rol,
    matriculaId,
  ]
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

/**
 * GET /api/cursos/docente/mis-cursos
 * Cursos cuya oferta tiene asignado al docente autenticado.
 */

export async function completarContenidoEstudiante(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId =
      Number(req.userId);

    const cursoId =
      Number(req.params.cursoId);

    const contenidoId =
      Number(req.params.contenidoId);

    if (
      !Number.isInteger(estudianteId) ||
      estudianteId <= 0 ||
      !Number.isInteger(cursoId) ||
      cursoId <= 0 ||
      !Number.isInteger(contenidoId) ||
      contenidoId <= 0
    ) {
      return res.status(400).json({
        message:
          "Datos de progreso no válidos.",
      });
    }

    const accesoResult =
      await pool.query(
        `SELECT
           m.id AS matricula_id

         FROM matriculas m

         INNER JOIN ofertas_curso oc
           ON oc.id =
              m.oferta_curso_id

         INNER JOIN usuarios u
           ON u.id =
              m.estudiante_id

         INNER JOIN modulos_curso mc
           ON mc.curso_id =
              oc.curso_id
          AND mc.activo = TRUE

         INNER JOIN contenidos_curso cc
           ON cc.modulo_id = mc.id
          AND cc.estado = 'Publicado'

         WHERE m.estudiante_id = $1
           AND oc.curso_id = $2
           AND cc.id = $3
           AND u.rol = 'Estudiante'
           AND m.estado IN (
             'Activa',
             'Completada'
           )
           AND oc.publicado = TRUE

         LIMIT 1`,
        [
          estudianteId,
          cursoId,
          contenidoId,
        ]
      );

    if (!accesoResult.rowCount) {
      return res.status(403).json({
        message:
          "No tienes acceso a este contenido.",
      });
    }

    const matriculaId =
      Number(
        accesoResult.rows[0]
          .matricula_id
      );

    await pool.query(
      `INSERT INTO progreso_contenido (
         matricula_id,
         contenido_id,
         estado,
         progreso,
         ultimo_acceso_en,
         completado_en
       )
       VALUES (
         $1,
         $2,
         'Completado',
         100,
         NOW(),
         NOW()
       )

       ON CONFLICT (
         matricula_id,
         contenido_id
       )

       DO UPDATE SET
         estado = 'Completado',
         progreso = 100,
         ultimo_acceso_en = NOW(),
         completado_en = COALESCE(
           progreso_contenido.completado_en,
           NOW()
         )`,
      [
        matriculaId,
        contenidoId,
      ]
    );

    const progresoResult =
      await pool.query(
        `SELECT
           COUNT(cc.id)::INTEGER
             AS total,

           COUNT(cc.id)
           FILTER (
             WHERE
               pc.estado = 'Completado'
               OR pc.progreso >= 100
           )::INTEGER
             AS completados

         FROM modulos_curso mc

         INNER JOIN contenidos_curso cc
           ON cc.modulo_id = mc.id
          AND cc.estado = 'Publicado'
          AND cc.obligatorio = TRUE

         LEFT JOIN progreso_contenido pc
           ON pc.matricula_id = $1
          AND pc.contenido_id = cc.id

         WHERE mc.curso_id = $2
           AND mc.activo = TRUE`,
        [
          matriculaId,
          cursoId,
        ]
      );

    const total =
      Number(
        progresoResult.rows[0]
          ?.total ?? 0
      );

    const completados =
      Number(
        progresoResult.rows[0]
          ?.completados ?? 0
      );

    const progreso =
      total > 0
        ? Math.round(
            (
              completados /
              total
            ) * 100
          )
        : 0;

    /*
     * Esto además nos deja preparada
     * la lógica para Certificados.
     */
    if (progreso >= 100) {
      await pool.query(
        `UPDATE matriculas

         SET estado = 'Completada',
             completado_en =
               COALESCE(
                 completado_en,
                 NOW()
               )

         WHERE id = $1`,
        [matriculaId]
      );

      try {
    await emitirCertificadoCurso(
      matriculaId
    );
  } catch (error) {
    console.error(
      "El curso llegó al 100%, pero no se pudo emitir el certificado:",
      error
    );
  }
    }

    return res
      .status(200)
      .json({
        contenidoId,
        progreso,
        completado: true,

        cursoCompletado:
          progreso >= 100,
      });

  } catch (error) {
    console.error(
      "Error guardando progreso del contenido:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo guardar el progreso.",
    });
  }
}

export async function obtenerMisCursosDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const docenteId = Number(req.userId);

    if (!Number.isInteger(docenteId) || docenteId <= 0) {
      return res.status(401).json({
        message: "Sesión no válida.",
      });
    }

    const usuarioResult = await pool.query(
      `SELECT id, rol
       FROM usuarios
       WHERE id = $1 AND activo = TRUE
       LIMIT 1`,
      [docenteId]
    );

    if (!usuarioResult.rowCount) {
      return res.status(401).json({
        message: "Usuario no encontrado o inactivo.",
      });
    }

    if (usuarioResult.rows[0].rol !== "Docente") {
      return res.status(403).json({
        message: "Este recurso es exclusivo para docentes.",
      });
    }

    const result = await pool.query(
      `SELECT DISTINCT ON (c.id)
         c.id,
         c.nombre,
         c.codigo,
         c.imagen_portada AS imagen,
         (
           SELECT COUNT(*)::INTEGER
           FROM matriculas m
           WHERE m.oferta_curso_id = oc.id
             AND m.estado IN ('Activa', 'Completada')
         ) AS alumnos
       FROM ofertas_curso oc
       INNER JOIN cursos c ON c.id = oc.curso_id
       WHERE oc.docente_id = $1
         AND oc.estado <> 'Cancelado'
         AND c.estado = 'Activo'
       ORDER BY c.id, oc.actualizado_en DESC, oc.id DESC`,
      [docenteId]
    );

    return res.status(200).json({
      cursos: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo cursos del docente:", error);

    return res.status(500).json({
      message: "No se pudieron obtener los cursos del docente.",
    });
  }
}
