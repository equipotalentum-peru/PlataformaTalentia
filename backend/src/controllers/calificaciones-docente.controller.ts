import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type ComponenteCalificacion = {
  id: number;
  nombre: string;
  tipo: string;
  porcentaje: number | null;
  puntajeMaximo: number | null;
};

type CursoDocente = {
  id: number;
  nombre: string;
  codigo: string;
  ofertaId: number;
  alumnos: number;
};

function numeroValido(value: unknown) {
  const numero = Number(value);

  return Number.isFinite(numero) ? numero : null;
}

function calcularPromedio(
  notas: Array<{
    nota: number | null;
    porcentaje: number | null;
  }>
) {
  const calificadas = notas.filter(
    (item) => item.nota !== null
  );

  if (calificadas.length === 0) {
    return null;
  }

  const conPeso = calificadas.filter(
    (item) => Number(item.porcentaje ?? 0) > 0
  );

  if (conPeso.length > 0) {
    const pesoTotal = conPeso.reduce(
      (total, item) =>
        total + Number(item.porcentaje ?? 0),
      0
    );

    if (pesoTotal > 0) {
      const sumaPonderada = conPeso.reduce(
        (total, item) =>
          total +
          Number(item.nota) *
            Number(item.porcentaje ?? 0),
        0
      );

      return Number(
        (sumaPonderada / pesoTotal).toFixed(2)
      );
    }
  }

  const suma = calificadas.reduce(
    (total, item) => total + Number(item.nota),
    0
  );

  return Number(
    (suma / calificadas.length).toFixed(2)
  );
}

async function validarDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  const docenteId = Number(req.userId);

  if (!Number.isInteger(docenteId) || docenteId <= 0) {
    res.status(401).json({
      message: "Sesión no válida.",
    });

    return null;
  }

  const usuarioResult = await pool.query(
    `SELECT
       id,
       rol
     FROM usuarios
     WHERE id = $1
       AND activo = TRUE
     LIMIT 1`,
    [docenteId]
  );

  if (!usuarioResult.rowCount) {
    res.status(401).json({
      message: "Usuario no encontrado o inactivo.",
    });

    return null;
  }

  if (usuarioResult.rows[0].rol !== "Docente") {
    res.status(403).json({
      message: "Este recurso es exclusivo para docentes.",
    });

    return null;
  }

  return docenteId;
}

async function obtenerCursoDocente(
  docenteId: number,
  cursoId: number
) {
  const cursoResult = await pool.query(
    `SELECT
       c.id,
       c.nombre,
       c.codigo,
       oc.id AS oferta_id
     FROM ofertas_curso oc
     INNER JOIN cursos c
       ON c.id = oc.curso_id
     WHERE oc.docente_id = $1
       AND c.id = $2
       AND oc.estado <> 'Cancelado'
       AND c.estado = 'Activo'
     ORDER BY
       oc.actualizado_en DESC,
       oc.id DESC
     LIMIT 1`,
    [docenteId, cursoId]
  );

  if (!cursoResult.rowCount) {
    return null;
  }

  return cursoResult.rows[0];
}

/**
 * GET /api/calificaciones/docente/mis-calificaciones
 *
 * Devuelve los cursos del docente y, para el curso seleccionado,
 * sus componentes de calificación y alumnos matriculados con sus notas.
 */
