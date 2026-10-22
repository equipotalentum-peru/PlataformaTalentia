import type { Response } from "express";
import type { PoolClient } from "pg";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type TipoEvaluacion = "Cuestionario" | "Practica" | "Examen" | "Evaluacion";
type EstadoEvaluacion = "Borrador" | "Publicado";
type TipoPregunta =
  | "seleccion_unica"
  | "seleccion_multiple"
  | "verdadero_falso"
  | "respuesta_abierta"
  | "relacional";

type OpcionEntrada = { texto?: unknown; esCorrecta?: unknown };
type RelacionEntrada = {
  elementoIzquierda?: unknown;
  elementoDerecha?: unknown;
};
type PreguntaEntrada = {
  enunciado?: unknown;
  tipo?: unknown;
  puntaje?: unknown;
  permiteArchivos?: unknown;
  opciones?: unknown;
  relaciones?: unknown;
};

class EvaluacionInputError extends Error {}

function idPositivo(valor: unknown): number | null {
  const numero = typeof valor === "string" && valor.trim() ? Number(valor) : valor;
  return typeof numero === "number" && Number.isSafeInteger(numero) && numero > 0
    ? numero
    : null;
}

function numeroValido(valor: unknown, min: number, max: number): number | null {
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(numero) || numero < min || numero > max) return null;
  if (Math.abs(numero * 100 - Math.round(numero * 100)) > 1e-8) return null;
  return numero;
}

function fechaValida(valor: unknown): string | null | undefined {
  if (valor === null || valor === undefined || valor === "") return null;
  if (
    typeof valor !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(valor) ||
    !Number.isFinite(Date.parse(valor))
  ) {
    return undefined;
  }
  return valor;
}

function texto(valor: unknown, maximo: number): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio.length <= maximo ? limpio : null;
}

