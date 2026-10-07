import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function obtenerDashboardDocente(
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
      `SELECT
         id,
         nombres,
         apellidos,
         rol
       FROM usuarios
       WHERE id = $1
         AND activo = TRUE
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

    const [
      cursosResult,
      actividadesPendientesResult,
      evaluacionesPendientesResult,
      evaluacionesResult,
      resumenAlumnosResult,
      actividadRecienteResult,
    ] = await Promise.all([
      /* CURSOS ASIGNADOS */
      pool.query(
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
      ),

      /* ENTREGAS DE ACTIVIDADES PENDIENTES DE CALIFICAR */
      pool.query(
        `SELECT
           a.id AS actividad_id,
           cc.id AS contenido_id,
           cc.titulo,
           c.id AS curso_id,
           c.nombre AS curso,
           c.codigo,
           COUNT(ea.id)::INTEGER AS pendientes,
           MAX(ea.entregada_en) AS ultima_entrega,
           SUM(COUNT(ea.id)) OVER ()::INTEGER AS total_pendientes
         FROM ofertas_curso oc
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
         INNER JOIN entregas_actividades ea
           ON ea.actividad_id = a.id
          AND ea.estado = 'Entregada'
         INNER JOIN matriculas m
           ON m.id = ea.matricula_id
          AND m.oferta_curso_id = oc.id
          AND m.estado IN ('Activa', 'Completada')
         WHERE oc.docente_id = $1
           AND oc.estado <> 'Cancelado'
           AND c.estado = 'Activo'
           AND NOT EXISTS (
             SELECT 1
             FROM calificaciones cal
             WHERE cal.entrega_id = ea.id
           )
         GROUP BY
           a.id,
           cc.id,
           cc.titulo,
           c.id,
           c.nombre,
           c.codigo
         ORDER BY
           pendientes DESC,
           ultima_entrega DESC NULLS LAST
         LIMIT 6`,
        [docenteId]
      ),

      /* INTENTOS DE EVALUACIONES PENDIENTES DE REVISAR */
      pool.query(
        `SELECT
           e.id AS evaluacion_id,
           cc.id AS contenido_id,
           cc.titulo,
           e.tipo,
           c.id AS curso_id,
           c.nombre AS curso,
           c.codigo,
           COUNT(ie.id)::INTEGER AS pendientes,
           MAX(COALESCE(ie.enviado_en, ie.iniciado_en)) AS ultima_entrega,
           SUM(COUNT(ie.id)) OVER ()::INTEGER AS total_pendientes
         FROM ofertas_curso oc
         INNER JOIN cursos c
           ON c.id = oc.curso_id
         INNER JOIN modulos_curso mc
           ON mc.curso_id = c.id
          AND mc.activo = TRUE
         INNER JOIN contenidos_curso cc
           ON cc.modulo_id = mc.id
          AND cc.estado = 'Publicado'
         INNER JOIN evaluaciones e
           ON e.contenido_id = cc.id
          AND e.estado = 'Publicada'
         INNER JOIN intentos_evaluacion ie
           ON ie.evaluacion_id = e.id
          AND ie.estado = 'Enviado'
         INNER JOIN matriculas m
           ON m.id = ie.matricula_id
          AND m.oferta_curso_id = oc.id
          AND m.estado IN ('Activa', 'Completada')
         WHERE oc.docente_id = $1
           AND oc.estado <> 'Cancelado'
           AND c.estado = 'Activo'
           AND NOT EXISTS (
             SELECT 1
             FROM calificaciones cal
             WHERE cal.intento_evaluacion_id = ie.id
           )
         GROUP BY
           e.id,
           cc.id,
           cc.titulo,
           e.tipo,
           c.id,
           c.nombre,
           c.codigo
         ORDER BY
           pendientes DESC,
           ultima_entrega DESC NULLS LAST
         LIMIT 6`,
        [docenteId]
      ),

      /* PRÓXIMAS EVALUACIONES */
      pool.query(
        `WITH evaluaciones_docente AS (
           SELECT DISTINCT ON (e.id)
             e.id,
             cc.titulo,
             c.id AS curso_id,
             c.nombre AS curso,
             c.codigo,
             COALESCE(e.fecha_inicio, e.fecha_fin) AS fecha_inicio,
             e.fecha_fin
           FROM ofertas_curso oc
           INNER JOIN cursos c
             ON c.id = oc.curso_id
           INNER JOIN modulos_curso mc
             ON mc.curso_id = c.id
            AND mc.activo = TRUE
           INNER JOIN contenidos_curso cc
             ON cc.modulo_id = mc.id
            AND cc.estado = 'Publicado'
           INNER JOIN evaluaciones e
             ON e.contenido_id = cc.id
            AND e.estado = 'Publicada'
           WHERE oc.docente_id = $1
             AND oc.estado <> 'Cancelado'
             AND c.estado = 'Activo'
             AND COALESCE(e.fecha_fin, e.fecha_inicio) IS NOT NULL
             AND COALESCE(e.fecha_fin, e.fecha_inicio) >= NOW()
           ORDER BY
             e.id,
             oc.actualizado_en DESC,
             oc.id DESC
         )
         SELECT
           evaluaciones_docente.*,
           COUNT(*) OVER ()::INTEGER AS total_evaluaciones
         FROM evaluaciones_docente
         ORDER BY fecha_inicio ASC
         LIMIT 3`,
        [docenteId]
      ),

      /* RESUMEN DE ALUMNOS */
      pool.query(
        `WITH matriculas_docente AS (
           SELECT DISTINCT
             m.id AS matricula_id,
             m.estudiante_id
           FROM matriculas m
           INNER JOIN ofertas_curso oc
             ON oc.id = m.oferta_curso_id
           INNER JOIN cursos c
             ON c.id = oc.curso_id
           WHERE oc.docente_id = $1
             AND oc.estado <> 'Cancelado'
             AND c.estado = 'Activo'
             AND m.estado IN ('Activa', 'Completada')
         ),
         progreso_alumnos AS (
           SELECT
             md.estudiante_id,
             AVG(pc.progreso) AS progreso
           FROM matriculas_docente md
           LEFT JOIN progreso_contenido pc
             ON pc.matricula_id = md.matricula_id
           GROUP BY md.estudiante_id
         ),
         notas_alumnos AS (
           SELECT
             md.estudiante_id,
             AVG(cal.nota) AS promedio
           FROM matriculas_docente md
           INNER JOIN calificaciones cal
             ON cal.matricula_id = md.matricula_id
           GROUP BY md.estudiante_id
         ),
         clasificacion AS (
           SELECT
             md.estudiante_id,
             COALESCE(pa.progreso, 0) AS progreso,
             na.promedio
           FROM (
             SELECT DISTINCT estudiante_id
             FROM matriculas_docente
           ) md
           LEFT JOIN progreso_alumnos pa
             ON pa.estudiante_id = md.estudiante_id
           LEFT JOIN notas_alumnos na
             ON na.estudiante_id = md.estudiante_id
         )
         SELECT
           COUNT(*)::INTEGER AS total,
           COUNT(*) FILTER (
             WHERE COALESCE(promedio, 11) >= 11
               AND progreso >= 80
           )::INTEGER AS al_dia,
           COUNT(*) FILTER (
             WHERE promedio IS NOT NULL
               AND promedio < 11
           )::INTEGER AS bajo_rendimiento,
           COUNT(*) FILTER (
             WHERE NOT (
               COALESCE(promedio, 11) >= 11
               AND progreso >= 80
             )
             AND NOT (
               promedio IS NOT NULL
               AND promedio < 11
             )
           )::INTEGER AS con_pendientes
         FROM clasificacion`,
        [docenteId]
      ),

      /* ACTIVIDAD RECIENTE */
      pool.query(
        `SELECT *
         FROM (
           SELECT
             'calificacion'::TEXT AS tipo,
             (
               'Se calificó "' || comp.nombre || '" en ' || c.nombre
             ) AS texto,
             cal.calificado_en AS fecha
           FROM calificaciones cal
           INNER JOIN componentes_calificacion comp
             ON comp.id = cal.componente_id
           INNER JOIN matriculas m
             ON m.id = cal.matricula_id
           INNER JOIN ofertas_curso oc
             ON oc.id = m.oferta_curso_id
           INNER JOIN cursos c
             ON c.id = oc.curso_id
           WHERE oc.docente_id = $1
             AND oc.estado <> 'Cancelado'
             AND cal.calificado_por = $1

           UNION ALL

           SELECT
             'matricula'::TEXT AS tipo,
             (
               'Nuevo alumno matriculado en ' || c.nombre
             ) AS texto,
             m.matriculado_en AS fecha
           FROM matriculas m
           INNER JOIN ofertas_curso oc
             ON oc.id = m.oferta_curso_id
           INNER JOIN cursos c
             ON c.id = oc.curso_id
           WHERE oc.docente_id = $1
             AND oc.estado <> 'Cancelado'
             AND m.estado IN ('Activa', 'Completada')

           UNION ALL

           SELECT
             'contenido'::TEXT AS tipo,
             (
               'Se creó contenido en ' || c.nombre || ': ' || cc.titulo
             ) AS texto,
             cc.creado_en AS fecha
           FROM contenidos_curso cc
           INNER JOIN modulos_curso mc
             ON mc.id = cc.modulo_id
           INNER JOIN cursos c
             ON c.id = mc.curso_id
           WHERE cc.creado_por = $1
             AND EXISTS (
               SELECT 1
               FROM ofertas_curso oc
               WHERE oc.curso_id = c.id
                 AND oc.docente_id = $1
                 AND oc.estado <> 'Cancelado'
             )

           UNION ALL

           SELECT
             'evaluacion'::TEXT AS tipo,
             (
               'Se publicó "' || cc.titulo || '" en ' || c.nombre
             ) AS texto,
             e.actualizado_en AS fecha
           FROM evaluaciones e
           INNER JOIN contenidos_curso cc
             ON cc.id = e.contenido_id
           INNER JOIN modulos_curso mc
             ON mc.id = cc.modulo_id
           INNER JOIN cursos c
             ON c.id = mc.curso_id
           WHERE e.estado = 'Publicada'
             AND EXISTS (
               SELECT 1
               FROM ofertas_curso oc
               WHERE oc.curso_id = c.id
                 AND oc.docente_id = $1
                 AND oc.estado <> 'Cancelado'
             )

         ) actividad
         WHERE fecha IS NOT NULL
         ORDER BY fecha DESC
         LIMIT 5`,
        [docenteId]
      ),
    ]);

    const pendientesActividades =
      actividadesPendientesResult.rows.map(
        (item) => ({
          id: Number(item.actividad_id),
          tipo: "Actividad",
          titulo: item.titulo,
          curso: item.curso,
          codigo: item.codigo,
          cursoId: Number(item.curso_id),
          contenidoId: Number(item.contenido_id),
          pendientes: Number(item.pendientes ?? 0),
          fecha: item.ultima_entrega,
        })
      );

    const pendientesEvaluaciones =
      evaluacionesPendientesResult.rows.map(
        (item) => ({
          id: Number(item.evaluacion_id),
          tipo: item.tipo === "Examen"
            ? "Examen"
            : "Evaluación",
          titulo: item.titulo,
          curso: item.curso,
          codigo: item.codigo,
          cursoId: Number(item.curso_id),
          contenidoId: Number(item.contenido_id),
          pendientes: Number(item.pendientes ?? 0),
          fecha: item.ultima_entrega,
        })
      );

    const pendientesRevision = [
      ...pendientesActividades,
      ...pendientesEvaluaciones,
    ]
      .sort((a, b) => {
        const pendientesA = Number(a.pendientes ?? 0);
        const pendientesB = Number(b.pendientes ?? 0);

        if (pendientesA !== pendientesB) {
          return pendientesB - pendientesA;
        }

        const fechaA = a.fecha
          ? new Date(a.fecha).getTime()
          : 0;
        const fechaB = b.fecha
          ? new Date(b.fecha).getTime()
          : 0;

        return fechaB - fechaA;
      })
      .slice(0, 4);

    const actividadesPorCalificar = Number(
      actividadesPendientesResult.rows[0]
        ?.total_pendientes ?? 0
    );

    const evaluacionesPendientes = Number(
      evaluacionesPendientesResult.rows[0]
        ?.total_pendientes ?? 0
    );

    const evaluacionesProximas = Number(
      evaluacionesResult.rows[0]
        ?.total_evaluaciones ?? 0
    );

    const resumenAlumnos =
      resumenAlumnosResult.rows[0] ?? {
        total: 0,
        al_dia: 0,
        con_pendientes: 0,
        bajo_rendimiento: 0,
      };

    const nombre = String(
      usuarioResult.rows[0].nombres ?? "Docente"
    ).trim();

    const apellidos = String(
      usuarioResult.rows[0].apellidos ?? ""
    ).trim();

    return res.status(200).json({
      docente: {
        nombres: nombre,
        apellidos,
      },

      resumen: {
        cursosAsignados: cursosResult.rows.length,
        alumnos: Number(resumenAlumnos.total ?? 0),
        actividadesPorCalificar,
        evaluacionesProximas,
        revisionesPendientes:
          actividadesPorCalificar + evaluacionesPendientes,
      },

      pendientesRevision,

      cursos:
        cursosResult.rows.map((curso) => ({
          id: Number(curso.id),
          nombre: curso.nombre,
          codigo: curso.codigo,
          imagen: curso.imagen,
          alumnos: Number(curso.alumnos ?? 0),
        })),

      resumenAlumnos: {
        total: Number(resumenAlumnos.total ?? 0),
        alDia: Number(resumenAlumnos.al_dia ?? 0),
        conPendientes: Number(
          resumenAlumnos.con_pendientes ?? 0
        ),
        bajoRendimiento: Number(
          resumenAlumnos.bajo_rendimiento ?? 0
        ),
      },

      evaluaciones: evaluacionesResult.rows.map(
        (evaluation) => ({
          id: Number(evaluation.id),
          titulo: evaluation.titulo,
          curso: evaluation.curso,
          codigo: evaluation.codigo,
          fecha:
            evaluation.fecha_fin ??
            evaluation.fecha_inicio,
        })
      ),

      actividadReciente:
        actividadRecienteResult.rows.map(
          (activity) => ({
            tipo: activity.tipo,
            texto: activity.texto,
            fecha: activity.fecha,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Error obteniendo dashboard del docente:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo cargar el dashboard del docente.",
    });
  }
}