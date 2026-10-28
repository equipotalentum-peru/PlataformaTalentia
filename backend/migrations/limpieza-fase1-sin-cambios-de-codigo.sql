-- ============================================================
-- Talentia: LIMPIEZA FASE 1
-- Borra SOLO tablas y columnas que el backend y el frontend no
-- mencionan en ninguna parte. No requiere tocar código.
--
-- ANTES DE EJECUTAR:
--   1. Haz un respaldo:  pg_dump -U <usuario> -d talentia -F c -f talentia_antes_limpieza.dump
--   2. Ejecuta verificar-columnas-sin-uso.sql y confirma que
--      estas columnas tienen con_datos = 0 y las tablas 0 filas.
--      (La migración se detiene sola si encuentra datos.)
-- ============================================================

BEGIN;

-- Seguridad: abortar si alguna de estas columnas/tablas tiene datos.
-- (Se puede ejecutar más de una vez: solo revisa lo que todavía existe.)
DO $$
DECLARE
  n BIGINT := 0;
  parcial BIGINT;
  chequeo RECORD;
BEGIN
  FOR chequeo IN
    SELECT * FROM (VALUES
      ('empresas',             NULL),
      ('solicitudes_personas', NULL),
      ('solicitudes_empresas', NULL),
      ('menciones_foro',       NULL),
      ('contenidos_curso',     'paginas'),
      ('contenidos_curso',     'duracion_segundos'),
      ('evaluaciones',         'puntaje_aprobacion'),
      ('rubricas',             'descripcion')
    ) AS v(tabla, columna)
  LOOP
    IF chequeo.columna IS NULL THEN
      IF to_regclass('public.' || chequeo.tabla) IS NOT NULL THEN
        EXECUTE format('SELECT COUNT(*) FROM public.%I', chequeo.tabla) INTO parcial;
        n := n + parcial;
      END IF;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = chequeo.tabla
        AND column_name = chequeo.columna
    ) THEN
      EXECUTE format('SELECT COUNT(%I) FROM public.%I', chequeo.columna, chequeo.tabla) INTO parcial;
      n := n + parcial;
    END IF;
  END LOOP;

  IF n > 0 THEN
    RAISE EXCEPTION 'Hay % dato(s) en columnas/tablas que se iban a borrar. Revisa verificar-columnas-sin-uso.sql antes de continuar.', n;
  END IF;
END $$;

-- 1. Tablas sin uso.
--    Las solicitudes de personas/empresas se leen desde Firebase
--    (colección FormularioAlumno), no desde PostgreSQL.
--    Las menciones del foro se guardan dentro del texto de la respuesta.
DROP TABLE IF EXISTS menciones_foro;
DROP TABLE IF EXISTS solicitudes_personas;
DROP TABLE IF EXISTS solicitudes_empresas;
DROP TABLE IF EXISTS empresas;

-- 2. Columnas que nunca se escriben ni se leen.
ALTER TABLE contenidos_curso
  DROP COLUMN IF EXISTS paginas,
  DROP COLUMN IF EXISTS duracion_segundos;

ALTER TABLE evaluaciones
  DROP COLUMN IF EXISTS puntaje_aprobacion;

ALTER TABLE rubricas
  DROP COLUMN IF EXISTS descripcion;

COMMIT;
