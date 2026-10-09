SELECT
    sc.id,
    c.codigo,
    c.nombre,
    sc.numero_sesion,
    sc.tema,
    sc.inicia_en,
    sc.termina_en,
    sc.estado,
    sc.url_zoom
FROM sesiones_clase sc
INNER JOIN ofertas_curso oc
    ON oc.id = sc.oferta_curso_id
INNER JOIN cursos c
    ON c.id = oc.curso_id
ORDER BY sc.id;

SELECT *
FROM sesiones_clase
WHERE id = 1;

DELETE FROM sesiones_clase
WHERE id = 1;

SELECT *
FROM sesiones_clase
ORDER BY id;

UPDATE sesiones_clase
SET
    estado = CASE
        WHEN estado = 'Cancelada'
            THEN 'Cancelada'

        WHEN estado = 'Finalizada'
            THEN 'Finalizada'

        WHEN termina_en <= CURRENT_TIMESTAMP
            THEN 'Finalizada'

        WHEN estado = 'En curso'
            THEN 'En curso'

        WHEN inicia_en <= CURRENT_TIMESTAMP
            THEN 'En curso'

        WHEN inicia_en <= CURRENT_TIMESTAMP + INTERVAL '48 hours'
            THEN 'Proxima'

        ELSE 'Programada'
    END,
    actualizado_en = CURRENT_TIMESTAMP;

UPDATE sesiones_clase
SET ruta_grabacion = '/grabaciones/sesion-01.mp4'
WHERE id = 2;