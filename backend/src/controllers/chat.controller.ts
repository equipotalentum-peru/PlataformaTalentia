import type { Response } from "express";
import {
  createChatFileKey,
  deleteObjectFromR2,
  getObjectFromR2,
  streamBodyToResponse,
  stripR2Prefix,
  uploadBufferToR2,
} from "../services/r2.service";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import type { Express } from "express";
import type { Server, } from "socket.io";
import { construirSalaChat, construirSalaUsuario, } from "../realtime/chat-room";

function validarId(value: unknown) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function obtenerIniciales(
  nombres: string,
  apellidos?: string | null
) {
  const primera =
    nombres.trim().charAt(0).toUpperCase();

  const apellido =
    apellidos?.trim().charAt(0).toUpperCase() ?? "";

  if (apellido) {
    return `${primera}${apellido}`;
  }

  const partes =
    nombres.trim().split(/\s+/);

  if (partes.length > 1) {
    return (
      partes[0].charAt(0) +
      partes[1].charAt(0)
    ).toUpperCase();
  }

  return primera;
}

function nombreCompleto(
  nombres: string,
  apellidos?: string | null
) {
  return `${nombres} ${
    apellidos ?? ""
  }`.trim();
}

function emitirMensajeChat(
  req: AuthenticatedRequest,
  datos: {
    cursoId: number;
    ofertaCursoId: number;
    remitenteId: number;
    destinatarioId: number;
    mensaje: {
      id: number;
      tipo: string;
      contenido: string | null;
      enviadoEn: string;
      file?: {
        id: number;
        name: string;
        size: string;
        downloadUrl: string;
      };
    };
  }
) {
  const io = req.app.get("io") as Server | undefined;

  if (!io) return;

  const salaConversacion = construirSalaChat(
    datos.ofertaCursoId,
    datos.remitenteId,
    datos.destinatarioId
  );

  // Envía el mensaje a los participantes de la conversación abierta.
  io.to(salaConversacion).emit(
    "chat:mensaje:nuevo",
    datos
  );

  // Notifica al destinatario aunque esté viendo otro contacto.
  io.to(
    construirSalaUsuario(datos.destinatarioId)
  ).emit("chat:mensaje:notificacion", {
    cursoId: datos.cursoId,
    remitenteId: datos.remitenteId,
    destinatarioId: datos.destinatarioId,
    mensajeId: datos.mensaje.id,
  });
}

/*
 * Obtiene la oferta del curso a la que
 * tiene acceso el usuario actual.
 */
export async function obtenerAccesoCurso(
  usuarioId: number,
  cursoId: number
) {
  const result = await pool.query(
    `
    SELECT
      u.id AS usuario_id,
      u.rol,

      oc.id AS oferta_curso_id,
      oc.docente_id,

      c.id AS curso_id,
      c.nombre AS curso_nombre,
      c.codigo AS curso_codigo

    FROM usuarios u

    INNER JOIN cursos c
      ON c.id = $2

    INNER JOIN ofertas_curso oc
      ON oc.curso_id = c.id

    WHERE u.id = $1
      AND u.activo = TRUE

      AND c.estado = 'Activo'

      AND oc.publicado = TRUE

      AND oc.estado IN (
        'Programado',
        'En curso',
        'Finalizado'
      )

      AND (
        (
          u.rol = 'Estudiante'
          AND EXISTS (
            SELECT 1
            FROM matriculas m
            WHERE m.oferta_curso_id = oc.id
              AND m.estudiante_id = u.id
              AND m.estado IN (
                'Activa',
                'Completada'
              )
          )
        )

        OR

        (
          u.rol = 'Docente'
          AND oc.docente_id = u.id
        )
      )

    ORDER BY
      oc.actualizado_en DESC,
      oc.id DESC

    LIMIT 1
    `,
    [usuarioId, cursoId]
  );

  return result.rows[0] ?? null;
}

/*
 * Obtiene o crea la conversación entre
 * dos usuarios dentro de una oferta.
 */
async function obtenerOCrearConversacion(
  ofertaCursoId: number,
  usuarioA: number,
  usuarioB: number
) {
  const usuario1 = Math.min(
    usuarioA,
    usuarioB
  );

  const usuario2 = Math.max(
    usuarioA,
    usuarioB
  );

  const result = await pool.query(
    `
    INSERT INTO conversaciones_chat (
      oferta_curso_id,
      usuario_1_id,
      usuario_2_id
    )
    VALUES (
      $1,
      $2,
      $3
    )

    ON CONFLICT (
      oferta_curso_id,
      usuario_1_id,
      usuario_2_id
    )
    DO UPDATE
      SET id =
        conversaciones_chat.id

    RETURNING id
    `,
    [
      ofertaCursoId,
      usuario1,
      usuario2,
    ]
  );

  return Number(
    result.rows[0].id
  );
}

