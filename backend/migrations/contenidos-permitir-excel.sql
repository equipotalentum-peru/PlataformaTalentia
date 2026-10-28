-- Talentia: permitir hojas de cálculo como contenido de curso.
-- Ejecutar una sola vez en cada base de datos existente, después de desplegar
-- el cambio de backend. No elimina ni modifica los registros actuales.
BEGIN;

ALTER TABLE public.contenidos_curso
  DROP CONSTRAINT IF EXISTS contenidos_curso_tipo_check;

ALTER TABLE public.contenidos_curso
  ADD CONSTRAINT contenidos_curso_tipo_check
  CHECK (tipo IN (
    'pdf', 'docx', 'pptx', 'xls', 'xlsx', 'video',
    'enlace', 'actividad', 'evaluacion'
  ));

COMMIT;
