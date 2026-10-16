import type { Request, Response } from "express";
import type { PoolClient } from "pg";
import pool from "../config/database";

const ESTADOS_PAGO = new Set(["Pendiente", "Pagado", "No aplica"]);
const ESTADOS_MATRICULA = new Set([
  "Pendiente",
  "Activa",
  "Completada",
  "Retirada",
  "Cancelada",
]);

function leerIdPositivo(valor: unknown): string | null {
  if (typeof valor !== "string" && typeof valor !== "number") return null;
  const texto = String(valor);
  if (!/^[1-9]\d{0,18}$/.test(texto)) return null;

  try {
    return BigInt(texto) <= BigInt("9223372036854775807") ? texto : null;
  } catch {
    return null;
  }
}

export async function listarMatriculas(_req: Request, res: Response) {
  try {
    const resultado = await pool.query(
      `SELECT
         m.id::TEXT AS id,
         'MAT' || LPAD(m.id::TEXT, 4, '0') AS codigo,
         m.estudiante_id::TEXT AS "estudianteId",
         BTRIM(CONCAT_WS(' ', u.nombres, u.apellidos)) AS alumno,
         COALESCE(NULLIF(u.id_persona, ''), u.usuario) AS "codigoAlumno",
         oc.id::TEXT AS "ofertaCursoId",
         c.nombre AS curso,
         c.codigo AS "codigoCurso",
         COALESCE(p.nombre, 'Periodo sin asignar') AS periodo,
         TO_CHAR(m.matriculado_en AT TIME ZONE 'America/Lima', 'DD Mon YYYY') AS fecha,
         m.estado,
         m.estado_pago AS "estadoPago",
         COALESCE(oc.cupo_maximo, 0)::INTEGER AS "cupoMaximo",
         COALESCE(ins.ocupadas, 0)::INTEGER AS "cuposOcupados"
       FROM matriculas m
       JOIN usuarios u ON u.id = m.estudiante_id
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       JOIN cursos c ON c.id = oc.curso_id
       LEFT JOIN periodos_academicos p ON p.id = oc.periodo_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::INTEGER AS ocupadas
         FROM matriculas m2
         WHERE m2.oferta_curso_id = oc.id
           AND m2.estado IN ('Pendiente', 'Activa')
       ) ins ON TRUE
       ORDER BY m.matriculado_en DESC, m.id DESC`
    );

    return res.status(200).json({ matriculas: resultado.rows });
  } catch (error) {
    console.error("Error listando matrículas administrativas:", error);
    return res.status(500).json({
      message: "No se pudieron cargar las matrículas desde la base de datos.",
    });
  }
}

export async function obtenerOpcionesMatricula(_req: Request, res: Response) {
  try {
    const [alumnosResult, periodosResult, ofertasResult] = await Promise.all([
      pool.query(
        `SELECT
           id::TEXT AS id,
           BTRIM(CONCAT_WS(' ', nombres, apellidos)) AS nombre,
           COALESCE(NULLIF(id_persona, ''), usuario) AS codigo
         FROM usuarios
         WHERE rol = 'Estudiante'
           AND activo = TRUE
         ORDER BY nombres, apellidos`
      ),
      pool.query(
        `SELECT
           id::TEXT AS id,
           nombre,
           TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio",
           TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS "fechaFin"
         FROM periodos_academicos
         WHERE activo = TRUE
         ORDER BY fecha_inicio DESC, id DESC`
      ),
      pool.query(
        `SELECT
           oc.id::TEXT AS id,
           oc.curso_id::TEXT AS "cursoId",
           c.nombre AS "nombreCurso",
           c.codigo,
           oc.periodo_id::TEXT AS "periodoId",
           p.nombre AS "periodoNombre",
           TO_CHAR(COALESCE(oc.fecha_inicio, p.fecha_inicio), 'YYYY-MM-DD') AS "fechaInicio",
           TO_CHAR(COALESCE(oc.fecha_fin, p.fecha_fin), 'YYYY-MM-DD') AS "fechaFin",
           oc.cupo_maximo::INTEGER AS "cupoMaximo",
           COALESCE(ins.ocupadas, 0)::INTEGER AS ocupadas,
           GREATEST(oc.cupo_maximo - COALESCE(ins.ocupadas, 0), 0)::INTEGER AS "cuposDisponibles",
           COALESCE(
             NULLIF(BTRIM(CONCAT_WS(' ', u.nombres, u.apellidos)), ''),
             'Sin asignar'
           ) AS docente
         FROM ofertas_curso oc
         JOIN cursos c ON c.id = oc.curso_id
         LEFT JOIN periodos_academicos p ON p.id = oc.periodo_id
         LEFT JOIN usuarios u ON u.id = oc.docente_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::INTEGER AS ocupadas
           FROM matriculas m
           WHERE m.oferta_curso_id = oc.id
             AND m.estado IN ('Pendiente', 'Activa')
         ) ins ON TRUE
         WHERE c.estado = 'Activo'
           AND oc.publicado = TRUE
           AND oc.estado IN ('Programado', 'En curso')
           AND (oc.periodo_id IS NULL OR p.activo = TRUE)
           AND oc.cupo_maximo > COALESCE(ins.ocupadas, 0)
         ORDER BY c.nombre, p.fecha_inicio NULLS LAST, oc.id DESC`
      ),
    ]);

    return res.status(200).json({
      alumnos: alumnosResult.rows,
      periodos: periodosResult.rows,
      ofertas: ofertasResult.rows,
    });
  } catch (error) {
    console.error("Error cargando opciones de matrícula:", error);
    return res.status(500).json({
      message: "No se pudieron cargar alumnos, ofertas y periodos académicos.",
    });
  }
}

