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
      AND ROUND(SUM(CASE WHEN requisito_comp.porcentaje > 0
        THEN requisito_cal.nota * requisito_comp.porcentaje / 100
        ELSE 0 END)::NUMERIC, 2) >= 14
  )
`;
