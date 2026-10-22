import type { Response } from "express";
import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { unlink } from "node:fs/promises";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { formatosArchivoEvaluacion } from "../middleware/evaluacion-upload.middleware";
import {
  deleteObjectFromR2,
  getObjectFromR2,
  isR2NotFoundError,
  streamBodyToResponse,
  uploadFileToR2,
} from "../services/r2.service";

type RespuestaIntentoEntrada = {
  preguntaId?: unknown;
  opcionesSeleccionadas?: unknown;
  textoRespuesta?: unknown;
  relaciones?: unknown;
};

type ContextoEvaluacionAlumno = {
  evaluacionId: string;
  matriculaId: string;
  ofertaCursoId: string;
  intentosPermitidos: number;
  tiempoLimiteMinutos: number | null;
  puntajeTotal: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaInicioAlcanzada: boolean;
  fechaFinVigente: boolean;
  ventanaAbierta: boolean;
};

function idPositivo(valor: unknown): number | null {
  const numero = typeof valor === "string" && valor.trim() ? Number(valor) : valor;
  return typeof numero === "number" && Number.isSafeInteger(numero) && numero > 0
    ? numero
    : null;
}

async function obtenerContextoEvaluacionAlumno(
  client: PoolClient,
  cursoId: number,
  contenidoId: number,
  usuarioId: string
): Promise<ContextoEvaluacionAlumno | null> {
  const result = await client.query(
    `SELECT
       e.id::TEXT AS "evaluacionId",
       m.id::TEXT AS "matriculaId",
       oc.id::TEXT AS "ofertaCursoId",
       e.intentos_permitidos AS "intentosPermitidos",
       e.tiempo_limite_minutos AS "tiempoLimiteMinutos",
       e.puntaje_total AS "puntajeTotal",
       e.fecha_inicio AS "fechaInicio",
       e.fecha_fin AS "fechaFin",
       (e.fecha_inicio IS NULL OR e.fecha_inicio <= statement_timestamp()) AS "fechaInicioAlcanzada",
       (e.fecha_fin IS NULL OR e.fecha_fin >= statement_timestamp()) AS "fechaFinVigente"
     FROM contenidos_curso cc
     JOIN modulos_curso mc ON mc.id = cc.modulo_id
     JOIN cursos c ON c.id = mc.curso_id
     JOIN evaluaciones e ON e.contenido_id = cc.id
     JOIN ofertas_curso oc
       ON oc.curso_id = c.id
      AND oc.publicado = TRUE
      AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
     JOIN matriculas m
       ON m.oferta_curso_id = oc.id
      AND m.estudiante_id = $3
      AND m.estado IN ('Activa', 'Completada')
     JOIN usuarios u
       ON u.id = m.estudiante_id
      AND u.activo = TRUE
      AND u.rol = 'Estudiante'
     WHERE c.id = $1
       AND cc.id = $2
       AND c.estado = 'Activo'
       AND mc.activo = TRUE
       AND cc.estado = 'Publicado'
       AND e.estado = 'Publicada'
     ORDER BY
       CASE oc.estado
         WHEN 'En curso' THEN 1
         WHEN 'Programado' THEN 2
         ELSE 3
       END,
       m.id DESC
     LIMIT 1`,
    [cursoId, contenidoId, usuarioId]
  );

  if (!result.rowCount) return null;

  const row = result.rows[0];
  return {
    evaluacionId: String(row.evaluacionId),
    matriculaId: String(row.matriculaId),
    ofertaCursoId: String(row.ofertaCursoId),
    intentosPermitidos: Number(row.intentosPermitidos),
    tiempoLimiteMinutos:
      row.tiempoLimiteMinutos == null ? null : Number(row.tiempoLimiteMinutos),
    puntajeTotal: row.puntajeTotal == null ? null : Number(row.puntajeTotal),
    fechaInicio: row.fechaInicio == null ? null : new Date(row.fechaInicio).toISOString(),
    fechaFin: row.fechaFin == null ? null : new Date(row.fechaFin).toISOString(),
    fechaInicioAlcanzada: row.fechaInicioAlcanzada === true,
    fechaFinVigente: row.fechaFinVigente === true,
    ventanaAbierta: row.fechaInicioAlcanzada === true && row.fechaFinVigente === true,
  };
}

async function cerrarIntentoVencido(
  client: PoolClient,
  contexto: ContextoEvaluacionAlumno
) {
  if (contexto.tiempoLimiteMinutos === null) return;

  await client.query(
    `UPDATE intentos_evaluacion
     SET estado = 'Enviado',
         enviado_en = COALESCE(
           enviado_en,
           iniciado_en + ($3::INTEGER * INTERVAL '1 minute')
         )
     WHERE evaluacion_id = $1
       AND matricula_id = $2
       AND estado = 'En curso'
       AND CURRENT_TIMESTAMP >= iniciado_en + ($3::INTEGER * INTERVAL '1 minute')`,
    [contexto.evaluacionId, contexto.matriculaId, contexto.tiempoLimiteMinutos]
  );
}

function calcularTiempoRestante(
  iniciadoEn: string | Date,
  tiempoLimiteMinutos: number | null
): number | null {
  if (tiempoLimiteMinutos === null) return null;

  const inicioMs = new Date(iniciadoEn).getTime();
  const limiteSegundos = tiempoLimiteMinutos * 60;
  const transcurridoSegundos = Math.max(0, Math.floor((Date.now() - inicioMs) / 1000));
  return Math.max(0, limiteSegundos - transcurridoSegundos);
}

function calcularTiempoUsado(
  iniciadoEn: string | Date,
  enviadoEn: string | Date | null,
  tiempoLimiteMinutos: number | null
): number | null {
  if (!enviadoEn) return null;

  const inicioMs = new Date(iniciadoEn).getTime();
  const finMs = new Date(enviadoEn).getTime();
  const usado = Math.max(0, Math.floor((finMs - inicioMs) / 1000));

  if (tiempoLimiteMinutos === null) return usado;
  return Math.min(usado, tiempoLimiteMinutos * 60);
}

function nombreArchivoSeguro(nombre: string) {
  return path
    .basename(nombre.replaceAll("\\", "/"))
    .replace(/[\x00-\x1f\x7f]/g, "")
    .slice(0, 255) || "archivo";
}

function parsearRespuestasEntrada(valor: unknown): RespuestaIntentoEntrada[] | null {
  if (Array.isArray(valor)) return valor as RespuestaIntentoEntrada[];
  if (typeof valor !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(valor);
    return Array.isArray(parsed) ? (parsed as RespuestaIntentoEntrada[]) : null;
  } catch {
    return null;
  }
}

type ResultadoCalificacionIntento = {
  estado: "Enviado" | "Calificado";
  puntosObtenidos: number;
  puntajeTotal: number | null;
  nota: number | null;
};

/** Actualiza el estado solo cuando existe una respuesta puntuada por pregunta.
 * Si la evaluación está vinculada a un componente calificable, publica la nota
 * sobre 20 en la tabla calificaciones del mismo intento. */
