-- ============================================================
-- TALENTIA - BASE DE DATOS DEFINITIVA
-- PostgreSQL
--
-- IMPORTANTE:
-- 1. Este script se ejecuta conectado a la base de datos "Talentia".
-- 2. Parte desde cero y elimina el esquema public existente.
-- 3. SOLO las fotos de perfil se almacenan como BYTEA.
-- 4. PDF, DOCX, PPTX, videos y demas archivos de contenido
--    permanecen como archivos locales y en PostgreSQL se guarda
--    unicamente su ruta/metadatos.
-- 5. Los nombres de tablas y atributos estan en espanol.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- REINICIO DEL ESQUEMA
-- ============================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ============================================================
-- 1. USUARIOS Y AUTENTICACION
-- ============================================================

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,

    -- La interfaz actual trabaja con "Nombre completo".
    -- Se conserva "apellidos" por compatibilidad con la base actual,
    -- pero puede quedar NULL cuando el formulario no lo separa.
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),

    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(150) NOT NULL UNIQUE,

    hash_contrasena TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL
        CHECK (rol IN ('Estudiante', 'Docente', 'Administrador')),

    id_persona VARCHAR(30) UNIQUE,
    dni VARCHAR(8) UNIQUE,

    fecha_nacimiento DATE,

    genero VARCHAR(1)
        CHECK (genero IN ('M', 'F')),

    nacionalidad VARCHAR(80),

    direccion TEXT,
    telefono VARCHAR(20),

    -- Unicamente la foto de perfil se almacena como BYTEA.
    foto_perfil BYTEA,

    empresa_aliada VARCHAR(150),

    -- Datos adicionales que aparecen en la gestion de docentes.
    -- "Carga" no se almacena: se calcula a partir de las asignaciones.
    especialidad VARCHAR(150),
    disponibilidad VARCHAR(150),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    ultimo_acceso_en TIMESTAMPTZ,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_rol
    ON usuarios (rol);

CREATE INDEX idx_usuarios_activo
    ON usuarios (activo);

CREATE INDEX idx_usuarios_nombre
    ON usuarios (nombres, apellidos);