/*
 * Verifica que el contacto pertenezca
 * al mismo curso y rol permitido.
 */
export async function verificarContacto(
  ofertaCursoId: number,
  usuarioActualId: number,
  contactoId: number,
  rol: string
) {
  if (rol === "Estudiante") {
    const result =
      await pool.query(
        `
        SELECT u.id
        FROM usuarios u
        WHERE u.id = $1
          AND u.activo = TRUE

          AND (
            u.id = (
              SELECT docente_id
              FROM ofertas_curso
              WHERE id = $2
            )

            OR EXISTS (
              SELECT 1
              FROM matriculas m
              WHERE m.oferta_curso_id = $2
                AND m.estudiante_id = u.id
                AND m.estado IN (
                  'Activa',
                  'Completada'
                )
            )
          )

          AND u.id <> $3

        LIMIT 1
        `,
        [
          contactoId,
          ofertaCursoId,
          usuarioActualId,
        ]
      );

    return Boolean(result.rowCount);
  }

  if (rol === "Docente") {
    const result =
      await pool.query(
        `
        SELECT u.id
        FROM usuarios u

        INNER JOIN matriculas m
          ON m.estudiante_id = u.id

        WHERE u.id = $1
          AND u.activo = TRUE

          AND m.oferta_curso_id = $2
          AND m.estado IN (
            'Activa',
            'Completada'
          )

        LIMIT 1
        `,
        [
          contactoId,
          ofertaCursoId,
        ]
      );

    return Boolean(
      result.rowCount
    );
  }

  return false;
}

/* =========================================================
   CURSOS DE CHAT
========================================================= */

export async function obtenerCursosChat(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId =
      validarId(req.userId);

    if (!usuarioId) {
      return res.status(401).json({
        message:
          "Sesión no válida.",
      });
    }

    const usuario =
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

    if (!usuario.rowCount) {
      return res.status(401).json({
        message:
          "Usuario no encontrado.",
      });
    }

    const rol =
      usuario.rows[0].rol;

    if (
      rol !== "Estudiante" &&
      rol !== "Docente"
    ) {
      return res.status(403).json({
        message:
          "El chat no está disponible para este rol.",
      });
    }

    let result;

    if (rol === "Estudiante") {
      result = await pool.query(
        `
        SELECT DISTINCT ON (c.id)

          c.id,
          c.nombre,
          c.codigo,

          COALESCE(
            docente.nombres,
            ''
          ) AS docente_nombres,

          COALESCE(
            docente.apellidos,
            ''
          ) AS docente_apellidos,

          (
            SELECT COUNT(*)::INTEGER
            FROM matriculas m2
            WHERE m2.oferta_curso_id = oc.id
              AND m2.estado IN (
                'Activa',
                'Completada'
              )
          ) AS miembros

        FROM matriculas m

        INNER JOIN ofertas_curso oc
          ON oc.id = m.oferta_curso_id

        INNER JOIN cursos c
          ON c.id = oc.curso_id

        LEFT JOIN usuarios docente
          ON docente.id = oc.docente_id

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

        ORDER BY
          c.id,
          oc.actualizado_en DESC,
          oc.id DESC
        `,
        [usuarioId]
      );
    } else {
      result = await pool.query(
        `
        SELECT DISTINCT ON (c.id)

          c.id,
          c.nombre,
          c.codigo,

          COALESCE(
            docente.nombres,
            ''
          ) AS docente_nombres,

          COALESCE(
            docente.apellidos,
            ''
          ) AS docente_apellidos,

          (
            SELECT COUNT(*)::INTEGER
            FROM matriculas m2
            WHERE m2.oferta_curso_id = oc.id
              AND m2.estado IN (
                'Activa',
                'Completada'
              )
          ) AS miembros

        FROM ofertas_curso oc

        INNER JOIN cursos c
          ON c.id = oc.curso_id

        LEFT JOIN usuarios docente
          ON docente.id = oc.docente_id

        WHERE oc.docente_id = $1

          AND oc.estado IN (
            'Programado',
            'En curso',
            'Finalizado'
          )

          AND oc.publicado = TRUE

          AND c.estado = 'Activo'

        ORDER BY
          c.id,
          oc.actualizado_en DESC,
          oc.id DESC
        `,
        [usuarioId]
      );
    }

    return res.status(200).json({
      cursos: result.rows.map(
        (row) => ({
          id: Number(row.id),

          nombre:
            row.nombre,

          codigo:
            row.codigo,

          initials:
            obtenerIniciales(
              row.docente_nombres ||
                row.nombre,
              row.docente_apellidos
            ),

          miembros:
            Number(row.miembros),
        })
      ),
    });
  } catch (error) {
    console.error(
      "Error obteniendo cursos del chat:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener los cursos del chat.",
    });
  }
}

