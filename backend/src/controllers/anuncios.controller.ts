import type { Response } from "express";

import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type EstadoAnuncio = "Borrador" | "Publicado" | "Oculto";

function idPositivo(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function obtenerUsuarioActivo(userId: number) {
  const result = await pool.query(
    `SELECT id, rol
     FROM usuarios
     WHERE id = $1 AND activo = TRUE
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] as
    | { id: number; rol: "Estudiante" | "Docente" | "Administrador" }
    | undefined;
}

async function obtenerOfertaDocente(cursoId: number, docenteId: number) {
  const result = await pool.query(
    `SELECT
       oc.id AS oferta_curso_id,
       c.id AS id,
       c.id AS curso_id,
       c.nombre,
       c.imagen_portada AS imagen
     FROM cursos c
     INNER JOIN ofertas_curso oc ON oc.curso_id = c.id
     WHERE c.id = $1
       AND oc.docente_id = $2
       AND oc.estado <> 'Cancelado'
     ORDER BY oc.actualizado_en DESC, oc.id DESC
     LIMIT 1`,
    [cursoId, docenteId]
  );

  return result.rows[0] as
    | { id: number; oferta_curso_id: number; curso_id: number; nombre: string; imagen: string | null }
    | undefined;
}

async function obtenerCursoMatriculado(cursoId: number, estudianteId: number) {
  const result = await pool.query(
    `SELECT
       c.id,
       c.nombre,
       c.imagen_portada AS imagen
     FROM cursos c
     INNER JOIN ofertas_curso oc ON oc.curso_id = c.id
     INNER JOIN matriculas m ON m.oferta_curso_id = oc.id
     WHERE c.id = $1
       AND m.estudiante_id = $2
       AND m.estado IN ('Activa', 'Completada')
       AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
       AND oc.publicado = TRUE
       AND c.estado = 'Activo'
     ORDER BY oc.actualizado_en DESC, oc.id DESC
     LIMIT 1`,
    [cursoId, estudianteId]
  );

  return result.rows[0] as
    | { id: number; nombre: string; imagen: string | null }
    | undefined;
}

/**
 * GET /api/cursos/:cursoId/anuncios
 * Docentes ven sus estados de anuncio para una oferta asignada.
 * Estudiantes solo ven anuncios publicados en ofertas donde están matriculados.
 */
export async function listarAnunciosCurso(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = idPositivo(req.userId);
    const cursoId = idPositivo(req.params.cursoId);

    if (!userId || !cursoId) {
      return res.status(400).json({
        message: "Usuario o curso no válido.",
      });
    }

    const usuario = await obtenerUsuarioActivo(userId);

    if (!usuario) {
      return res.status(401).json({
        message: "Usuario no encontrado o inactivo.",
      });
    }

    if (usuario.rol === "Docente") {
      const oferta = await obtenerOfertaDocente(cursoId, userId);

      if (!oferta) {
        return res.status(403).json({
          message:
            "No tienes una oferta de este curso asignada. Asigna primero el docente en ofertas_curso.",
        });
      }

      const anuncios = await pool.query(
        `SELECT
           a.id,
           a.titulo AS title,
           a.contenido AS content,
           COALESCE(a.publicado_en, a.creado_en) AS date,
           a.estado AS status,
           FALSE AS read,
           (
             SELECT COUNT(*)::INTEGER
             FROM lecturas_anuncio la
             WHERE la.anuncio_id = a.id
           ) AS views
         FROM anuncios a
         WHERE a.oferta_curso_id = $1
         ORDER BY a.creado_en DESC, a.id DESC`,
        [oferta.oferta_curso_id]
      );

      return res.status(200).json({
        curso: oferta,
        anuncios: anuncios.rows,
      });
    }

    if (usuario.rol === "Estudiante") {
      const curso = await obtenerCursoMatriculado(cursoId, userId);

      if (!curso) {
        return res.status(403).json({
          message:
            "No estás matriculado en una oferta publicada de este curso.",
        });
      }

      const anuncios = await pool.query(
        `SELECT
           a.id,
           a.titulo AS title,
           a.contenido AS content,
           COALESCE(a.publicado_en, a.creado_en) AS date,
           a.estado AS status,
           (la.usuario_id IS NOT NULL) AS read,
           (
             SELECT COUNT(*)::INTEGER
             FROM lecturas_anuncio la2
             WHERE la2.anuncio_id = a.id
           ) AS views
         FROM anuncios a
         INNER JOIN ofertas_curso oc ON oc.id = a.oferta_curso_id
         INNER JOIN matriculas m
           ON m.oferta_curso_id = oc.id
          AND m.estudiante_id = $2
         LEFT JOIN lecturas_anuncio la
           ON la.anuncio_id = a.id
          AND la.usuario_id = $2
         WHERE oc.curso_id = $1
           AND m.estado IN ('Activa', 'Completada')
           AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
           AND oc.publicado = TRUE
           AND a.estado = 'Publicado'
         ORDER BY
           COALESCE(a.publicado_en, a.creado_en) DESC,
           a.id DESC`,
        [cursoId, userId]
      );

      return res.status(200).json({
        curso,
        anuncios: anuncios.rows,
      });
    }

    return res.status(403).json({
      message:
        "Este recurso es exclusivo para docentes y estudiantes.",
    });
  } catch (error) {
    console.error("Error listando anuncios del curso:", error);

    return res.status(500).json({
      message: "No se pudieron cargar los anuncios.",
    });
  }
}

/**
 * POST /api/cursos/:cursoId/anuncios
 * Crear un anuncio. Solo el docente asignado puede hacerlo.
 */
export async function crearAnuncio(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = idPositivo(req.userId);
    const cursoId = idPositivo(req.params.cursoId);
    const titulo = texto(req.body?.titulo);
    const contenido = texto(req.body?.contenido);
    const estado = texto(req.body?.estado) as EstadoAnuncio;

    if (!userId || !cursoId) {
      return res.status(400).json({
        message: "Usuario o curso no válido.",
      });
    }

    if (!titulo || titulo.length > 200 || !contenido) {
      return res.status(400).json({
        message:
          "El título (máximo 200 caracteres) y el contenido son obligatorios.",
      });
    }

    if (estado !== "Publicado" && estado !== "Borrador") {
      return res.status(400).json({
        message: "El estado inicial debe ser Publicado o Borrador.",
      });
    }

    const usuario = await obtenerUsuarioActivo(userId);

    if (!usuario || usuario.rol !== "Docente") {
      return res.status(403).json({
        message: "Solo un docente activo puede crear anuncios.",
      });
    }

    const oferta = await obtenerOfertaDocente(cursoId, userId);

    if (!oferta) {
      return res.status(403).json({
        message: "No tienes una oferta de este curso asignada.",
      });
    }

    const result = await pool.query(
      `INSERT INTO anuncios (
         oferta_curso_id,
         titulo,
         contenido,
         creado_por,
         estado,
         publicado_en
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5::VARCHAR(20),
         CASE
           WHEN $5::VARCHAR(20) = 'Publicado' THEN CURRENT_TIMESTAMP
           ELSE NULL
         END
       )
       RETURNING
         id,
         titulo AS title,
         contenido AS content,
         COALESCE(publicado_en, creado_en) AS date,
         estado AS status,
         creado_en`,
      [
        oferta.oferta_curso_id,
        titulo,
        contenido,
        userId,
        estado,
      ]
    );

    return res.status(201).json({
      anuncio: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando anuncio:", error);

    return res.status(500).json({
      message: "No se pudo guardar el anuncio.",
    });
  }
}

/**
 * PATCH /api/anuncios/:anuncioId
 * Editar el título y el contenido.
 */
export async function editarAnuncio(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = idPositivo(req.userId);
    const anuncioId = idPositivo(req.params.anuncioId);
    const titulo = texto(req.body?.titulo);
    const contenido = texto(req.body?.contenido);

    if (!userId || !anuncioId) {
      return res.status(400).json({
        message: "Usuario o anuncio no válido.",
      });
    }

    if (!titulo || titulo.length > 200 || !contenido) {
      return res.status(400).json({
        message:
          "El título (máximo 200 caracteres) y el contenido son obligatorios.",
      });
    }

    const usuario = await obtenerUsuarioActivo(userId);

    if (!usuario || usuario.rol !== "Docente") {
      return res.status(403).json({
        message: "Solo un docente puede editar anuncios.",
      });
    }

    const result = await pool.query(
      `UPDATE anuncios a
       SET
         titulo = $2,
         contenido = $3,
         actualizado_en = CURRENT_TIMESTAMP
       FROM ofertas_curso oc
       WHERE a.id = $1
         AND a.oferta_curso_id = oc.id
         AND a.creado_por = $4
         AND oc.docente_id = $4
       RETURNING
         a.id,
         a.titulo AS title,
         a.contenido AS content,
         COALESCE(a.publicado_en, a.creado_en) AS date,
         a.estado AS status`,
      [anuncioId, titulo, contenido, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message:
          "Anuncio no encontrado o no tienes permiso para editarlo.",
      });
    }

    return res.status(200).json({
      anuncio: result.rows[0],
    });
  } catch (error) {
    console.error("Error editando anuncio:", error);

    return res.status(500).json({
      message: "No se pudo editar el anuncio.",
    });
  }
}

/**
 * PATCH /api/anuncios/:anuncioId/estado
 * Publicar, guardar como borrador u ocultar un anuncio.
 */
export async function cambiarEstadoAnuncio(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = idPositivo(req.userId);
    const anuncioId = idPositivo(req.params.anuncioId);
    const estado = texto(req.body?.estado) as EstadoAnuncio;

    if (!userId || !anuncioId) {
      return res.status(400).json({
        message: "Usuario o anuncio no válido.",
      });
    }

    if (!["Borrador", "Publicado", "Oculto"].includes(estado)) {
      return res.status(400).json({
        message: "Estado de anuncio no válido.",
      });
    }

    const usuario = await obtenerUsuarioActivo(userId);

    if (!usuario || usuario.rol !== "Docente") {
      return res.status(403).json({
        message:
          "Solo un docente puede cambiar el estado de anuncios.",
      });
    }

    const result = await pool.query(
      `UPDATE anuncios a
       SET
         estado = $2::VARCHAR(20),
         publicado_en = CASE
           WHEN $2::VARCHAR(20) = 'Publicado'
             AND a.estado <> 'Publicado'
           THEN CURRENT_TIMESTAMP
           ELSE a.publicado_en
         END,
         actualizado_en = CURRENT_TIMESTAMP
       FROM ofertas_curso oc
       WHERE a.id = $1
         AND a.oferta_curso_id = oc.id
         AND a.creado_por = $3
         AND oc.docente_id = $3
       RETURNING
         a.id,
         a.estado AS status`,
      [anuncioId, estado, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message:
          "Anuncio no encontrado o no tienes permiso para modificarlo.",
      });
    }

    return res.status(200).json({
      anuncio: result.rows[0],
    });
  } catch (error) {
    console.error("Error cambiando estado del anuncio:", error);

    return res.status(500).json({
      message: "No se pudo cambiar el estado del anuncio.",
    });
  }
}

/**
 * DELETE /api/anuncios/:anuncioId
 * Eliminar un anuncio propio.
 */
export async function eliminarAnuncio(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = idPositivo(req.userId);
    const anuncioId = idPositivo(req.params.anuncioId);

    if (!userId || !anuncioId) {
      return res.status(400).json({
        message: "Usuario o anuncio no válido.",
      });
    }

    const usuario = await obtenerUsuarioActivo(userId);

    if (!usuario || usuario.rol !== "Docente") {
      return res.status(403).json({
        message: "Solo un docente puede eliminar anuncios.",
      });
    }

    const result = await pool.query(
      `DELETE FROM anuncios a
       USING ofertas_curso oc
       WHERE a.id = $1
         AND a.oferta_curso_id = oc.id
         AND a.creado_por = $2
         AND oc.docente_id = $2
       RETURNING a.id`,
      [anuncioId, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message:
          "Anuncio no encontrado o no tienes permiso para eliminarlo.",
      });
    }

    return res.status(200).json({
      message: "Anuncio eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando anuncio:", error);

    return res.status(500).json({
      message: "No se pudo eliminar el anuncio.",
    });
  }
}

/**
 * POST /api/anuncios/:anuncioId/lectura
 * Registrar que el alumno abrió un anuncio.
 */
export async function marcarAnuncioLeido(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = idPositivo(req.userId);
    const anuncioId = idPositivo(req.params.anuncioId);

    if (!userId || !anuncioId) {
      return res.status(400).json({
        message: "Usuario o anuncio no válido.",
      });
    }

    const usuario = await obtenerUsuarioActivo(userId);

    if (!usuario || usuario.rol !== "Estudiante") {
      return res.status(403).json({
        message:
          "Solo un estudiante puede marcar un anuncio como leído.",
      });
    }

    const autorizado = await pool.query(
      `SELECT a.id
       FROM anuncios a
       INNER JOIN ofertas_curso oc ON oc.id = a.oferta_curso_id
       INNER JOIN matriculas m ON m.oferta_curso_id = oc.id
       WHERE a.id = $1
         AND m.estudiante_id = $2
         AND m.estado IN ('Activa', 'Completada')
         AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
         AND oc.publicado = TRUE
         AND a.estado = 'Publicado'
       LIMIT 1`,
      [anuncioId, userId]
    );

    if (!autorizado.rowCount) {
      return res.status(404).json({
        message:
          "Anuncio no encontrado o no disponible para este alumno.",
      });
    }

    await pool.query(
      `INSERT INTO lecturas_anuncio (
         anuncio_id,
         usuario_id
       )
       VALUES ($1, $2)
       ON CONFLICT (anuncio_id, usuario_id) DO NOTHING`,
      [anuncioId, userId]
    );

    return res.status(200).json({
      leido: true,
    });
  } catch (error) {
    console.error("Error registrando lectura de anuncio:", error);

    return res.status(500).json({
      message: "No se pudo registrar la lectura del anuncio.",
    });
  }
}