CREATE TABLE codigos_restablecimiento (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL,

    hash_codigo TEXT NOT NULL,

    expira_en TIMESTAMPTZ NOT NULL,

    usado BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_codigo_restablecimiento_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_codigos_restablecimiento_usuario
    ON codigos_restablecimiento (usuario_id);

CREATE INDEX idx_codigos_restablecimiento_activos
    ON codigos_restablecimiento (usuario_id, usado, expira_en);


CREATE TABLE invitaciones_registro (
    id BIGSERIAL PRIMARY KEY,

    correo VARCHAR(150) NOT NULL,

    hash_token TEXT NOT NULL UNIQUE,

    expira_en TIMESTAMPTZ NOT NULL,

    nombre VARCHAR(200),

    dni VARCHAR(8),

    telefono VARCHAR(20),

    tipo_alumno VARCHAR(20)
        CHECK (tipo_alumno IN ('Convenio', 'Externo')),

    empresa_aliada VARCHAR(150),

    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        CHECK (
            estado IN (
                'Pendiente',
                'Contactado',
                'Matriculado',
                'Cancelado'
            )
        ),

    usada BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invitaciones_registro_correo
    ON invitaciones_registro (LOWER(correo));

CREATE INDEX idx_invitaciones_registro_estado
    ON invitaciones_registro (estado);


-- ============================================================
-- 2. EMPRESAS Y PERIODOS
-- ============================================================

CREATE TABLE empresas (
    id BIGSERIAL PRIMARY KEY,

    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,

    nombre_contacto VARCHAR(150),
    correo_corporativo VARCHAR(150),
    telefono VARCHAR(20),

    estado VARCHAR(20) NOT NULL DEFAULT 'Activa'
        CHECK (estado IN ('Activa', 'Inactiva')),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_empresas_nombre
    ON empresas (razon_social);


CREATE TABLE periodos_academicos (
    id BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL UNIQUE,

    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_periodo_fechas
        CHECK (fecha_fin >= fecha_inicio)
);


-- ============================================================
-- 3. CURSOS, OFERTAS, MATRICULAS Y MODULOS
-- ============================================================

CREATE TABLE cursos (
    id BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(200) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,

    categoria VARCHAR(120),

    modalidad VARCHAR(20) NOT NULL
        CHECK (
            modalidad IN (
                'Virtual',
                'Presencial',
                'Hibrido'
            )
        ),

    descripcion TEXT,

    imagen_portada TEXT,

    estado VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CHECK (
            estado IN (
                'Borrador',
                'Activo',
                'Inactivo',
                'Archivado'
            )
        ),

    creado_por BIGINT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_curso_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_cursos_estado
    ON cursos (estado);

CREATE INDEX idx_cursos_categoria
    ON cursos (categoria);


CREATE TABLE ofertas_curso (
    id BIGSERIAL PRIMARY KEY,

    curso_id BIGINT NOT NULL,
    periodo_id BIGINT,

    fecha_inicio DATE,
    fecha_fin DATE,

    cupo_maximo INTEGER NOT NULL DEFAULT 0
        CHECK (cupo_maximo >= 0),

    docente_id BIGINT,

    estado VARCHAR(20) NOT NULL DEFAULT 'Programado'
        CHECK (
            estado IN (
                'Programado',
                'En curso',
                'Finalizado',
                'Cancelado'
            )
        ),

    publicado BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_oferta_curso
        FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_oferta_periodo
        FOREIGN KEY (periodo_id)
        REFERENCES periodos_academicos(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_oferta_docente
        FOREIGN KEY (docente_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT ck_oferta_fechas
        CHECK (
            fecha_fin IS NULL
            OR fecha_inicio IS NULL
            OR fecha_fin >= fecha_inicio
        )
);

CREATE INDEX idx_ofertas_curso_curso
    ON ofertas_curso (curso_id);

CREATE INDEX idx_ofertas_curso_periodo
    ON ofertas_curso (periodo_id);

CREATE INDEX idx_ofertas_curso_docente
    ON ofertas_curso (docente_id);


CREATE TABLE matriculas (
    id BIGSERIAL PRIMARY KEY,

    oferta_curso_id BIGINT NOT NULL,
    estudiante_id BIGINT NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        CHECK (
            estado IN (
                'Pendiente',
                'Activa',
                'Completada',
                'Retirada',
                'Cancelada'
            )
        ),

    estado_pago VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        CHECK (
            estado_pago IN (
                'Pendiente',
                'Pagado',
                'No aplica'
            )
        ),

    matriculado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completado_en TIMESTAMPTZ,

    CONSTRAINT fk_matricula_oferta
        FOREIGN KEY (oferta_curso_id)
        REFERENCES ofertas_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_matricula_estudiante
        FOREIGN KEY (estudiante_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_matricula_estudiante_oferta
        UNIQUE (oferta_curso_id, estudiante_id)
);

CREATE INDEX idx_matriculas_estudiante
    ON matriculas (estudiante_id);

CREATE INDEX idx_matriculas_oferta
    ON matriculas (oferta_curso_id);

CREATE INDEX idx_matriculas_estado
    ON matriculas (estado);


CREATE TABLE modulos_curso (
    id BIGSERIAL PRIMARY KEY,

    curso_id BIGINT NOT NULL,

    numero INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,

    descripcion TEXT,

    orden INTEGER NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_modulo_curso
        FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_modulo_numero
        UNIQUE (curso_id, numero),

    CONSTRAINT uq_modulo_orden
        UNIQUE (curso_id, orden)
);

CREATE INDEX idx_modulos_curso
    ON modulos_curso (curso_id);


CREATE TABLE contenidos_curso (
    id BIGSERIAL PRIMARY KEY,

    modulo_id BIGINT NOT NULL,

    titulo VARCHAR(200) NOT NULL,

    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'pdf',
                'docx',
                'pptx',
                'video',
                'enlace',
                'actividad',
                'evaluacion'
            )
        ),

    descripcion TEXT,

    -- ARCHIVOS LOCALES: no se guarda BYTEA.
    nombre_archivo VARCHAR(255),
    ruta_archivo TEXT,
    mime_type VARCHAR(120),
    tamano_bytes BIGINT,
    paginas INTEGER
        CHECK (paginas IS NULL OR paginas > 0),
    duracion_segundos INTEGER
        CHECK (
            duracion_segundos IS NULL
            OR duracion_segundos > 0
        ),

    url_enlace TEXT,

    orden INTEGER NOT NULL,

    obligatorio BOOLEAN NOT NULL DEFAULT TRUE,

    estado VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CHECK (
            estado IN (
                'Borrador',
                'Publicado',
                'Oculto'
            )
        ),

    creado_por BIGINT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contenido_modulo
        FOREIGN KEY (modulo_id)
        REFERENCES modulos_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_contenido_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_contenido_orden
        UNIQUE (modulo_id, orden)
);

CREATE INDEX idx_contenidos_modulo
    ON contenidos_curso (modulo_id);

CREATE INDEX idx_contenidos_tipo
    ON contenidos_curso (tipo);


-- ============================================================
-- 4. ACTIVIDADES Y ENTREGAS
-- ============================================================

CREATE TABLE actividades (
    id BIGSERIAL PRIMARY KEY,

    contenido_id BIGINT NOT NULL UNIQUE,

    instrucciones TEXT,

    fecha_limite TIMESTAMPTZ,

    intentos_permitidos INTEGER NOT NULL DEFAULT 1
        CHECK (intentos_permitidos > 0),

    puntaje_maximo NUMERIC(6,2)
        CHECK (puntaje_maximo IS NULL OR puntaje_maximo >= 0),

    permitir_archivo BOOLEAN NOT NULL DEFAULT TRUE,
    permitir_enlace BOOLEAN NOT NULL DEFAULT FALSE,
    permitir_imagen BOOLEAN NOT NULL DEFAULT FALSE,
    permitir_video BOOLEAN NOT NULL DEFAULT FALSE,

    formatos_permitidos TEXT,

    tamano_maximo_mb NUMERIC(8,2)
        CHECK (
            tamano_maximo_mb IS NULL
            OR tamano_maximo_mb > 0
        ),

    calificada BOOLEAN NOT NULL DEFAULT TRUE,

    estado VARCHAR(20) NOT NULL DEFAULT 'Oculta'
        CHECK (
            estado IN (
                'Oculta',
                'Publicada'
            )
        ),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_actividad_contenido
        FOREIGN KEY (contenido_id)
        REFERENCES contenidos_curso(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_actividades_contenido
    ON actividades (contenido_id);


CREATE TABLE rubricas (
    id BIGSERIAL PRIMARY KEY,

    actividad_id BIGINT NOT NULL UNIQUE,

    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rubrica_actividad
        FOREIGN KEY (actividad_id)
        REFERENCES actividades(id)
        ON DELETE CASCADE
);


CREATE TABLE criterios_rubrica (
    id BIGSERIAL PRIMARY KEY,

    rubrica_id BIGINT NOT NULL,

    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    puntaje_maximo NUMERIC(6,2) NOT NULL DEFAULT 0
        CHECK (puntaje_maximo >= 0),

    orden INTEGER NOT NULL,

    CONSTRAINT fk_criterio_rubrica
        FOREIGN KEY (rubrica_id)
        REFERENCES rubricas(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_criterio_rubrica_orden
        UNIQUE (rubrica_id, orden)
);


CREATE TABLE entregas_actividades (
    id BIGSERIAL PRIMARY KEY,

    actividad_id BIGINT NOT NULL,
    matricula_id BIGINT NOT NULL,

    numero_intento INTEGER NOT NULL,

    texto_entrega TEXT,

    estado VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CHECK (
            estado IN (
                'Borrador',
                'Entregada',
                'Calificada',
                'Devuelta'
            )
        ),

    entregada_en TIMESTAMPTZ,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entrega_actividad
        FOREIGN KEY (actividad_id)
        REFERENCES actividades(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_entrega_matricula
        FOREIGN KEY (matricula_id)
        REFERENCES matriculas(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_entrega_intento
        UNIQUE (actividad_id, matricula_id, numero_intento)
);

CREATE INDEX idx_entregas_actividad
    ON entregas_actividades (actividad_id);

CREATE INDEX idx_entregas_matricula
    ON entregas_actividades (matricula_id);


CREATE TABLE archivos_entrega_actividad (
    id BIGSERIAL PRIMARY KEY,

    entrega_id BIGINT NOT NULL,

    nombre_archivo VARCHAR(255) NOT NULL,

    -- Archivo local; NO BYTEA.
    ruta_archivo TEXT NOT NULL,

    mime_type VARCHAR(120),
    tamano_bytes BIGINT,

    subido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_archivo_entrega
        FOREIGN KEY (entrega_id)
        REFERENCES entregas_actividades(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_archivos_entrega
    ON archivos_entrega_actividad (entrega_id);


-- ============================================================
-- 5. EVALUACIONES
-- ============================================================

CREATE TABLE evaluaciones (
    id BIGSERIAL PRIMARY KEY,

    contenido_id BIGINT NOT NULL UNIQUE,

    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'Cuestionario',
                'Practica',
                'Examen',
                'Evaluacion'
            )
        ),

    instrucciones TEXT,

    puntaje_aprobacion NUMERIC(5,2)
        CHECK (
            puntaje_aprobacion IS NULL
            OR puntaje_aprobacion >= 0
        ),

    intentos_permitidos INTEGER NOT NULL DEFAULT 1
        CHECK (intentos_permitidos > 0),

    tiempo_limite_minutos INTEGER
        CHECK (
            tiempo_limite_minutos IS NULL
            OR tiempo_limite_minutos > 0
        ),

    puntaje_total NUMERIC(6,2)
        CHECK (
            puntaje_total IS NULL
            OR puntaje_total >= 0
        ),

    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,

    calificada BOOLEAN NOT NULL DEFAULT TRUE,

    estado VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CHECK (
            estado IN (
                'Borrador',
                'Publicada',
                'Oculta'
            )
        ),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_evaluacion_contenido
        FOREIGN KEY (contenido_id)
        REFERENCES contenidos_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_evaluacion_fechas
        CHECK (
            fecha_fin IS NULL
            OR fecha_inicio IS NULL
            OR fecha_fin >= fecha_inicio
        )
);

CREATE INDEX idx_evaluaciones_contenido
    ON evaluaciones (contenido_id);


CREATE TABLE preguntas_evaluacion (
    id BIGSERIAL PRIMARY KEY,

    evaluacion_id BIGINT NOT NULL,

    numero INTEGER NOT NULL,

    enunciado TEXT NOT NULL,

    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'seleccion_unica',
                'seleccion_multiple',
                'verdadero_falso',
                'respuesta_abierta'
            )
        ),

    puntaje NUMERIC(6,2) NOT NULL DEFAULT 1
        CHECK (puntaje >= 0),

    CONSTRAINT fk_pregunta_evaluacion
        FOREIGN KEY (evaluacion_id)
        REFERENCES evaluaciones(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_pregunta_numero
        UNIQUE (evaluacion_id, numero)
);


CREATE TABLE opciones_pregunta (
    id BIGSERIAL PRIMARY KEY,

    pregunta_id BIGINT NOT NULL,

    numero INTEGER NOT NULL,

    texto TEXT NOT NULL,

    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_opcion_pregunta
        FOREIGN KEY (pregunta_id)
        REFERENCES preguntas_evaluacion(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_opcion_numero
        UNIQUE (pregunta_id, numero)
);


CREATE TABLE intentos_evaluacion (
    id BIGSERIAL PRIMARY KEY,

    evaluacion_id BIGINT NOT NULL,
    matricula_id BIGINT NOT NULL,

    numero_intento INTEGER NOT NULL,

    iniciado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    enviado_en TIMESTAMPTZ,

    estado VARCHAR(20) NOT NULL DEFAULT 'En curso'
        CHECK (
            estado IN (
                'En curso',
                'Enviado',
                'Calificado',
                'Cancelado'
            )
        ),

    CONSTRAINT fk_intento_evaluacion
        FOREIGN KEY (evaluacion_id)
        REFERENCES evaluaciones(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_intento_matricula
        FOREIGN KEY (matricula_id)
        REFERENCES matriculas(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_intento_numero
        UNIQUE (
            evaluacion_id,
            matricula_id,
            numero_intento
        )
);


CREATE TABLE respuestas_evaluacion (
    id BIGSERIAL PRIMARY KEY,

    intento_id BIGINT NOT NULL,
    pregunta_id BIGINT NOT NULL,

    texto_respuesta TEXT,

    es_correcta BOOLEAN,

    puntos_obtenidos NUMERIC(6,2)
        CHECK (
            puntos_obtenidos IS NULL
            OR puntos_obtenidos >= 0
        ),

    CONSTRAINT fk_respuesta_intento
        FOREIGN KEY (intento_id)
        REFERENCES intentos_evaluacion(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_respuesta_pregunta
        FOREIGN KEY (pregunta_id)
        REFERENCES preguntas_evaluacion(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_respuesta_intento_pregunta
        UNIQUE (intento_id, pregunta_id)
);


CREATE TABLE opciones_respuesta_evaluacion (
    respuesta_id BIGINT NOT NULL,
    opcion_id BIGINT NOT NULL,

    PRIMARY KEY (respuesta_id, opcion_id),

    CONSTRAINT fk_opcion_respuesta_respuesta
        FOREIGN KEY (respuesta_id)
        REFERENCES respuestas_evaluacion(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_opcion_respuesta_opcion
        FOREIGN KEY (opcion_id)
        REFERENCES opciones_pregunta(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 6. COMPONENTES DE CALIFICACION Y CALIFICACIONES
-- ============================================================

CREATE TABLE componentes_calificacion (
    id BIGSERIAL PRIMARY KEY,

    oferta_curso_id BIGINT NOT NULL,

    nombre VARCHAR(200) NOT NULL,

    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'actividad',
                'evaluacion',
                'proyecto',
                'participacion',
                'otro'
            )
        ),

    porcentaje NUMERIC(6,2)
        CHECK (
            porcentaje IS NULL
            OR (porcentaje >= 0 AND porcentaje <= 100)
        ),

    puntaje_maximo NUMERIC(6,2)
        CHECK (
            puntaje_maximo IS NULL
            OR puntaje_maximo >= 0
        ),

    actividad_id BIGINT,
    evaluacion_id BIGINT,

    CONSTRAINT fk_componente_oferta
        FOREIGN KEY (oferta_curso_id)
        REFERENCES ofertas_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_componente_actividad
        FOREIGN KEY (actividad_id)
        REFERENCES actividades(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_componente_evaluacion
        FOREIGN KEY (evaluacion_id)
        REFERENCES evaluaciones(id)
        ON DELETE SET NULL,

    CONSTRAINT ck_componente_origen
        CHECK (
            (
                actividad_id IS NULL
                AND evaluacion_id IS NULL
            )
            OR
            (
                actividad_id IS NOT NULL
                AND evaluacion_id IS NULL
            )
            OR
            (
                actividad_id IS NULL
                AND evaluacion_id IS NOT NULL
            )
        )
);

CREATE INDEX idx_componentes_oferta
    ON componentes_calificacion (oferta_curso_id);


CREATE TABLE calificaciones (
    id BIGSERIAL PRIMARY KEY,

    componente_id BIGINT NOT NULL,
    matricula_id BIGINT NOT NULL,

    -- Referencia opcional al origen de la nota.
    entrega_id BIGINT,
    intento_evaluacion_id BIGINT,

    nota NUMERIC(5,2) NOT NULL
        CHECK (nota >= 0 AND nota <= 20),

    retroalimentacion TEXT,

    calificado_por BIGINT,
    calificado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_calificacion_componente
        FOREIGN KEY (componente_id)
        REFERENCES componentes_calificacion(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_calificacion_matricula
        FOREIGN KEY (matricula_id)
        REFERENCES matriculas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_calificacion_entrega
        FOREIGN KEY (entrega_id)
        REFERENCES entregas_actividades(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_calificacion_intento
        FOREIGN KEY (intento_evaluacion_id)
        REFERENCES intentos_evaluacion(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_calificacion_docente
        FOREIGN KEY (calificado_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_calificacion_componente_matricula
        UNIQUE (componente_id, matricula_id)
);

CREATE INDEX idx_calificaciones_matricula
    ON calificaciones (matricula_id);

CREATE INDEX idx_calificaciones_componente
    ON calificaciones (componente_id);


-- ============================================================
-- 7. PROGRESO
-- ============================================================

CREATE TABLE progreso_contenido (
    matricula_id BIGINT NOT NULL,
    contenido_id BIGINT NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'No iniciado'
        CHECK (
            estado IN (
                'No iniciado',
                'En progreso',
                'Completado'
            )
        ),

    progreso NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (progreso >= 0 AND progreso <= 100),

    ultimo_acceso_en TIMESTAMPTZ,
    completado_en TIMESTAMPTZ,

    PRIMARY KEY (matricula_id, contenido_id),

    CONSTRAINT fk_progreso_matricula
        FOREIGN KEY (matricula_id)
        REFERENCES matriculas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_progreso_contenido
        FOREIGN KEY (contenido_id)
        REFERENCES contenidos_curso(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 8. CLASES Y ASISTENCIA
-- ============================================================

CREATE TABLE sesiones_clase (
    id BIGSERIAL PRIMARY KEY,

    oferta_curso_id BIGINT NOT NULL,

    modulo_id BIGINT,

    docente_id BIGINT,

    numero_sesion INTEGER NOT NULL,

    tema VARCHAR(200) NOT NULL,

    inicia_en TIMESTAMPTZ NOT NULL,
    termina_en TIMESTAMPTZ NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'Programada'
        CHECK (
            estado IN (
                'Programada',
                'Proxima',
                'En curso',
                'Finalizada',
                'Cancelada'
            )
        ),

    url_zoom TEXT,
    ruta_grabacion TEXT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sesion_oferta
        FOREIGN KEY (oferta_curso_id)
        REFERENCES ofertas_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sesion_modulo
        FOREIGN KEY (modulo_id)
        REFERENCES modulos_curso(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_sesion_docente
        FOREIGN KEY (docente_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_sesion_numero
        UNIQUE (oferta_curso_id, numero_sesion),

    CONSTRAINT ck_sesion_horario
        CHECK (termina_en > inicia_en)
);

CREATE INDEX idx_sesiones_oferta
    ON sesiones_clase (oferta_curso_id);


CREATE TABLE asistencias (
    sesion_clase_id BIGINT NOT NULL,
    matricula_id BIGINT NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'Presente'
        CHECK (
            estado IN (
                'Presente',
                'Falta'
            )
        ),

    marcado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (sesion_clase_id, matricula_id),

    CONSTRAINT fk_asistencia_sesion
        FOREIGN KEY (sesion_clase_id)
        REFERENCES sesiones_clase(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_asistencia_matricula
        FOREIGN KEY (matricula_id)
        REFERENCES matriculas(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 9. FOROS
-- ============================================================

CREATE TABLE foros (
    id BIGSERIAL PRIMARY KEY,

    oferta_curso_id BIGINT NOT NULL,

    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,

    autor_id BIGINT NOT NULL,

    fecha_cierre TIMESTAMPTZ,

    permitir_respuestas_estudiantes BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_respuestas_despues_participar BOOLEAN NOT NULL DEFAULT TRUE,

    estado VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CHECK (
            estado IN (
                'Borrador',
                'Publicado',
                'Cerrado',
                'Oculto'
            )
        ),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_foro_oferta
        FOREIGN KEY (oferta_curso_id)
        REFERENCES ofertas_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_foro_autor
        FOREIGN KEY (autor_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_foro_fecha_cierre
        CHECK (
            fecha_cierre IS NULL
            OR fecha_cierre > creado_en
        )
);

CREATE INDEX idx_foros_oferta
    ON foros (oferta_curso_id);


CREATE TABLE respuestas_foro (
    id BIGSERIAL PRIMARY KEY,

    foro_id BIGINT NOT NULL,
    autor_id BIGINT NOT NULL,

    respuesta_padre_id BIGINT,

    contenido TEXT NOT NULL,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_respuesta_foro
        FOREIGN KEY (foro_id)
        REFERENCES foros(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_respuesta_autor
        FOREIGN KEY (autor_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_respuesta_padre
        FOREIGN KEY (respuesta_padre_id)
        REFERENCES respuestas_foro(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_respuestas_foro
    ON respuestas_foro (foro_id);

CREATE INDEX idx_respuestas_foro_padre
    ON respuestas_foro (respuesta_padre_id);


CREATE TABLE menciones_foro (
    respuesta_id BIGINT NOT NULL,
    usuario_mencionado_id BIGINT NOT NULL,

    PRIMARY KEY (respuesta_id, usuario_mencionado_id),

    CONSTRAINT fk_mencion_respuesta
        FOREIGN KEY (respuesta_id)
        REFERENCES respuestas_foro(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mencion_usuario
        FOREIGN KEY (usuario_mencionado_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 10. ANUNCIOS
-- ============================================================

CREATE TABLE anuncios (
    id BIGSERIAL PRIMARY KEY,

    oferta_curso_id BIGINT NOT NULL,

    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,

    creado_por BIGINT NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CHECK (
            estado IN (
                'Borrador',
                'Publicado',
                'Oculto'
            )
        ),

    publicado_en TIMESTAMPTZ,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_anuncio_oferta
        FOREIGN KEY (oferta_curso_id)
        REFERENCES ofertas_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_anuncio_autor
        FOREIGN KEY (creado_por)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_anuncios_oferta
    ON anuncios (oferta_curso_id);


CREATE TABLE lecturas_anuncio (
    anuncio_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,

    leido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (anuncio_id, usuario_id),

    CONSTRAINT fk_lectura_anuncio
        FOREIGN KEY (anuncio_id)
        REFERENCES anuncios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lectura_anuncio_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 11. CHAT
-- ============================================================

CREATE TABLE conversaciones_chat (
    id BIGSERIAL PRIMARY KEY,

    oferta_curso_id BIGINT NOT NULL,

    usuario_1_id BIGINT NOT NULL,
    usuario_2_id BIGINT NOT NULL,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversacion_oferta
        FOREIGN KEY (oferta_curso_id)
        REFERENCES ofertas_curso(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversacion_usuario_1
        FOREIGN KEY (usuario_1_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversacion_usuario_2
        FOREIGN KEY (usuario_2_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_conversacion_usuarios_distintos
        CHECK (usuario_1_id <> usuario_2_id),

    CONSTRAINT uq_conversacion_participantes
        UNIQUE (
            oferta_curso_id,
            usuario_1_id,
            usuario_2_id
        )
);

CREATE INDEX idx_conversaciones_chat_oferta
    ON conversaciones_chat (oferta_curso_id);


CREATE TABLE mensajes_chat (
    id BIGSERIAL PRIMARY KEY,

    conversacion_id BIGINT NOT NULL,

    remitente_id BIGINT NOT NULL,

    tipo VARCHAR(20) NOT NULL DEFAULT 'Texto'
        CHECK (
            tipo IN (
                'Texto',
                'Archivo'
            )
        ),

    contenido TEXT,

    enviado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en TIMESTAMPTZ,
    eliminado_en TIMESTAMPTZ,

    CONSTRAINT fk_mensaje_conversacion
        FOREIGN KEY (conversacion_id)
        REFERENCES conversaciones_chat(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensaje_remitente
        FOREIGN KEY (remitente_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_mensajes_chat_conversacion
    ON mensajes_chat (conversacion_id, enviado_en);


CREATE TABLE adjuntos_chat (
    id BIGSERIAL PRIMARY KEY,

    mensaje_id BIGINT NOT NULL,

    nombre_archivo VARCHAR(255) NOT NULL,

    -- Archivo local; NO BYTEA.
    ruta_archivo TEXT NOT NULL,

    mime_type VARCHAR(120),
    tamano_bytes BIGINT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_adjunto_mensaje
        FOREIGN KEY (mensaje_id)
        REFERENCES mensajes_chat(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_adjuntos_chat_mensaje
    ON adjuntos_chat (mensaje_id);


CREATE TABLE lecturas_chat (
    conversacion_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,

    ultimo_mensaje_leido_id BIGINT,

    leido_en TIMESTAMPTZ,

    PRIMARY KEY (conversacion_id, usuario_id),

    CONSTRAINT fk_lectura_chat_conversacion
        FOREIGN KEY (conversacion_id)
        REFERENCES conversaciones_chat(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lectura_chat_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lectura_chat_mensaje
        FOREIGN KEY (ultimo_mensaje_leido_id)
        REFERENCES mensajes_chat(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 12. CERTIFICADOS
-- ============================================================

CREATE TABLE certificados (
    id BIGSERIAL PRIMARY KEY,

    matricula_id BIGINT NOT NULL,

    modulo_id BIGINT,

    tipo VARCHAR(20) NOT NULL
        CHECK (
            tipo IN (
                'Participacion',
                'Aprobacion'
            )
        ),

    numero_certificado VARCHAR(100) NOT NULL UNIQUE,
    codigo_verificacion VARCHAR(120) NOT NULL UNIQUE,

    emitido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- El certificado generado puede ser un archivo local.
    ruta_archivo TEXT,

    CONSTRAINT fk_certificado_matricula
        FOREIGN KEY (matricula_id)
        REFERENCES matriculas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_certificado_modulo
        FOREIGN KEY (modulo_id)
        REFERENCES modulos_curso(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_certificados_matricula
    ON certificados (matricula_id);


-- ============================================================
-- 13. HISTORIAL Y SOLICITUDES ADMINISTRATIVAS
-- ============================================================

CREATE TABLE historial_administrativo (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT,

    accion VARCHAR(200) NOT NULL,

    area VARCHAR(100) NOT NULL,

    tipo_entidad VARCHAR(100),

    entidad_id VARCHAR(100),

    resultado VARCHAR(30) NOT NULL DEFAULT 'Completo'
        CHECK (
            resultado IN (
                'Completo',
                'Confirmado',
                'Pendiente',
                'Fallido'
            )
        ),

    detalles TEXT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_historial_administrativo_usuario
    ON historial_administrativo (usuario_id);

CREATE INDEX idx_historial_administrativo_area
    ON historial_administrativo (area);


CREATE TABLE solicitudes_personas (
    id BIGSERIAL PRIMARY KEY,

    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    nombre VARCHAR(200) NOT NULL,
    dni VARCHAR(8) NOT NULL,

    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),

    tipo_alumno VARCHAR(20) NOT NULL
        CHECK (
            tipo_alumno IN (
                'Convenio',
                'Externo'
            )
        ),

    empresa_id BIGINT,
    empresa_aliada VARCHAR(150),

    interes TEXT,

    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        CHECK (
            estado IN (
                'Pendiente',
                'Contactado',
                'Matriculado',
                'Cancelado'
            )
        ),

    CONSTRAINT fk_solicitud_persona_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_solicitudes_personas_estado
    ON solicitudes_personas (estado);

CREATE INDEX idx_solicitudes_personas_correo
    ON solicitudes_personas (LOWER(correo));

CREATE INDEX idx_solicitudes_personas_dni
    ON solicitudes_personas (dni);


CREATE TABLE solicitudes_empresas (
    id BIGSERIAL PRIMARY KEY,

    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ruc VARCHAR(11) NOT NULL,
    empresa VARCHAR(200) NOT NULL,

    contacto VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),

    interes TEXT,

    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        CHECK (
            estado IN (
                'Pendiente',
                'Contactada',
                'Atendida',
                'Cancelada'
            )
        ),

    empresa_id BIGINT,

    CONSTRAINT fk_solicitud_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_solicitudes_empresas_estado
    ON solicitudes_empresas (estado);

CREATE INDEX idx_solicitudes_empresas_ruc
    ON solicitudes_empresas (ruc);


-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================

-- Para comprobar las tablas creadas:
-- SELECT tablename
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
