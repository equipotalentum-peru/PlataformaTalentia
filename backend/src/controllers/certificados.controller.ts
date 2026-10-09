import type {
  Response,
} from "express";

import pool
  from "../config/database";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  emitirCertificadoCurso,
  emitirCertificadosPendientesEstudiante,
} from "../services/certificados.service";

import {
  getObjectFromR2,
  isR2NotFoundError,
  isR2Path,
  streamBodyToResponse,
  stripR2Prefix,
} from "../services/r2.service";

function obtenerUsuarioId(
  req: AuthenticatedRequest
) {
  const id =
    Number(
      req.userId
    );

  return (
    Number.isSafeInteger(id) &&
    id > 0
  )
    ? id
    : null;
}

export async function listarCertificadosEstudiante(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId =
      obtenerUsuarioId(req);

    if (!estudianteId) {
      return res
        .status(401)
        .json({
          message:
            "Sesión no válida.",
        });
    }

    /*
     * Recupera también certificados
     * pendientes de cursos que ya
     * estaban al 100%.
     */
    await emitirCertificadosPendientesEstudiante(
      estudianteId
    );

    const result =
      await pool.query(
        `SELECT
           cert.id,

           c.nombre
             AS curso,

           c.codigo
             AS "codigoCurso",

           c.imagen_portada
             AS imagen,

           cert.numero_certificado
             AS "numeroCertificado",

           cert.codigo_verificacion
             AS "codigoVerificacion",

           cert.emitido_en
             AS "emitidoEn",

           'Completado'
             AS estado

         FROM certificados cert

         INNER JOIN matriculas m
           ON m.id =
              cert.matricula_id

         INNER JOIN
           ofertas_curso oc
           ON oc.id =
              m.oferta_curso_id

         INNER JOIN cursos c
           ON c.id =
              oc.curso_id

         WHERE
           m.estudiante_id = $1

           AND cert.modulo_id
               IS NULL

           AND cert.tipo =
               'Aprobacion'

         ORDER BY
           cert.emitido_en DESC,
           cert.id DESC`,
        [
          estudianteId,
        ]
      );

    return res
      .status(200)
      .json({
        certificados:
          result.rows,
      });

  } catch (error) {
    console.error(
      "Error obteniendo certificados:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "No se pudieron obtener los certificados.",
      });
  }
}

export async function obtenerCertificadoEstudiante(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId =
      obtenerUsuarioId(req);

    const certificadoId =
      Number(
        req.params
          .certificadoId
      );

    if (!estudianteId) {
      return res
        .status(401)
        .json({
          message:
            "Sesión no válida.",
        });
    }

    if (
      !Number.isSafeInteger(
        certificadoId
      ) ||
      certificadoId <= 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Certificado no válido.",
        });
    }

    const result =
      await pool.query(
        `SELECT
           cert.id,

           cert.matricula_id
             AS "matriculaId",

           c.nombre
             AS curso,

           c.codigo
             AS "codigoCurso",

           c.descripcion,

           c.imagen_portada
             AS imagen,

           CONCAT_WS(
             ' ',
             u.nombres,
             u.apellidos
           ) AS estudiante,

           cert.numero_certificado
             AS "numeroCertificado",

           cert.codigo_verificacion
             AS "codigoVerificacion",

           cert.emitido_en
             AS "emitidoEn",

           cert.ruta_archivo
             AS "rutaArchivo",

           CASE
             WHEN
               oc.fecha_inicio
                 IS NOT NULL

               AND
               oc.fecha_fin
                 IS NOT NULL

             THEN
               GREATEST(
                 1,
                 CEIL(
                   (
                     oc.fecha_fin -
                     oc.fecha_inicio +
                     1
                   ) / 30.0
                 )::INTEGER
               )::TEXT
               || ' meses'

             ELSE
               'No especificada'
           END AS duracion,

           'Completado'
             AS estado

         FROM certificados cert

         INNER JOIN matriculas m
           ON m.id =
              cert.matricula_id

         INNER JOIN
           ofertas_curso oc
           ON oc.id =
              m.oferta_curso_id

         INNER JOIN cursos c
           ON c.id =
              oc.curso_id

         INNER JOIN usuarios u
           ON u.id =
              m.estudiante_id

         WHERE
           cert.id = $1

           AND
             m.estudiante_id = $2

           AND
             cert.modulo_id
             IS NULL

           AND cert.tipo =
               'Aprobacion'

         LIMIT 1`,
        [
          certificadoId,
          estudianteId,
        ]
      );

    if (
      !result.rowCount
    ) {
      return res
        .status(404)
        .json({
          message:
            "Certificado no encontrado.",
        });
    }

    return res
      .status(200)
      .json({
        certificado:
          result.rows[0],
      });

  } catch (error) {
    console.error(
      "Error obteniendo certificado:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "No se pudo obtener el certificado.",
      });
  }
}

