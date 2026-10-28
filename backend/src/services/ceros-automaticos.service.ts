import pool from "../config/database";

/*
 * ==========================================================
 * 0 AUTOMÁTICO POR NO ENTREGAR A TIEMPO
 * ==========================================================
 * Se ejecuta al iniciar el backend y luego cada minuto
 * (igual que sincronizarEstadosClases).
 *
 * ACTIVIDADES (solo las calificables):
 *   Si ya pasó la fecha límite y el alumno no entregó nada,
 *   se guarda un registro con nota 0 y numero_intento = 0.
 *   El "intento 0" es la marca del 0 automático: NO es un intento
 *   real, no se muestra en el historial ni cuenta como intento usado.
 *
 * EVALUACIONES / EXÁMENES (solo las calificables):
 *   Si ya pasó la fecha de fin y el alumno no envió ningún
 *   intento, se guarda un 0 en "calificaciones" para el
 *   componente de calificación vinculado a esa evaluación.
 *   Tampoco se crea ningún intento.
 *
 * Si el docente amplía la fecha (o la vuelve no calificable),
 * el 0 automático se borra solo. Nunca pisa una nota real.
 */

export const MENSAJE_CERO_ACTIVIDAD =
  "Calificación automática: no se entregó dentro del plazo.";

export const MENSAJE_CERO_EVALUACION =
  "Calificación automática: no se envió ningún intento dentro del plazo.";

let sincronizando = false;

