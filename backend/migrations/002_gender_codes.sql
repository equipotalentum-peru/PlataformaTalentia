BEGIN;

UPDATE users
SET genero = CASE
    WHEN LOWER(BTRIM(genero)) IN ('masculino', 'm') THEN 'M'
    WHEN LOWER(BTRIM(genero)) IN ('femenino', 'f') THEN 'F'
    ELSE genero
END
WHERE genero IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_genero_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_genero_check
            CHECK (genero IN ('M', 'F'));
    END IF;
END $$;

COMMIT;