/* =========================================================
   CONTACTOS
========================================================= */

export async function obtenerContactosChat(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId =
      validarId(req.userId);

    const cursoId =
      validarId(
        req.params.cursoId
      );

    if (!usuarioId || !cursoId) {
      return res.status(400).json({
        message:
          "Solicitud no válida.",
      });
    }

    const acceso =
      await obtenerAccesoCurso(
        usuarioId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes acceso a este curso.",
      });
    }

    let contactos;

    if (
      acceso.rol ===
      "Estudiante"
    ) {
      contactos =
        await pool.query(
          `
          WITH candidatos AS (

            /*
             * Docente
             */
            SELECT
              u.id,
              u.nombres,
              u.apellidos,
              u.rol,
              0 AS orden_tipo

            FROM usuarios u

            WHERE u.id =
              $2
              AND u.activo = TRUE

            UNION ALL

            /*
             * Compañeros
             */
            SELECT
              u.id,
              u.nombres,
              u.apellidos,
              u.rol,
              1 AS orden_tipo

            FROM matriculas m

            INNER JOIN usuarios u
              ON u.id =
                m.estudiante_id

            WHERE m.oferta_curso_id =
              $1

              AND m.estado IN (
                'Activa',
                'Completada'
              )

              AND u.id <> $3
              AND u.activo = TRUE
          )

          SELECT
            candidatos.id,
            candidatos.nombres,
            candidatos.apellidos,
            candidatos.rol,

            conv.id AS conversacion_id,

            EXISTS (
              SELECT 1
              FROM mensajes_chat mx

              WHERE mx.conversacion_id =
                conv.id

                AND mx.remitente_id <>
                  $3

                AND mx.eliminado_en IS NULL

                AND mx.id >
                  COALESCE(
                    (
                      SELECT lc.ultimo_mensaje_leido_id
                      FROM lecturas_chat lc
                      WHERE lc.conversacion_id = conv.id
                        AND lc.usuario_id = $3
                    ),
                    0
                  )
            ) AS no_leido

          FROM candidatos

          LEFT JOIN LATERAL (
            SELECT cc.id
            FROM conversaciones_chat cc

            WHERE cc.oferta_curso_id =
              $1

              AND (
                (
                  cc.usuario_1_id =
                    LEAST(
                      $3::bigint,
                      candidatos.id
                    )

                  AND

                  cc.usuario_2_id =
                    GREATEST(
                      $3::bigint,
                      candidatos.id
                    )
                )
              )

            LIMIT 1
          ) conv
            ON TRUE

          ORDER BY
            candidatos.orden_tipo,
            candidatos.nombres,
            candidatos.apellidos
          `,
          [
            acceso.oferta_curso_id,
            acceso.docente_id,
            usuarioId,
          ]
        );
    } else {
      contactos =
        await pool.query(
          `
          SELECT
            u.id,
            u.nombres,
            u.apellidos,
            u.rol,

            conv.id AS conversacion_id,

            EXISTS (
              SELECT 1
              FROM mensajes_chat mx

              WHERE mx.conversacion_id =
                conv.id

                AND mx.remitente_id <>
                  $2

                AND mx.eliminado_en IS NULL

                AND mx.enviado_en >
                  COALESCE(
                    (
                      SELECT lc.leido_en
                      FROM lecturas_chat lc
                      WHERE lc.conversacion_id =
                        conv.id

                        AND lc.usuario_id =
                          $2
                    ),
                    TO_TIMESTAMP(0)
                  )
            ) AS no_leido

          FROM matriculas m

          INNER JOIN usuarios u
            ON u.id =
              m.estudiante_id

          LEFT JOIN LATERAL (
            SELECT cc.id
            FROM conversaciones_chat cc

            WHERE cc.oferta_curso_id =
              $1

              AND cc.usuario_1_id =
                LEAST(
                  $2::bigint,
                  u.id
                )

              AND cc.usuario_2_id =
                GREATEST(
                  $2::bigint,
                  u.id
                )

            LIMIT 1
          ) conv
            ON TRUE

          WHERE m.oferta_curso_id =
            $1

            AND m.estado IN (
              'Activa',
              'Completada'
            )

            AND u.activo = TRUE

          ORDER BY
            u.nombres,
            u.apellidos
          `,
          [
            acceso.oferta_curso_id,
            usuarioId,
          ]
        );
    }

    return res.status(200).json({
      curso: {
        id: Number(acceso.curso_id),
        nombre:
          acceso.curso_nombre,
        codigo:
          acceso.curso_codigo,
      },

      contactos:
        contactos.rows.map(
          (row) => ({
            id:
              Number(row.id),

            initials:
              obtenerIniciales(
                row.nombres,
                row.apellidos
              ),

            name:
              row.rol === "Docente"
                ? `Prof. ${nombreCompleto(
                    row.nombres,
                    row.apellidos
                  )}`
                : nombreCompleto(
                    row.nombres,
                    row.apellidos
                  ),

            role:
              row.rol,

            unread:
              Boolean(
                row.no_leido
              ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "Error obteniendo contactos:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener los contactos.",
    });
  }
}

/* =========================================================
   MENSAJES
========================================================= */

export async function obtenerMensajesChat(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);
    const contactoId = validarId(req.params.contactoId);

    if (!usuarioId || !cursoId || !contactoId) {
      return res.status(400).json({
        message:
          "Solicitud no válida.",
      });
    }

    const acceso = await obtenerAccesoCurso(usuarioId, cursoId);

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes acceso a este curso.",
      });
    }

    const contactoValido = await verificarContacto(acceso.oferta_curso_id, usuarioId, contactoId, acceso.rol);

    if (!contactoValido) {
      return res.status(403).json({
        message:
          "No puedes conversar con este usuario.",
      });
    }

    /*
     * No creamos una conversación
     * solamente por abrirla.
     */
    const conversacion =
      await pool.query(
        `
        SELECT id
        FROM conversaciones_chat

        WHERE oferta_curso_id =
          $1

          AND usuario_1_id =
            LEAST(
              $2::bigint,
              $3::bigint
            )

          AND usuario_2_id =
            GREATEST(
              $2::bigint,
              $3::bigint
            )

        LIMIT 1
        `,
        [
          acceso.oferta_curso_id,
          usuarioId,
          contactoId,
        ]
      );

    if (!conversacion.rowCount) {
      return res.status(200).json({
        mensajes: [],
      });
    }

    const conversacionId =
      Number(
        conversacion.rows[0].id
      );

    const result =
      await pool.query(
        `
        SELECT *
        FROM (
          SELECT
            m.id,
            m.remitente_id,
            m.tipo,
            m.contenido,
            m.enviado_en,
            m.editado_en,
            m.eliminado_en,

            a.id AS adjunto_id,
            a.nombre_archivo,
            a.mime_type,
            a.tamano_bytes

          FROM mensajes_chat m

          LEFT JOIN adjuntos_chat a
            ON a.mensaje_id =
              m.id

          WHERE m.conversacion_id =
            $1

          ORDER BY m.id DESC

          LIMIT 50
        ) mensajes

        ORDER BY
          mensajes.id ASC
        `,
        [conversacionId]
      );

    /*
     * Marcar como leídos
     */
    const ultimo =
      result.rows[
        result.rows.length - 1
      ];

    if (ultimo) {
      await pool.query(
        `
        INSERT INTO lecturas_chat (
          conversacion_id,
          usuario_id,
          ultimo_mensaje_leido_id,
          leido_en
        )
        VALUES (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP
        )

        ON CONFLICT (
          conversacion_id,
          usuario_id
        )
        DO UPDATE SET
          ultimo_mensaje_leido_id =
            EXCLUDED.ultimo_mensaje_leido_id,

          leido_en =
            EXCLUDED.leido_en
        `,
        [
          conversacionId,
          usuarioId,
          Number(ultimo.id),
        ]
      );
    }

    return res.status(200).json({
      mensajes: result.rows.map((row) => {
        const eliminado = Boolean(row.eliminado_en);

        return {
          id: Number(row.id),

          sender:
            Number(row.remitente_id) === usuarioId
              ? "me"
              : "other",

          deleted: eliminado,

          text:
            !eliminado && row.tipo === "Texto"
              ? row.contenido
              : undefined,

          edited:
            !eliminado && Boolean(row.editado_en),

          file:
            !eliminado && row.adjunto_id
              ? {
                  id: Number(row.adjunto_id),
                  name: row.nombre_archivo,
                  size: row.tamano_bytes
                    ? `${(
                        Number(row.tamano_bytes) /
                        (1024 * 1024)
                      ).toFixed(1)} MB`
                    : "",
                  downloadUrl: `/api/chat/adjuntos/${Number(row.adjunto_id)}`,
                }
              : undefined,

          time: new Date(row.enviado_en).toISOString(),
        };
      }),
    });
  } catch (error) {
    console.error(
      "Error obteniendo mensajes:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudieron obtener los mensajes.",
    });
  }
}