export async function obtenerCalificacionesDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const docenteId = await validarDocente(req, res);

    if (docenteId === null) {
      return;
    }

    const cursoIdParam = req.query.cursoId;

    const cursoId =
      cursoIdParam === undefined || cursoIdParam === ""
        ? null
        : Number(cursoIdParam);

    if (
      cursoId !== null &&
      (!Number.isInteger(cursoId) || cursoId <= 0)
    ) {
      return res.status(400).json({
        message: "Curso no válido.",
      });
    }

    const cursosResult = await pool.query(
      `SELECT DISTINCT ON (c.id)
         c.id,
         c.nombre,
         c.codigo,
         oc.id AS oferta_id,

         (
           SELECT COUNT(*)::INTEGER
           FROM matriculas m
           WHERE m.oferta_curso_id = oc.id
             AND m.estado IN ('Activa', 'Completada')
         ) AS alumnos

       FROM ofertas_curso oc

       INNER JOIN cursos c
         ON c.id = oc.curso_id

       WHERE oc.docente_id = $1
         AND oc.estado <> 'Cancelado'
         AND c.estado = 'Activo'

       ORDER BY
         c.id,
         oc.actualizado_en DESC,
         oc.id DESC`,
      [docenteId]
    );

    const cursos: CursoDocente[] = cursosResult.rows.map(
      (curso) => ({
        id: Number(curso.id),
        nombre: curso.nombre,
        codigo: curso.codigo,
        ofertaId: Number(curso.oferta_id),
        alumnos: Number(curso.alumnos ?? 0),
      })
    );

    if (cursos.length === 0) {
      return res.status(200).json({
        cursos: [],
        curso: null,
        componentes: [],
        alumnos: [],

        resumen: {
          alumnos: 0,
          conCalificacion: 0,
          pendientes: 0,
          promedioCurso: null,
          promedioMasAlto: null,
        },
      });
    }

    const cursoSeleccionado =
      cursoId === null
        ? cursos[0]
        : cursos.find(
            (curso) => curso.id === cursoId
          );

    if (!cursoSeleccionado) {
      return res.status(404).json({
        message:
          "El curso seleccionado no está asignado al docente.",
      });
    }

    const componentesResult = await pool.query(
      `SELECT
         id,
         nombre,
         tipo,
         porcentaje,
         puntaje_maximo
       FROM componentes_calificacion
       WHERE oferta_curso_id = $1
       ORDER BY id`,
      [cursoSeleccionado.ofertaId]
    );

    const componentes: ComponenteCalificacion[] =
      componentesResult.rows.map((componente) => ({
        id: Number(componente.id),
        nombre: componente.nombre,
        tipo: componente.tipo,

        porcentaje:
          componente.porcentaje === null
            ? null
            : Number(componente.porcentaje),

        puntajeMaximo:
          componente.puntaje_maximo === null
            ? null
            : Number(componente.puntaje_maximo),
      }));

    const alumnosResult = await pool.query(
      `SELECT
         m.id AS matricula_id,
         m.estudiante_id,

         TRIM(
           CONCAT(
             COALESCE(u.nombres, ''),
             ' ',
             COALESCE(u.apellidos, '')
           )
         ) AS alumno,

         COALESCE(
           json_agg(
             json_build_object(
               'componenteId',
               comp.id,

               'nota',
               cal.nota,

               'retroalimentacion',
               cal.retroalimentacion,

               'calificadoEn',
               cal.calificado_en
             )
             ORDER BY comp.id
           ) FILTER (
             WHERE comp.id IS NOT NULL
           ),
           '[]'::json
         ) AS calificaciones

       FROM matriculas m

       INNER JOIN usuarios u
         ON u.id = m.estudiante_id

       LEFT JOIN componentes_calificacion comp
         ON comp.oferta_curso_id = m.oferta_curso_id

       LEFT JOIN calificaciones cal
         ON cal.componente_id = comp.id
        AND cal.matricula_id = m.id

       WHERE m.oferta_curso_id = $1

         AND m.estado IN (
           'Activa',
           'Completada'
         )

         AND u.rol = 'Estudiante'
         AND u.activo = TRUE

       GROUP BY
         m.id,
         m.estudiante_id,
         u.nombres,
         u.apellidos

       ORDER BY
         u.apellidos NULLS LAST,
         u.nombres,
         m.estudiante_id`,
      [cursoSeleccionado.ofertaId]
    );

    const alumnos = alumnosResult.rows.map((alumno) => {
      const calificaciones =
        Array.isArray(alumno.calificaciones)
          ? alumno.calificaciones
          : [];

      const notas = componentes.map((componente) => {
        const encontrada = calificaciones.find(
          (item: {
            componenteId?: number;
            nota?: number | string | null;
          }) =>
            Number(item.componenteId) ===
            componente.id
        );

        return {
          componenteId: componente.id,

          nota:
            encontrada?.nota === null ||
            encontrada?.nota === undefined
              ? null
              : Number(encontrada.nota),

          retroalimentacion:
            encontrada?.retroalimentacion ?? null,

          calificadoEn:
            encontrada?.calificadoEn ?? null,
        };
      });

      const promedio = calcularPromedio(
        notas.map((nota) => {
          const componente = componentes.find(
            (item) => item.id === nota.componenteId
          );

          return {
            nota: nota.nota,

            porcentaje:
              componente?.porcentaje ?? null,
          };
        })
      );

      return {
        id: Number(
          alumno.estudiante_id
        ),

        matriculaId: Number(
          alumno.matricula_id
        ),

        alumno: String(
          alumno.alumno ?? ""
        ).trim(),

        calificaciones: notas,

        promedio,
      };
    });

    const alumnosConPromedio = alumnos.filter(
      (alumno) => alumno.promedio !== null
    );

    const notasParaPromedio = alumnosConPromedio
      .map((alumno) => alumno.promedio)
      .filter(
        (nota): nota is number =>
          nota !== null
      );

    const promedioCurso =
      notasParaPromedio.length > 0
        ? Number(
            (
              notasParaPromedio.reduce(
                (total, nota) =>
                  total + nota,
                0
              ) /
              notasParaPromedio.length
            ).toFixed(2)
          )
        : null;

    const promedioMasAlto =
      notasParaPromedio.length > 0
        ? Math.max(...notasParaPromedio)
        : null;

    return res.status(200).json({
      cursos,

      curso: {
        id: cursoSeleccionado.id,
        nombre: cursoSeleccionado.nombre,
        codigo: cursoSeleccionado.codigo,
        ofertaId:
          cursoSeleccionado.ofertaId,
      },

      componentes,

      alumnos,

      resumen: {
        alumnos: alumnos.length,

        conCalificacion:
          alumnosConPromedio.length,

        pendientes:
          alumnos.length -
          alumnosConPromedio.length,

        promedioCurso,

        promedioMasAlto,
      },
    });
  } catch (error) {
    console.error(
      "Error obteniendo calificaciones del docente:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener las calificaciones del docente.",
    });
  }
}

