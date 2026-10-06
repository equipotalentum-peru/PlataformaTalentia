import type { Response } from "express";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  actualizarReunionZoom,
  crearReunionZoom,
  eliminarReunionZoom,
  extraerMeetingIdDesdeUrl,
  obtenerGrabacionesZoom,
  obtenerReunionZoom,
} from "../services/zoom.service";

/* =========================================================
   HELPERS
========================================================= */

function validarId(value: unknown) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function formatearEstado(
  estado: string
) {
  if (estado === "Proxima") {
    return "Próxima";
  }

  return estado;
}

function formatearClase(row: any) {
  const fecha = new Date(row.inicia_en);

  return {
    id: Number(row.id),
    numero: String(
      row.numero_sesion
    ).padStart(2, "0"),

    tema: row.tema,

    fecha: fecha.toLocaleDateString(
      "es-PE",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ),

    horario: `${fecha.toLocaleTimeString(
      "es-PE",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    )} – ${new Date(
      row.termina_en
    ).toLocaleTimeString(
      "es-PE",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    )} (GMT-5)`,

    estado: formatearEstado(
      row.estado
    ),

    docente: row.docente_nombres
      ? `Prof. ${row.docente_nombres} ${row.docente_apellidos ?? ""}`.trim()
      : "Docente",

    zoomUrl: row.url_zoom ?? null,

    recordingUrl:
      row.ruta_grabacion ?? null,

    iniciaEn: row.inicia_en,

    terminaEn: row.termina_en,

    moduloId:
      row.modulo_id !== null
        ? Number(row.modulo_id)
        : null,

    ofertaCursoId:
      Number(row.oferta_curso_id),
  };
}

/* =========================================================
   VERIFICAR ALUMNO MATRICULADO
========================================================= */

async function verificarMatriculaAlumno(
  estudianteId: number,
  cursoId: number
) {
  const result = await pool.query(
    `
    SELECT
      m.id AS matricula_id,
      oc.id AS oferta_curso_id,
      c.id AS curso_id
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
      AND u.activo = TRUE
      AND m.estado IN ('Activa', 'Completada')
      AND oc.estado IN (
        'Programado',
        'En curso',
        'Finalizado'
      )
      AND oc.publicado = TRUE
      AND c.estado = 'Activo'
    LIMIT 1
    `,
    [estudianteId, cursoId]
  );

  return result.rows[0] ?? null;
}

/* =========================================================
   VERIFICAR DOCENTE DEL CURSO
========================================================= */

async function verificarDocenteCurso(
  docenteId: number,
  cursoId: number
) {
  const result = await pool.query(
    `
    SELECT
      oc.id AS oferta_curso_id,
      c.id AS curso_id
    FROM ofertas_curso oc
    INNER JOIN cursos c
      ON c.id = oc.curso_id
    INNER JOIN usuarios u
      ON u.id = oc.docente_id
    WHERE oc.docente_id = $1
      AND c.id = $2
      AND u.rol = 'Docente'
      AND u.activo = TRUE
      AND oc.estado <> 'Cancelado'
      AND c.estado = 'Activo'
    ORDER BY oc.id DESC
    LIMIT 1
    `,
    [docenteId, cursoId]
  );

  return result.rows[0] ?? null;
}

/* =========================================================
   ALUMNO: OBTENER CLASES
========================================================= */

