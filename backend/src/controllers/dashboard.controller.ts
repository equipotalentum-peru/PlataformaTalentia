import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function obtenerDashboardEstudiante(
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

    const [
      cursosResult,
      promedioResult,
      tareasResult,
      mensajesResult,
      eventosResult,
      anunciosResult,
    ] = await Promise.all([
      /*
       * ==========================================
       * CURSOS DEL ESTUDIANTE
       * ==========================================
       */
      pool.query(
  `SELECT
     c.id,
     c.nombre,
     c.codigo,
     c.imagen_portada AS imagen,

     COALESCE(
       ROUND(
         100.0 * COUNT(DISTINCT cc.id)
         FILTER (
           WHERE pc.estado = 'Completado'
              OR pc.progreso >= 100
         )
         /
         NULLIF(
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
),

      /*
       * ==========================================
       * PROMEDIO GENERAL
       * ==========================================
       */
      pool.query(
        `WITH promedios_curso AS (

           SELECT
             m.id AS matricula_id,

             CASE

               WHEN COUNT(cal.nota)
                 FILTER (
                   WHERE cal.nota IS NOT NULL
                 ) = 0
               THEN NULL

               WHEN COALESCE(
                 SUM(comp.porcentaje)
                 FILTER (
                   WHERE cal.nota IS NOT NULL
                     AND comp.porcentaje > 0
                 ),
                 0
               ) > 0

               THEN
                 SUM(
                   cal.nota * comp.porcentaje
                 )
                 FILTER (
                   WHERE cal.nota IS NOT NULL
                     AND comp.porcentaje > 0
                 )
                 /
                 NULLIF(
                   SUM(comp.porcentaje)
                   FILTER (
                     WHERE cal.nota IS NOT NULL
                       AND comp.porcentaje > 0
                   ),
                   0
                 )

               ELSE
                 AVG(cal.nota)
                 FILTER (
                   WHERE cal.nota IS NOT NULL
                 )

             END AS promedio

           FROM matriculas m

           INNER JOIN ofertas_curso oc
             ON oc.id = m.oferta_curso_id

           INNER JOIN cursos c
             ON c.id = oc.curso_id

           LEFT JOIN componentes_calificacion comp
             ON comp.oferta_curso_id = oc.id

           LEFT JOIN calificaciones cal
             ON cal.componente_id = comp.id
            AND cal.matricula_id = m.id

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

           GROUP BY m.id
         )

         SELECT
           ROUND(
             AVG(promedio),
             2
           ) AS promedio_general

         FROM promedios_curso

         WHERE promedio IS NOT NULL`,
        [estudianteId]
      ),

      /*
       * ==========================================
       * TAREAS PENDIENTES
       * ==========================================
       */
      pool.query(
        `SELECT
           COUNT(*)::INTEGER AS total

         FROM matriculas m

         INNER JOIN ofertas_curso oc
           ON oc.id = m.oferta_curso_id

         INNER JOIN cursos c
           ON c.id = oc.curso_id

         INNER JOIN modulos_curso mc
           ON mc.curso_id = c.id
          AND mc.activo = TRUE

         INNER JOIN contenidos_curso cc
           ON cc.modulo_id = mc.id
          AND cc.estado = 'Publicado'

         INNER JOIN actividades a
           ON a.contenido_id = cc.id
          AND a.estado = 'Publicada'

         WHERE m.estudiante_id = $1

           AND m.estado IN (
             'Activa',
             'Completada'
           )

           AND oc.publicado = TRUE

           AND NOT EXISTS (
             SELECT 1

             FROM entregas_actividades ea

             WHERE ea.actividad_id = a.id
               AND ea.matricula_id = m.id

               AND ea.estado IN (
                 'Entregada',
                 'Calificada'
               )
           )`,
        [estudianteId]
      ),

      /*
       * ==========================================
       * MENSAJES NO LEÍDOS
       * ==========================================
       */
      pool.query(
        `SELECT
           COUNT(msg.id)::INTEGER AS total

         FROM conversaciones_chat conv

         INNER JOIN mensajes_chat msg
           ON msg.conversacion_id = conv.id

         LEFT JOIN lecturas_chat lectura
           ON lectura.conversacion_id = conv.id
          AND lectura.usuario_id = $1

         WHERE (
           conv.usuario_1_id = $1
           OR conv.usuario_2_id = $1
         )

           AND msg.remitente_id <> $1

           AND msg.eliminado_en IS NULL

           AND msg.id >
             COALESCE(
               lectura.ultimo_mensaje_leido_id,
               0
             )`,
        [estudianteId]
      ),

      /*
       * ==========================================
       * PRÓXIMOS EVENTOS
       * ==========================================
       */
      pool.query(
        `SELECT *

         FROM (

           SELECT
             'Actividad'::TEXT AS tipo,
             cc.titulo,
             c.nombre AS curso,
             c.codigo,
             a.fecha_limite AS fecha

           FROM matriculas m

           INNER JOIN ofertas_curso oc
             ON oc.id = m.oferta_curso_id

           INNER JOIN cursos c
             ON c.id = oc.curso_id

           INNER JOIN modulos_curso mc
             ON mc.curso_id = c.id

           INNER JOIN contenidos_curso cc
             ON cc.modulo_id = mc.id

           INNER JOIN actividades a
             ON a.contenido_id = cc.id

           WHERE m.estudiante_id = $1

             AND m.estado IN (
               'Activa',
               'Completada'
             )

             AND oc.publicado = TRUE
             AND cc.estado = 'Publicado'
             AND a.estado = 'Publicada'

             AND a.fecha_limite IS NOT NULL
             AND a.fecha_limite >= NOW()

           UNION ALL

           SELECT
             'Evaluación'::TEXT AS tipo,
             cc.titulo,
             c.nombre AS curso,
             c.codigo,
             e.fecha_fin AS fecha

           FROM matriculas m

           INNER JOIN ofertas_curso oc
             ON oc.id = m.oferta_curso_id

           INNER JOIN cursos c
             ON c.id = oc.curso_id

           INNER JOIN modulos_curso mc
             ON mc.curso_id = c.id

           INNER JOIN contenidos_curso cc
             ON cc.modulo_id = mc.id

           INNER JOIN evaluaciones e
             ON e.contenido_id = cc.id

           WHERE m.estudiante_id = $1

             AND m.estado IN (
               'Activa',
               'Completada'
             )

             AND oc.publicado = TRUE
             AND cc.estado = 'Publicado'
             AND e.estado = 'Publicada'

             AND e.fecha_fin IS NOT NULL
             AND e.fecha_fin >= NOW()

         ) eventos

         ORDER BY fecha ASC

         LIMIT 3`,
        [estudianteId]
      ),

      /*
       * ==========================================
       * ANUNCIOS
       * ==========================================
       */
      pool.query(
       `SELECT
        a.id,
        c.id AS curso_id,
        c.codigo,
        a.titulo,

        COALESCE(
         a.publicado_en,
        a.creado_en
        )   AS fecha

         FROM matriculas m

         INNER JOIN ofertas_curso oc
           ON oc.id = m.oferta_curso_id

         INNER JOIN cursos c
           ON c.id = oc.curso_id

         INNER JOIN anuncios a
           ON a.oferta_curso_id = oc.id

         WHERE m.estudiante_id = $1

           AND m.estado IN (
             'Activa',
             'Completada'
           )

           AND oc.publicado = TRUE
           AND a.estado = 'Publicado'

         ORDER BY
           COALESCE(
             a.publicado_en,
             a.creado_en
           ) DESC

         LIMIT 2`,
        [estudianteId]
      ),
    ]);

    const promedioRaw =
      promedioResult.rows[0]
        ?.promedio_general;

    return res.status(200).json({
      resumen: {
        cursosInscritos:
          cursosResult.rows.length,

        tareasPendientes:
          Number(
            tareasResult.rows[0]
              ?.total ?? 0
          ),

        mensajesNoLeidos:
          Number(
            mensajesResult.rows[0]
              ?.total ?? 0
          ),

        promedioGeneral:
          promedioRaw === null ||
          promedioRaw === undefined
            ? null
            : Number(promedioRaw),
      },

      cursos:
        cursosResult.rows.map(
          (curso) => ({
            ...curso,

            id:
              Number(curso.id),

            progreso:
              Number(
                curso.progreso ?? 0
              ),
          })
        ),

      eventos:
        eventosResult.rows,

      anuncios:
        anunciosResult.rows,
    });

  } catch (error) {
    console.error(
      "Error obteniendo dashboard del estudiante:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo cargar el dashboard.",
    });
  }
}