export async function registrarMatricula(req: Request, res: Response) {
  const estudianteId = leerIdPositivo(req.body?.estudianteId);
  const ofertaCursoId = leerIdPositivo(req.body?.ofertaCursoId);
  const periodoIdSolicitado = leerIdPositivo(req.body?.periodoId);
  const estadoPago = req.body?.estadoPago;

  if (!estudianteId) {
    return res.status(400).json({ message: "Selecciona un alumno válido." });
  }
  if (!ofertaCursoId) {
    return res.status(400).json({ message: "Selecciona una oferta de curso válida." });
  }
  if (!periodoIdSolicitado) {
    return res.status(400).json({ message: "Selecciona un periodo académico activo." });
  }
  if (typeof estadoPago !== "string" || !ESTADOS_PAGO.has(estadoPago)) {
    return res.status(400).json({ message: "Selecciona un estado de pago válido." });
  }

  let client: PoolClient | null = null;
  let transaccionConfirmada = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const alumnoResult = await client.query(
      `SELECT id
       FROM usuarios
       WHERE id = $1
         AND rol = 'Estudiante'
         AND activo = TRUE
       FOR SHARE`,
      [estudianteId]
    );

    if (!alumnoResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "El alumno no existe, está inactivo o no tiene el rol Estudiante.",
      });
    }

    const ofertaResult = await client.query(
      `SELECT
         oc.id,
         oc.periodo_id::TEXT AS periodo_id,
         oc.fecha_inicio,
         oc.fecha_fin,
         oc.cupo_maximo,
         oc.estado AS estado_oferta,
         oc.publicado,
         c.estado AS estado_curso
       FROM ofertas_curso oc
       JOIN cursos c ON c.id = oc.curso_id
       WHERE oc.id = $1
       FOR UPDATE OF oc`,
      [ofertaCursoId]
    );

    if (!ofertaResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "La oferta seleccionada ya no existe." });
    }

    const oferta = ofertaResult.rows[0];

    if (
      oferta.estado_curso !== "Activo" ||
      oferta.publicado !== true ||
      !["Programado", "En curso"].includes(oferta.estado_oferta)
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "El curso o su oferta ya no están disponibles para matrícula.",
      });
    }

    const periodoResult = await client.query(
      `SELECT id, nombre, fecha_inicio, fecha_fin
       FROM periodos_academicos
       WHERE id = $1
         AND activo = TRUE
       FOR SHARE`,
      [periodoIdSolicitado]
    );

    if (!periodoResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "El periodo seleccionado no existe o está inactivo.",
      });
    }

    if (
      oferta.periodo_id !== null &&
      String(oferta.periodo_id) !== periodoIdSolicitado
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "La oferta ya pertenece a otro periodo. Recarga el formulario.",
      });
    }

    // Compatibilidad con ofertas antiguas: si no tienen periodo, la primera
    // matrícula lo asigna a nivel de oferta. Las siguientes usarán ese mismo periodo.
    if (oferta.periodo_id === null) {
      await client.query(
        `UPDATE ofertas_curso
         SET periodo_id = $2,
             fecha_inicio = COALESCE(fecha_inicio, $3::DATE),
             fecha_fin = COALESCE(fecha_fin, $4::DATE),
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          ofertaCursoId,
          periodoIdSolicitado,
          periodoResult.rows[0].fecha_inicio,
          periodoResult.rows[0].fecha_fin,
        ]
      );
    }

    const cuposResult = await client.query(
      `SELECT COUNT(*)::INTEGER AS ocupadas
       FROM matriculas
       WHERE oferta_curso_id = $1
         AND estado IN ('Pendiente', 'Activa')`,
      [ofertaCursoId]
    );

    const ocupadas = Number(cuposResult.rows[0].ocupadas) || 0;
    const cupoMaximo = Number(oferta.cupo_maximo) || 0;

    if (ocupadas >= cupoMaximo) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "No quedan cupos disponibles para esta oferta.",
      });
    }

    const duplicada = await client.query(
      `SELECT id
       FROM matriculas
       WHERE oferta_curso_id = $1
         AND estudiante_id = $2
       LIMIT 1`,
      [ofertaCursoId, estudianteId]
    );

    if (duplicada.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Este alumno ya tiene una matrícula registrada en esta oferta.",
      });
    }

    // Un pago pendiente deja la matrícula pendiente; Pagado/No aplica permite activarla.
    const estadoMatricula = estadoPago === "Pendiente" ? "Pendiente" : "Activa";

    const insertResult = await client.query(
      `INSERT INTO matriculas (
         oferta_curso_id,
         estudiante_id,
         estado,
         estado_pago
       ) VALUES ($1, $2, $3, $4)
       RETURNING id::TEXT AS id, estado, estado_pago AS "estadoPago", matriculado_en`,
      [ofertaCursoId, estudianteId, estadoMatricula, estadoPago]
    );

    await client.query("COMMIT");
    transaccionConfirmada = true;

    return res.status(201).json({
      message: "La matrícula se registró correctamente.",
      matricula: insertResult.rows[0],
    });
  } catch (error) {
    if (client && !transaccionConfirmada) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    const codigo = (error as { code?: string }).code;

    if (codigo === "23505") {
      return res.status(409).json({
        message: "Este alumno ya está matriculado en la oferta seleccionada.",
      });
    }

    if (codigo === "23503") {
      return res.status(400).json({
        message: "El alumno, la oferta o el periodo seleccionado ya no existe.",
      });
    }

    console.error("Error registrando matrícula:", error);
    return res.status(500).json({
      message: "No se pudo registrar la matrícula. Revisa los datos y vuelve a intentarlo.",
    });
  } finally {
    client?.release();
  }
}

export async function cambiarEstadoMatricula(req: Request, res: Response) {
  const matriculaId = leerIdPositivo(req.params.id);
  const estado = req.body?.estado;

  if (!matriculaId) {
    return res.status(400).json({ message: "El ID de matrícula no es válido." });
  }
  if (typeof estado !== "string" || !ESTADOS_MATRICULA.has(estado)) {
    return res.status(400).json({ message: "El estado solicitado no es válido." });
  }

  try {
    const resultado = await pool.query(
        `UPDATE matriculas
        SET estado = $1::VARCHAR,
            completado_en = CASE
                WHEN $1::VARCHAR = 'Completada'
                    THEN COALESCE(completado_en, CURRENT_TIMESTAMP)
                WHEN $1::VARCHAR IN ('Activa', 'Pendiente')
                    THEN NULL
                ELSE completado_en
            END
        WHERE id = $2
        RETURNING
            id::TEXT AS id,
            estado,
            estado_pago AS "estadoPago"`,
        [estado, matriculaId]
    );


    if (!resultado.rowCount) {
      return res.status(404).json({ message: "La matrícula no existe." });
    }

    return res.status(200).json({
      message: "El estado de la matrícula se actualizó correctamente.",
      matricula: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error actualizando matrícula:", error);
    return res.status(500).json({ message: "No se pudo actualizar la matrícula." });
  }
}