async function actualizarEstadoYNotaIntento(
  client: PoolClient,
  intentoId: number,
  calificadoPor: number | null = null
): Promise<ResultadoCalificacionIntento> {
  const result = await client.query(
    `SELECT
       ie.id::TEXT AS id,
       ie.numero_intento AS "numeroIntento",
       ie.matricula_id::TEXT AS "matriculaId",
       ie.evaluacion_id::TEXT AS "evaluacionId",
       e.calificada,
       e.puntaje_total::NUMERIC AS "puntajeTotal",
       COUNT(p.id)::INTEGER AS "preguntasTotal",
       COUNT(re.id)::INTEGER AS "respuestasTotal",
       COUNT(*) FILTER (
         WHERE p.id IS NOT NULL
           AND (re.id IS NULL OR re.puntos_obtenidos IS NULL)
       )::INTEGER AS pendientes,
       COALESCE(SUM(re.puntos_obtenidos), 0)::NUMERIC AS "puntosObtenidos"
     FROM intentos_evaluacion ie
     JOIN evaluaciones e ON e.id = ie.evaluacion_id
     LEFT JOIN preguntas_evaluacion p ON p.evaluacion_id = e.id
     LEFT JOIN respuestas_evaluacion re
       ON re.pregunta_id = p.id
      AND re.intento_id = ie.id
     WHERE ie.id = $1
     GROUP BY ie.id, e.id`,
    [intentoId]
  );

  if (!result.rowCount) throw new Error("No se encontró el intento para actualizar su calificación.");
  const row = result.rows[0];
  const preguntasTotal = Number(row.preguntasTotal ?? 0);
  const respuestasTotal = Number(row.respuestasTotal ?? 0);
  const puntosObtenidos = Number(row.puntosObtenidos ?? 0);
  const puntajeTotal = row.puntajeTotal == null ? null : Number(row.puntajeTotal);
  const completo = preguntasTotal > 0 && respuestasTotal === preguntasTotal && Number(row.pendientes) === 0;
  const estado: ResultadoCalificacionIntento["estado"] = completo ? "Calificado" : "Enviado";

  await client.query(
    `UPDATE intentos_evaluacion
     SET estado = $2
     WHERE id = $1`,
    [intentoId, estado]
  );

  let nota: number | null = null;
  if (completo && puntajeTotal !== null && puntajeTotal > 0) {
    nota = Math.max(0, Math.min(20, Number(((puntosObtenidos / puntajeTotal) * 20).toFixed(2))));
  }

  if (completo && row.calificada === true && nota !== null) {
    const componentes = await client.query(
      `SELECT cc.id::TEXT AS id
       FROM componentes_calificacion cc
       JOIN matriculas m ON m.id = $2
       WHERE cc.evaluacion_id = $1
         AND cc.oferta_curso_id = m.oferta_curso_id`,
      [row.evaluacionId, row.matriculaId]
    );

    for (const componente of componentes.rows) {
      await client.query(
        `INSERT INTO calificaciones AS calificacion_actual (
           componente_id,
           matricula_id,
           intento_evaluacion_id,
           nota,
           calificado_por,
           calificado_en
         )
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (componente_id, matricula_id)
         DO UPDATE SET
           intento_evaluacion_id = EXCLUDED.intento_evaluacion_id,
           nota = EXCLUDED.nota,
           calificado_por = EXCLUDED.calificado_por,
           calificado_en = CURRENT_TIMESTAMP
         WHERE calificacion_actual.intento_evaluacion_id IS NULL
            OR COALESCE((
                 SELECT nuevo.numero_intento
                 FROM intentos_evaluacion nuevo
                 WHERE nuevo.id = EXCLUDED.intento_evaluacion_id
               ), 0) >= COALESCE((
                 SELECT anterior.numero_intento
                 FROM intentos_evaluacion anterior
                 WHERE anterior.id = calificacion_actual.intento_evaluacion_id
               ), 0)`,
        [componente.id, row.matriculaId, intentoId, nota, calificadoPor]
      );
    }
  }

  return {
    estado,
    puntosObtenidos: Number(puntosObtenidos.toFixed(2)),
    puntajeTotal,
    nota,
  };
}

async function construirEstadoIntentos(
  client: PoolClient,
  contexto: ContextoEvaluacionAlumno
) {
  await cerrarIntentoVencido(client, contexto);

  const result = await client.query(
    `SELECT
       ie.id::TEXT AS id,
       ie.numero_intento AS "numeroIntento",
       ie.iniciado_en AS "iniciadoEn",
       ie.enviado_en AS "enviadoEn",
       ie.estado,
       COALESCE(SUM(re.puntos_obtenidos), 0)::NUMERIC AS "puntosObtenidos"
     FROM intentos_evaluacion ie
     LEFT JOIN respuestas_evaluacion re ON re.intento_id = ie.id
     WHERE ie.evaluacion_id = $1
       AND ie.matricula_id = $2
       AND ie.estado <> 'Cancelado'
     GROUP BY ie.id
     ORDER BY ie.numero_intento ASC, ie.id ASC`,
    [contexto.evaluacionId, contexto.matriculaId]
  );

  const intentos = result.rows.map((row) => {
    const tiempoUsadoSegundos = calcularTiempoUsado(
      row.iniciadoEn,
      row.enviadoEn,
      contexto.tiempoLimiteMinutos
    );

    const tiempoRestanteSegundos =
      contexto.tiempoLimiteMinutos === null
        ? null
        : row.estado === "En curso"
          ? calcularTiempoRestante(row.iniciadoEn, contexto.tiempoLimiteMinutos)
          : Math.max(
              0,
              contexto.tiempoLimiteMinutos * 60 - (tiempoUsadoSegundos ?? 0)
            );

    const calificado = String(row.estado) === "Calificado";
    const puntosFinales = Number(row.puntosObtenidos ?? 0);
    const notaFinal = calificado && contexto.puntajeTotal !== null && contexto.puntajeTotal > 0
      ? Math.max(0, Math.min(20, Number(((puntosFinales / contexto.puntajeTotal) * 20).toFixed(2))))
      : null;

    return {
      id: String(row.id),
      numeroIntento: Number(row.numeroIntento),
      iniciadoEn: row.iniciadoEn,
      enviadoEn: row.enviadoEn,
      estado: String(row.estado),
      puntosObtenidos: calificado ? Number(puntosFinales.toFixed(2)) : null,
      puntajeTotal: contexto.puntajeTotal,
      nota: notaFinal,
      tiempoUsadoSegundos,
      tiempoRestanteSegundos,
    };
  });

  const intentoEnCurso = intentos.find((intento) => intento.estado === "En curso") ?? null;
  const intentosUsados = intentos.length;
  const intentosRestantes = Math.max(0, contexto.intentosPermitidos - intentosUsados);

  const mensajeDisponibilidad = !contexto.fechaInicioAlcanzada
    ? "La evaluación todavía no está disponible."
    : !contexto.fechaFinVigente
      ? "Terminó el plazo para iniciar nuevos intentos de esta evaluación."
      : null;

  return {
    intentosPermitidos: contexto.intentosPermitidos,
    intentosUsados,
    intentosRestantes,
    puedeIniciarNuevo: intentoEnCurso === null && intentosRestantes > 0 && contexto.ventanaAbierta,
    intentoEnCurso,
    intentos,
    fechaInicio: contexto.fechaInicio,
    fechaFin: contexto.fechaFin,
    ventanaAbierta: contexto.ventanaAbierta,
    mensajeDisponibilidad,
  };
}

export async function obtenerIntentosEvaluacionAlumno(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const usuarioId = req.userId;

  if (!cursoId || !contenidoId || !usuarioId) {
    return res.status(400).json({ message: "Curso, contenido o sesión no válidos." });
  }

  const client = await pool.connect();

  try {
    const contexto = await obtenerContextoEvaluacionAlumno(
      client,
      cursoId,
      contenidoId,
      usuarioId
    );

    if (!contexto) {
      return res.status(404).json({
        message: "La evaluación no existe o no tienes una matrícula válida para resolverla.",
      });
    }

    const estado = await construirEstadoIntentos(client, contexto);
    return res.status(200).json(estado);
  } catch (error) {
    console.error("Error obteniendo intentos de evaluación:", error);
    return res.status(500).json({ message: "No se pudieron cargar tus intentos." });
  } finally {
    client.release();
  }
}

