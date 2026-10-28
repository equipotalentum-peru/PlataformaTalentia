BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'apellidos'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE LENGTH(BTRIM(CONCAT_WS(' ', nombres, NULLIF(BTRIM(apellidos), '')))) > 100
    ) THEN
      RAISE EXCEPTION 'Revisa los nombres completos que superan 100 caracteres antes de continuar.';
    END IF;
    UPDATE public.usuarios
    SET nombres = CASE
      WHEN NULLIF(BTRIM(apellidos), '') IS NULL THEN BTRIM(nombres)
      WHEN RIGHT(LOWER(BTRIM(nombres)), LENGTH(LOWER(BTRIM(apellidos)))) = LOWER(BTRIM(apellidos)) THEN BTRIM(nombres)
      ELSE BTRIM(CONCAT_WS(' ', nombres, apellidos))
    END
    WHERE NULLIF(BTRIM(apellidos), '') IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ofertas_curso' AND column_name = 'fecha_inicio'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM public.ofertas_curso oc
      LEFT JOIN public.periodos_academicos p ON p.id = oc.periodo_id
      WHERE (oc.fecha_inicio IS NOT NULL AND oc.fecha_inicio IS DISTINCT FROM p.fecha_inicio)
         OR (oc.fecha_fin IS NOT NULL AND oc.fecha_fin IS DISTINCT FROM p.fecha_fin)
    ) THEN
      RAISE EXCEPTION 'Hay fechas de oferta distintas a las del periodo. Revisa esos datos antes de continuar.';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certificados' AND column_name = 'modulo_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.certificados WHERE modulo_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Hay certificados asociados a módulos. Revisa esos datos antes de continuar.';
    END IF;
  END IF;
END $$;

ALTER TABLE public.calificaciones
  DROP COLUMN IF EXISTS entrega_id,
  DROP COLUMN IF EXISTS retroalimentacion;
ALTER TABLE public.certificados DROP COLUMN IF EXISTS modulo_id;
ALTER TABLE public.componentes_calificacion DROP COLUMN IF EXISTS actividad_id;
ALTER TABLE public.modulos_curso DROP COLUMN IF EXISTS descripcion;
ALTER TABLE public.ofertas_curso
  DROP COLUMN IF EXISTS fecha_inicio,
  DROP COLUMN IF EXISTS fecha_fin;
ALTER TABLE public.sesiones_clase DROP COLUMN IF EXISTS modulo_id;
ALTER TABLE public.usuarios
  DROP COLUMN IF EXISTS especialidad,
  DROP COLUMN IF EXISTS disponibilidad,
  DROP COLUMN IF EXISTS apellidos;

COMMIT;