/* =========================================================
   ENVIAR MENSAJE
========================================================= */

export async function enviarMensajeChat(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId =
      validarId(req.userId);

    const cursoId =
      validarId(
        req.params.cursoId
      );

    const contactoId =
      validarId(
        req.params.contactoId
      );

    if (
      !usuarioId ||
      !cursoId ||
      !contactoId
    ) {
      return res.status(400).json({
        message:
          "Solicitud no válida.",
      });
    }

    const contenido =
      typeof req.body?.contenido ===
      "string"
        ? req.body.contenido.trim()
        : "";

    if (!contenido) {
      return res.status(400).json({
        message:
          "El mensaje no puede estar vacío.",
      });
    }

    const acceso =
      await obtenerAccesoCurso(
        usuarioId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes acceso a este curso.",
      });
    }

    const contactoValido =
      await verificarContacto(
        acceso.oferta_curso_id,
        usuarioId,
        contactoId,
        acceso.rol
      );

    if (!contactoValido) {
      return res.status(403).json({
        message:
          "No puedes enviar mensajes a este usuario.",
      });
    }

    const conversacionId = await obtenerOCrearConversacion(acceso.oferta_curso_id, usuarioId, contactoId);
    const result = await pool.query(
        `
        INSERT INTO mensajes_chat (
          conversacion_id,
          remitente_id,
          tipo,
          contenido
        )
        VALUES (
          $1,
          $2,
          'Texto',
          $3
        )

        RETURNING
          id,
          remitente_id,
          tipo,
          contenido,
          enviado_en
        `,
        [
          conversacionId,
          usuarioId,
          contenido,
        ]
      );

    const mensajeCreado = result.rows[0];

      emitirMensajeChat(
        req,
        {
          cursoId,
          ofertaCursoId:
            Number(
              acceso.oferta_curso_id
            ),
          remitenteId:
            usuarioId,
          destinatarioId:
            contactoId,

          mensaje: {
            id:
              Number(
                mensajeCreado.id
              ),

            tipo:
              mensajeCreado.tipo,

            contenido:
              mensajeCreado
                .contenido,

            enviadoEn:
              new Date(
                mensajeCreado
                  .enviado_en
              ).toISOString(),
          },
        }
      );

    return res.status(201).json({
      mensaje: {
        id:
          Number(
            result.rows[0].id
          ),

        sender: "me",

        text:
          result.rows[0]
            .contenido,

        time:
          new Date(
            result.rows[0]
              .enviado_en
          ).toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Error enviando mensaje:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo enviar el mensaje.",
    });
  }
}