export async function iniciarIntentoEvaluacionAlumno(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const usuarioId = req.userId;

  if (!cursoId || !contenidoId || !usuarioId) {
    return res.status(400).json({ message: "Curso, contenido o sesión no válidos." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const contexto = await obtenerContextoEvaluacionAlumno(
      client,
      cursoId,
      contenidoId,
      usuarioId
    );

    if (!contexto) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "La evaluación no existe o no tienes una matrícula válida para resolverla.",
      });
    }

    const evaluacionBloqueada = await client.query(
      `SELECT
         id,
         (fecha_inicio IS NULL OR fecha_inicio <= statement_timestamp()) AS "fechaInicioAlcanzada",
         (fecha_fin IS NULL OR fecha_fin >= statement_timestamp()) AS "fechaFinVigente"
       FROM evaluaciones
       WHERE id = $1
       FOR UPDATE`,
      [contexto.evaluacionId]
    );
    const fechaInicioAlcanzada = evaluacionBloqueada.rows[0]?.fechaInicioAlcanzada === true;
    const fechaFinVigente = evaluacionBloqueada.rows[0]?.fechaFinVigente === true;
    const ventanaDisponibleAhora = fechaInicioAlcanzada && fechaFinVigente;

    await cerrarIntentoVencido(client, contexto);

    const enCursoResult = await client.query(
      `SELECT id::TEXT AS id, numero_intento AS "numeroIntento", iniciado_en AS "iniciadoEn"
       FROM intentos_evaluacion
       WHERE evaluacion_id = $1
         AND matricula_id = $2
         AND estado = 'En curso'
       ORDER BY numero_intento DESC
       LIMIT 1`,
      [contexto.evaluacionId, contexto.matriculaId]
    );

    if (enCursoResult.rowCount) {
      const intento = enCursoResult.rows[0];
      await client.query("COMMIT");

      return res.status(200).json({
        intento: {
          id: String(intento.id),
          numeroIntento: Number(intento.numeroIntento),
          iniciadoEn: intento.iniciadoEn,
          tiempoRestanteSegundos: calcularTiempoRestante(
            intento.iniciadoEn,
            contexto.tiempoLimiteMinutos
          ),
        },
        reanudado: true,
      });
    }

    if (!ventanaDisponibleAhora) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: !fechaInicioAlcanzada
          ? "La evaluación todavía no está disponible."
          : "Terminó el plazo para iniciar nuevos intentos de esta evaluación.",
        fechaInicio: contexto.fechaInicio,
        fechaFin: contexto.fechaFin,
      });
    }

    const usadosResult = await client.query(
      `SELECT COUNT(*)::INTEGER AS total,
              COALESCE(MAX(numero_intento), 0)::INTEGER AS "ultimoNumero"
       FROM intentos_evaluacion
       WHERE evaluacion_id = $1
         AND matricula_id = $2
         AND estado <> 'Cancelado'`,
      [contexto.evaluacionId, contexto.matriculaId]
    );

    const usados = Number(usadosResult.rows[0]?.total ?? 0);
    const ultimoNumero = Number(usadosResult.rows[0]?.ultimoNumero ?? 0);

    if (usados >= contexto.intentosPermitidos) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Ya utilizaste todos los intentos permitidos para esta evaluación.",
        intentosAgotados: true,
      });
    }

    const insertResult = await client.query(
      `INSERT INTO intentos_evaluacion (
         evaluacion_id,
         matricula_id,
         numero_intento,
         iniciado_en,
         estado
       )
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'En curso')
       RETURNING id::TEXT AS id, numero_intento AS "numeroIntento", iniciado_en AS "iniciadoEn"`,
      [contexto.evaluacionId, contexto.matriculaId, ultimoNumero + 1]
    );

    await client.query("COMMIT");

    const intento = insertResult.rows[0];
    return res.status(201).json({
      intento: {
        id: String(intento.id),
        numeroIntento: Number(intento.numeroIntento),
        iniciadoEn: intento.iniciadoEn,
        tiempoRestanteSegundos:
          contexto.tiempoLimiteMinutos === null
            ? null
            : contexto.tiempoLimiteMinutos * 60,
      },
      reanudado: false,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Error iniciando intento de evaluación:", error);
    return res.status(500).json({ message: "No se pudo iniciar el intento." });
  } finally {
    client.release();
  }
}

