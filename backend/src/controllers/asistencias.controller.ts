import type { Response } from "express";

import pool from "../config/database";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";


type EstadoAsistencia =
  | "Presente"
  | "Falta";


function validarId(
  value: unknown
) {
  const id = Number(value);

  return Number.isSafeInteger(id) &&
    id > 0
    ? id
    : null;
}


/* =========================================================
   VERIFICAR QUE EL CURSO PERTENECE AL DOCENTE
========================================================= */

async function obtenerOfertaDocente(
  docenteId: number,
  cursoId: number
) {
  const result =
    await pool.query(
      `
      SELECT
        oc.id AS oferta_curso_id

      FROM ofertas_curso oc

      INNER JOIN cursos c
        ON c.id = oc.curso_id

      INNER JOIN usuarios d
        ON d.id = oc.docente_id

      WHERE oc.docente_id = $1
        AND c.id = $2

        AND d.rol = 'Docente'
        AND d.activo = TRUE

        AND c.estado = 'Activo'

        AND oc.estado <> 'Cancelado'

      ORDER BY
        oc.actualizado_en DESC,
        oc.id DESC

      LIMIT 1
      `,
      [
        docenteId,
        cursoId,
      ]
    );

  return result.rows[0] ?? null;
}


/* =========================================================
   DOCENTE: OBTENER ASISTENCIA
========================================================= */

export async function obtenerAsistenciaDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  try {

    const docenteId =
      validarId(req.userId);

    const cursoId =
      validarId(
        req.params.cursoId
      );


    if (
      !docenteId ||
      !cursoId
    ) {
      return res
        .status(400)
        .json({
          message:
            "Solicitud no válida.",
        });
    }


    /*
     * Verificar que el docente
     * realmente dicta este curso.
     */
    const acceso =
      await obtenerOfertaDocente(
        docenteId,
        cursoId
      );


    if (!acceso) {
      return res
        .status(403)
        .json({
          message:
            "No tienes permiso para gestionar la asistencia de este curso.",
        });
    }


    const ofertaCursoId =
      Number(
        acceso.oferta_curso_id
      );


    /*
     * IMPORTANTE:
     *
     * Para cualquier combinación
     * sesión + alumno que todavía
     * no tenga asistencia registrada,
     * se crea automáticamente
     * como PRESENTE.
     *
     * ON CONFLICT DO NOTHING evita
     * sobreescribir las X ya guardadas.
     */
    await pool.query(
      `
      INSERT INTO asistencias (
        sesion_clase_id,
        matricula_id,
        estado
      )

      SELECT
        sc.id,
        m.id,
        'Presente'

      FROM sesiones_clase sc

      INNER JOIN matriculas m
        ON m.oferta_curso_id =
           sc.oferta_curso_id

      INNER JOIN usuarios e
        ON e.id =
           m.estudiante_id

      WHERE sc.oferta_curso_id = $1

        AND sc.estado <>
            'Cancelada'

        AND m.estado IN (
          'Activa',
          'Completada'
        )

        AND e.rol =
            'Estudiante'

        AND e.activo = TRUE

      ON CONFLICT (
        sesion_clase_id,
        matricula_id
      )
      DO NOTHING
      `,
      [
        ofertaCursoId,
      ]
    );


    /*
     * SESIONES DEL CURSO
     */
    const sesionesResult =
      await pool.query(
        `
        SELECT
          sc.id,
          sc.numero_sesion,
          sc.tema,
          sc.inicia_en

        FROM sesiones_clase sc

        WHERE sc.oferta_curso_id = $1

          AND sc.estado <>
              'Cancelada'

        ORDER BY
          sc.numero_sesion ASC,
          sc.inicia_en ASC,
          sc.id ASC
        `,
        [
          ofertaCursoId,
        ]
      );


    /*
     * ALUMNOS MATRICULADOS
     */
    const estudiantesResult =
      await pool.query(
        `
        SELECT
          m.id AS matricula_id,

          e.id AS estudiante_id,

          TRIM(
            CONCAT_WS(
              ' ',
              e.nombres,
              e.apellidos
            )
          ) AS nombre

        FROM matriculas m

        INNER JOIN usuarios e
          ON e.id =
             m.estudiante_id

        WHERE m.oferta_curso_id = $1

          AND m.estado IN (
            'Activa',
            'Completada'
          )

          AND e.rol =
              'Estudiante'

          AND e.activo = TRUE

        ORDER BY
          e.apellidos ASC,
          e.nombres ASC,
          m.id ASC
        `,
        [
          ofertaCursoId,
        ]
      );


    /*
     * ASISTENCIAS GUARDADAS
     */
    const asistenciasResult =
      await pool.query(
        `
        SELECT
          a.sesion_clase_id,
          a.matricula_id,
          a.estado

        FROM asistencias a

        INNER JOIN sesiones_clase sc
          ON sc.id =
             a.sesion_clase_id

        INNER JOIN matriculas m
          ON m.id =
             a.matricula_id

        WHERE sc.oferta_curso_id = $1

          AND m.oferta_curso_id = $1

          AND sc.estado <>
              'Cancelada'

          AND m.estado IN (
            'Activa',
            'Completada'
          )
        `,
        [
          ofertaCursoId,
        ]
      );


    /*
     * MAPA:
     * matriculaId:sesionId
     */
    const estados =
      new Map<
        string,
        EstadoAsistencia
      >();


    for (
      const row
      of asistenciasResult.rows
    ) {

      estados.set(
        `${row.matricula_id}:${row.sesion_clase_id}`,
        row.estado as EstadoAsistencia
      );

    }


    const sesiones =
      sesionesResult.rows.map(
        (row) => ({
          id:
            Number(row.id),

          numero:
            Number(
              row.numero_sesion
            ),

          tema:
            row.tema,

          iniciaEn:
            row.inicia_en,
        })
      );


    const estudiantes =
      estudiantesResult.rows.map(
        (row) => {

          const matriculaId =
            Number(
              row.matricula_id
            );


          return {
            matriculaId,

            estudianteId:
              Number(
                row.estudiante_id
              ),

            nombre:
              row.nombre,

            asistencias:
              sesiones.map(
                (sesion) => ({
                  sesionClaseId:
                    sesion.id,

                  estado:
                    estados.get(
                      `${matriculaId}:${sesion.id}`
                    ) ??
                    "Presente",
                })
              ),
          };

        }
      );


    return res
      .status(200)
      .json({
        sesiones,
        estudiantes,
      });

  } catch (error) {

    console.error(
      "Error obteniendo asistencia:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "No se pudo obtener la asistencia.",
      });

  }
}


