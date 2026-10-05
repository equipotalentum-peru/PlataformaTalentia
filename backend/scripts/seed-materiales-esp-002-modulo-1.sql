BEGIN;

DO $$
DECLARE
    material RECORD;
    filas INTEGER;
BEGIN
    FOR material IN
        SELECT * FROM (VALUES
            ('Factura, boleta, nota de crédito y nota de débito.', 'pptx', '01-factura-boleta-y-notas.pptx'),
            ('Datos y condiciones que debe contener un comprobante.', 'pptx', '02-datos-y-condiciones.pptx'),
            ('Operaciones gravadas, exoneradas y no gravadas: criterios generales.', 'pptx', '03-operaciones-y-tratamiento-tributario.pptx'),
            ('Emisión, anulación y corrección de comprobantes.', 'pdf', '04-emision-anulacion-y-correccion.pdf'),
            ('Errores frecuentes y buenas prácticas de control.', 'pdf', '05-errores-y-buenas-practicas.pdf')
        ) AS archivos(titulo, tipo, nombre)
    LOOP
        UPDATE contenidos_curso AS cc
        SET ruta_archivo =
            'Contenidos Mod 1 - Especialización en Contabilidad Práctica para la Gestión de MYPES/'
            || material.nombre
        FROM modulos_curso AS mc, cursos AS c
        WHERE mc.id = cc.modulo_id
          AND c.id = mc.curso_id
          AND c.codigo = 'ESP-002'
          AND mc.numero = 1
          AND cc.titulo = material.titulo
          AND cc.tipo = material.tipo;

        GET DIAGNOSTICS filas = ROW_COUNT;
        IF filas <> 1 THEN
            RAISE EXCEPTION 'Se esperaba un contenido para "%", encontrados: %',
                material.titulo, filas;
        END IF;
    END LOOP;
END $$;

COMMIT;

SELECT cc.id, cc.titulo, cc.tipo, cc.ruta_archivo
FROM contenidos_curso cc
JOIN modulos_curso mc ON mc.id = cc.modulo_id
JOIN cursos c ON c.id = mc.curso_id
WHERE c.codigo = 'ESP-002' AND mc.numero = 1
ORDER BY cc.orden, cc.id;