/**
 * PUT /api/calificaciones/docente/calificaciones
 *
 * Crea o actualiza una nota.
 *
 * Si nota es null o vacía, elimina la calificación
 * existente para dejar nuevamente el componente pendiente.
 */
export async function guardarCalificacionDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  const client = await pool.connect();

  try {
    const docenteId = await validarDocente(req, res);

    if (docenteId === null) {
      client.release();
      return;
    }

    const {
      matriculaId,
      componenteId,
      nota,
      retroalimentacion,
    } = req.body ?? {};

    const matriculaIdNumber =
      Number(matriculaId);

    const componenteIdNumber =
      Number(componenteId);

    if (
      !Number.isInteger(
        matriculaIdNumber
      ) ||
      matriculaIdNumber <= 0 ||
      !Number.isInteger(
        componenteIdNumber
      ) ||
      componenteIdNumber <= 0
    ) {
      client.release();

      return res.status(400).json({
        message:
          "La matrícula y el componente de calificación son obligatorios.",
      });
    }

    let notaNumber: number | null = null;

    if (
      nota !== null &&
      nota !== undefined &&
      nota !== ""
    ) {
      notaNumber = numeroValido(
        nota
      );

      if (
        notaNumber === null ||
        notaNumber < 0 ||
        notaNumber > 20
      ) {
        client.release();

        return res.status(400).json({
          message:
            "La nota debe ser un número entre 0 y 20.",
        });
      }
    }

    const componenteResult =
      await client.query(
        `SELECT
           comp.id,
           comp.oferta_curso_id,
           comp.nombre

         FROM componentes_calificacion comp

         INNER JOIN ofertas_curso oc
           ON oc.id = comp.oferta_curso_id

         INNER JOIN cursos c
           ON c.id = oc.curso_id

         WHERE comp.id = $1

           AND oc.docente_id = $2

           AND oc.estado <> 'Cancelado'

           AND c.estado = 'Activo'

         LIMIT 1`,
        [
          componenteIdNumber,
          docenteId,
        ]
      );

    if (!componenteResult.rowCount) {
      client.release();

      return res.status(403).json({
        message:
          "No puedes modificar una calificación que no pertenece a un curso asignado.",
      });
    }

    const ofertaId = Number(
      componenteResult.rows[0]
        .oferta_curso_id
    );

    const matriculaResult =
      await client.query(
        `SELECT
           id,
           estudiante_id

         FROM matriculas

         WHERE id = $1

           AND oferta_curso_id = $2

           AND estado IN (
             'Activa',
             'Completada'
           )

         LIMIT 1`,
        [
          matriculaIdNumber,
          ofertaId,
        ]
      );

    if (!matriculaResult.rowCount) {
      client.release();

      return res.status(403).json({
        message:
          "La matrícula indicada no pertenece al curso de la calificación.",
      });
    }

    await client.query("BEGIN");

    if (notaNumber === null) {
      await client.query(
        `DELETE FROM calificaciones

         WHERE componente_id = $1

           AND matricula_id = $2`,
        [
          componenteIdNumber,
          matriculaIdNumber,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO calificaciones (
           componente_id,
           matricula_id,
           nota,
           retroalimentacion,
           calificado_por,
           calificado_en
         )

         VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           CURRENT_TIMESTAMP
         )

         ON CONFLICT (
           componente_id,
           matricula_id
         )

         DO UPDATE SET
           nota =
             EXCLUDED.nota,

           retroalimentacion =
             EXCLUDED.retroalimentacion,

           calificado_por =
             EXCLUDED.calificado_por,

           calificado_en =
             CURRENT_TIMESTAMP`,
        [
          componenteIdNumber,
          matriculaIdNumber,
          notaNumber,

          typeof retroalimentacion ===
          "string"
            ? retroalimentacion.trim() ||
              null
            : null,

          docenteId,
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message:
        notaNumber === null
          ? "La calificación fue retirada correctamente."
          : "La calificación fue guardada correctamente.",

      calificacion: {
        componenteId:
          componenteIdNumber,

        matriculaId:
          matriculaIdNumber,

        nota: notaNumber,
      },
    });
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {
      // No hacemos nada si el rollback ya no es posible.
    }

    console.error(
      "Error guardando calificación del docente:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo guardar la calificación.",
    });
  } finally {
    client.release();
  }
}