export async function editarMensajeChat(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);
    const contactoId = validarId(req.params.contactoId);
    const mensajeId = validarId(req.params.mensajeId);

    const contenido =
      typeof req.body?.contenido === "string"
        ? req.body.contenido.trim()
        : "";

    if (!usuarioId || !cursoId || !contactoId || !mensajeId) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    if (!contenido || contenido.length > 10000) {
      return res.status(400).json({
        message: "El mensaje debe tener entre 1 y 10000 caracteres.",
      });
    }

    const acceso = await obtenerAccesoCurso(usuarioId, cursoId);

    if (!acceso) {
      return res.status(403).json({
        message: "No tienes acceso a este curso.",
      });
    }

    const contactoValido = await verificarContacto(
      acceso.oferta_curso_id,
      usuarioId,
      contactoId,
      acceso.rol
    );

    if (!contactoValido) {
      return res.status(403).json({
        message: "No puedes conversar con este usuario.",
      });
    }

    const existente = await pool.query(
      `
      SELECT
        m.id,
        m.remitente_id,
        m.tipo,
        cc.id AS conversacion_id
      FROM mensajes_chat m
      INNER JOIN conversaciones_chat cc
        ON cc.id = m.conversacion_id
      WHERE m.id = $1
        AND cc.oferta_curso_id = $2
        AND cc.usuario_1_id =
          LEAST($3::bigint, $4::bigint)
        AND cc.usuario_2_id =
          GREATEST($3::bigint, $4::bigint)
        AND m.eliminado_en IS NULL
      LIMIT 1
      `,
      [
        mensajeId,
        acceso.oferta_curso_id,
        usuarioId,
        contactoId,
      ]
    );

    if (!existente.rowCount) {
      return res.status(404).json({
        message: "El mensaje no existe en esta conversación.",
      });
    }

    const mensajeOriginal = existente.rows[0];

    if (Number(mensajeOriginal.remitente_id) !== usuarioId) {
      return res.status(403).json({
        message: "Solo puedes editar tus propios mensajes.",
      });
    }

    if (mensajeOriginal.tipo !== "Texto") {
      return res.status(400).json({
        message: "Solo se pueden editar mensajes de texto.",
      });
    }

    const actualizado = await pool.query(
      `
      UPDATE mensajes_chat
      SET
        contenido = $2,
        editado_en = CURRENT_TIMESTAMP
      WHERE id = $1
        AND remitente_id = $3
        AND eliminado_en IS NULL
      RETURNING id, contenido, editado_en
      `,
      [
        mensajeId,
        contenido,
        usuarioId,
      ]
    );

    const row = actualizado.rows[0];

    const editadoEn = new Date(row.editado_en).toISOString();

    const io = req.app.get("io") as Server | undefined;

    if (io) {
      const sala = construirSalaChat(
        Number(acceso.oferta_curso_id),
        usuarioId,
        contactoId
      );

      io.to(sala).emit("chat:mensaje:editado", {
        cursoId,
        mensajeId,
        contenido: row.contenido,
        editadoEn,
      });
    }

    return res.status(200).json({
      mensaje: {
        id: Number(row.id),
        text: row.contenido,
        edited: true,
        editedAt: editadoEn,
      },
    });
  } catch (error) {
    console.error("Error editando mensaje:", error);

    return res.status(500).json({
      message: "No se pudo editar el mensaje.",
    });
  }
}