export async function obtenerClasesAlumno(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId =
      validarId(req.userId);

    const cursoId =
      validarId(req.params.cursoId);

    if (!estudianteId || !cursoId) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    const acceso =
      await verificarMatriculaAlumno(
        estudianteId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No estás matriculado en este curso.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        sc.id,
        sc.oferta_curso_id,
        sc.modulo_id,
        sc.numero_sesion,
        sc.tema,
        sc.inicia_en,
        sc.termina_en,
        sc.estado,
        sc.url_zoom,
        sc.ruta_grabacion,

        u.nombres AS docente_nombres,
        u.apellidos AS docente_apellidos

      FROM sesiones_clase sc

      INNER JOIN usuarios u
        ON u.id = sc.docente_id

      WHERE sc.oferta_curso_id = $1

      ORDER BY
        sc.numero_sesion ASC,
        sc.inicia_en ASC,
        sc.id ASC
      `,
      [acceso.oferta_curso_id]
    );

    return res.status(200).json({
      clases: result.rows.map(formatearClase),
    });
  } catch (error) {
    console.error(
      "Error obteniendo clases del alumno:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener las clases.",
    });
  }
}

/* =========================================================
   DOCENTE: OBTENER CLASES
========================================================= */

export async function obtenerClasesDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const docenteId =
      validarId(req.userId);

    const cursoId =
      validarId(req.params.cursoId);

    if (!docenteId || !cursoId) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    const acceso =
      await verificarDocenteCurso(
        docenteId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes permiso para gestionar este curso.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        sc.id,
        sc.oferta_curso_id,
        sc.modulo_id,
        sc.numero_sesion,
        sc.tema,
        sc.inicia_en,
        sc.termina_en,
        sc.estado,
        sc.url_zoom,
        sc.ruta_grabacion,

        u.nombres AS docente_nombres,
        u.apellidos AS docente_apellidos

      FROM sesiones_clase sc

      LEFT JOIN usuarios u
        ON u.id = sc.docente_id

      WHERE sc.oferta_curso_id = $1

      ORDER BY
        sc.numero_sesion ASC,
        sc.inicia_en ASC,
        sc.id ASC
      `,
      [acceso.oferta_curso_id]
    );

    return res.status(200).json({
      clases: result.rows.map(formatearClase),
    });
  } catch (error) {
    console.error(
      "Error obteniendo clases del docente:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener las clases.",
    });
  }
}

/* =========================================================
   DOCENTE: CREAR CLASE
========================================================= */

export async function crearClase(
  req: AuthenticatedRequest,
  res: Response
) {
  const client = await pool.connect();

  try {
    const docenteId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);

    if (!docenteId || !cursoId) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    const {
      moduloId,
      numeroSesion,
      tema,
      iniciaEn,
      terminaEn,
    } = req.body;

    if (
      !tema?.trim() ||
      !iniciaEn ||
      !terminaEn
    ) {
      return res.status(400).json({
        message:
          "Tema, fecha de inicio y fecha de término son obligatorios.",
      });
    }

    const acceso =
      await verificarDocenteCurso(
        docenteId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes permiso para gestionar este curso.",
      });
    }

    let numero = Number(numeroSesion);

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      const numeroResult =
        await client.query(
          `
          SELECT
            COALESCE(MAX(numero_sesion), 0) + 1 AS siguiente
          FROM sesiones_clase
          WHERE oferta_curso_id = $1
          `,
          [acceso.oferta_curso_id]
        );

      numero = Number(
        numeroResult.rows[0].siguiente
      );
    }

    /*
     * Calcular duración en minutos
     */
    const inicio = new Date(iniciaEn);
    const fin = new Date(terminaEn);

    const duracionMinutos = Math.ceil(
      (fin.getTime() - inicio.getTime()) /
        (1000 * 60)
    );

    if (duracionMinutos <= 0) {
      return res.status(400).json({
        message:
          "La hora de término debe ser posterior a la hora de inicio.",
      });
    }

    /*
     * 1. Crear reunión REAL en Zoom
     */
    const reunion =
      await crearReunionZoom({
        topic: tema.trim(),
        startTime: iniciaEn,
        durationMinutes: duracionMinutos,
      });

    /*
     * 2. Guardar reunión en PostgreSQL
     */
    const result =
      await client.query(
        `
        INSERT INTO sesiones_clase (
          oferta_curso_id,
          modulo_id,
          docente_id,
          numero_sesion,
          tema,
          inicia_en,
          termina_en,
          estado,
          url_zoom
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          'Programada',
          $8
        )
        RETURNING *
        `,
        [
          acceso.oferta_curso_id,
          moduloId
            ? Number(moduloId)
            : null,
          docenteId,
          numero,
          tema.trim(),
          iniciaEn,
          terminaEn,
          reunion.join_url,
        ]
      );

    return res.status(201).json({
      message:
        "Clase y reunión de Zoom creadas correctamente.",
      clase: {
        ...result.rows[0],
        zoomMeetingId:
          reunion.id,
        startUrl:
          reunion.start_url,
        joinUrl:
          reunion.join_url,
      },
    });
  } catch (error) {
    console.error(
      "Error creando clase:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo crear la clase.",
    });
  } finally {
    client.release();
  }
}

/* =========================================================
   DOCENTE: EDITAR CLASE
========================================================= */

