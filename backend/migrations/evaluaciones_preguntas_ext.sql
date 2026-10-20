-- Ejecutar una sola vez en la base de datos PostgreSQL de Talentia.
-- Conserva las preguntas/opciones actuales y amplía el esquema para texto y relación.
BEGIN;

ALTER TABLE preguntas_evaluacion
  ADD COLUMN IF NOT EXISTS permite_archivos BOOLEAN NOT NULL DEFAULT FALSE;

-- El CHECK original se genera como preguntas_evaluacion_tipo_check.
ALTER TABLE preguntas_evaluacion
  DROP CONSTRAINT IF EXISTS preguntas_evaluacion_tipo_check;
ALTER TABLE preguntas_evaluacion
  DROP CONSTRAINT IF EXISTS ck_preguntas_evaluacion_tipo;

ALTER TABLE preguntas_evaluacion
  ADD CONSTRAINT ck_preguntas_evaluacion_tipo
  CHECK (
    tipo IN (
      'seleccion_unica',
      'seleccion_multiple',
      'verdadero_falso',
      'respuesta_abierta',
      'relacional'
    )
  );

CREATE TABLE IF NOT EXISTS relaciones_pregunta (
  id BIGSERIAL PRIMARY KEY,
  pregunta_id BIGINT NOT NULL,
  numero INTEGER NOT NULL CHECK (numero > 0),
  elemento_izquierda TEXT NOT NULL,
  elemento_derecha TEXT NOT NULL,
  CONSTRAINT fk_relacion_pregunta
    FOREIGN KEY (pregunta_id)
    REFERENCES preguntas_evaluacion(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_relacion_numero
    UNIQUE (pregunta_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_relaciones_pregunta_pregunta
  ON relaciones_pregunta(pregunta_id);

COMMIT;