export async function eliminarMensajeChat(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);
    const contactoId = validarId(req.params.contactoId);
    const mensajeId = validarId(req.params.mensajeId);

    if (!usuarioId || !cursoId || !contactoId || !mensajeId) {
      return res.status(400).json({
        message: "Solicitud no válida.",
      });
    }

    const acceso = await obtenerAccesoCurso(usuarioId, cursoId);

    if (!acceso) {
      return res.status(403).json({
        message: "No tienes acceso a este curso.",
      });
    }

    const contactoValido = await verificarContacto(
      acceso.oferta_curso_id,
      usuarioId,
      contactoId,
      acceso.rol
    );

    if (!contactoValido) {
      return res.status(403).json({
        message: "No puedes conversar con este usuario.",
      });
    }

    const existente = await pool.query(
      `
      SELECT
        m.id,
        m.remitente_id,
        cc.id AS conversacion_id,
        a.ruta_archivo
      FROM mensajes_chat m
      INNER JOIN conversaciones_chat cc
        ON cc.id = m.conversacion_id
      LEFT JOIN adjuntos_chat a
        ON a.mensaje_id = m.id
      WHERE m.id = $1
        AND cc.oferta_curso_id = $2
        AND cc.usuario_1_id =
          LEAST($3::bigint, $4::bigint)
        AND cc.usuario_2_id =
          GREATEST($3::bigint, $4::bigint)
        AND m.eliminado_en IS NULL
      LIMIT 1
      `,
      [
        mensajeId,
        acceso.oferta_curso_id,
        usuarioId,
        contactoId,
      ]
    );

    if (!existente.rowCount) {
      return res.status(404).json({
        message: "El mensaje ya no existe.",
      });
    }

    const mensajeOriginal = existente.rows[0];

    if (Number(mensajeOriginal.remitente_id) !== usuarioId) {
      return res.status(403).json({
        message: "Solo puedes eliminar tus propios mensajes.",
      });
    }

    await pool.query(
      `
      UPDATE mensajes_chat
      SET eliminado_en = CURRENT_TIMESTAMP
      WHERE id = $1
        AND remitente_id = $2
        AND eliminado_en IS NULL
      `,
      [
        mensajeId,
        usuarioId,
      ]
    );

    // Si es un archivo en R2, intentamos retirar también el objeto.
    // La eliminación lógica del mensaje no depende de que R2 responda.
    const ruta = mensajeOriginal.ruta_archivo;

    if (typeof ruta === "string" && ruta.startsWith("r2://")) {
      try {
        await deleteObjectFromR2(stripR2Prefix(ruta));
      } catch (error) {
        console.error(
          "El mensaje se eliminó, pero no se pudo retirar el objeto de R2:",
          error
        );
      }
    }

    const io = req.app.get("io") as Server | undefined;

    if (io) {
      const sala = construirSalaChat(
        Number(acceso.oferta_curso_id),
        usuarioId,
        contactoId
      );

      io.to(sala).emit("chat:mensaje:eliminado", {
        cursoId,
        mensajeId,
      });

      // Actualiza los indicadores de lectura de ambos participantes.
      io.to(construirSalaUsuario(usuarioId)).emit(
        "chat:contactos:actualizar",
        { cursoId }
      );

      io.to(construirSalaUsuario(contactoId)).emit(
        "chat:contactos:actualizar",
        { cursoId }
      );
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error eliminando mensaje:", error);

    return res.status(500).json({
      message: "No se pudo eliminar el mensaje.",
    });
  }
}

/* =========================================================
   MARCAR CONVERSACIÓN COMO LEÍDA
========================================================= */

