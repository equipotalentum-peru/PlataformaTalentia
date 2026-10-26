ROLLBACK;

-- Talentia: asistencia por calendario académico usando la tabla asistencias existente.
-- Este script no elimina los registros de asistencia actuales ni crea una tabla nueva.
-- Ejecutar una sola vez en la base de datos existente.

BEGIN;

-- Días ISO de la semana: 1=lunes, 2=martes, ..., 7=domingo.
ALTER TABLE public.ofertas_curso
  ADD COLUMN IF NOT EXISTS dias_clase SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[];

ALTER TABLE public.ofertas_curso
  DROP CONSTRAINT IF EXISTS ck_oferta_dias_clase;

ALTER TABLE public.ofertas_curso
  ADD CONSTRAINT ck_oferta_dias_clase
  CHECK (dias_clase <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::SMALLINT[]);

-- Agregamos una PK independiente para admitir registros de calendario sin sesión de Zoom.
-- La secuencia y la actualización de ids se hacen explícitamente para ser compatibles
-- tanto con una tabla que ya tenga filas como si el script se vuelve a ejecutar.
ALTER TABLE public.asistencias
  ADD COLUMN IF NOT EXISTS id BIGINT;

CREATE SEQUENCE IF NOT EXISTS public.asistencias_id_seq;

ALTER TABLE public.asistencias
  ALTER COLUMN id SET DEFAULT nextval('public.asistencias_id_seq');

-- Sincroniza la secuencia con los ids existentes antes de completar los nuevos.
SELECT setval(
  'public.asistencias_id_seq',
  GREATEST(COALESCE((SELECT MAX(id) FROM public.asistencias), 0), 1),
  COALESCE((SELECT MAX(id) FROM public.asistencias), 0) > 0
);

UPDATE public.asistencias
SET id = nextval('public.asistencias_id_seq')
WHERE id IS NULL;

-- Deja la secuencia preparada para el siguiente INSERT.
SELECT setval(
  'public.asistencias_id_seq',
  COALESCE((SELECT MAX(id) FROM public.asistencias), 0) + 1,
  FALSE
);

ALTER SEQUENCE public.asistencias_id_seq
  OWNED BY public.asistencias.id;

ALTER TABLE public.asistencias
  ADD COLUMN IF NOT EXISTS fecha_asistencia DATE;


-- 1. Retirar la clave primaria anterior.
--    sesion_clase_id ya no será obligatoria para la asistencia
--    registrada por fecha del calendario académico.
DO $$
DECLARE
  pk_name TEXT;
BEGIN
  SELECT conname
    INTO pk_name
  FROM pg_constraint
  WHERE conrelid = 'public.asistencias'::regclass
    AND contype = 'p'
  LIMIT 1;

  IF pk_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.asistencias DROP CONSTRAINT %I',
      pk_name
    );
  END IF;
END $$;

-- 2. Ahora sí puede admitir NULL.
ALTER TABLE public.asistencias
  ALTER COLUMN sesion_clase_id DROP NOT NULL;

ALTER TABLE public.asistencias
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.asistencias
  ADD CONSTRAINT asistencias_pkey PRIMARY KEY (id);

ALTER TABLE public.asistencias
  DROP CONSTRAINT IF EXISTS ck_asistencia_origen;

ALTER TABLE public.asistencias
  ADD CONSTRAINT ck_asistencia_origen
  CHECK (
    (sesion_clase_id IS NOT NULL AND fecha_asistencia IS NULL)
    OR
    (sesion_clase_id IS NULL AND fecha_asistencia IS NOT NULL)
  );

-- Conserva la unicidad de la asistencia antigua ligada a una sesión de Zoom.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asistencias_sesion_matricula
  ON public.asistencias (sesion_clase_id, matricula_id)
  WHERE sesion_clase_id IS NOT NULL;

-- Una única asistencia por matrícula y fecha académica.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asistencias_fecha_matricula
  ON public.asistencias (matricula_id, fecha_asistencia)
  WHERE sesion_clase_id IS NULL AND fecha_asistencia IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_calendario
  ON public.asistencias (fecha_asistencia)
  WHERE sesion_clase_id IS NULL AND fecha_asistencia IS NOT NULL;

COMMIT;
