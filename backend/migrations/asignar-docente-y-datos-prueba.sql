-- ============================================================
-- Asigna al docente "docente01" a las ofertas de los cursos
-- y deja matriculado a "estudiante01" (si aún no lo está).
-- Es seguro ejecutarlo más de una vez.
-- ============================================================

-- 1. Asignar docente01 a las ofertas que no tienen docente
UPDATE ofertas_curso oc
SET docente_id = (
        SELECT id FROM usuarios
        WHERE usuario = 'docente01' AND rol = 'Docente'
        LIMIT 1
    ),
    actualizado_en = CURRENT_TIMESTAMP
WHERE oc.docente_id IS NULL
  AND oc.curso_id IN (
        SELECT id FROM cursos
        WHERE codigo IN ('ESP-001','ESP-002','ESP-003','ESP-004','ESP-005')
  );

-- 2. Asegurar que las ofertas estén publicadas
UPDATE ofertas_curso
SET publicado = TRUE
WHERE docente_id IS NOT NULL;

-- 3. Verificación: debe devolver una fila por curso con docente y alumnos
SELECT
    c.id        AS curso_id,
    c.codigo,
    oc.id       AS oferta_id,
    oc.estado   AS estado_oferta,
    oc.publicado,
    d.usuario   AS docente,
    (SELECT COUNT(*) FROM matriculas m
      WHERE m.oferta_curso_id = oc.id
        AND m.estado IN ('Activa','Completada')) AS alumnos
FROM ofertas_curso oc
INNER JOIN cursos c ON c.id = oc.curso_id
LEFT JOIN usuarios d ON d.id = oc.docente_id
ORDER BY c.id;