export async function enviarIntentoEvaluacionAlumno(
  req: AuthenticatedRequest,
  res: Response
) {
  const archivosTemporales = Array.isArray(req.files) ? req.files : [];
  const clavesR2Nuevas: string[] = [];
  const rutasR2Anteriores: string[] = [];

  try {
    const cursoId = idPositivo(req.params.cursoId);
    const contenidoId = idPositivo(req.params.contenidoId);
    const intentoId = idPositivo(req.params.intentoId);
    const usuarioId = req.userId;
    const respuestasEntrada = parsearRespuestasEntrada(req.body?.respuestas);

    if (!cursoId || !contenidoId || !intentoId || !usuarioId) {
      return res.status(400).json({ message: "Evaluación, intento o sesión no válidos." });
    }
    if (!respuestasEntrada) {
      return res.status(400).json({ message: "No se pudieron leer las respuestas del examen." });
    }

    const archivosPorPregunta = new Map<string, Express.Multer.File[]>();
    for (const archivo of archivosTemporales) {
      const match = /^archivo_(\d+)$/.exec(archivo.fieldname);
      if (!match) {
        return res.status(400).json({ message: "Uno de los archivos no está asociado a una pregunta." });
      }
      const preguntaId = String(Number(match[1]));
      const grupo = archivosPorPregunta.get(preguntaId) ?? [];
      grupo.push(archivo);
      archivosPorPregunta.set(preguntaId, grupo);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const contexto = await obtenerContextoEvaluacionAlumno(
        client,
        cursoId,
        contenidoId,
        usuarioId
      );

      if (!contexto) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "La evaluación no existe o no tienes una matrícula válida para resolverla.",
        });
      }

      const intentoResult = await client.query(
        `SELECT id, estado, iniciado_en
         FROM intentos_evaluacion
         WHERE id = $1
           AND evaluacion_id = $2
           AND matricula_id = $3
         FOR UPDATE`,
        [intentoId, contexto.evaluacionId, contexto.matriculaId]
      );

      if (!intentoResult.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "El intento no existe." });
      }

      if (intentoResult.rows[0].estado !== "En curso") {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: "Este intento ya fue enviado y no puede modificarse.",
        });
      }

      const preguntasResult = await client.query(
        `SELECT
           id::TEXT AS id,
           tipo,
           puntaje::NUMERIC AS puntaje,
           COALESCE(permite_archivos, FALSE) AS "permiteArchivos"
         FROM preguntas_evaluacion
         WHERE evaluacion_id = $1
         ORDER BY numero, id`,
        [contexto.evaluacionId]
      );

      const preguntaPorId = new Map<string, Record<string, unknown>>(
        preguntasResult.rows.map((row) => [String(row.id), row])
      );

      for (const preguntaId of archivosPorPregunta.keys()) {
        const pregunta = preguntaPorId.get(preguntaId);
        if (!pregunta || pregunta.tipo !== "respuesta_abierta" || pregunta.permiteArchivos !== true) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            message: "Solo puedes adjuntar archivos a preguntas de respuesta libre que permitan documentos.",
          });
        }
      }

      const preguntaIds = preguntasResult.rows.map((row) => String(row.id));
      const opcionesResult = preguntaIds.length
        ? await client.query(
            `SELECT
               id::TEXT AS id,
               pregunta_id::TEXT AS "preguntaId",
               es_correcta AS "esCorrecta"
             FROM opciones_pregunta
             WHERE pregunta_id = ANY($1::BIGINT[])`,
            [preguntaIds]
          )
        : { rows: [] as Array<Record<string, unknown>> };

      const relacionesResult = preguntaIds.length
        ? await client.query(
            `SELECT
               id::TEXT AS id,
               pregunta_id::TEXT AS "preguntaId",
               elemento_derecha AS "elementoDerecha"
             FROM relaciones_pregunta
             WHERE pregunta_id = ANY($1::BIGINT[])`,
            [preguntaIds]
          )
        : { rows: [] as Array<Record<string, unknown>> };

      const entradaPorPregunta = new Map<string, RespuestaIntentoEntrada>();
      for (const entrada of respuestasEntrada) {
        const preguntaId = idPositivo(entrada?.preguntaId);
        if (preguntaId) entradaPorPregunta.set(String(preguntaId), entrada);
      }

      const anterioresResult = await client.query(
        `SELECT DISTINCT f.ruta_archivo
         FROM archivos_respuesta_evaluacion f
         JOIN respuestas_evaluacion re ON re.id = f.respuesta_id
         WHERE re.intento_id = $1`,
        [intentoId]
      );
      for (const row of anterioresResult.rows) {
        if (typeof row.ruta_archivo === "string") rutasR2Anteriores.push(row.ruta_archivo);
      }

      await client.query(
        "DELETE FROM respuestas_evaluacion WHERE intento_id = $1",
        [intentoId]
      );

      for (const pregunta of preguntasResult.rows) {
        const preguntaId = String(pregunta.id);
        const tipo = String(pregunta.tipo);
        const puntaje = Number(pregunta.puntaje ?? 0);
        const entrada = entradaPorPregunta.get(preguntaId) ?? {};

        const opcionesValidas = opcionesResult.rows
          .filter((opcion) => String(opcion.preguntaId) === preguntaId)
          .map((opcion) => ({
            id: String(opcion.id),
            esCorrecta: opcion.esCorrecta === true,
          }));

        const idsOpcionesValidas = new Set(opcionesValidas.map((opcion) => opcion.id));
        const opcionesSeleccionadas = Array.isArray(entrada.opcionesSeleccionadas)
          ? Array.from(
              new Set(
                entrada.opcionesSeleccionadas
                  .map((valor) => String(valor))
                  .filter((valor) => idsOpcionesValidas.has(valor))
              )
            )
          : [];

        let textoRespuesta: string | null = null;
        let esCorrecta: boolean | null = null;
        let puntosPregunta: number | null = null;

        if (["seleccion_unica", "seleccion_multiple", "verdadero_falso"].includes(tipo)) {
          const correctas = opcionesValidas
            .filter((opcion) => opcion.esCorrecta)
            .map((opcion) => opcion.id)
            .sort();
          const seleccionadas = [...opcionesSeleccionadas].sort();

          esCorrecta =
            correctas.length > 0 &&
            correctas.length === seleccionadas.length &&
            correctas.every((id, index) => id === seleccionadas[index]);

          if (esCorrecta) {
            puntosPregunta = puntaje;
          } else if (tipo === "seleccion_multiple" && correctas.length > 0) {
            // Crédito parcial: cada opción correcta seleccionada aporta una parte
            // proporcional del puntaje, igual que cada relación acertada. La
            // cantidad seleccionada también se considera para que marcar opciones
            // incorrectas no permita obtener automáticamente el puntaje completo.
            const conjuntoCorrectas = new Set(correctas);
            const aciertos = seleccionadas.filter((id) => conjuntoCorrectas.has(id)).length;
            const cantidadComparada = Math.max(correctas.length, seleccionadas.length);
            puntosPregunta = Number(
              Math.max(
                0,
                Math.min(puntaje, puntaje * aciertos / cantidadComparada)
              ).toFixed(2)
            );
          } else {
            puntosPregunta = 0;
          }
        } else if (tipo === "respuesta_abierta") {
          textoRespuesta =
            typeof entrada.textoRespuesta === "string"
              ? entrada.textoRespuesta.trim()
              : "";
        } else if (tipo === "relacional") {
          const relacionesCorrectas = relacionesResult.rows
            .filter((relacion) => String(relacion.preguntaId) === preguntaId)
            .map((relacion) => ({
              id: String(relacion.id),
              derecha: String(relacion.elementoDerecha),
            }));

          const relacionesEntrada =
            entrada.relaciones && typeof entrada.relaciones === "object" && !Array.isArray(entrada.relaciones)
              ? (entrada.relaciones as Record<string, unknown>)
              : {};

          const relacionesLimpias = Object.fromEntries(
            Object.entries(relacionesEntrada).map(([key, value]) => [key, String(value ?? "")])
          );

          textoRespuesta = JSON.stringify({ relaciones: relacionesLimpias });
          const aciertosRelacion = relacionesCorrectas.filter(
            (relacion) => relacionesLimpias[relacion.id] === relacion.derecha
          ).length;
          esCorrecta =
            relacionesCorrectas.length > 0 &&
            aciertosRelacion === relacionesCorrectas.length;
          puntosPregunta = esCorrecta
            ? puntaje
            : relacionesCorrectas.length > 0
              ? Number((puntaje * aciertosRelacion / relacionesCorrectas.length).toFixed(2))
              : 0;
        }

        const respuestaResult = await client.query(
          `INSERT INTO respuestas_evaluacion (
             intento_id,
             pregunta_id,
             texto_respuesta,
             es_correcta,
             puntos_obtenidos
           )
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id::TEXT AS id`,
          [intentoId, preguntaId, textoRespuesta, esCorrecta, puntosPregunta]
        );

        const respuestaId = String(respuestaResult.rows[0].id);
        for (const opcionId of opcionesSeleccionadas) {
          await client.query(
            `INSERT INTO opciones_respuesta_evaluacion (respuesta_id, opcion_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [respuestaId, opcionId]
          );
        }

        const archivosPregunta = archivosPorPregunta.get(preguntaId) ?? [];
        for (const archivo of archivosPregunta) {
          const nombreArchivo = nombreArchivoSeguro(archivo.originalname);
          const extension = path.extname(nombreArchivo).toLowerCase();
          const mimeType = formatosArchivoEvaluacion[extension];
          if (!mimeType) throw new Error("Formato de archivo no permitido.");

          const claveR2 = `evaluation-responses/course-${cursoId}/content-${contenidoId}/attempt-${intentoId}/question-${preguntaId}/${randomUUID()}${extension}`;
          await uploadFileToR2({
            filePath: archivo.path,
            key: claveR2,
            contentType: mimeType,
            contentLength: archivo.size,
            originalName: nombreArchivo,
          });
          clavesR2Nuevas.push(claveR2);

          await client.query(
            `INSERT INTO archivos_respuesta_evaluacion (
               respuesta_id, nombre_archivo, ruta_archivo, mime_type, tamano_bytes
             ) VALUES ($1, $2, $3, $4, $5)`,
            [respuestaId, nombreArchivo, `r2://${claveR2}`, mimeType, archivo.size]
          );
        }
      }

      await client.query(
        `UPDATE intentos_evaluacion
         SET enviado_en = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [intentoId]
      );

      const calificacion = await actualizarEstadoYNotaIntento(client, intentoId, null);
      await client.query("COMMIT");

      for (const ruta of rutasR2Anteriores) {
        if (ruta.startsWith("r2://")) {
          await deleteObjectFromR2(ruta.slice(5)).catch((error) => {
            console.warn("No se pudo eliminar un archivo anterior de la respuesta:", error);
          });
        }
      }

      return res.status(200).json({
        message: "Evaluación enviada correctamente.",
        intento: {
          id: String(intentoId),
          estado: calificacion.estado,
          puntosObtenidos: calificacion.estado === "Calificado" ? calificacion.puntosObtenidos : null,
          puntajeTotal: calificacion.puntajeTotal,
          nota: calificacion.estado === "Calificado" ? calificacion.nota : null,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      for (const key of clavesR2Nuevas) {
        await deleteObjectFromR2(key).catch((cleanupError) => {
          console.warn("No se pudo limpiar un archivo de evaluación tras un error:", cleanupError);
        });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error enviando intento de evaluación:", error);
    return res.status(500).json({ message: "No se pudo enviar la evaluación ni guardar sus archivos." });
  } finally {
    await Promise.all(
      archivosTemporales.map((archivo) =>
        unlink(archivo.path).catch((cleanupError) => {
          if ((cleanupError as NodeJS.ErrnoException).code !== "ENOENT") {
            console.warn("No se pudo limpiar un archivo temporal de evaluación:", cleanupError);
          }
        })
      )
    );
  }
}

/* =========================================================
   CONSULTA DE INTENTOS ENVIADOS / REVISIÓN
   Estas funciones son aditivas: no modifican el flujo actual
   de inicio, temporizador ni envío de evaluaciones.
========================================================= */

type DetalleIntentoAcceso = {
  intentoId: string;
  evaluacionId: string;
  matriculaId: string;
  alumnoId: string;
};

async function obtenerCabeceraEvaluacionPorContenido(
  client: PoolClient,
  cursoId: number,
  contenidoId: number
) {
  const result = await client.query(
    `SELECT
       e.id::TEXT AS "evaluacionId",
       cc.id::TEXT AS "contenidoId",
       cc.titulo,
       cc.descripcion,
       mc.numero AS "numeroModulo",
       mc.titulo AS "tituloModulo",
       e.instrucciones,
       e.intentos_permitidos AS "intentosPermitidos",
       e.tiempo_limite_minutos AS "tiempoLimiteMinutos",
       e.puntaje_total::NUMERIC AS "puntajeTotal",
       e.fecha_inicio AS "fechaInicio",
       e.fecha_fin AS "fechaFin",
       e.calificada,
       e.estado
     FROM contenidos_curso cc
     JOIN modulos_curso mc ON mc.id = cc.modulo_id
     JOIN cursos c ON c.id = mc.curso_id
     JOIN evaluaciones e ON e.contenido_id = cc.id
     WHERE c.id = $1
       AND cc.id = $2
       AND c.estado = 'Activo'
       AND mc.activo = TRUE
     LIMIT 1`,
    [cursoId, contenidoId]
  );

  return result.rows[0] ?? null;
}

async function docenteTieneAccesoCurso(
  client: PoolClient,
  cursoId: number,
  usuarioId: string
) {
  const result = await client.query(
    `SELECT 1
     FROM usuarios u
     WHERE u.id = $2
       AND u.rol = 'Docente'
       AND u.activo = TRUE
       AND EXISTS (
         SELECT 1
         FROM ofertas_curso oc
         WHERE oc.curso_id = $1
           AND oc.docente_id = u.id
           AND oc.estado <> 'Cancelado'
       )
     LIMIT 1`,
    [cursoId, usuarioId]
  );

  return Boolean(result.rowCount);
}

function parsearRelacionesGuardadas(textoRespuesta: unknown): Record<string, string> {
  if (typeof textoRespuesta !== "string" || !textoRespuesta.trim()) return {};

  try {
    const parsed = JSON.parse(textoRespuesta) as { relaciones?: unknown };
    if (!parsed.relaciones || typeof parsed.relaciones !== "object" || Array.isArray(parsed.relaciones)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed.relaciones as Record<string, unknown>).map(([key, value]) => [
        key,
        String(value ?? ""),
      ])
    );
  } catch {
    return {};
  }
}

async function construirDetalleIntento(
  client: PoolClient,
  cursoId: number,
  contenidoId: number,
  intentoId: number
) {
  const intentoResult = await client.query(
    `SELECT
       ie.id::TEXT AS id,
       ie.evaluacion_id::TEXT AS "evaluacionId",
       ie.matricula_id::TEXT AS "matriculaId",
       ie.numero_intento AS "numeroIntento",
       ie.iniciado_en AS "iniciadoEn",
       ie.enviado_en AS "enviadoEn",
       ie.estado,
       m.estudiante_id::TEXT AS "alumnoId",
       TRIM(CONCAT(u.nombres, ' ', COALESCE(u.apellidos, ''))) AS alumno,
       e.puntaje_total::NUMERIC AS "puntajeTotal",
       e.tiempo_limite_minutos AS "tiempoLimiteMinutos",
       cc.titulo,
       cc.descripcion,
       e.instrucciones,
       mc.numero AS "numeroModulo",
       mc.titulo AS "tituloModulo"
     FROM intentos_evaluacion ie
     JOIN evaluaciones e ON e.id = ie.evaluacion_id
     JOIN contenidos_curso cc ON cc.id = e.contenido_id
     JOIN modulos_curso mc ON mc.id = cc.modulo_id
     JOIN cursos c ON c.id = mc.curso_id
     JOIN matriculas m ON m.id = ie.matricula_id
     JOIN usuarios u ON u.id = m.estudiante_id
     WHERE ie.id = $1
       AND c.id = $2
       AND cc.id = $3
     LIMIT 1`,
    [intentoId, cursoId, contenidoId]
  );

  if (!intentoResult.rowCount) return null;

  const intento = intentoResult.rows[0];
  const evaluacionId = String(intento.evaluacionId);

  const preguntasResult = await client.query(
    `SELECT
       p.id::TEXT AS id,
       p.numero,
       p.enunciado,
       p.tipo,
       p.puntaje::NUMERIC AS puntaje,
       COALESCE(p.permite_archivos, FALSE) AS "permiteArchivos",
       re.id::TEXT AS "respuestaId",
       re.texto_respuesta AS "textoRespuesta",
       re.es_correcta AS "esCorrecta",
       re.puntos_obtenidos::NUMERIC AS "puntosObtenidos"
     FROM preguntas_evaluacion p
     LEFT JOIN respuestas_evaluacion re
       ON re.pregunta_id = p.id
      AND re.intento_id = $2
     WHERE p.evaluacion_id = $1
     ORDER BY p.numero, p.id`,
    [evaluacionId, intentoId]
  );

  const preguntaIds = preguntasResult.rows.map((row) => String(row.id));
  const respuestaIds = preguntasResult.rows
    .map((row) => row.respuestaId)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  const opcionesResult = preguntaIds.length
    ? await client.query(
        `SELECT
           op.id::TEXT AS id,
           op.pregunta_id::TEXT AS "preguntaId",
           op.numero,
           op.texto,
           op.es_correcta AS "esCorrecta"
         FROM opciones_pregunta op
         WHERE op.pregunta_id = ANY($1::BIGINT[])
         ORDER BY op.pregunta_id, op.numero, op.id`,
        [preguntaIds]
      )
    : { rows: [] as Array<Record<string, unknown>> };

  const seleccionadasResult = respuestaIds.length
    ? await client.query(
        `SELECT
           ore.respuesta_id::TEXT AS "respuestaId",
           ore.opcion_id::TEXT AS "opcionId"
         FROM opciones_respuesta_evaluacion ore
         WHERE ore.respuesta_id = ANY($1::BIGINT[])`,
        [respuestaIds]
      )
    : { rows: [] as Array<Record<string, unknown>> };

  const archivosResult = respuestaIds.length
    ? await client.query(
        `SELECT
           f.id::TEXT AS id,
           f.respuesta_id::TEXT AS "respuestaId",
           f.nombre_archivo AS "nombreArchivo",
           f.mime_type AS "mimeType",
           f.tamano_bytes::BIGINT AS "tamanoBytes",
           f.subido_en AS "subidoEn"
         FROM archivos_respuesta_evaluacion f
         WHERE f.respuesta_id = ANY($1::BIGINT[])
         ORDER BY f.id`,
        [respuestaIds]
      )
    : { rows: [] as Array<Record<string, unknown>> };

  const relacionesResult = preguntaIds.length
    ? await client.query(
        `SELECT
           rp.id::TEXT AS id,
           rp.pregunta_id::TEXT AS "preguntaId",
           rp.numero,
           rp.elemento_izquierda AS "elementoIzquierda",
           rp.elemento_derecha AS "elementoDerecha"
         FROM relaciones_pregunta rp
         WHERE rp.pregunta_id = ANY($1::BIGINT[])
         ORDER BY rp.pregunta_id, rp.numero, rp.id`,
        [preguntaIds]
      )
    : { rows: [] as Array<Record<string, unknown>> };

  const opcionesSeleccionadasPorRespuesta = new Map<string, Set<string>>();
  for (const row of seleccionadasResult.rows) {
    const respuestaId = String(row.respuestaId);
    const actuales = opcionesSeleccionadasPorRespuesta.get(respuestaId) ?? new Set<string>();
    actuales.add(String(row.opcionId));
    opcionesSeleccionadasPorRespuesta.set(respuestaId, actuales);
  }

  const preguntas = preguntasResult.rows.map((pregunta) => {
    const preguntaId = String(pregunta.id);
    const respuestaId = pregunta.respuestaId ? String(pregunta.respuestaId) : null;
    const seleccionadas = respuestaId
      ? opcionesSeleccionadasPorRespuesta.get(respuestaId) ?? new Set<string>()
      : new Set<string>();
    const relacionesGuardadas = parsearRelacionesGuardadas(pregunta.textoRespuesta);

    return {
      id: preguntaId,
      numero: Number(pregunta.numero),
      enunciado: String(pregunta.enunciado),
      tipo: String(pregunta.tipo),
      puntaje: Number(pregunta.puntaje ?? 0),
      permiteArchivos: pregunta.permiteArchivos === true,
      respuesta: {
        texto:
          String(pregunta.tipo) === "respuesta_abierta"
            ? String(pregunta.textoRespuesta ?? "")
            : null,
        esCorrecta:
          pregunta.esCorrecta === null || pregunta.esCorrecta === undefined
            ? null
            : pregunta.esCorrecta === true,
        puntosObtenidos:
          pregunta.puntosObtenidos === null || pregunta.puntosObtenidos === undefined
            ? null
            : Number(pregunta.puntosObtenidos),
        // Permite indicar al alumno que esta pregunta ya fue revisada,
        // sin revelar el puntaje hasta que todo el intento esté calificado.
        calificada:
          pregunta.puntosObtenidos !== null && pregunta.puntosObtenidos !== undefined,
      },
      archivos: archivosResult.rows
        .filter((archivo) => respuestaId !== null && String(archivo.respuestaId) === respuestaId)
        .map((archivo) => ({
          id: String(archivo.id),
          nombreArchivo: String(archivo.nombreArchivo),
          mimeType: archivo.mimeType == null ? null : String(archivo.mimeType),
          tamanoBytes: archivo.tamanoBytes == null ? null : Number(archivo.tamanoBytes),
          subidoEn: archivo.subidoEn instanceof Date
            ? archivo.subidoEn.toISOString()
            : String(archivo.subidoEn ?? ""),
        })),
      opciones: opcionesResult.rows
        .filter((opcion) => String(opcion.preguntaId) === preguntaId)
        .map((opcion) => ({
          id: String(opcion.id),
          numero: Number(opcion.numero),
          texto: String(opcion.texto),
          esCorrecta: opcion.esCorrecta === true,
          seleccionada: seleccionadas.has(String(opcion.id)),
        })),
      relaciones: relacionesResult.rows
        .filter((relacion) => String(relacion.preguntaId) === preguntaId)
        .map((relacion) => ({
          id: String(relacion.id),
          numero: Number(relacion.numero),
          elementoIzquierda: String(relacion.elementoIzquierda),
          respuestaCorrecta: String(relacion.elementoDerecha),
          respuestaAlumno: relacionesGuardadas[String(relacion.id)] ?? "",
        })),
    };
  });

  const puntosObtenidos = preguntas.reduce(
    (total, pregunta) => total + Number(pregunta.respuesta.puntosObtenidos ?? 0),
    0
  );

  const tiempoUsadoSegundos = calcularTiempoUsado(
    intento.iniciadoEn,
    intento.enviadoEn,
    intento.tiempoLimiteMinutos == null ? null : Number(intento.tiempoLimiteMinutos)
  );
  const notaFinal = intento.estado === "Calificado" && Number(intento.puntajeTotal ?? 0) > 0
    ? Math.max(0, Math.min(20, Number(((puntosObtenidos / Number(intento.puntajeTotal)) * 20).toFixed(2))))
    : null;

  return {
    contenido: {
      id: String(contenidoId),
      titulo: String(intento.titulo),
      descripcion: String(intento.descripcion ?? ""),
      numeroModulo: Number(intento.numeroModulo),
      tituloModulo: String(intento.tituloModulo ?? ""),
    },
    evaluacion: {
      id: evaluacionId,
      instrucciones: String(intento.instrucciones ?? ""),
      puntajeTotal: intento.puntajeTotal == null ? null : Number(intento.puntajeTotal),
      tiempoLimiteMinutos:
        intento.tiempoLimiteMinutos == null ? null : Number(intento.tiempoLimiteMinutos),
    },
    alumno: {
      id: String(intento.alumnoId),
      nombre: String(intento.alumno),
    },
    intento: {
      id: String(intento.id),
      numeroIntento: Number(intento.numeroIntento),
      iniciadoEn: intento.iniciadoEn,
      enviadoEn: intento.enviadoEn,
      estado: String(intento.estado),
      puntosObtenidos: Number(puntosObtenidos.toFixed(2)),
      puntajeTotal: intento.puntajeTotal == null ? null : Number(intento.puntajeTotal),
      nota: notaFinal,
      tiempoUsadoSegundos,
    },
    preguntas,
  };
}

/** GET /api/cursos/:cursoId/contenidos/:contenidoId/evaluacion/intentos/:intentoId/detalle */
export async function obtenerDetalleIntentoEvaluacionAlumno(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const intentoId = idPositivo(req.params.intentoId);
  const usuarioId = req.userId;

  if (!cursoId || !contenidoId || !intentoId || !usuarioId) {
    return res.status(400).json({ message: "Intento o sesión no válidos." });
  }

  const client = await pool.connect();

  try {
    const accesoResult = await client.query(
      `SELECT 1
       FROM intentos_evaluacion ie
       JOIN matriculas m ON m.id = ie.matricula_id
       JOIN evaluaciones e ON e.id = ie.evaluacion_id
       JOIN contenidos_curso cc ON cc.id = e.contenido_id
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       WHERE ie.id = $1
         AND m.estudiante_id = $2
         AND cc.id = $3
         AND mc.curso_id = $4
         AND ie.estado IN ('Enviado', 'Calificado')
       LIMIT 1`,
      [intentoId, usuarioId, contenidoId, cursoId]
    );

    if (!accesoResult.rowCount) {
      return res.status(404).json({
        message: "El intento no existe, todavía está en curso o no te pertenece.",
      });
    }

    const detalle = await construirDetalleIntento(client, cursoId, contenidoId, intentoId);
    if (!detalle) {
      return res.status(404).json({ message: "No se encontró el intento." });
    }

    if (detalle.intento.estado !== "Calificado") {
      return res.status(200).json({
        ...detalle,
        intento: { ...detalle.intento, puntosObtenidos: null, nota: null },
        preguntas: detalle.preguntas.map((pregunta) => ({
          ...pregunta,
          respuesta: { ...pregunta.respuesta, puntosObtenidos: null },
        })),
      });
    }

    return res.status(200).json(detalle);
  } catch (error) {
    console.error("Error obteniendo detalle del intento del alumno:", error);
    return res.status(500).json({ message: "No se pudo cargar el detalle del intento." });
  } finally {
    client.release();
  }
}

/** GET /api/cursos/:cursoId/contenidos/:contenidoId/evaluacion/docente/seguimiento */
export async function obtenerSeguimientoEvaluacionDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const usuarioId = req.userId;

  if (!cursoId || !contenidoId || !usuarioId) {
    return res.status(400).json({ message: "Curso, evaluación o sesión no válidos." });
  }

  const client = await pool.connect();

  try {
    const acceso = await docenteTieneAccesoCurso(client, cursoId, usuarioId);
    if (!acceso) {
      return res.status(403).json({ message: "No tienes acceso docente a este curso." });
    }

    const evaluacion = await obtenerCabeceraEvaluacionPorContenido(client, cursoId, contenidoId);
    if (!evaluacion) {
      return res.status(404).json({ message: "No se encontró la evaluación." });
    }

    const alumnosResult = await client.query(
      `SELECT DISTINCT ON (u.id)
         u.id::TEXT AS "alumnoId",
         m.id::TEXT AS "matriculaId",
         TRIM(CONCAT(u.nombres, ' ', COALESCE(u.apellidos, ''))) AS alumno,
         u.correo,
         m.estado AS "estadoMatricula",
         (
           SELECT cal.nota::NUMERIC
           FROM componentes_calificacion comp
           JOIN calificaciones cal
             ON cal.componente_id = comp.id
            AND cal.matricula_id = m.id
           WHERE comp.evaluacion_id = $3
             AND comp.oferta_curso_id = m.oferta_curso_id
           ORDER BY cal.calificado_en DESC NULLS LAST, cal.id DESC
           LIMIT 1
         ) AS "notaCalificacion"
       FROM ofertas_curso oc
       JOIN matriculas m ON m.oferta_curso_id = oc.id
       JOIN usuarios u ON u.id = m.estudiante_id
       WHERE oc.curso_id = $1
         AND oc.docente_id = $2
         AND oc.estado <> 'Cancelado'
         AND m.estado IN ('Activa', 'Completada')
         AND u.rol = 'Estudiante'
         AND u.activo = TRUE
       ORDER BY
         u.id,
         CASE oc.estado
           WHEN 'En curso' THEN 1
           WHEN 'Programado' THEN 2
           ELSE 3
         END,
         m.id DESC`,
      [cursoId, usuarioId, String(evaluacion.evaluacionId)]
    );

    const matriculaIds = alumnosResult.rows.map((row) => String(row.matriculaId));
    const intentosResult = matriculaIds.length
      ? await client.query(
          `SELECT
             ie.id::TEXT AS id,
             ie.matricula_id::TEXT AS "matriculaId",
             ie.numero_intento AS "numeroIntento",
             ie.iniciado_en AS "iniciadoEn",
             ie.enviado_en AS "enviadoEn",
             ie.estado,
             COALESCE(SUM(re.puntos_obtenidos), 0)::NUMERIC AS "puntosObtenidos"
           FROM intentos_evaluacion ie
           LEFT JOIN respuestas_evaluacion re ON re.intento_id = ie.id
           WHERE ie.evaluacion_id = $1
             AND ie.matricula_id = ANY($2::BIGINT[])
             AND ie.estado <> 'Cancelado'
           GROUP BY ie.id
           ORDER BY ie.numero_intento ASC, ie.id ASC`,
          [String(evaluacion.evaluacionId), matriculaIds]
        )
      : { rows: [] as Array<Record<string, unknown>> };

    const intentosPorMatricula = new Map<string, Array<Record<string, unknown>>>();
    for (const intento of intentosResult.rows) {
      const matriculaId = String(intento.matriculaId);
      const actuales = intentosPorMatricula.get(matriculaId) ?? [];
      actuales.push(intento);
      intentosPorMatricula.set(matriculaId, actuales);
    }

    const alumnos = alumnosResult.rows.map((alumno) => {
      const intentos = intentosPorMatricula.get(String(alumno.matriculaId)) ?? [];
      const ultimo = intentos.length > 0 ? intentos[intentos.length - 1] : null;

      return {
        alumnoId: String(alumno.alumnoId),
        matriculaId: String(alumno.matriculaId),
        alumno: String(alumno.alumno),
        correo: String(alumno.correo ?? ""),
        intentosUsados: intentos.length,
        notaCalificacion: alumno.notaCalificacion == null ? null : Number(alumno.notaCalificacion),
        ultimoIntento: ultimo
          ? {
              id: String(ultimo.id),
              numeroIntento: Number(ultimo.numeroIntento),
              estado: String(ultimo.estado),
              enviadoEn: ultimo.enviadoEn,
              puntosObtenidos: Number(ultimo.puntosObtenidos ?? 0),
            }
          : null,
      };
    });

    return res.status(200).json({
      evaluacion: {
        contenidoId: String(evaluacion.contenidoId),
        evaluacionId: String(evaluacion.evaluacionId),
        titulo: String(evaluacion.titulo),
        descripcion: String(evaluacion.descripcion ?? ""),
        numeroModulo: Number(evaluacion.numeroModulo),
        tituloModulo: String(evaluacion.tituloModulo ?? ""),
        instrucciones: String(evaluacion.instrucciones ?? ""),
        intentosPermitidos: Number(evaluacion.intentosPermitidos),
        tiempoLimiteMinutos:
          evaluacion.tiempoLimiteMinutos == null ? null : Number(evaluacion.tiempoLimiteMinutos),
        puntajeTotal: evaluacion.puntajeTotal == null ? null : Number(evaluacion.puntajeTotal),
        fechaInicio: evaluacion.fechaInicio,
        fechaFin: evaluacion.fechaFin,
        calificada: evaluacion.calificada === true,
        estado: String(evaluacion.estado),
      },
      alumnos,
    });
  } catch (error) {
    console.error("Error obteniendo seguimiento de evaluación:", error);
    return res.status(500).json({ message: "No se pudo cargar el seguimiento de la evaluación." });
  } finally {
    client.release();
  }
}

/** GET /api/cursos/:cursoId/contenidos/:contenidoId/evaluacion/docente/alumnos/:alumnoId/intentos */
export async function obtenerIntentosEvaluacionAlumnoDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const alumnoId = idPositivo(req.params.alumnoId);
  const usuarioId = req.userId;

  if (!cursoId || !contenidoId || !alumnoId || !usuarioId) {
    return res.status(400).json({ message: "Curso, alumno o sesión no válidos." });
  }

  const client = await pool.connect();

  try {
    const acceso = await docenteTieneAccesoCurso(client, cursoId, usuarioId);
    if (!acceso) {
      return res.status(403).json({ message: "No tienes acceso docente a este curso." });
    }

    const evaluacion = await obtenerCabeceraEvaluacionPorContenido(client, cursoId, contenidoId);
    if (!evaluacion) {
      return res.status(404).json({ message: "No se encontró la evaluación." });
    }

    const matriculasResult = await client.query(
      `SELECT m.id::TEXT AS id
       FROM ofertas_curso oc
       JOIN matriculas m ON m.oferta_curso_id = oc.id
       WHERE oc.curso_id = $1
         AND oc.docente_id = $2
         AND oc.estado <> 'Cancelado'
         AND m.estudiante_id = $3
         AND m.estado IN ('Activa', 'Completada')`,
      [cursoId, usuarioId, alumnoId]
    );

    const matriculaIds = matriculasResult.rows.map((row) => String(row.id));
    if (!matriculaIds.length) {
      return res.status(404).json({ message: "El alumno no pertenece a una oferta asignada a este docente." });
    }

    const alumnoResult = await client.query(
      `SELECT TRIM(CONCAT(nombres, ' ', COALESCE(apellidos, ''))) AS nombre
       FROM usuarios
       WHERE id = $1 AND rol = 'Estudiante'
       LIMIT 1`,
      [alumnoId]
    );

    const intentosResult = await client.query(
      `SELECT
         ie.id::TEXT AS id,
         ie.numero_intento AS "numeroIntento",
         ie.iniciado_en AS "iniciadoEn",
         ie.enviado_en AS "enviadoEn",
         ie.estado,
         COALESCE(SUM(re.puntos_obtenidos), 0)::NUMERIC AS "puntosObtenidos"
       FROM intentos_evaluacion ie
       LEFT JOIN respuestas_evaluacion re ON re.intento_id = ie.id
       WHERE ie.evaluacion_id = $1
         AND ie.matricula_id = ANY($2::BIGINT[])
         AND ie.estado <> 'Cancelado'
       GROUP BY ie.id
       ORDER BY ie.numero_intento ASC, ie.id ASC`,
      [String(evaluacion.evaluacionId), matriculaIds]
    );

    const intentos = intentosResult.rows.map((intento) => ({
      id: String(intento.id),
      numeroIntento: Number(intento.numeroIntento),
      iniciadoEn: intento.iniciadoEn,
      enviadoEn: intento.enviadoEn,
      estado: String(intento.estado),
      puntosObtenidos: Number(intento.puntosObtenidos ?? 0),
      puntajeTotal: evaluacion.puntajeTotal == null ? null : Number(evaluacion.puntajeTotal),
      puedeRevisar: ["Enviado", "Calificado"].includes(String(intento.estado)),
    }));

    return res.status(200).json({
      alumno: {
        id: String(alumnoId),
        nombre: String(alumnoResult.rows[0]?.nombre ?? "Alumno"),
      },
      intentosPermitidos: Number(evaluacion.intentosPermitidos),
      intentos,
    });
  } catch (error) {
    console.error("Error obteniendo intentos del alumno para docente:", error);
    return res.status(500).json({ message: "No se pudo cargar el historial del alumno." });
  } finally {
    client.release();
  }
}

/** GET /api/cursos/:cursoId/contenidos/:contenidoId/evaluacion/docente/alumnos/:alumnoId/intentos/:intentoId/detalle */
export async function obtenerDetalleIntentoEvaluacionDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const alumnoId = idPositivo(req.params.alumnoId);
  const intentoId = idPositivo(req.params.intentoId);
  const usuarioId = req.userId;

  if (!cursoId || !contenidoId || !alumnoId || !intentoId || !usuarioId) {
    return res.status(400).json({ message: "Intento, alumno o sesión no válidos." });
  }

  const client = await pool.connect();

  try {
    const acceso = await docenteTieneAccesoCurso(client, cursoId, usuarioId);
    if (!acceso) {
      return res.status(403).json({ message: "No tienes acceso docente a este curso." });
    }

    const intentoAcceso = await client.query<DetalleIntentoAcceso>(
      `SELECT
         ie.id::TEXT AS "intentoId",
         ie.evaluacion_id::TEXT AS "evaluacionId",
         ie.matricula_id::TEXT AS "matriculaId",
         m.estudiante_id::TEXT AS "alumnoId"
       FROM intentos_evaluacion ie
       JOIN matriculas m ON m.id = ie.matricula_id
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       JOIN evaluaciones e ON e.id = ie.evaluacion_id
       JOIN contenidos_curso cc ON cc.id = e.contenido_id
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       WHERE ie.id = $1
         AND m.estudiante_id = $2
         AND cc.id = $3
         AND mc.curso_id = $4
         AND oc.docente_id = $5
         AND ie.estado IN ('Enviado', 'Calificado')
       LIMIT 1`,
      [intentoId, alumnoId, contenidoId, cursoId, usuarioId]
    );

    if (!intentoAcceso.rowCount) {
      return res.status(404).json({
        message: "El intento no existe, todavía está en curso o no pertenece a este alumno.",
      });
    }

    const detalle = await construirDetalleIntento(client, cursoId, contenidoId, intentoId);
    if (!detalle) {
      return res.status(404).json({ message: "No se encontró el intento." });
    }

    return res.status(200).json(detalle);
  } catch (error) {
    console.error("Error obteniendo detalle del intento para docente:", error);
    return res.status(500).json({ message: "No se pudo cargar el detalle del intento." });
  } finally {
    client.release();
  }
}

/** PATCH /api/cursos/:cursoId/contenidos/:contenidoId/evaluacion/docente/alumnos/:alumnoId/intentos/:intentoId/preguntas/:preguntaId/calificacion */
export async function calificarRespuestaEvaluacionDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const alumnoId = idPositivo(req.params.alumnoId);
  const intentoId = idPositivo(req.params.intentoId);
  const preguntaId = idPositivo(req.params.preguntaId);
  const usuarioId = idPositivo(req.userId);
  const valorPuntaje = req.body?.puntosObtenidos;
  const puntos = valorPuntaje === "" || valorPuntaje === null || valorPuntaje === undefined
    ? Number.NaN
    : Number(valorPuntaje);

  if (!cursoId || !contenidoId || !alumnoId || !intentoId || !preguntaId || !usuarioId) {
    return res.status(400).json({ message: "Evaluación, intento, pregunta o sesión no válidos." });
  }
  if (!Number.isFinite(puntos) || puntos < 0 || Math.abs(puntos * 100 - Math.round(puntos * 100)) > 1e-8) {
    return res.status(400).json({ message: "Escribe un puntaje válido con hasta dos decimales." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const acceso = await docenteTieneAccesoCurso(client, cursoId, String(usuarioId));
    if (!acceso) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "No tienes acceso docente a este curso." });
    }

    const respuestaResult = await client.query(
      `SELECT
         ie.id::TEXT AS id,
         ie.estado,
         ie.matricula_id::TEXT AS "matriculaId",
         ie.evaluacion_id::TEXT AS "evaluacionId",
         p.puntaje::NUMERIC AS "puntajeMaximo",
         p.tipo,
         re.puntos_obtenidos::NUMERIC AS "puntosObtenidos"
       FROM intentos_evaluacion ie
       JOIN matriculas m ON m.id = ie.matricula_id
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       JOIN evaluaciones e ON e.id = ie.evaluacion_id
       JOIN contenidos_curso cc ON cc.id = e.contenido_id
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       JOIN preguntas_evaluacion p ON p.evaluacion_id = e.id
       JOIN respuestas_evaluacion re
         ON re.intento_id = ie.id
        AND re.pregunta_id = p.id
       WHERE ie.id = $1
         AND m.estudiante_id = $2
         AND cc.id = $3
         AND mc.curso_id = $4
         AND p.id = $5
         AND p.tipo = 'respuesta_abierta'
         AND oc.docente_id = $6
         AND oc.estado <> 'Cancelado'
         AND ie.estado IN ('Enviado', 'Calificado')
       FOR UPDATE OF ie, re`,
      [intentoId, alumnoId, contenidoId, cursoId, preguntaId, usuarioId]
    );

    if (!respuestaResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "No se encontró la respuesta o no pertenece a una pregunta abierta de este curso." });
    }

    const respuesta = respuestaResult.rows[0];

    const maximo = Number(respuesta.puntajeMaximo ?? 0);
    if (puntos > maximo) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `El puntaje no puede superar ${maximo.toFixed(2)} puntos.` });
    }

    await client.query(
      `UPDATE respuestas_evaluacion
       SET puntos_obtenidos = $1
       WHERE intento_id = $2
         AND pregunta_id = $3`,
      [puntos, intentoId, preguntaId]
    );

    const calificacion = await actualizarEstadoYNotaIntento(client, intentoId, usuarioId);
    await client.query("COMMIT");

    return res.status(200).json({
      message: calificacion.estado === "Calificado"
        ? "Puntaje actualizado. La nota del examen está publicada."
        : "Puntaje actualizado. Todavía hay preguntas pendientes de calificación.",
      preguntaId: String(preguntaId),
      puntosObtenidos: puntos,
      intento: {
        id: String(intentoId),
        estado: calificacion.estado,
        puntosObtenidos: calificacion.estado === "Calificado" ? calificacion.puntosObtenidos : null,
        puntajeTotal: calificacion.puntajeTotal,
        nota: calificacion.estado === "Calificado" ? calificacion.nota : null,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Error calificando pregunta abierta de evaluación:", error);
    return res.status(500).json({ message: "No se pudo guardar el puntaje de la pregunta." });
  } finally {
    client.release();
  }
}

/** GET /api/cursos/:cursoId/contenidos/:contenidoId/evaluacion/archivo/:archivoId */
export async function descargarArchivoRespuestaEvaluacion(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const archivoId = idPositivo(req.params.archivoId);
  const usuarioId = idPositivo(req.userId);

  if (!cursoId || !contenidoId || !archivoId || !usuarioId) {
    return res.status(400).json({ message: "Archivo o sesión no válidos." });
  }

  try {
    const result = await pool.query(
      `SELECT
         f.ruta_archivo AS "rutaArchivo",
         f.nombre_archivo AS "nombreArchivo",
         f.mime_type AS "mimeType"
       FROM archivos_respuesta_evaluacion f
       JOIN respuestas_evaluacion re ON re.id = f.respuesta_id
       JOIN intentos_evaluacion ie ON ie.id = re.intento_id
       JOIN evaluaciones e ON e.id = ie.evaluacion_id
       JOIN contenidos_curso cc ON cc.id = e.contenido_id
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       JOIN cursos c ON c.id = mc.curso_id
       JOIN matriculas m ON m.id = ie.matricula_id
       JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
       JOIN usuarios u ON u.id = $4 AND u.activo = TRUE
       WHERE f.id = $3
         AND c.id = $1
         AND cc.id = $2
         AND ie.estado IN ('Enviado', 'Calificado')
         AND (
           (u.rol = 'Estudiante' AND m.estudiante_id = u.id AND m.estado IN ('Activa', 'Completada'))
           OR
           (u.rol = 'Docente' AND oc.docente_id = u.id AND oc.estado <> 'Cancelado')
         )
       LIMIT 1`,
      [cursoId, contenidoId, archivoId, usuarioId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "El archivo no existe o no tienes permiso para consultarlo." });
    }

    const row = result.rows[0];
    const ruta = typeof row.rutaArchivo === "string" ? row.rutaArchivo : "";
    if (!ruta.startsWith("r2://") || !ruta.slice(5)) {
      return res.status(404).json({ message: "El documento no está disponible en Cloudflare R2." });
    }

    let object;
    try {
      object = await getObjectFromR2(ruta.slice(5));
    } catch (error) {
      if (isR2NotFoundError(error)) {
        return res.status(404).json({ message: "El documento ya no está disponible en Cloudflare R2." });
      }
      throw error;
    }

    if (!object.Body) {
      return res.status(404).json({ message: "El documento no contiene datos." });
    }

    const nombre = nombreArchivoSeguro(String(row.nombreArchivo ?? "archivo"));
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", String(row.mimeType ?? "application/octet-stream"));
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`);
    streamBodyToResponse(object.Body, res);
  } catch (error) {
    console.error("Error descargando archivo de respuesta de evaluación:", error);
    if (!res.headersSent) return res.status(500).json({ message: "No se pudo descargar el documento." });
  }
}