export async function editarClase(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const docenteId =
      validarId(req.userId);

    const cursoId =
      validarId(req.params.cursoId);

    const claseId =
      validarId(req.params.claseId);

    if (
      !docenteId ||
      !cursoId ||
      !claseId
    ) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    const acceso =
      await verificarDocenteCurso(
        docenteId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes permiso para gestionar este curso.",
      });
    }

    const {
      tema,
      iniciaEn,
      terminaEn,
      moduloId,
    } = req.body;

    /*
     * Obtener la clase actual
     */
    const actual =
      await pool.query(
        `
        SELECT *
        FROM sesiones_clase
        WHERE id = $1
          AND oferta_curso_id = $2
          AND docente_id = $3
        LIMIT 1
        `,
        [
          claseId,
          acceso.oferta_curso_id,
          docenteId,
        ]
      );

    if (!actual.rowCount) {
      return res.status(404).json({
        message:
          "No se encontró la clase.",
      });
    }

    const clase = actual.rows[0];

    if (
      !["Programada", "Proxima"].includes(
        clase.estado
      )
    ) {
      return res.status(409).json({
        message:
          "Esta clase ya no puede editarse.",
      });
    }

    const nuevoTema = tema?.trim() || clase.tema;
    const nuevoInicio = iniciaEn || clase.inicia_en;
    const nuevoFin = terminaEn || clase.termina_en;
    const inicio = new Date(nuevoInicio);
    const fin = new Date(nuevoFin);
    const duracionMinutos = Math.ceil(
      (fin.getTime() - inicio.getTime()) /
        (1000 * 60)
    );

    if (duracionMinutos <= 0) {
      return res.status(400).json({
        message:
          "La hora de término debe ser posterior a la hora de inicio.",
      });
    }

    /*
     * Actualizar reunión REAL de Zoom
     */
    const meetingId =
      extraerMeetingIdDesdeUrl(
        clase.url_zoom
      );

    if (meetingId) {
      await actualizarReunionZoom(
        meetingId,
        {
          topic: nuevoTema,
          startTime: nuevoInicio,
          durationMinutes:
            duracionMinutos,
        }
      );
    }

    /*
     * Actualizar Talentia
     */
    const result =
      await pool.query(
        `
        UPDATE sesiones_clase
        SET
          tema = $1,
          inicia_en = $2,
          termina_en = $3,
          modulo_id = $4,
          actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $5
          AND oferta_curso_id = $6
          AND docente_id = $7
        RETURNING *
        `,
        [
          nuevoTema,
          nuevoInicio,
          nuevoFin,
          moduloId
            ? Number(moduloId)
            : clase.modulo_id,
          claseId,
          acceso.oferta_curso_id,
          docenteId,
        ]
      );

    return res.status(200).json({
      message:
        "Clase y reunión de Zoom actualizadas correctamente.",
      clase: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error editando clase:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo editar la clase.",
    });
  }
}

/* =========================================================
   DOCENTE: CANCELAR CLASE
========================================================= */

