
export const requisitosCertificacionSql = `
  EXISTS (
    SELECT 1
    FROM componentes_calificacion requisito_comp
    LEFT JOIN calificaciones requisito_cal
      ON requisito_cal.componente_id = requisito_comp.id
      AND requisito_cal.matricula_id = m.id
    WHERE requisito_comp.oferta_curso_id = m.oferta_curso_id
    HAVING COUNT(*) > 0
      AND BOOL_AND(requisito_cal.nota IS NOT NULL)
      AND ROUND(
        SUM(
          CASE
            WHEN requisito_comp.porcentaje > 0
            THEN requisito_cal.nota * requisito_comp.porcentaje / 100
            ELSE 0
          END
        )::NUMERIC,
        2
      ) >= 14
  )

  AND
  EXISTS (
    SELECT 1
    FROM ofertas_curso requisito_oc

    INNER JOIN modulos_curso requisito_mc
      ON requisito_mc.curso_id = requisito_oc.curso_id
      AND requisito_mc.activo = TRUE

    INNER JOIN contenidos_curso requisito_cc
      ON requisito_cc.modulo_id = requisito_mc.id
      AND requisito_cc.estado = 'Publicado'
      AND requisito_cc.obligatorio = TRUE

    LEFT JOIN progreso_contenido requisito_pc
      ON requisito_pc.matricula_id = m.id
      AND requisito_pc.contenido_id = requisito_cc.id

    WHERE requisito_oc.id = m.oferta_curso_id

    GROUP BY requisito_oc.id

    HAVING COUNT(requisito_cc.id) > 0
      AND COUNT(requisito_cc.id) FILTER (
        WHERE requisito_pc.estado = 'Completado'
           OR requisito_pc.progreso >= 100
      ) = COUNT(requisito_cc.id)
  )
`;