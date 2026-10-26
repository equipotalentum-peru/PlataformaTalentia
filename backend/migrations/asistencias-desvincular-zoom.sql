SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (
        WHERE fecha_asistencia IS NULL
    ) AS registros_zoom_sin_fecha,
    COUNT(*) FILTER (
        WHERE fecha_asistencia IS NOT NULL
    ) AS registros_con_fecha
FROM public.asistencias;

DELETE FROM public.asistencias
WHERE fecha_asistencia IS NULL;

-- Talentia: desligar permanentemente la tabla asistencias de las sesiones de Zoom.
-- Requiere que la migración asistencia-calendario-periodo.sql ya se haya aplicado.
-- No borra registros automáticamente. Los registros antiguos de Zoom (fecha_asistencia NULL)
-- deben revisarse antes de ejecutar esta migración.

BEGIN;

DO $$
DECLARE
  registros_sin_fecha BIGINT;
BEGIN
  SELECT COUNT(*)
    INTO registros_sin_fecha
  FROM public.asistencias
  WHERE fecha_asistencia IS NULL;

  IF registros_sin_fecha > 0 THEN
    RAISE EXCEPTION
      'No se puede desligar asistencias de Zoom: hay % registro(s) sin fecha_asistencia. Revisa esos registros. Si son datos de prueba de Zoom que deseas descartar, elimínalos antes de ejecutar esta migración.',
      registros_sin_fecha;
  END IF;
END $$;

-- Quitar la FK y las restricciones/índices específicos de sesiones Zoom.
ALTER TABLE public.asistencias
  DROP CONSTRAINT IF EXISTS fk_asistencia_sesion;

ALTER TABLE public.asistencias
  DROP CONSTRAINT IF EXISTS ck_asistencia_origen;

DROP INDEX IF EXISTS public.uq_asistencias_sesion_matricula;
DROP INDEX IF EXISTS public.uq_asistencias_fecha_matricula;
DROP INDEX IF EXISTS public.idx_asistencias_fecha_calendario;

-- La asistencia queda identificada por matrícula + fecha, sin session_id.
ALTER TABLE public.asistencias
  DROP COLUMN IF EXISTS sesion_clase_id;

ALTER TABLE public.asistencias
  ALTER COLUMN fecha_asistencia SET NOT NULL;

CREATE UNIQUE INDEX uq_asistencias_fecha_matricula
  ON public.asistencias (matricula_id, fecha_asistencia);

CREATE INDEX idx_asistencias_fecha_calendario
  ON public.asistencias (fecha_asistencia);

COMMIT;
