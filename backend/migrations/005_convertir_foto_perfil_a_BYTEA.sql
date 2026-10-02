BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE foto_perfil IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'Hay fotos existentes';
    END IF;
END $$;

ALTER TABLE public.users
    ALTER COLUMN foto_perfil TYPE BYTEA
    USING foto_perfil::bytea;

COMMIT;