function validarPreguntas(
  valor: unknown,
  estado: EstadoEvaluacion
): Array<{
  enunciado: string;
  tipo: TipoPregunta;
  puntaje: number;
  permiteArchivos: boolean;
  opciones: Array<{ texto: string; esCorrecta: boolean }>;
  relaciones: Array<{ izquierda: string; derecha: string }>;
}> {
  if (!Array.isArray(valor) || valor.length < 1 || valor.length > 100) {
    throw new EvaluacionInputError("La evaluación debe tener entre 1 y 100 preguntas.");
  }

  const tipos = new Set<TipoPregunta>([
    "seleccion_unica",
    "seleccion_multiple",
    "verdadero_falso",
    "respuesta_abierta",
    "relacional",
  ]);

  return valor.map((item, indice) => {
    if (!item || typeof item !== "object") {
      throw new EvaluacionInputError(`La pregunta ${indice + 1} no es válida.`);
    }

    const pregunta = item as PreguntaEntrada;
    const enunciado = texto(pregunta.enunciado, 5000);
    const puntaje = numeroValido(pregunta.puntaje, 0, 100);
    const tipo = pregunta.tipo as TipoPregunta;
    const permiteArchivos = pregunta.permiteArchivos === true;

    if (enunciado === null || !enunciado) {
      throw new EvaluacionInputError(`Completa el enunciado de la pregunta ${indice + 1}.`);
    }
    if (!tipos.has(tipo)) {
      throw new EvaluacionInputError(`El tipo de la pregunta ${indice + 1} no es válido.`);
    }
    if (puntaje === null) {
      throw new EvaluacionInputError(`El puntaje de la pregunta ${indice + 1} debe estar entre 0 y 100, con hasta dos decimales.`);
    }
    if (permiteArchivos && tipo !== "respuesta_abierta") {
      throw new EvaluacionInputError("Solo una pregunta de texto puede permitir archivos adjuntos.");
    }

    const opcionesEntrada = Array.isArray(pregunta.opciones) ? pregunta.opciones : [];
    const relacionesEntrada = Array.isArray(pregunta.relaciones) ? pregunta.relaciones : [];
    let opciones: Array<{ texto: string; esCorrecta: boolean }> = [];
    let relaciones: Array<{ izquierda: string; derecha: string }> = [];

    if (["seleccion_unica", "seleccion_multiple", "verdadero_falso"].includes(tipo)) {
      if (opcionesEntrada.length < 2 || opcionesEntrada.length > 6) {
        throw new EvaluacionInputError(`La pregunta ${indice + 1} debe tener entre 2 y 6 opciones.`);
      }

      opciones = (opcionesEntrada as OpcionEntrada[]).map((opcion, numero) => {
        const opcionTexto = texto(opcion?.texto, 2000);
        if (opcionTexto === null) {
          throw new EvaluacionInputError(`La opción ${numero + 1} de la pregunta ${indice + 1} no es válida.`);
        }
        return { texto: opcionTexto, esCorrecta: opcion.esCorrecta === true };
      });

      if (tipo === "verdadero_falso") {
        if (
          opciones.length !== 2 ||
          opciones[0].texto.toLocaleLowerCase("es") !== "verdadero" ||
          opciones[1].texto.toLocaleLowerCase("es") !== "falso"
        ) {
          throw new EvaluacionInputError("Las preguntas Verdadero / Falso deben conservar las opciones Verdadero y Falso.");
        }
      }

      if (estado === "Publicado") {
        if (opciones.some((opcion) => !opcion.texto)) {
          throw new EvaluacionInputError(`Completa todas las opciones de la pregunta ${indice + 1}.`);
        }
        const correctas = opciones.filter((opcion) => opcion.esCorrecta).length;
        if (tipo === "seleccion_multiple" ? correctas < 1 : correctas !== 1) {
          throw new EvaluacionInputError(
            tipo === "seleccion_multiple"
              ? `Marca al menos una respuesta correcta en la pregunta ${indice + 1}.`
              : `Marca exactamente una respuesta correcta en la pregunta ${indice + 1}.`
          );
        }
      }
    } else if (tipo === "relacional") {
      if (relacionesEntrada.length < 2 || relacionesEntrada.length > 30) {
        throw new EvaluacionInputError(`La pregunta relacional ${indice + 1} debe tener entre 2 y 30 relaciones.`);
      }
      relaciones = (relacionesEntrada as RelacionEntrada[]).map((relacion, numero) => {
        const izquierda = texto(relacion?.elementoIzquierda, 2000);
        const derecha = texto(relacion?.elementoDerecha, 2000);
        if (izquierda === null || derecha === null) {
          throw new EvaluacionInputError(`La relación ${numero + 1} de la pregunta ${indice + 1} no es válida.`);
        }
        if (estado === "Publicado" && (!izquierda || !derecha)) {
          throw new EvaluacionInputError(`Completa ambos elementos de la relación ${numero + 1} de la pregunta ${indice + 1}.`);
        }
        return { izquierda, derecha };
      });
    }

    return {
      enunciado,
      tipo,
      puntaje,
      permiteArchivos: tipo === "respuesta_abierta" && permiteArchivos,
      opciones,
      relaciones,
    };
  });
}

async function comprobarAccesoDocente(
  cursoId: number,
  moduloId: number,
  usuarioId: string
): Promise<boolean> {
  const acceso = await pool.query(
    `SELECT mc.id
     FROM modulos_curso mc
     JOIN cursos c ON c.id = mc.curso_id
     JOIN usuarios u ON u.id = $3
     WHERE mc.id = $2
       AND c.id = $1
       AND mc.activo = TRUE
       AND c.estado = 'Activo'
       AND u.rol = 'Docente'
       AND u.activo = TRUE
       AND EXISTS (
         SELECT 1
         FROM ofertas_curso oc
         WHERE oc.curso_id = c.id
           AND oc.docente_id = u.id
           AND oc.estado <> 'Cancelado'
       )
     LIMIT 1`,
    [cursoId, moduloId, usuarioId]
  );
  return Boolean(acceso.rowCount);
}