/* =========================================================
   DOCENTE: GUARDAR ASISTENCIA
========================================================= */

export async function guardarAsistenciaDocente(
  req: AuthenticatedRequest,
  res: Response
) {

  const client =
    await pool.connect();


  try {

    const docenteId =
      validarId(req.userId);

    const cursoId =
      validarId(
        req.params.cursoId
      );


    if (
      !docenteId ||
      !cursoId
    ) {
      return res
        .status(400)
        .json({
          message:
            "Solicitud no válida.",
        });
    }


    const acceso =
      await obtenerOfertaDocente(
        docenteId,
        cursoId
      );


    if (!acceso) {
      return res
        .status(403)
        .json({
          message:
            "No tienes permiso para modificar la asistencia de este curso.",
        });
    }


    const registrosRaw =
      Array.isArray(
        req.body?.registros
      )
        ? req.body.registros
        : [];


    if (
      registrosRaw.length === 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "No hay registros de asistencia para guardar.",
        });
    }


    /*
     * Validar y eliminar
     * posibles duplicados.
     */
    const registros =
      new Map<
        string,
        {
          sesion_clase_id:
            number;

          matricula_id:
            number;

          estado:
            EstadoAsistencia;
        }
      >();


    for (
      const item
      of registrosRaw
    ) {

      const sesionClaseId =
        validarId(
          item?.sesionClaseId
        );

      const matriculaId =
        validarId(
          item?.matriculaId
        );

      const estado =
        item?.estado;


      if (
        !sesionClaseId ||
        !matriculaId ||
        ![
          "Presente",
          "Falta",
        ].includes(
          estado
        )
      ) {

        return res
          .status(400)
          .json({
            message:
              "Existe un registro de asistencia no válido.",
          });

      }


      registros.set(
        `${sesionClaseId}:${matriculaId}`,
        {
          sesion_clase_id:
            sesionClaseId,

          matricula_id:
            matriculaId,

          estado:
            estado as EstadoAsistencia,
        }
      );

    }


    const datos =
      Array.from(
        registros.values()
      );


    const ofertaCursoId =
      Number(
        acceso.oferta_curso_id
      );


    await client.query(
      "BEGIN"
    );


    /*
     * Se guardan todos los cambios
     * en una sola operación SQL.
     *
     * Además se vuelve a comprobar
     * que sesión y matrícula
     * pertenezcan realmente
     * a la oferta del docente.
     */
    const result =
      await client.query(
        `
        WITH datos AS (

          SELECT *

          FROM jsonb_to_recordset(
            $1::jsonb
          ) AS x(
            sesion_clase_id BIGINT,
            matricula_id BIGINT,
            estado VARCHAR(20)
          )

        )

        INSERT INTO asistencias (
          sesion_clase_id,
          matricula_id,
          estado,
          marcado_en
        )

        SELECT
          d.sesion_clase_id,
          d.matricula_id,
          d.estado,
          CURRENT_TIMESTAMP

        FROM datos d

        INNER JOIN sesiones_clase sc
          ON sc.id =
             d.sesion_clase_id

         AND sc.oferta_curso_id =
             $2

         AND sc.estado <>
             'Cancelada'

        INNER JOIN matriculas m
          ON m.id =
             d.matricula_id

         AND m.oferta_curso_id =
             $2

         AND m.estado IN (
           'Activa',
           'Completada'
         )

        WHERE d.estado IN (
          'Presente',
          'Falta'
        )

        ON CONFLICT (
          sesion_clase_id,
          matricula_id
        )

        DO UPDATE SET
          estado =
            EXCLUDED.estado,

          marcado_en =
            CURRENT_TIMESTAMP

        RETURNING
          sesion_clase_id,
          matricula_id,
          estado
        `,
        [
          JSON.stringify(
            datos
          ),

          ofertaCursoId,
        ]
      );


    if (
      Number(
        result.rowCount ?? 0
      ) !== datos.length
    ) {

      await client.query(
        "ROLLBACK"
      );

      return res
        .status(400)
        .json({
          message:
            "Algunos registros no pertenecen a este curso.",
        });

    }


    await client.query(
      "COMMIT"
    );


    return res
      .status(200)
      .json({
        message:
          "Asistencia guardada correctamente.",
      });

  } catch (error) {

    await client
      .query("ROLLBACK")
      .catch(() => undefined);


    console.error(
      "Error guardando asistencia:",
      error
    );


    return res
      .status(500)
      .json({
        message:
          "No se pudo guardar la asistencia.",
      });

  } finally {

    client.release();

  }
}