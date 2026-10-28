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
 *   se le crea una entrega "Calificada" con nota 0 y sin fecha
 *   de entrega. Así el 0 se ve en la tabla del docente y en la
 *   vista del alumno, y el docente puede editarlo si quiere.
 *
 * EVALUACIONES / EXÁMENES (solo las calificables):
 *   Si ya pasó la fecha de fin y el alumno no envió ningún
 *   intento, se guarda un 0 en "calificaciones" para el
 *   componente de calificación vinculado a esa evaluación.
 *
 * Nunca pisa una nota que ya exista.
 */

const MENSAJE_ACTIVIDAD =
  "Calificación automática: no se entregó dentro del plazo.";

const MENSAJE_EVALUACION =
  "Calificación automática: no se envió ningún intento dentro del plazo.";

let sincronizando = false;

export async function asignarCerosAutomaticos() {
  if (sincronizando) {
    return;
  }

  sincronizando = true;

  try {
    /* ---------- ACTIVIDADES ---------- */
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
         COALESCE(
           (
             SELECT MAX(x.numero_intento)
             FROM entregas_actividades x
             WHERE x.actividad_id = a.id
               AND x.matricula_id = m.id
           ),
           0
         ) + 1,
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
         -- El alumno no tiene ninguna entrega real
         AND NOT EXISTS (
           SELECT 1
           FROM entregas_actividades ea
           WHERE ea.actividad_id = a.id
             AND ea.matricula_id = m.id
             AND ea.estado <> 'Borrador'
         )
       ON CONFLICT (actividad_id, matricula_id, numero_intento)
       DO NOTHING`,
      [MENSAJE_ACTIVIDAD]
    );

    /* ---------- EVALUACIONES / EXÁMENES ---------- */
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
      [MENSAJE_EVALUACION]
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