export async function cancelarClase(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const docenteId =
      validarId(req.userId);

    const cursoId =
      validarId(req.params.cursoId);

    const claseId =
      validarId(req.params.claseId);

    if (
      !docenteId ||
      !cursoId ||
      !claseId
    ) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    const acceso =
      await verificarDocenteCurso(
        docenteId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes permiso para gestionar este curso.",
      });
    }

    const actual =
      await pool.query(
        `
        SELECT
          id,
          url_zoom,
          estado
        FROM sesiones_clase
        WHERE id = $1
          AND oferta_curso_id = $2
          AND docente_id = $3
        LIMIT 1
        `,
        [
          claseId,
          acceso.oferta_curso_id,
          docenteId,
        ]
      );

    if (!actual.rowCount) {
      return res.status(404).json({
        message:
          "No se encontró la clase.",
      });
    }

    const clase = actual.rows[0];

    if (
      !["Programada", "Proxima"].includes(
        clase.estado
      )
    ) {
      return res.status(409).json({
        message:
          "Esta clase no puede cancelarse.",
      });
    }

    /*
     * Cancelar/eliminar la reunión real de Zoom
     */
    const meetingId =
      extraerMeetingIdDesdeUrl(
        clase.url_zoom
      );

    if (meetingId) {
      await eliminarReunionZoom(
        meetingId
      );
    }

    /*
     * Marcar la sesión como cancelada
     */
    await pool.query(
      `
      UPDATE sesiones_clase
      SET
        estado = 'Cancelada',
        actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [claseId]
    );

    return res.status(200).json({
      message:
        "Clase cancelada y reunión de Zoom eliminada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error cancelando clase:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo cancelar la clase.",
    });
  }
}

/* =========================================================
   DOCENTE: INICIAR CLASE
========================================================= */

export async function iniciarClase(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const docenteId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);
    const claseId = validarId(req.params.claseId);

    if (!docenteId || !cursoId || !claseId) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    const acceso = await verificarDocenteCurso(
      docenteId,
      cursoId
    );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes permiso para gestionar este curso.",
      });
    }

    const result = await pool.query(
      `
      SELECT id, url_zoom, estado
      FROM sesiones_clase
      WHERE id = $1
        AND oferta_curso_id = $2
        AND docente_id = $3
      LIMIT 1
      `,
      [
        claseId,
        acceso.oferta_curso_id,
        docenteId,
      ]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message:
          "No se encontró la clase.",
      });
    }

    const clase = result.rows[0];

    const meetingId =
      extraerMeetingIdDesdeUrl(
        clase.url_zoom
      );

    if (!meetingId) {
      return res.status(404).json({
        message:
          "La clase no tiene una reunión de Zoom asociada.",
      });
    }

    const reunion =
      await obtenerReunionZoom(
        meetingId
      );

    await pool.query(
      `
      UPDATE sesiones_clase
      SET
        estado = 'En curso',
        actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [claseId]
    );

    return res.status(200).json({
      message:
        "Clase iniciada correctamente.",
      startUrl:
        reunion.start_url,
    });
  } catch (error) {
    console.error(
      "Error iniciando clase:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo iniciar la clase.",
    });
  }
}


/* =========================================================
   ALUMNO: UNIRSE A CLASE
========================================================= */

export async function unirseClase(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId =
      validarId(req.userId);

    const cursoId =
      validarId(req.params.cursoId);

    const claseId =
      validarId(req.params.claseId);

    if (
      !estudianteId ||
      !cursoId ||
      !claseId
    ) {
      return res.status(400).json({
        message:
          "Solicitud no válida.",
      });
    }

    const acceso =
      await verificarMatriculaAlumno(
        estudianteId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No estás matriculado en este curso.",
      });
    }

    const result =
      await pool.query(
        `
        SELECT
          id,
          url_zoom,
          estado,
          inicia_en,
          termina_en
        FROM sesiones_clase
        WHERE id = $1
          AND oferta_curso_id = $2
        LIMIT 1
        `,
        [
          claseId,
          acceso.oferta_curso_id,
        ]
      );

    if (!result.rowCount) {
      return res.status(404).json({
        message:
          "No se encontró la clase.",
      });
    }

    const clase = result.rows[0];

    if (clase.estado === "Cancelada") {
      return res.status(409).json({
        message:
          "Esta clase fue cancelada.",
      });
    }

    const ahora = new Date();
    const fin = new Date(
      clase.termina_en
    );

    if (ahora > fin) {
      return res.status(409).json({
        message:
          "La clase ya finalizó.",
      });
    }

    let joinUrl =
      clase.url_zoom as
        | string
        | null;

    const meetingId =
      extraerMeetingIdDesdeUrl(
        joinUrl
      );

    if (meetingId) {
      try {
        const reunion =
          await obtenerReunionZoom(
            meetingId
          );

        joinUrl =
          reunion.join_url;
      } catch (error) {
        console.warn(
          "No se pudo refrescar la reunión de Zoom:",
          error
        );
      }
    }

    if (!joinUrl) {
      return res.status(404).json({
        message:
          "La clase no tiene un enlace de Zoom disponible.",
      });
    }

    return res.status(200).json({
      joinUrl,
    });
  } catch (error) {
    console.error(
      "Error uniéndose a clase:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo abrir la reunión.",
    });
  }
}


/* =========================================================
   OBTENER GRABACIONES
========================================================= */

