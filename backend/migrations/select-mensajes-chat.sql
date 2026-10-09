SELECT *
FROM mensajes_chat
ORDER BY id ASC;

SELECT
    id,
    conversacion_id,
    remitente_id,
    tipo,
    contenido,
    enviado_en
FROM mensajes_chat
ORDER BY id ASC;

SELECT
    id,
    oferta_curso_id,
    usuario_1_id,
    usuario_2_id
FROM conversaciones_chat
ORDER BY id ASC;

SELECT
    id,
    mensaje_id,
    nombre_archivo,
    ruta_archivo,
    mime_type,
    tamano_bytes,
    creado_en
FROM adjuntos_chat
ORDER BY id DESC;

SELECT
    id,
    nombre_archivo,
    ruta_archivo,
    mime_type,
    tamano_bytes
FROM adjuntos_chat
ORDER BY id;

SELECT
    id,
    titulo,
    nombre_archivo,
    ruta_archivo,
    mime_type,
    tamano_bytes
FROM contenidos_curso
ORDER BY id;

SELECT
    a.id AS adjunto_id,
    a.nombre_archivo,
    a.ruta_archivo,
    a.mime_type,
    a.tamano_bytes,
    m.id AS mensaje_id,
    m.conversacion_id,
    m.remitente_id,
    m.enviado_en
FROM adjuntos_chat a
INNER JOIN mensajes_chat m
    ON m.id = a.mensaje_id
ORDER BY a.id;

ROLLBACK;

BEGIN;

TRUNCATE TABLE
    conversaciones_chat,
    mensajes_chat,
    adjuntos_chat,
    lecturas_chat
RESTART IDENTITY;

COMMIT;

