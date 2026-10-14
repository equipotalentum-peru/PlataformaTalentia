BEGIN;

ALTER TABLE invitaciones_registro
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20)
    NOT NULL DEFAULT 'Estudiante'
    CHECK (rol IN ('Estudiante', 'Docente', 'Administrador')),
  ADD COLUMN IF NOT EXISTS usuario_activo BOOLEAN
    NOT NULL DEFAULT TRUE;

COMMIT;