export async function marcarChatLeido(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId =
      validarId(req.userId);

    const cursoId =
      validarId(
        req.params.cursoId
      );

    const contactoId =
      validarId(
        req.params.contactoId
      );

    if (
      !usuarioId ||
      !cursoId ||
      !contactoId
    ) {
      return res.status(400).json({
        message:
          "Solicitud no válida.",
      });
    }

    const acceso =
      await obtenerAccesoCurso(
        usuarioId,
        cursoId
      );

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes acceso a este curso.",
      });
    }

    const contactoValido =
      await verificarContacto(
        acceso.oferta_curso_id,
        usuarioId,
        contactoId,
        acceso.rol
      );

    if (!contactoValido) {
      return res.status(403).json({
        message:
          "No puedes acceder a esta conversación.",
      });
    }

    const conversacion =
      await pool.query(
        `
        SELECT id
        FROM conversaciones_chat
        WHERE oferta_curso_id =
          $1

        AND usuario_1_id =
          LEAST(
            $2::bigint,
            $3::bigint
          )

        AND usuario_2_id =
          GREATEST(
            $2::bigint,
            $3::bigint
          )

        LIMIT 1
        `,
        [
          acceso.oferta_curso_id,
          usuarioId,
          contactoId,
        ]
      );

    if (!conversacion.rowCount) {
      return res.status(204).send();
    }

    const conversacionId =
      Number(
        conversacion.rows[0].id
      );

    const ultimo =
      await pool.query(
        `
        SELECT id
        FROM mensajes_chat
        WHERE conversacion_id =
          $1
          AND eliminado_en IS NULL
        ORDER BY id DESC
        LIMIT 1
        `,
        [conversacionId]
      );

    if (ultimo.rowCount) {
      await pool.query(
        `
        INSERT INTO lecturas_chat (
          conversacion_id,
          usuario_id,
          ultimo_mensaje_leido_id,
          leido_en
        )
        VALUES (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP
        )

        ON CONFLICT (
          conversacion_id,
          usuario_id
        )
        DO UPDATE SET
          ultimo_mensaje_leido_id =
            EXCLUDED.ultimo_mensaje_leido_id,

          leido_en =
            EXCLUDED.leido_en
        `,
        [
          conversacionId,
          usuarioId,
          Number(
            ultimo.rows[0].id
          ),
        ]
      );
    }

    return res.status(204).send();
  } catch (error) {
    console.error(
      "Error marcando chat como leído:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo marcar la conversación como leída.",
    });
  }
}

/* =========================================================
   DESCARGAR ADJUNTO
========================================================= */

