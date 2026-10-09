import { randomUUID } from "node:crypto";
import { PassThrough } from "node:stream";

import PDFDocument from "pdfkit";

import pool from "../config/database";

import {
  deleteObjectFromR2,
  isR2Path,
  slugifyFileName,
  stripR2Prefix,
  uploadStreamToR2,
} from "./r2.service";

type DatosCertificado = {
  matricula_id: number;
  estudiante_id: number;
  curso_id: number;
  curso: string;
  codigo_curso: string;
  estudiante: string;
  completado_en: string | Date | null;
  total_contenidos: number;
  contenidos_completados: number;
};

type CertificadoDb = {
  id: number;
  numero_certificado: string;
  codigo_verificacion: string;
  emitido_en: string | Date;
  ruta_archivo: string | null;
};

function formatearFecha(
  fecha: string | Date
) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone:
        "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

async function generarYSubirPdf({
  certificado,
  datos,
}: {
  certificado: CertificadoDb;
  datos: DatosCertificado;
}) {
  const nombreArchivo =
    `${certificado.numero_certificado}.pdf`;

  /*
   * Esta será la ruta visible
   * dentro del bucket talentia-files.
   */
  const key = [
    "certificates",
    `students/${datos.estudiante_id}`,
    `courses/${datos.curso_id}`,
    `${slugifyFileName(
      certificado.numero_certificado
    )}.pdf`,
  ].join("/");

  /*
   * PDFKit genera el PDF en memoria.
   * No creamos archivos temporales.
   */
  const stream =
    new PassThrough();

  const doc =
    new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });

  doc.pipe(stream);

  /*
   * Empieza la subida directa:
   * PDFKit → stream → Cloudflare R2.
   */
  const uploadPromise =
    uploadStreamToR2({
      body: stream,
      key,
      contentType:
        "application/pdf",
      originalName:
        nombreArchivo,
    });

  const fecha =
    formatearFecha(
      certificado.emitido_en
    );

  /*
   * BORDE
   */
  doc
    .lineWidth(2)
    .strokeColor("#2d97e8")
    .rect(
      25,
      25,
      792,
      545
    )
    .stroke();

  /*
   * TALENTIA
   */
  doc
    .font(
      "Helvetica-Bold"
    )
    .fontSize(22)
    .fillColor("#0f2851")
    .text(
      "TALENTIA",
      60,
      60
    );

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#64748b")
    .text(
      "Escuela de Especialización Profesional",
      60,
      88
    );

  /*
   * TÍTULO
   */
  doc
    .font(
      "Helvetica-Bold"
    )
    .fontSize(30)
    .fillColor("#287ad2")
    .text(
      "CERTIFICADO DE FINALIZACIÓN",
      80,
      150,
      {
        width: 680,
        align: "center",
      }
    );

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor("#475569")
    .text(
      "Se certifica que",
      80,
      220,
      {
        width: 680,
        align: "center",
      }
    );

  /*
   * ESTUDIANTE
   */
  doc
    .font(
      "Helvetica-Bold"
    )
    .fontSize(28)
    .fillColor("#2d97e8")
    .text(
      datos.estudiante
        .toUpperCase(),
      80,
      255,
      {
        width: 680,
        align: "center",
      }
    );

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor("#475569")
    .text(
      "ha completado satisfactoriamente el curso",
      80,
      310,
      {
        width: 680,
        align: "center",
      }
    );

  /*
   * CURSO
   */
  doc
    .font(
      "Helvetica-Bold"
    )
    .fontSize(22)
    .fillColor("#287ad2")
    .text(
      datos.curso,
      80,
      345,
      {
        width: 680,
        align: "center",
      }
    );

  /*
   * DATOS INFERIORES
   */
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#64748b")
    .text(
      `Fecha de emisión: ${fecha}`,
      65,
      480
    )
    .text(
      `Certificado: ${certificado.numero_certificado}`,
      65,
      500
    )
    .text(
      `Código de verificación: ${certificado.codigo_verificacion}`,
      65,
      520
    );

  doc
    .moveTo(
      610,
      490
    )
    .lineTo(
      740,
      490
    )
    .strokeColor("#64748b")
    .stroke();

  doc
    .fontSize(10)
    .text(
      "Firma autorizada",
      625,
      500
    );

  /*
   * Finalizamos PDF.
   */
  doc.end();

  /*
   * Esperamos que termine R2.
   */
  const rutaR2 =
    await uploadPromise;

  /*
   * uploadStreamToR2() devuelve:
   *
   * r2://certificates/...
   */

  try {
    await pool.query(
      `UPDATE certificados
       SET ruta_archivo = $1
       WHERE id = $2`,
      [
        rutaR2,
        certificado.id,
      ]
    );

  } catch (error) {

    /*
     * Si R2 recibió el PDF pero
     * PostgreSQL falló, evitamos
     * dejar un archivo huérfano.
     */
    if (
      isR2Path(rutaR2)
    ) {
      await deleteObjectFromR2(
        stripR2Prefix(
          rutaR2
        )
      ).catch(
        () => undefined
      );
    }

    throw error;
  }

  return rutaR2;
}