/** GET /api/cursos/:cursoId/modulos/:moduloId/evaluaciones/componentes-calificacion */
export async function listarComponentesCalificacionDocente(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const moduloId = idPositivo(req.params.moduloId);
  const contenidoId = req.query.contenidoId == null ? null : idPositivo(req.query.contenidoId);
  if (!cursoId || !moduloId || !req.userId || (req.query.contenidoId != null && !contenidoId)) {
    return res.status(400).json({ message: "Curso, módulo o sesión no válidos." });
  }

  try {
    if (!(await comprobarAccesoDocente(cursoId, moduloId, req.userId))) {
      return res.status(403).json({ message: "No tienes permiso para crear evaluaciones en este módulo." });
    }

    const resultado = await pool.query(
      `SELECT
         cc.id::TEXT AS id,
         cc.nombre,
         cc.tipo,
         cc.porcentaje::NUMERIC AS porcentaje,
         COALESCE(p.nombre, 'Sin periodo') AS periodo
       FROM componentes_calificacion cc
       JOIN ofertas_curso oc ON oc.id = cc.oferta_curso_id
       LEFT JOIN periodos_academicos p ON p.id = oc.periodo_id
       WHERE oc.curso_id = $1
         AND oc.docente_id = $2
         AND oc.estado <> 'Cancelado'
         AND (cc.evaluacion_id IS NULL OR cc.evaluacion_id IN (
           SELECT e.id FROM evaluaciones e
           JOIN contenidos_curso contenido ON contenido.id = e.contenido_id
           WHERE contenido.id = $3 AND contenido.modulo_id = $4
         ))
         AND cc.actividad_id IS NULL
       ORDER BY p.fecha_inicio DESC NULLS LAST, cc.id`,
      [cursoId, req.userId, contenidoId, moduloId]
    );

    return res.status(200).json({ componentes: resultado.rows });
  } catch (error) {
    console.error("Error listando componentes de calificación:", error);
    return res.status(500).json({ message: "No se pudieron cargar las evaluaciones configuradas por el administrador." });
  }
}

/** POST /api/cursos/:cursoId/modulos/:moduloId/evaluaciones */
export async function crearEvaluacionCurso(
  req: AuthenticatedRequest,
  res: Response
) {
  return guardarEvaluacionCurso(req, res, false);
}

export async function editarEvaluacionCurso(req: AuthenticatedRequest, res: Response) {
  return guardarEvaluacionCurso(req, res, true);
}