export async function descargarCertificadoEstudiante(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estudianteId =
      obtenerUsuarioId(req);

    const certificadoId =
      Number(
        req.params
          .certificadoId
      );

    if (!estudianteId) {
      return res
        .status(401)
        .json({
          message:
            "Sesión no válida.",
        });
    }

    if (
      !Number.isSafeInteger(
        certificadoId
      ) ||
      certificadoId <= 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Certificado no válido.",
        });
    }

    let result =
      await pool.query(
        `SELECT
           cert.id,
           cert.matricula_id,
           cert.ruta_archivo,
           cert.numero_certificado,

           c.codigo
             AS codigo_curso

         FROM certificados cert

         INNER JOIN matriculas m
           ON m.id =
              cert.matricula_id

         INNER JOIN
           ofertas_curso oc
           ON oc.id =
              m.oferta_curso_id

         INNER JOIN cursos c
           ON c.id =
              oc.curso_id

         WHERE
           cert.id = $1

           AND
             m.estudiante_id = $2

           AND
             cert.modulo_id
             IS NULL

           AND cert.tipo =
               'Aprobacion'

         LIMIT 1`,
        [
          certificadoId,
          estudianteId,
        ]
      );

    if (
      !result.rowCount
    ) {
      return res
        .status(404)
        .json({
          message:
            "Certificado no encontrado.",
        });
    }

    let certificado =
      result.rows[0];

    /*
     * Si existe la fila pero
     * todavía no hay PDF en R2,
     * intenta generarlo.
     */
    if (
      !isR2Path(
        String(
          certificado
            .ruta_archivo ??
            ""
        )
      )
    ) {
      await emitirCertificadoCurso(
        Number(
          certificado
            .matricula_id
        )
      );

      result =
        await pool.query(
          `SELECT
             cert.id,
             cert.matricula_id,
             cert.ruta_archivo,
             cert.numero_certificado,

             c.codigo
               AS codigo_curso

           FROM certificados cert

           INNER JOIN matriculas m
             ON m.id =
                cert.matricula_id

           INNER JOIN
             ofertas_curso oc
             ON oc.id =
                m.oferta_curso_id

           INNER JOIN cursos c
             ON c.id =
                oc.curso_id

           WHERE
             cert.id = $1

             AND
               m.estudiante_id =
               $2

           LIMIT 1`,
          [
            certificadoId,
            estudianteId,
          ]
        );

      certificado =
        result.rows[0];
    }

    const ruta =
      String(
        certificado
          .ruta_archivo ??
          ""
      ).trim();

    if (
      !isR2Path(ruta)
    ) {
      return res
        .status(404)
        .json({
          message:
            "PDF no disponible.",
        });
    }

    const key =
      stripR2Prefix(
        ruta
      );

    let object;

    try {
      object =
        await getObjectFromR2(
          key
        );

    } catch (error) {

      if (
        isR2NotFoundError(
          error
        )
      ) {
        return res
          .status(404)
          .json({
            message:
              "PDF no disponible en Cloudflare R2.",
          });
      }

      throw error;
    }

    if (!object.Body) {
      return res
        .status(404)
        .json({
          message:
            "PDF no disponible.",
        });
    }

    const fileName =
      `${certificado.numero_certificado}.pdf`;

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
        "application/pdf"
    );

    if (
      object.ContentLength !==
      undefined
    ) {
      res.setHeader(
        "Content-Length",
        String(
          object.ContentLength
        )
      );
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(
        fileName
      )}`
    );

    streamBodyToResponse(
      object.Body,
      res
    );

  } catch (error) {
    console.error(
      "Error descargando certificado:",
      error
    );

    if (
      !res.headersSent
    ) {
      return res
        .status(500)
        .json({
          message:
            "No se pudo descargar el certificado.",
        });
    }
  }
}