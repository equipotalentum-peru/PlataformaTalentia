import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";


const PROMEDIOS_MATRICULA_CTE = `
  WITH promedios_matricula AS (
    SELECT
      m.id AS matricula_id,
      m.estudiante_id,
      m.estado,

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

    LEFT JOIN componentes_calificacion comp
      ON comp.oferta_curso_id = oc.id

    LEFT JOIN calificaciones cal
      ON cal.componente_id = comp.id
     AND cal.matricula_id = m.id

    WHERE oc.estado <> 'Cancelado'
      AND m.estado <> 'Cancelada'

    GROUP BY
      m.id,
      m.estudiante_id,
      m.estado
  )
`;


export async function obtenerDashboardAdministrador(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const administradorId =
      Number(req.userId);


    if (
      !Number.isInteger(
        administradorId
      ) ||
      administradorId <= 0
    ) {
      return res.status(401).json({
        message:
          "Sesión no válida.",
      });
    }


    const usuarioResult =
      await pool.query(
        `SELECT
           id,
           rol
         FROM usuarios
         WHERE id = $1
           AND activo = TRUE
         LIMIT 1`,
        [
          administradorId,
        ]
      );


    if (
      !usuarioResult.rowCount
    ) {
      return res.status(401).json({
        message:
          "Usuario no encontrado o inactivo.",
      });
    }


    if (
      usuarioResult.rows[0]
        .rol !==
      "Administrador"
    ) {
      return res.status(403).json({
        message:
          "Este recurso es exclusivo para administradores.",
      });
    }


    const [
      clasificacionResult,
      matriculasMesResult,
      destacadosResult,
      continuidadResult,
    ] =
      await Promise.all([
        /*
         * =============================
         * DISTRIBUCIÓN ACADÉMICA
         * =============================
         */
        pool.query(
          `${PROMEDIOS_MATRICULA_CTE},

           alumnos AS (
             SELECT
               u.id AS estudiante_id,

               BOOL_OR(
                 pm.estado = 'Activa'
               ) AS tiene_activa,

               BOOL_OR(
                 pm.estado = 'Completada'
               ) AS tiene_completada,

               AVG(pm.promedio)
               FILTER (
                 WHERE pm.promedio
                   IS NOT NULL
               ) AS promedio_general

             FROM usuarios u

             INNER JOIN promedios_matricula pm
               ON pm.estudiante_id = u.id

             WHERE u.rol = 'Estudiante'

             GROUP BY u.id
           ),

           clasificados AS (
             SELECT
               estudiante_id,
               promedio_general,

               CASE

                 WHEN tiene_activa
                  AND promedio_general
                    IS NOT NULL
                  AND promedio_general < 14
                 THEN 'En riesgo'

                 WHEN tiene_activa
                 THEN 'En progreso'

                 WHEN tiene_completada
                  AND promedio_general
                    IS NOT NULL
                  AND promedio_general < 14
                 THEN 'Desaprobado'

                 WHEN tiene_completada
                  AND promedio_general
                    IS NOT NULL
                  AND promedio_general >= 14
                 THEN 'Aprobado'

                 ELSE 'Pendiente'

               END AS estado_academico

             FROM alumnos
           )

           SELECT

             COUNT(*)::INTEGER
               AS total_estudiantes,

             COUNT(*)
             FILTER (
               WHERE estado_academico =
                 'En progreso'
             )::INTEGER
               AS en_progreso,

             COUNT(*)
             FILTER (
               WHERE estado_academico =
                 'Aprobado'
             )::INTEGER
               AS aprobados,

             COUNT(*)
             FILTER (
               WHERE estado_academico =
                 'Desaprobado'
             )::INTEGER
               AS desaprobados,

             COUNT(*)
             FILTER (
               WHERE estado_academico =
                 'En riesgo'
             )::INTEGER
               AS en_riesgo,

             COUNT(*)
             FILTER (
               WHERE estado_academico =
                 'Pendiente'
             )::INTEGER
               AS pendientes

           FROM clasificados`
        ),


        /*
         * =============================
         * MATRÍCULAS ÚLTIMOS 6 MESES
         * =============================
         */
        pool.query(
          `WITH meses AS (
             SELECT
               generate_series(
                 date_trunc(
                   'month',
                   CURRENT_DATE
                 )
                 - INTERVAL '5 months',

                 date_trunc(
                   'month',
                   CURRENT_DATE
                 ),

                 INTERVAL '1 month'
               ) AS mes
           )

           SELECT

             TO_CHAR(
               meses.mes,
               'YYYY-MM-DD'
             ) AS mes,

             COUNT(m.id)::INTEGER
               AS cantidad

           FROM meses

           LEFT JOIN matriculas m
             ON m.matriculado_en >=
                  meses.mes
            AND m.matriculado_en <
                  meses.mes
                  + INTERVAL '1 month'

           GROUP BY meses.mes

           ORDER BY
             meses.mes ASC`
        ),


        /*
         * =============================
         * TOP 4 ALUMNOS
         * =============================
         */
        pool.query(
          `${PROMEDIOS_MATRICULA_CTE}

           SELECT

             u.id
               AS estudiante_id,

             u.nombres AS nombre,

             ROUND(
               AVG(pm.promedio),
               2
             ) AS promedio

           FROM promedios_matricula pm

           INNER JOIN usuarios u
             ON u.id =
                pm.estudiante_id

           WHERE pm.promedio IS NOT NULL

  AND pm.promedio >= 14

  AND pm.estado IN (
    'Activa',
    'Completada'
  )

  AND u.rol = 'Estudiante'

           GROUP BY
             u.id,
             u.nombres

           ORDER BY
             promedio DESC,
             nombre ASC

           LIMIT 3`
        ),


        /*
         * =============================
         * CURSOS BAJA CONTINUIDAD
         * =============================
         */
        pool.query(
          `SELECT

             c.id
               AS curso_id,

             c.codigo,
             c.nombre,

             COUNT(m.id)
             FILTER (
               WHERE m.estado IN (
                 'Activa',
                 'Completada',
                 'Retirada',
                 'Cancelada'
               )
             )::INTEGER
               AS total_matriculas,

             COUNT(m.id)
             FILTER (
               WHERE m.estado IN (
                 'Activa',
                 'Completada'
               )
             )::INTEGER
               AS continuan,

             COALESCE(
               ROUND(
                 100.0
                 *
                 COUNT(m.id)
                 FILTER (
                   WHERE m.estado IN (
                     'Activa',
                     'Completada'
                   )
                 )
                 /
                 NULLIF(
                   COUNT(m.id)
                   FILTER (
                     WHERE m.estado IN (
                       'Activa',
                       'Completada',
                       'Retirada',
                       'Cancelada'
                     )
                   ),
                   0
                 )
               ),
               0
             )::INTEGER
               AS porcentaje

           FROM cursos c

           INNER JOIN ofertas_curso oc
             ON oc.curso_id = c.id
            AND oc.estado <>
                'Cancelado'

           LEFT JOIN matriculas m
             ON m.oferta_curso_id =
                oc.id

           WHERE c.estado =
             'Activo'

           GROUP BY
             c.id,
             c.codigo,
             c.nombre

           HAVING
             COUNT(m.id)
             FILTER (
               WHERE m.estado IN (
                 'Activa',
                 'Completada',
                 'Retirada',
                 'Cancelada'
               )
             ) > 0

           ORDER BY
             porcentaje ASC,
             total_matriculas DESC,
             c.nombre ASC

           LIMIT 3`
        ),
      ]);


    const clasificacion =
      clasificacionResult
        .rows[0] ??
      {};


    const aprobados =
      Number(
        clasificacion
          .aprobados ??
          0
      );


    const desaprobados =
      Number(
        clasificacion
          .desaprobados ??
          0
      );


    const enRiesgo =
      Number(
        clasificacion
          .en_riesgo ??
          0
      );


    /*
     * El donut únicamente representa:
     *
     * aprobados
     * desaprobados
     * en riesgo
     */
    const totalResultado =
      aprobados +
      desaprobados +
      enRiesgo;


    const obtenerPorcentaje = (
      cantidad: number
    ) => {
      if (
        totalResultado <= 0
      ) {
        return 0;
      }

      return Math.round(
        (
          cantidad *
          100
        ) /
          totalResultado
      );
    };


    return res.json({
      /*
       * DONUT
       */
      resumenAcademico: {
        total:
          totalResultado,

        aprobados: {
          cantidad:
            aprobados,

          porcentaje:
            obtenerPorcentaje(
              aprobados
            ),
        },

        desaprobados: {
          cantidad:
            desaprobados,

          porcentaje:
            obtenerPorcentaje(
              desaprobados
            ),
        },

        enRiesgo: {
          cantidad:
            enRiesgo,

          porcentaje:
            obtenerPorcentaje(
              enRiesgo
            ),
        },
      },


      /*
       * GRÁFICO MATRÍCULAS
       */
      matriculasUltimosMeses:
        matriculasMesResult
          .rows
          .map(
            (
              row
            ) => ({
              mes:
                String(
                  row.mes
                ),

              cantidad:
                Number(
                  row.cantidad ??
                    0
                ),
            })
          ),


      /*
       * TOP ALUMNOS
       */
      alumnosDestacados:
        destacadosResult
          .rows
          .map(
            (
              row
            ) => ({
              estudianteId:
                Number(
                  row.estudiante_id
                ),

              nombre:
                String(
                  row.nombre ??
                    ""
                ),

              promedio:
                Number(
                  row.promedio ??
                    0
                ),
            })
          ),


      /*
       * CONTINUIDAD
       */
      cursosBajaContinuidad:
        continuidadResult
          .rows
          .map(
            (
              row
            ) => ({
              cursoId:
                Number(
                  row.curso_id
                ),

              codigo:
                String(
                  row.codigo ??
                    ""
                ),

              nombre:
                String(
                  row.nombre ??
                    ""
                ),

              totalMatriculas:
                Number(
                  row.total_matriculas ??
                    0
                ),

              continuan:
                Number(
                  row.continuan ??
                    0
                ),

              porcentaje:
                Number(
                  row.porcentaje ??
                    0
                ),
            })
          ),


      /*
       * DISTRIBUCIÓN GENERAL
       */
      distribucionAcademica: {
        total:
          Number(
            clasificacion
              .total_estudiantes ??
              0
          ),

        enProgreso:
          Number(
            clasificacion
              .en_progreso ??
              0
          ),

        aprobados,

        desaprobados,

        enRiesgo,

        pendientes:
          Number(
            clasificacion
              .pendientes ??
              0
          ),
      },
    });

  } catch (error) {

    console.error(
      "Error al cargar dashboard administrativo:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "No se pudo cargar el dashboard administrativo.",
      });
  }
}