async function guardarEvaluacionCurso(req: AuthenticatedRequest, res: Response, editing: boolean) {
  const cursoId = idPositivo(req.params.cursoId);
  const moduloId = idPositivo(req.params.moduloId);
  const contenidoExistenteId = editing ? idPositivo(req.params.contenidoId) : null;
  const usuarioId = req.userId;

  if (!cursoId || !moduloId || !usuarioId || (editing && !contenidoExistenteId)) {
    return res.status(400).json({ message: "Curso, módulo o sesión no válidos." });
  }

  const body = req.body as Record<string, unknown> | undefined;
  const titulo = texto(body?.titulo, 200);
  const descripcion = typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const estado = body?.estado as EstadoEvaluacion;
  const calificada = body?.calificada;
  const tipo = body?.tipo as TipoEvaluacion;
  const componenteId = body?.componenteCalificacionId == null || body.componenteCalificacionId === ""
    ? null
    : idPositivo(body.componenteCalificacionId);
  const intentos = idPositivo(body?.intentosPermitidos);
  const tiempo = body?.tiempoLimiteMinutos === null || body?.tiempoLimiteMinutos === undefined
    ? null
    : idPositivo(body.tiempoLimiteMinutos);
  const puntajeTotal = numeroValido(body?.puntajeTotal, 0, 1000);
  const fechaInicio = fechaValida(body?.fechaInicio);
  const fechaFin = fechaValida(body?.fechaFin);

  if (!titulo || descripcion.length > 20000) {
    return res.status(400).json({ message: "El título es obligatorio (máximo 200 caracteres) y la descripción no debe superar 20 000 caracteres." });
  }
  if (estado !== "Borrador" && estado !== "Publicado") {
    return res.status(400).json({ message: "El estado de la evaluación no es válido." });
  }
  if (typeof calificada !== "boolean") {
    return res.status(400).json({ message: "Indica si la evaluación es calificable." });
  }
  if (!["Cuestionario", "Practica", "Examen", "Evaluacion"].includes(tipo)) {
    return res.status(400).json({ message: "El tipo de evaluación no es válido." });
  }
  if (intentos === null || !Number.isSafeInteger(intentos) || intentos < 1 || intentos > 10) {
    return res.status(400).json({ message: "Los intentos permitidos deben estar entre 1 y 10." });
  }
  if (body?.tiempoLimiteMinutos !== null && body?.tiempoLimiteMinutos !== undefined && (tiempo === null || !Number.isSafeInteger(tiempo) || tiempo < 1 || tiempo > 1440)) {
    return res.status(400).json({ message: "El tiempo límite debe estar entre 1 y 1440 minutos, o dejarse vacío." });
  }
  if (puntajeTotal === null) {
    return res.status(400).json({ message: "El puntaje total debe estar entre 0 y 1000, con hasta dos decimales." });
  }
  if (fechaInicio === undefined || fechaFin === undefined) {
    return res.status(400).json({ message: "Las fechas deben ser fechas válidas con zona horaria." });
  }
  if (fechaInicio === null || fechaFin === null) {
    return res.status(400).json({ message: "La fecha de inicio y la fecha final son obligatorias." });
  }
  if (Date.parse(fechaFin) < Date.parse(fechaInicio)) {
    return res.status(400).json({ message: "La fecha final no puede ser anterior a la fecha de inicio." });
  }
  if (fechaInicio && fechaFin && Date.parse(fechaFin) < Date.parse(fechaInicio)) {
    return res.status(400).json({ message: "La fecha final no puede ser anterior a la fecha de inicio." });
  }
  if (calificada && !componenteId) {
    return res.status(400).json({ message: "Selecciona el componente de calificación configurado por el administrador." });
  }
  if (calificada && tipo !== "Evaluacion") {
    return res.status(400).json({ message: "Las evaluaciones calificables deben usar el tipo interno Evaluacion." });
  }

  let preguntas: ReturnType<typeof validarPreguntas>;
  try {
    preguntas = validarPreguntas(body?.preguntas, estado);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "Las preguntas no son válidas." });
  }

  if (estado === "Publicado") {
    const sumaCentimos = preguntas.reduce((suma, pregunta) => suma + Math.round(pregunta.puntaje * 100), 0);
    if (puntajeTotal <= 0 || sumaCentimos !== Math.round(puntajeTotal * 100)) {
      return res.status(400).json({ message: "Para publicar, los puntos de las preguntas deben sumar exactamente el puntaje total." });
    }
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const acceso = await client.query(
      `SELECT mc.id
       FROM modulos_curso mc
       JOIN cursos c ON c.id = mc.curso_id
       JOIN usuarios u ON u.id = $3
       WHERE mc.id = $2
         AND c.id = $1
         AND mc.activo = TRUE
         AND c.estado = 'Activo'
         AND u.rol = 'Docente'
         AND u.activo = TRUE
         AND EXISTS (
           SELECT 1 FROM ofertas_curso oc
           WHERE oc.curso_id = c.id
             AND oc.docente_id = u.id
             AND oc.estado <> 'Cancelado'
         )
       FOR UPDATE OF mc, c`,
      [cursoId, moduloId, usuarioId]
    );

    if (!acceso.rowCount) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "No tienes permiso para crear evaluaciones en este módulo." });
    }

    let evaluacionId: string;
    let contenidoId: string;
    if (editing) {
      const existente = await client.query(
        `SELECT e.id::TEXT AS id, cc.id::TEXT AS "contenidoId"
         FROM evaluaciones e JOIN contenidos_curso cc ON cc.id = e.contenido_id
         WHERE cc.id = $1 AND cc.modulo_id = $2 AND cc.tipo = 'evaluacion'
         FOR UPDATE OF e, cc`,
        [contenidoExistenteId, moduloId]
      );
      if (!existente.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "La evaluación no existe en este módulo." });
      }
      evaluacionId = String(existente.rows[0].id);
      contenidoId = String(existente.rows[0].contenidoId);
      const intentosGuardados = await client.query(
        "SELECT id FROM intentos_evaluacion WHERE evaluacion_id = $1 LIMIT 1", [evaluacionId]
      );
      if (intentosGuardados.rowCount) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Esta evaluación ya tiene intentos de alumnos y no se puede modificar para conservar sus respuestas." });
      }
      const componentesVinculados = await client.query(
        `SELECT cc.id, oc.docente_id::TEXT AS "docenteId"
         FROM componentes_calificacion cc JOIN ofertas_curso oc ON oc.id = cc.oferta_curso_id
         WHERE cc.evaluacion_id = $1 ORDER BY cc.id FOR UPDATE OF cc`, [evaluacionId]
      );
      if (componentesVinculados.rows.length > 1 || componentesVinculados.rows.some(item => String(item.docenteId) !== String(usuarioId))) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "La evaluación tiene vínculos de calificación compartidos y no se puede modificar desde esta oferta." });
      }
    } else {
      evaluacionId = "";
      contenidoId = "";
    }

    if (calificada && componenteId) {
      const componente = await client.query(
        `SELECT cc.id
         FROM componentes_calificacion cc
         JOIN ofertas_curso oc ON oc.id = cc.oferta_curso_id
         WHERE cc.id = $1
           AND oc.curso_id = $2
           AND oc.docente_id = $3
           AND oc.estado <> 'Cancelado'
           AND (cc.evaluacion_id IS NULL OR cc.evaluacion_id = $4::BIGINT)
           AND cc.actividad_id IS NULL
         FOR UPDATE OF cc`,
        [componenteId, cursoId, usuarioId, editing ? evaluacionId : null]
      );

      if (!componente.rowCount) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "El componente seleccionado ya está vinculado o no pertenece a una oferta que tengas asignada." });
      }
    }

    const estadoContenido = estado === "Publicado" ? "Publicado" : "Borrador";
    const estadoEvaluacion = estado === "Publicado" ? "Publicada" : "Borrador";

    if (editing) {
      await client.query(
        "UPDATE contenidos_curso SET titulo = $1, descripcion = $2, estado = $3 WHERE id = $4",
        [titulo, descripcion || null, estadoContenido, contenidoId]
      );
      await client.query(
        `UPDATE evaluaciones SET tipo = $1, instrucciones = $2, intentos_permitidos = $3,
         tiempo_limite_minutos = $4, puntaje_total = $5, fecha_inicio = $6::TIMESTAMPTZ,
         fecha_fin = $7::TIMESTAMPTZ, calificada = $8, estado = $9 WHERE id = $10`,
        [tipo, descripcion || null, intentos, tiempo, puntajeTotal, fechaInicio, fechaFin, calificada, estadoEvaluacion, evaluacionId]
      );
      await client.query("DELETE FROM preguntas_evaluacion WHERE evaluacion_id = $1", [evaluacionId]);
      await client.query("UPDATE componentes_calificacion SET evaluacion_id = NULL WHERE evaluacion_id = $1", [evaluacionId]);
    } else {
      const contenidoResult = await client.query(
        `INSERT INTO contenidos_curso (
           modulo_id, titulo, tipo, descripcion, orden, estado, creado_por
         )
         SELECT $1, $2, 'evaluacion', $3,
                COALESCE(MAX(orden), 0) + 1, $4, $5
         FROM contenidos_curso
         WHERE modulo_id = $1
         RETURNING id::TEXT AS id`,
        [moduloId, titulo, descripcion || null, estadoContenido, usuarioId]
      );
      contenidoId = String(contenidoResult.rows[0].id);

      const evaluacionResult = await client.query(
        `INSERT INTO evaluaciones (
           contenido_id, tipo, instrucciones, intentos_permitidos,
           tiempo_limite_minutos, puntaje_total, fecha_inicio, fecha_fin,
           calificada, estado
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7::TIMESTAMPTZ, $8::TIMESTAMPTZ, $9, $10
         )
         RETURNING id::TEXT AS id`,
        [
          contenidoId,
          tipo,
          descripcion || null,
          intentos,
          tiempo,
          puntajeTotal,
          fechaInicio,
          fechaFin,
          calificada,
          estadoEvaluacion,
        ]
      );
      evaluacionId = String(evaluacionResult.rows[0].id);
    }

    for (let index = 0; index < preguntas.length; index += 1) {
      const pregunta = preguntas[index];
      const preguntaResult = await client.query(
        `INSERT INTO preguntas_evaluacion (
           evaluacion_id, numero, enunciado, tipo, puntaje, permite_archivos
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id::TEXT AS id`,
        [evaluacionId, index + 1, pregunta.enunciado, pregunta.tipo, pregunta.puntaje, pregunta.permiteArchivos]
      );
      const preguntaId = String(preguntaResult.rows[0].id);

      for (let optionIndex = 0; optionIndex < pregunta.opciones.length; optionIndex += 1) {
        const opcion = pregunta.opciones[optionIndex];
        await client.query(
          `INSERT INTO opciones_pregunta (pregunta_id, numero, texto, es_correcta)
           VALUES ($1, $2, $3, $4)`,
          [preguntaId, optionIndex + 1, opcion.texto, opcion.esCorrecta]
        );
      }

      for (let relationIndex = 0; relationIndex < pregunta.relaciones.length; relationIndex += 1) {
        const relacion = pregunta.relaciones[relationIndex];
        await client.query(
          `INSERT INTO relaciones_pregunta (
             pregunta_id, numero, elemento_izquierda, elemento_derecha
           ) VALUES ($1, $2, $3, $4)`,
          [preguntaId, relationIndex + 1, relacion.izquierda, relacion.derecha]
        );
      }
    }

    if (calificada && componenteId) {
      const asociacion = await client.query(
        `UPDATE componentes_calificacion
         SET evaluacion_id = $1
         WHERE id = $2
           AND evaluacion_id IS NULL
           AND actividad_id IS NULL`,
        [evaluacionId, componenteId]
      );

      if (!asociacion.rowCount) {
        throw new EvaluacionInputError("No se pudo vincular el componente de calificación. Puede haber sido utilizado por otra evaluación.");
      }
    }

    await client.query("COMMIT");

    return res.status(editing ? 200 : 201).json({
      message: editing ? "La evaluación se actualizó correctamente." : estado === "Publicado"
        ? "La evaluación se creó y publicó correctamente."
        : "La evaluación se guardó como borrador.",
      contenidoId,
      evaluacionId,
      estado: estadoEvaluacion,
      calificada,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => undefined);

    if (error instanceof EvaluacionInputError) {
      return res.status(400).json({ message: error.message });
    }
    if ((error as { code?: string }).code === "23505") {
      return res.status(409).json({ message: "Ya existe contenido con ese orden en el módulo. Recarga el curso e inténtalo de nuevo." });
    }

    console.error("Error creando evaluación del curso:", error);
    return res.status(500).json({ message: "No se pudo guardar la evaluación y sus preguntas." });
  } finally {
    client?.release();
  }
}


