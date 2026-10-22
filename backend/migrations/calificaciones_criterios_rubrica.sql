-- Calificación por criterios para cada intento de una actividad.
-- El detalle queda vinculado a la entrega y conserva una copia de los criterios
-- utilizados, aunque la rúbrica se edite posteriormente.
BEGIN;

CREATE TABLE IF NOT EXISTS calificaciones_criterios_rubrica (
    id BIGSERIAL PRIMARY KEY,

    entrega_id BIGINT NOT NULL
        REFERENCES entregas_actividades(id)
        ON DELETE CASCADE,

    criterio_rubrica_id BIGINT NULL
        REFERENCES criterios_rubrica(id)
        ON DELETE SET NULL,

    nombre_criterio VARCHAR(200) NOT NULL,
    descripcion_criterio TEXT,

    puntaje_maximo NUMERIC(6,2) NOT NULL
        CHECK (puntaje_maximo >= 0),

    puntaje_obtenido NUMERIC(6,2) NOT NULL
        CHECK (puntaje_obtenido >= 0 AND puntaje_obtenido <= puntaje_maximo),

    orden INTEGER NOT NULL CHECK (orden > 0),
    calificado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_calificacion_criterio_rubrica_entrega_orden
        UNIQUE (entrega_id, orden)
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_criterios_rubrica_entrega
    ON calificaciones_criterios_rubrica (entrega_id);

COMMIT;
