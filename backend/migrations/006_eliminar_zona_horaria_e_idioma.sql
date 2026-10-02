BEGIN;

ALTER TABLE public.users
    DROP COLUMN IF EXISTS idioma,
    DROP COLUMN IF EXISTS zona_horaria;

COMMIT;