/**
 * GET /api/cursos/:cursoId/contenidos/:contenidoId/evaluacion
 *
 * Devuelve la definición guardada. El estudiante nunca recibe las claves
 * correctas ni los pares de relación ya emparejados.
 */
export async function obtenerEvaluacionCurso(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = idPositivo(req.params.cursoId);
  const contenidoId = idPositivo(req.params.contenidoId);
  const usuarioId = req.userId;

  if (!cursoId || !contenidoId || !usuarioId) {
    return res.status(400).json({
      message: "Curso, contenido o sesión no válidos.",
    });
  }

  try {
    const cabeceraResult = await pool.query(
      `SELECT
         cc.id::TEXT AS "contenidoId",
         cc.titulo,
         cc.descripcion,
         cc.estado AS "estadoContenido",
         mc.numero AS "numeroModulo",
         mc.id::TEXT AS "moduloId",
         mc.titulo AS "tituloModulo",
         e.id::TEXT AS "evaluacionId",
         e.tipo,
         e.instrucciones,
         e.intentos_permitidos AS "intentosPermitidos",
         e.tiempo_limite_minutos AS "tiempoLimiteMinutos",
         e.puntaje_total AS "puntajeTotal",
         e.fecha_inicio AS "fechaInicio",
         e.fecha_fin AS "fechaFin",
         e.calificada,
         e.estado AS "estadoEvaluacion",
         u.rol
       FROM contenidos_curso cc
       JOIN modulos_curso mc ON mc.id = cc.modulo_id
       JOIN cursos c ON c.id = mc.curso_id
       JOIN evaluaciones e ON e.contenido_id = cc.id
       JOIN usuarios u ON u.id = $3 AND u.activo = TRUE
       WHERE c.id = $1
         AND cc.id = $2
         AND mc.activo = TRUE
         AND c.estado = 'Activo'
         AND (
           (
             u.rol = 'Docente'
             AND EXISTS (
               SELECT 1
               FROM ofertas_curso oc
               WHERE oc.curso_id = c.id
                 AND oc.docente_id = u.id
                 AND oc.estado <> 'Cancelado'
             )
           )
           OR
           (
             u.rol = 'Estudiante'
             AND cc.estado = 'Publicado'
             AND e.estado = 'Publicada'
             AND EXISTS (
               SELECT 1
               FROM matriculas m
               JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
               WHERE oc.curso_id = c.id
                 AND m.estudiante_id = u.id
                 AND m.estado IN ('Activa', 'Completada')
                 AND oc.publicado = TRUE
                 AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
             )
           )
         )
       LIMIT 1`,
      [cursoId, contenidoId, usuarioId]
    );

    if (!cabeceraResult.rowCount) {
      return res.status(404).json({
        message: "La evaluación no existe o no tienes acceso a ella.",
      });
    }

    const cabecera = cabeceraResult.rows[0];
    const evaluacionId = String(cabecera.evaluacionId);
    const esDocente = cabecera.rol === "Docente";
    const componenteResult = esDocente ? await pool.query(
      `SELECT cc.id::TEXT AS id FROM componentes_calificacion cc
       JOIN ofertas_curso oc ON oc.id = cc.oferta_curso_id
       WHERE cc.evaluacion_id = $1 AND oc.docente_id = $2
       ORDER BY cc.id LIMIT 1`, [evaluacionId, usuarioId]
    ) : { rows: [] };

    const preguntasResult = await pool.query(
      `SELECT
         id::TEXT AS id,
         numero,
         enunciado,
         tipo,
         puntaje::NUMERIC AS puntaje,
         permite_archivos AS "permiteArchivos"
       FROM preguntas_evaluacion
       WHERE evaluacion_id = $1
       ORDER BY numero, id`,
      [evaluacionId]
    );

    const preguntas = preguntasResult.rows as Array<{
      id: string;
      numero: number;
      enunciado: string;
      tipo: string;
      puntaje: string | number;
      permiteArchivos: boolean;
    }>;

    const preguntasIds = preguntas.map((pregunta) => pregunta.id);

    const opcionesResult = preguntasIds.length
      ? await pool.query(
          `SELECT
             op.id::TEXT AS id,
             op.pregunta_id::TEXT AS "preguntaId",
             op.numero,
             op.texto,
             CASE WHEN $2::BOOLEAN THEN op.es_correcta ELSE NULL END AS "esCorrecta"
           FROM opciones_pregunta op
           WHERE op.pregunta_id = ANY($1::BIGINT[])
           ORDER BY op.pregunta_id, op.numero, op.id`,
          [preguntasIds, esDocente]
        )
      : { rows: [] as Array<Record<string, unknown>> };

    const relacionesResult = preguntasIds.length
      ? await pool.query(
          `SELECT
             rp.id::TEXT AS id,
             rp.pregunta_id::TEXT AS "preguntaId",
             rp.numero,
             rp.elemento_izquierda AS "elementoIzquierda",
             rp.elemento_derecha AS "elementoDerecha"
           FROM relaciones_pregunta rp
           WHERE rp.pregunta_id = ANY($1::BIGINT[])
           ORDER BY rp.pregunta_id, rp.numero, rp.id`,
          [preguntasIds]
        )
      : { rows: [] as Array<Record<string, unknown>> };

    const opcionesPorPregunta = new Map<string, Array<Record<string, unknown>>>();
    for (const opcion of opcionesResult.rows) {
      const key = String(opcion.preguntaId);
      const actuales = opcionesPorPregunta.get(key) ?? [];
      actuales.push({
        id: String(opcion.id),
        numero: Number(opcion.numero),
        texto: String(opcion.texto),
        ...(esDocente ? { esCorrecta: opcion.esCorrecta === true } : {}),
      });
      opcionesPorPregunta.set(key, actuales);
    }

    const relacionesPorPregunta = new Map<string, Array<Record<string, unknown>>>();
    for (const relacion of relacionesResult.rows) {
      const key = String(relacion.preguntaId);
      const actuales = relacionesPorPregunta.get(key) ?? [];
      actuales.push({
        id: String(relacion.id),
        numero: Number(relacion.numero),
        elementoIzquierda: String(relacion.elementoIzquierda),
        ...(esDocente
          ? { elementoDerecha: String(relacion.elementoDerecha) }
          : {}),
      });
      relacionesPorPregunta.set(key, actuales);
    }

    const preguntasRespuesta = preguntas.map((pregunta) => {
      const relacionesCompletas = (relacionesResult.rows as Array<Record<string, unknown>>)
        .filter((relacion) => String(relacion.preguntaId) === pregunta.id);

      // El lado derecho se entrega como un conjunto separado y mezclado al estudiante.
      // No se devuelve la correspondencia correcta entre izquierda y derecha.
      const opcionesRelacion = esDocente
        ? []
        : relacionesCompletas
            .map((relacion) => String(relacion.elementoDerecha))
            .sort(() => Math.random() - 0.5);

      return {
        id: pregunta.id,
        numero: Number(pregunta.numero),
        enunciado: pregunta.enunciado,
        tipo: pregunta.tipo,
        puntaje: Number(pregunta.puntaje),
        permiteArchivos: pregunta.permiteArchivos === true,
        opciones: opcionesPorPregunta.get(pregunta.id) ?? [],
        relaciones: relacionesPorPregunta.get(pregunta.id) ?? [],
        opcionesRelacion,
      };
    });

    return res.status(200).json({
      contenido: {
        id: String(cabecera.contenidoId),
        titulo: cabecera.titulo,
        descripcion: cabecera.descripcion ?? "",
        estado: cabecera.estadoContenido,
        numeroModulo: Number(cabecera.numeroModulo),
        moduloId: String(cabecera.moduloId),
        tituloModulo: cabecera.tituloModulo,
      },
      evaluacion: {
        id: evaluacionId,
        tipo: cabecera.tipo,
        instrucciones: cabecera.instrucciones ?? "",
        intentosPermitidos: Number(cabecera.intentosPermitidos),
        tiempoLimiteMinutos:
          cabecera.tiempoLimiteMinutos == null
            ? null
            : Number(cabecera.tiempoLimiteMinutos),
        puntajeTotal:
          cabecera.puntajeTotal == null ? null : Number(cabecera.puntajeTotal),
        fechaInicio: cabecera.fechaInicio,
        fechaFin: cabecera.fechaFin,
        calificada: cabecera.calificada === true,
        ...(esDocente ? { componenteCalificacionId: componenteResult.rows[0]?.id ?? null } : {}),
        estado: cabecera.estadoEvaluacion,
      },
      preguntas: preguntasRespuesta,
    });
  } catch (error) {
    console.error("Error obteniendo evaluación del curso:", error);
    return res.status(500).json({
      message: "No se pudo cargar la evaluación y sus preguntas.",
    });
  }
}