export async function obtenerGrabaciones(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId =
      validarId(req.userId);

    const cursoId =
      validarId(req.params.cursoId);

    const claseId =
      validarId(req.params.claseId);

    if (
      !usuarioId ||
      !cursoId ||
      !claseId
    ) {
      return res.status(400).json({
        message:
          "Solicitud no válida.",
      });
    }

    const usuarioResult =
      await pool.query(
        `
        SELECT id, rol
        FROM usuarios
        WHERE id = $1
          AND activo = TRUE
        LIMIT 1
        `,
        [usuarioId]
      );

    if (!usuarioResult.rowCount) {
      return res.status(401).json({
        message:
          "Usuario no encontrado o inactivo.",
      });
    }

    const rol =
      usuarioResult.rows[0].rol;

    let ofertaCursoId:
      number | null = null;

    if (rol === "Estudiante") {
      const acceso =
        await verificarMatriculaAlumno(
          usuarioId,
          cursoId
        );

      ofertaCursoId =
        acceso?.oferta_curso_id ??
        null;
    } else if (rol === "Docente") {
      const acceso =
        await verificarDocenteCurso(
          usuarioId,
          cursoId
        );

      ofertaCursoId =
        acceso?.oferta_curso_id ??
        null;
    } else {
      return res.status(403).json({
        message:
          "No tienes permiso para consultar grabaciones.",
      });
    }

    if (!ofertaCursoId) {
      return res.status(403).json({
        message:
          "No tienes acceso a este curso.",
      });
    }

    const result =
      await pool.query(
        `
        SELECT
          id,
          url_zoom,
          ruta_grabacion
        FROM sesiones_clase
        WHERE id = $1
          AND oferta_curso_id = $2
        LIMIT 1
        `,
        [
          claseId,
          ofertaCursoId,
        ]
      );

    if (!result.rowCount) {
      return res.status(404).json({
        message:
          "No se encontró la clase.",
      });
    }

    const clase = result.rows[0];

    const grabacionLocal =
      clase.ruta_grabacion
        ? {
            id: "local",
            nombre: "Grabación local",
            tipo: "MP4",
            url: clase.ruta_grabacion,
          }
        : null;

    const meetingId =
      extraerMeetingIdDesdeUrl(
        clase.url_zoom
      );

    /*
    * Si no existe reunión Zoom,
    * pero existe grabación local,
    * devolvemos la grabación local.
    */
    if (!meetingId) {
      if (grabacionLocal) {
        return res.status(200).json({
          grabaciones: [
            grabacionLocal,
          ],
        });
      }

      return res.status(404).json({
        message:
          "No hay grabaciones asociadas a esta clase.",
      });
    }

    let grabacionesZoom: Array<{
      id: string;
      nombre: string;
      tipo: string | null;
      url: string;
    }> = [];

    try {
      const data =
        await obtenerGrabacionesZoom(
          meetingId
        );

      grabacionesZoom =
        (
          data.recording_files ??
          []
        )
          .filter(
            (archivo) =>
              archivo.status !==
              "deleted"
          )
          .map((archivo) => {
            const url =
              archivo.play_url ??
              archivo.share_url ??
              archivo.download_url ??
              null;

            return {
              id: archivo.id,

              nombre:
                archivo.recording_type ??
                archivo.file_type ??
                "Grabación",

              tipo:
                archivo.file_extension ??
                archivo.file_type ??
                null,

              url,
            };
          })
          .filter(
            (archivo): archivo is {
              id: string;
              nombre: string;
              tipo: string | null;
              url: string;
            } => Boolean(archivo.url)
          );
    } catch (error) {
      console.warn(
        "No se pudo obtener la grabación de Zoom:",
        error
      );
    }

    /*
    * Prioridad:
    * 1. grabación local
    * 2. grabaciones de Zoom
    */
    const grabaciones = [
      ...(grabacionLocal
        ? [grabacionLocal]
        : []),
      ...grabacionesZoom,
    ];

    if (grabacionesZoom.length > 0) {
      /*
      * Guardamos en BD la primera grabación
      * de Zoom encontrada.
      */
      await pool.query(
        `
        UPDATE sesiones_clase
        SET
          ruta_grabacion = $1,
          actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          grabacionesZoom[0].url,
          claseId,
        ]
      );
    }

    if (grabaciones.length === 0) {
      return res.status(404).json({
        message:
          "No hay grabaciones disponibles para esta clase.",
      });
    }

    return res.status(200).json({
      grabaciones,
    });
  } catch (error) {
    console.error(
      "Error obteniendo grabaciones:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener las grabaciones.",
    });
  }
}