export async function emitirCertificadoCurso(
  matriculaId: number
) {
  /*
   * Primero comprobamos el 100%
   * REAL del curso.
   *
   * No basta con confiar solamente
   * en matricula.estado.
   */
  const datosResult =
    await pool.query(
      `SELECT
         m.id
           AS matricula_id,

         m.estudiante_id,

         oc.curso_id,

         m.completado_en,

         c.nombre
           AS curso,

         c.codigo
           AS codigo_curso,

         CONCAT_WS(
           ' ',
           u.nombres,
           u.apellidos
         ) AS estudiante,

         (
           SELECT
             COUNT(cc.id)::INTEGER

           FROM modulos_curso mc

           INNER JOIN
             contenidos_curso cc
             ON cc.modulo_id =
                mc.id

            AND cc.estado =
                'Publicado'

            AND cc.obligatorio =
                TRUE

           WHERE mc.curso_id =
                 c.id

             AND mc.activo =
                 TRUE
         )
           AS total_contenidos,

         (
           SELECT
             COUNT(cc.id)::INTEGER

           FROM modulos_curso mc

           INNER JOIN
             contenidos_curso cc
             ON cc.modulo_id =
                mc.id

            AND cc.estado =
                'Publicado'

            AND cc.obligatorio =
                TRUE

           INNER JOIN
             progreso_contenido pc

             ON pc.contenido_id =
                cc.id

            AND pc.matricula_id =
                m.id

            AND (
              pc.estado =
                'Completado'

              OR pc.progreso >= 100
            )

           WHERE mc.curso_id =
                 c.id

             AND mc.activo =
                 TRUE
         )
           AS contenidos_completados

       FROM matriculas m

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

       WHERE m.id = $1
         AND u.rol =
             'Estudiante'

       LIMIT 1`,
      [
        matriculaId,
      ]
    );

  if (
    !datosResult.rowCount
  ) {
    return null;
  }

 const datos =
  datosResult.rows[0] as DatosCertificado;

  const total =
    Number(
      datos.total_contenidos ??
        0
    );

  const completados =
    Number(
      datos
        .contenidos_completados ??
        0
    );

  /*
   * Si no está en 100%,
   * NO se emite.
   */
  if (
    total <= 0 ||
    completados < total
  ) {
    return null;
  }

  /*
   * Garantizamos matrícula
   * completada.
   */
  const matriculaResult =
    await pool.query(
      `UPDATE matriculas

       SET
         estado =
           'Completada',

         completado_en =
           COALESCE(
             completado_en,
             NOW()
           )

       WHERE id = $1

       RETURNING
         completado_en`,
      [
        matriculaId,
      ]
    );

  datos.completado_en =
    matriculaResult
      .rows[0]
      ?.completado_en ??
    new Date();

  /*
   * ¿Ya existe certificado?
   */
  let certificadoResult =
    await pool.query(
      `SELECT
         id,
         numero_certificado,
         codigo_verificacion,
         emitido_en,
         ruta_archivo

       FROM certificados

       WHERE matricula_id = $1

         AND modulo_id
             IS NULL

         AND tipo =
             'Aprobacion'

       ORDER BY id DESC

       LIMIT 1`,
      [
        matriculaId,
      ]
    );

  /*
   * Crear solo si no existe.
   */
  if (
    !certificadoResult
      .rowCount
  ) {
    const fecha =
      new Date(
        datos.completado_en ??
          new Date()
      );

    const anio =
      fecha.getFullYear();

    const codigoCurso =
      datos.codigo_curso
        .replace(
          /[^A-Za-z0-9]/g,
          ""
        )
        .toUpperCase();

    const numeroCertificado =
      `TAL-${codigoCurso}-${anio}-${String(
        matriculaId
      ).padStart(
        5,
        "0"
      )}`;

    certificadoResult =
      await pool.query(
        `INSERT INTO certificados (
           matricula_id,
           modulo_id,
           tipo,
           numero_certificado,
           codigo_verificacion,
           emitido_en,
           ruta_archivo
         )
         VALUES (
           $1,
           NULL,
           'Aprobacion',
           $2,
           $3,
           COALESCE(
             $4::timestamptz,
             NOW()
           ),
           NULL
         )
         RETURNING
           id,
           numero_certificado,
           codigo_verificacion,
           emitido_en,
           ruta_archivo`,
        [
          matriculaId,
          numeroCertificado,
          randomUUID(),
          datos.completado_en,
        ]
      );
  }

  const certificado = certificadoResult.rows[0] as CertificadoDb;

  /*
   * Si todavía no existe PDF
   * en R2, lo generamos.
   */
  if (
    !certificado
      .ruta_archivo ||
    !isR2Path(
      certificado
        .ruta_archivo
    )
  ) {
    certificado.ruta_archivo =
      await generarYSubirPdf({
        certificado,
        datos,
      });
  }

  return certificado;
}

/*
 * Esto permite recuperar alumnos
 * que ya habían llegado al 100%
 * antes de implementar certificados.
 */
export async function emitirCertificadosPendientesEstudiante(
  estudianteId: number
) {
  const matriculasResult =
    await pool.query(
      `SELECT
         m.id

       FROM matriculas m

       INNER JOIN
         ofertas_curso oc
         ON oc.id =
            m.oferta_curso_id

       INNER JOIN cursos c
         ON c.id =
            oc.curso_id

       WHERE
         m.estudiante_id = $1

         AND m.estado IN (
           'Activa',
           'Completada'
         )

         AND c.estado =
             'Activo'

       ORDER BY
         m.id`,
      [
        estudianteId,
      ]
    );

  for (
    const fila
    of matriculasResult.rows
  ) {
    try {
      await emitirCertificadoCurso(
        Number(
          fila.id
        )
      );
    } catch (error) {
      console.error(
        `No se pudo emitir el certificado de la matrícula ${fila.id}:`,
        error
      );
    }
  }
}