export async function asignarCerosAutomaticos() {
  if (sincronizando) {
    return;
  }

  sincronizando = true;

  try {
    /* ======================================================
     * ACTIVIDADES
     * ====================================================== */

    // 1) Ceros creados con la versión anterior (como "Intento 1"):
    //    se pasan a intento 0 para que dejen de contar como intento.
    await pool.query(
      `UPDATE entregas_actividades ea
          SET numero_intento = 0,
              actualizado_en = CURRENT_TIMESTAMP
        WHERE ea.numero_intento <> 0
          AND ea.entregada_en IS NULL
          AND ea.texto_entrega IS NULL
          AND ea.estado = 'Calificada'
          AND ea.retroalimentacion = $1
          AND NOT EXISTS (
            SELECT 1
            FROM entregas_actividades x
            WHERE x.actividad_id = ea.actividad_id
              AND x.matricula_id = ea.matricula_id
              AND x.numero_intento = 0
          )`,
      [MENSAJE_CERO_ACTIVIDAD]
    );

    // 2) Se borra el 0 automático si ya no corresponde:
    //    el docente amplió la fecha, quitó la fecha, la volvió
    //    no calificable, o el alumno tiene una entrega real.
    await pool.query(
      `DELETE FROM entregas_actividades ea
        USING actividades a
        WHERE a.id = ea.actividad_id
          AND ea.numero_intento = 0
          AND ea.entregada_en IS NULL
          AND (
            a.fecha_limite IS NULL
            OR a.fecha_limite > CURRENT_TIMESTAMP
            OR a.calificada = FALSE
            OR EXISTS (
              SELECT 1
              FROM entregas_actividades real
              WHERE real.actividad_id = ea.actividad_id
                AND real.matricula_id = ea.matricula_id
                AND real.numero_intento > 0
                AND real.estado <> 'Borrador'
            )
          )`
    );

    // 3) Se crea el 0 automático (intento 0) a quien no entregó.
    await pool.query(
      `INSERT INTO entregas_actividades (
         actividad_id,
         matricula_id,
         numero_intento,
         texto_entrega,
         estado,
         entregada_en,
         nota,
         retroalimentacion,
         calificado_en
       )
       SELECT
         a.id,
         m.id,
         0,
         NULL,
         'Calificada',
         NULL,
         0,
         $1,
         CURRENT_TIMESTAMP
       FROM actividades a
       INNER JOIN contenidos_curso cc
         ON cc.id = a.contenido_id
        AND cc.estado = 'Publicado'
       INNER JOIN modulos_curso mc
         ON mc.id = cc.modulo_id
        AND mc.activo = TRUE
       INNER JOIN ofertas_curso oc
         ON oc.curso_id = mc.curso_id
        AND oc.estado <> 'Cancelado'
        AND oc.publicado = TRUE
       INNER JOIN matriculas m
         ON m.oferta_curso_id = oc.id
        AND m.estado IN ('Activa', 'Completada')
       WHERE a.estado = 'Publicada'
         AND a.calificada = TRUE
         AND a.fecha_limite IS NOT NULL
         AND a.fecha_limite <= CURRENT_TIMESTAMP
         -- No tiene ninguna entrega (real ni automática)
         AND NOT EXISTS (
           SELECT 1
           FROM entregas_actividades ea
           WHERE ea.actividad_id = a.id
             AND ea.matricula_id = m.id
             AND ea.estado <> 'Borrador'
         )
       ON CONFLICT (actividad_id, matricula_id, numero_intento)
       DO NOTHING`,
      [MENSAJE_CERO_ACTIVIDAD]
    );

    /* ======================================================
     * EVALUACIONES / EXÁMENES
     * ====================================================== */

    // 1) Se borra el 0 automático si el docente amplió la fecha
    //    o la volvió no calificable (solo el automático: sin
    //    intento vinculado y sin docente que lo haya puesto).
    await pool.query(
      `DELETE FROM calificaciones cal
        USING componentes_calificacion comp, evaluaciones e
        WHERE comp.id = cal.componente_id
          AND e.id = comp.evaluacion_id
          AND cal.intento_evaluacion_id IS NULL
          AND cal.calificado_por IS NULL
          AND cal.retroalimentacion = $1
          AND (
            e.fecha_fin IS NULL
            OR e.fecha_fin > CURRENT_TIMESTAMP
            OR e.calificada = FALSE
          )`,
      [MENSAJE_CERO_EVALUACION]
    );

    // 2) Se crea el 0 automático a quien no envió ningún intento.
    await pool.query(
      `INSERT INTO calificaciones (
         componente_id,
         matricula_id,
         nota,
         retroalimentacion,
         calificado_en
       )
       SELECT
         comp.id,
         m.id,
         0,
         $1,
         CURRENT_TIMESTAMP
       FROM evaluaciones e
       INNER JOIN contenidos_curso cc
         ON cc.id = e.contenido_id
        AND cc.estado = 'Publicado'
       INNER JOIN modulos_curso mc
         ON mc.id = cc.modulo_id
        AND mc.activo = TRUE
       INNER JOIN ofertas_curso oc
         ON oc.curso_id = mc.curso_id
        AND oc.estado <> 'Cancelado'
        AND oc.publicado = TRUE
       INNER JOIN componentes_calificacion comp
         ON comp.evaluacion_id = e.id
        AND comp.oferta_curso_id = oc.id
       INNER JOIN matriculas m
         ON m.oferta_curso_id = oc.id
        AND m.estado IN ('Activa', 'Completada')
       WHERE e.estado = 'Publicada'
         AND e.calificada = TRUE
         AND e.fecha_fin IS NOT NULL
         AND e.fecha_fin <= CURRENT_TIMESTAMP
         -- El alumno no envió ningún intento
         AND NOT EXISTS (
           SELECT 1
           FROM intentos_evaluacion ie
           WHERE ie.evaluacion_id = e.id
             AND ie.matricula_id = m.id
             AND ie.estado IN ('Enviado', 'Calificado')
         )
       -- Si ya tiene nota en ese componente, no se toca
       ON CONFLICT (componente_id, matricula_id)
       DO NOTHING`,
      [MENSAJE_CERO_EVALUACION]
    );
  } catch (error) {
    console.error(
      "Error asignando ceros automáticos:",
      error
    );
  } finally {
    sincronizando = false;
  }
}
