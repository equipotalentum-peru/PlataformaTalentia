import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type ComponenteFila = {
  id: number;
  nombre: string;
  tipo: string;
  porcentaje: string | number | null;
  puntaje_maximo: string | number | null;
  nota: string | number | null;
  retroalimentacion: string | null;
  calificado_en: string | null;
};

function calcularPromedio(
  componentes: ComponenteFila[]
) {
  const calificados = componentes.filter(
    (componente) =>
      componente.nota !== null
  );

  if (calificados.length === 0) {
    return null;
  }

  const conPeso = calificados.filter(
    (componente) =>
      Number(
        componente.porcentaje ?? 0
      ) > 0
  );

  if (conPeso.length > 0) {
    const pesoTotal =
      conPeso.reduce(
        (total, componente) =>
          total +
          Number(
            componente.porcentaje ?? 0
          ),
        0
      );

    if (pesoTotal > 0) {
      const sumaPonderada =
        conPeso.reduce(
          (total, componente) =>
            total +
            Number(componente.nota) *
              Number(
                componente.porcentaje ?? 0
              ),
          0
        );

      return Number(
        (
          sumaPonderada / pesoTotal
        ).toFixed(2)
      );
    }
  }

  const suma =
    calificados.reduce(
      (total, componente) =>
        total +
        Number(componente.nota),
      0
    );

  return Number(
    (
      suma /
      calificados.length
    ).toFixed(2)
  );
}

export async function obtenerMisCalificaciones(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId =
      Number(req.userId);

    if (
      !Number.isInteger(
        estudianteId
      ) ||
      estudianteId <= 0
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
         LIMIT 1`,
        [estudianteId]
      );

    if (
      !usuarioResult.rowCount
    ) {
      return res.status(401).json({
        message:
          "Usuario no encontrado.",
      });
    }

    if (
      usuarioResult.rows[0].rol !==
      "Estudiante"
    ) {
      return res.status(403).json({
        message:
          "Este recurso es exclusivo para estudiantes.",
      });
    }

    const cursosResult =
      await pool.query(
        `SELECT
          m.id AS matricula_id,
          m.estado AS estado_matricula,

          c.id AS curso_id,
          c.nombre,
          c.codigo,
          c.imagen_portada AS imagen,

          COALESCE(
            json_agg(
              json_build_object(
                'id',
                comp.id,

                'nombre',
                comp.nombre,

                'tipo',
                comp.tipo,

                'porcentaje',
                comp.porcentaje,

                'puntaje_maximo',
                comp.puntaje_maximo,

                'nota',
                cal.nota,

                'retroalimentacion',
                cal.retroalimentacion,

                'calificado_en',
                cal.calificado_en
              )
              ORDER BY comp.id
            )
            FILTER (
              WHERE comp.id
              IS NOT NULL
            ),
            '[]'::json
          ) AS componentes

         FROM matriculas m

         INNER JOIN ofertas_curso oc
           ON oc.id =
              m.oferta_curso_id

         INNER JOIN cursos c
           ON c.id =
              oc.curso_id

         LEFT JOIN componentes_calificacion comp
           ON comp.oferta_curso_id =
              oc.id

         LEFT JOIN calificaciones cal
           ON cal.componente_id =
              comp.id
          AND cal.matricula_id =
              m.id

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

           AND c.estado =
             'Activo'

         GROUP BY
           m.id,
           m.estado,
           c.id,
           c.nombre,
           c.codigo,
           c.imagen_portada

         ORDER BY c.id`,
        [estudianteId]
      );

    const cursos =
      cursosResult.rows.map(
        (fila) => {
          const componentes =
            Array.isArray(
              fila.componentes
            )
              ? (fila.componentes as ComponenteFila[])
              : [];

          const promedio =
            calcularPromedio(
              componentes
            );

          const totalComponentes =
            componentes.length;

          const componentesCalificados =
            componentes.filter(
              (componente) =>
                componente.nota !==
                null
            ).length;

          const todoCalificado =
            totalComponentes > 0 &&
            componentesCalificados ===
              totalComponentes;

          let estadoAcademico:
            | "Aprobado"
            | "Desaprobado"
            | "En curso" =
            "En curso";

          if (
            todoCalificado &&
            promedio !== null
          ) {
            estadoAcademico =
              promedio >= 11
                ? "Aprobado"
                : "Desaprobado";
          }

          return {
            id: Number(
              fila.curso_id
            ),

            matriculaId: Number(
              fila.matricula_id
            ),

            nombre:
              fila.nombre,

            codigo:
              fila.codigo,

            imagen:
              fila.imagen,

            estadoMatricula:
              fila.estado_matricula,

            promedio,

            estadoAcademico,

            componentes,
          };
        }
      );

    const cursosConPromedio =
      cursos.filter(
        (curso) =>
          curso.promedio !== null
      );

    const promedioGeneral =
      cursosConPromedio.length > 0
        ? Number(
            (
              cursosConPromedio.reduce(
                (
                  total,
                  curso
                ) =>
                  total +
                  Number(
                    curso.promedio
                  ),
                0
              ) /
              cursosConPromedio.length
            ).toFixed(2)
          )
        : null;

    const cursosAprobados =
      cursos.filter(
        (curso) =>
          curso.estadoAcademico ===
          "Aprobado"
      ).length;

    return res
      .status(200)
      .json({
        resumen: {
          promedioGeneral,

          cursosMatriculados:
            cursos.length,

          cursosAprobados,

          porcentajeAprobados:
            cursos.length > 0
              ? Math.round(
                  (
                    cursosAprobados /
                    cursos.length
                  ) * 100
                )
              : 0,
        },

        cursos,
      });
  } catch (error) {
    console.error(
      "Error obteniendo calificaciones del estudiante:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener las calificaciones.",
    });
  }
}