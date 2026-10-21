BEGIN;

CREATE TABLE IF NOT EXISTS archivos_respuesta_evaluacion (
    id BIGSERIAL PRIMARY KEY,

    respuesta_id BIGINT NOT NULL
        REFERENCES respuestas_evaluacion(id)
        ON DELETE CASCADE,

    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    mime_type VARCHAR(120),

    tamano_bytes BIGINT
        CHECK (tamano_bytes IS NULL OR tamano_bytes >= 0),

    subido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS
    idx_archivos_respuesta_evaluacion_respuesta
ON archivos_respuesta_evaluacion (respuesta_id);

COMMIT;

select * from archivos_respuesta_evaluacion;