export async function descargarAdjuntoChat(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const usuarioId =
      validarId(req.userId);

    const adjuntoId =
      validarId(
        req.params.adjuntoId
      );

    if (
      !usuarioId ||
      !adjuntoId
    ) {
      return res.status(400).json({
        message:
          "Solicitud no válida.",
      });
    }

    const result =
      await pool.query(
        `
        SELECT
          a.id,
          a.nombre_archivo,
          a.ruta_archivo,
          a.mime_type,
          a.tamano_bytes,

          cc.usuario_1_id,
          cc.usuario_2_id

        FROM adjuntos_chat a

        INNER JOIN mensajes_chat m
          ON m.id = a.mensaje_id

        INNER JOIN conversaciones_chat cc
          ON cc.id = m.conversacion_id

        WHERE a.id = $1

          AND (cc.usuario_1_id = $2 OR cc.usuario_2_id = $2)
          AND m.eliminado_en IS NULL

        LIMIT 1
        `,
        [adjuntoId, usuarioId,]
      );

    if (!result.rowCount) {
      return res.status(404).json({
        message:
          "Archivo no encontrado.",
      });
    }

    const row = result.rows[0];

    const ruta = typeof row.ruta_archivo === "string" ? row.ruta_archivo.trim() : "";

    if (!ruta) {
      return res.status(404).json({
        message:
          "Archivo no disponible.",
      });
    }

    /*
     * ==========================================
     * CLOUDFLARE R2
     * ==========================================
     */

    if (!ruta.startsWith("r2://")) {
      return res.status(404).json({
        message: "El archivo no está almacenado en Cloudflare R2.",
      });
    }

    const key = stripR2Prefix(ruta);

    if (!key) {
      return res.status(404).json({
        message:
          "Archivo no disponible.",
      });
    }

    const object = await getObjectFromR2(key);

    if (!object.Body) {
      return res.status(404).json({
        message:
          "Archivo no disponible en Cloudflare R2.",
      });
    }

    res.setHeader(
      "Cache-Control",
      "private, no-store"
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    res.setHeader(
      "Content-Type",
      object.ContentType ??
        row.mime_type ??
        "application/octet-stream"
    );

    if (object.ContentLength) {
      res.setHeader(
        "Content-Length",
        String(object.ContentLength)
      );
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(
        row.nombre_archivo
      )}`
    );

    streamBodyToResponse(
      object.Body,
      res
    );
  } catch (error) {
    console.error(
      "Error descargando adjunto:",
      error
    );

    return res.status(404).json({
      message:
        "No se pudo encontrar el archivo.",
    });
  }
}

export async function enviarAdjuntoChat(
  req: AuthenticatedRequest,
  res: Response
) {
  let objetoR2: string | null = null;

  try {
    const usuarioId = validarId(req.userId);
    const cursoId = validarId(req.params.cursoId);
    const contactoId = validarId(req.params.contactoId);
    const file = (req as AuthenticatedRequest & {
        file?: Express.Multer.File;
      }
    ).file;

    if (!usuarioId || !cursoId || !contactoId || !file) {
      return res.status(400).json({
        message:
          "Solicitud de archivo no válida.",
      });
    }

    if ( !file.buffer || !file.buffer.length ) {
      return res.status(400).json({
        message:
          "No se recibió el contenido del archivo.",
      });
    }

    const acceso = await obtenerAccesoCurso(usuarioId, cursoId);

    if (!acceso) {
      return res.status(403).json({
        message:
          "No tienes acceso a este curso.",
      });
    }

    const contactoValido = await verificarContacto(acceso.oferta_curso_id, usuarioId, contactoId,acceso.rol);

    if (!contactoValido) {
      return res.status(403).json({
        message:
          "No puedes enviar archivos a este usuario.",
      });
    }

    const conversacionId = await obtenerOCrearConversacion(acceso.oferta_curso_id, usuarioId, contactoId);

    /*
     * ==========================================
     * SUBIR DIRECTAMENTE A CLOUDFLARE R2
     * ==========================================
     */

    const key = createChatFileKey({
      courseId: cursoId,
      conversationId:
        conversacionId,
      originalName:
        file.originalname,
    });

    objetoR2 =
      await uploadBufferToR2({
        buffer:
          file.buffer,

        key,

        contentType:
          file.mimetype ||
          "application/octet-stream",

        contentLength:
          file.size,
      });

    /*
     * ==========================================
     * GUARDAR MENSAJE + ADJUNTO EN BD
     * ==========================================
     */

    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const mensaje =
        await client.query(
          `
          INSERT INTO mensajes_chat (
            conversacion_id,
            remitente_id,
            tipo,
            contenido
          )
          VALUES (
            $1,
            $2,
            'Archivo',
            NULL
          )

          RETURNING
            id,
            remitente_id,
            tipo,
            enviado_en
          `,
          [
            conversacionId,
            usuarioId,
          ]
        );

      const mensajeId =
        Number(
          mensaje.rows[0].id
        );

      const adjunto =
        await client.query(
          `
          INSERT INTO adjuntos_chat (
            mensaje_id,
            nombre_archivo,
            ruta_archivo,
            mime_type,
            tamano_bytes
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )

          RETURNING
            id
          `,
          [
            mensajeId,
            file.originalname,
            objetoR2,
            file.mimetype,
            file.size,
          ]
        );

      await client.query(
        "COMMIT"
      );

      const adjuntoId =
        Number(
          adjunto.rows[0].id
        );

      /*
       * Emitir mediante Socket.IO
       */
      emitirMensajeChat(
        req,
        {
          cursoId,

          ofertaCursoId:
            Number(
              acceso.oferta_curso_id
            ),

          remitenteId:
            usuarioId,

          destinatarioId:
            contactoId,

          mensaje: {
            id:
              mensajeId,

            tipo:
              "Archivo",

            contenido:
              null,

            enviadoEn:
              new Date(
                mensaje.rows[0]
                  .enviado_en
              ).toISOString(),

            file: {
              id:
                adjuntoId,

              name:
                file.originalname,

              size:
                `${(
                  file.size /
                  (1024 * 1024)
                ).toFixed(1)} MB`,

              downloadUrl:
                `/api/chat/adjuntos/${adjuntoId}`,
            },
          },
        }
      );

      return res.status(201).json({
        mensaje: {
          id:
            mensajeId,

          sender:
            "me",

          file: {
            id:
              adjuntoId,

            name:
              file.originalname,

            size:
              `${(
                file.size /
                (1024 * 1024)
              ).toFixed(1)} MB`,

            downloadUrl:
              `/api/chat/adjuntos/${adjuntoId}`,
          },

          time:
            new Date(
              mensaje.rows[0]
                .enviado_en
            ).toISOString(),
        },
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    /*
     * Si R2 ya recibió el archivo pero
     * PostgreSQL falló, eliminamos el objeto
     * para no dejar archivos huérfanos.
     */
    if (objetoR2) {
      try {
        await deleteObjectFromR2(
          stripR2Prefix(
            objetoR2
          )
        );
      } catch (deleteError) {
        console.error(
          "No se pudo eliminar el archivo huérfano de R2:",
          deleteError
        );
      }
    }

    console.error(
      "Error enviando adjunto:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo enviar el archivo.",
    });
  }
}