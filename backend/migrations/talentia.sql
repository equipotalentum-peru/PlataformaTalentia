-- Database: Talentia

-- DROP DATABASE IF EXISTS "Talentia";

CREATE DATABASE "Talentia"
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Peru.1252'
    LC_CTYPE = 'Spanish_Peru.1252'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- Usuarios------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,

    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(150) UNIQUE,

    password_hash TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL
        CHECK (rol IN ('Estudiante', 'Docente', 'Administrador')),

    id_persona VARCHAR(30) UNIQUE,

    fecha_nacimiento DATE,
    genero VARCHAR(50),
    nacionalidad VARCHAR(80),

    direccion TEXT,
    telefono VARCHAR(20),

    foto_perfil TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Contraseñas---------------------------------------------------------------------------------------------------------------------------
CREATE TABLE password_reset_codes (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    code_hash TEXT NOT NULL,

    expires_at TIMESTAMP NOT NULL,

    used BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
-- Extension pgcrypto--------------------------------------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT
    id,
    nombres,
    apellidos,
    usuario,
    correo,
	password_hash,
    rol
FROM users
ORDER BY id DESC;
--Insertacion de usuario administrador---------------------------------------------------------------------------------------------------
INSERT INTO users (
    nombres,
    apellidos,
    usuario,
    correo,
    password_hash,
    rol,
    id_persona
)
VALUES (
    'Administrador',
    'Talentia',
    'admin01',
    'admin01@talentia.local',
    crypt('Talentia123!', gen_salt('bf', 12)),
    'Administrador',
    'ADM-001'
);
--Insertacion de usuario docente---------------------------------------------------------------------------------------------------------
INSERT INTO users (
    nombres,
    apellidos,
    usuario,
    correo,
    password_hash,
    rol,
    id_persona
)
VALUES (
    'Docente',
    'Talentia',
    'docente01',
    'docente01@talentia.local',
    crypt('Talentia123!', gen_salt('bf', 12)),
    'Docente',
    'DOC-001'
);
--Consulta de usuarios-------------------------------------------------------------------------------------------------------------------

select * from users;

--Alteración de tabla usuarios-----------------------------------------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS idioma VARCHAR(50)
        NOT NULL DEFAULT 'Español, Perú',
    ADD COLUMN IF NOT EXISTS zona_horaria VARCHAR(50)
        NOT NULL DEFAULT '(UTC-5) Lima';
--Edicion genero usuarios----------------------------------------------------------------------------------------------------------------
BEGIN;

UPDATE users
SET genero = CASE
    WHEN LOWER(BTRIM(genero)) IN ('masculino', 'm') THEN 'M'
    WHEN LOWER(BTRIM(genero)) IN ('femenino', 'f') THEN 'F'
    ELSE genero
END
WHERE genero IS NOT NULL;
--Begin genero usuarios------------------------------------------------------------------------------------------------------------------
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

-- Normalizar género---------------------------------------------------------------------------------------------------------------------
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_genero_check;

UPDATE users
SET genero = CASE
    WHEN LOWER(BTRIM(genero)) IN ('masculino', 'm')
        THEN 'M'
    WHEN LOWER(BTRIM(genero)) IN ('femenino', 'f')
        THEN 'F'
    ELSE NULL
END
WHERE genero IS NOT NULL;

ALTER TABLE users
    ADD CONSTRAINT users_genero_check
    CHECK (genero IN ('M', 'F'));

-- El correo será obligatorio.
-- Ejecuta primero esta consulta para comprobar que no existan NULL:
SELECT id, usuario
FROM users
WHERE correo IS NULL;

ALTER TABLE users
    ALTER COLUMN correo SET NOT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS activo BOOLEAN
        NOT NULL DEFAULT TRUE;

--cursos---------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    horas NUMERIC(6,2) NOT NULL CHECK (horas > 0),
    modalidad VARCHAR(50) NOT NULL,
    categoria VARCHAR(120),
    nivel VARCHAR(50),
    frase_identificadora TEXT,
    descripcion TEXT,
    dirigido_a TEXT,
    imagen_portada TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo', 'archivado')),
    created_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

--Oferta de cursos-----------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_offerings (
    id BIGSERIAL PRIMARY KEY,

    course_id BIGINT NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(200),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'programado'
        CHECK (
            estado IN (
                'programado',
                'en_curso',
                'finalizado',
                'cancelado'
            )
        ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_offering_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);

--oferta para docentes-------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offering_teachers (
    offering_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (offering_id, teacher_id),
    CONSTRAINT fk_offering_teacher_offering
        FOREIGN KEY (offering_id)
        REFERENCES course_offerings(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_offering_teacher_user
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

--Modulos--------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modules (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL,
    numero INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    duracion_horas NUMERIC(5,2),
    descripcion TEXT,
    aplicacion_practica TEXT,
    producto TEXT,
    evidencia TEXT,
    orden INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_module_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_module_number
        UNIQUE (course_id, numero)
);

--Contenidos de modulos------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_items (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'pdf',
                'docx',
                'pptx',
                'video',
                'quiz',
                'cuestionario',
                'evaluacion'
            )
        ),

    descripcion TEXT,
    file_path TEXT,
    mime_type VARCHAR(120),
    page_count INTEGER
        CHECK (page_count IS NULL OR page_count > 0),
    duration_seconds INTEGER
        CHECK (
            duration_seconds IS NULL
            OR duration_seconds > 0
        ),
    orden INTEGER NOT NULL,
    obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_content_module
        FOREIGN KEY (module_id)
        REFERENCES modules(id)
        ON DELETE CASCADE
);

--Actividades----------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,

    module_id BIGINT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50),
    instrucciones TEXT,
    fecha_limite TIMESTAMPTZ,
    puntaje_maximo NUMERIC(6,2),
    orden INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_module
        FOREIGN KEY (module_id)
        REFERENCES modules(id)
        ON DELETE CASCADE
);

--clases---------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_sessions (
    id BIGSERIAL PRIMARY KEY,

    offering_id BIGINT NOT NULL,
    module_id BIGINT,
    teacher_id BIGINT,
    numero_sesion INTEGER NOT NULL,
    tema VARCHAR(200) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada'
        CHECK (
            estado IN (
                'programada',
                'proxima',
                'finalizada',
                'cancelada'
            )
        ),
    zoom_url TEXT,
    recording_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	
    CONSTRAINT fk_session_offering
        FOREIGN KEY (offering_id)
        REFERENCES course_offerings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_session_module
        FOREIGN KEY (module_id)
        REFERENCES modules(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_session_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_session_number
        UNIQUE (offering_id, numero_sesion),

    CONSTRAINT ck_session_time
        CHECK (ends_at > starts_at)
);

--inscripciones--------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
    id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (
            estado IN (
                'pendiente',
                'activa',
                'completada',
                'retirada',
                'cancelada'
            )
        ),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,

    CONSTRAINT fk_enrollment_offering
        FOREIGN KEY (offering_id)
        REFERENCES course_offerings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_offering
        UNIQUE (offering_id, student_id)
);

--progreso-------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_progress (
    enrollment_id BIGINT NOT NULL,
    content_id BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'no_iniciado'
        CHECK (
            estado IN (
                'no_iniciado',
                'en_progreso',
                'completado'
            )
        ),
    progreso NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (progreso >= 0 AND progreso <= 100),
    last_accessed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (enrollment_id, content_id),

    CONSTRAINT fk_progress_enrollment
        FOREIGN KEY (enrollment_id)
        REFERENCES enrollments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_progress_content
        FOREIGN KEY (content_id)
        REFERENCES content_items(id)
        ON DELETE CASCADE
);

--foro principal-------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_topics (
    id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	
    CONSTRAINT fk_forum_topic_offering
        FOREIGN KEY (offering_id)
        REFERENCES course_offerings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_topic_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

--foro mensajes--------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_messages (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    parent_message_id BIGINT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_forum_message_topic
        FOREIGN KEY (topic_id)
        REFERENCES forum_topics(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_message_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_message_parent
        FOREIGN KEY (parent_message_id)
        REFERENCES forum_messages(id)
        ON DELETE CASCADE
);

--foro menciones-------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_mentions (
    message_id BIGINT NOT NULL,
    mentioned_user_id BIGINT NOT NULL,
    PRIMARY KEY (message_id, mentioned_user_id),
	
    CONSTRAINT fk_forum_mention_message
        FOREIGN KEY (message_id)
        REFERENCES forum_messages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_mention_user
        FOREIGN KEY (mentioned_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

--lectura del tema-----------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forum_topic_reads (
    topic_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (topic_id, user_id),

    CONSTRAINT fk_forum_read_topic
        FOREIGN KEY (topic_id)
        REFERENCES forum_topics(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forum_read_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

--anuncios-------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_announcement_offering
        FOREIGN KEY (offering_id)
        REFERENCES course_offerings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_announcement_author
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

--anuncios lectura-----------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcement_reads (
    announcement_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, user_id),

    CONSTRAINT fk_announcement_read
        FOREIGN KEY (announcement_id)
        REFERENCES announcements(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_announcement_read_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

--actividades entregadas-----------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_submissions (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    submission_text TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'entregada'
        CHECK (
            estado IN (
                'borrador',
                'entregada',
                'calificada',
                'devuelta'
            )
        ),
    puntaje NUMERIC(6,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    graded_by BIGINT,

    CONSTRAINT fk_submission_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submission_enrollment
        FOREIGN KEY (enrollment_id)
        REFERENCES enrollments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submission_grader
        FOREIGN KEY (graded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

--actividades entregables archivos-------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_submission_files (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(120),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_submission_file
        FOREIGN KEY (submission_id)
        REFERENCES activity_submissions(id)
        ON DELETE CASCADE
);

--evaluaciones principal-----------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'quiz',
                'cuestionario',
                'evaluacion'
            )
        ),
    puntaje_aprobacion NUMERIC(5,2),
    intentos_permitidos INTEGER DEFAULT 1,
    tiempo_limite_minutos INTEGER,
    randomizar_preguntas BOOLEAN NOT NULL DEFAULT FALSE,
    publicado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	
    CONSTRAINT fk_assessment_content
        FOREIGN KEY (content_id)
        REFERENCES content_items(id)
        ON DELETE CASCADE
);

--evaluaciones preguntas-----------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_questions (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    numero INTEGER NOT NULL,
    texto TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'single_choice',
                'multiple_choice',
                'true_false',
                'open_text'
            )
        ),
    puntaje NUMERIC(6,2) NOT NULL DEFAULT 1,

    CONSTRAINT fk_question_assessment
        FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_assessment_question_number
        UNIQUE (assessment_id, numero)
);

--evaluaciones opciones------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    numero INTEGER NOT NULL,
    texto TEXT NOT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_option_question
        FOREIGN KEY (question_id)
        REFERENCES assessment_questions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_question_option_number
        UNIQUE (question_id, numero)
);

--evaluaciones intentos------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    numero_intento INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    score NUMERIC(6,2),
    passed BOOLEAN,

    CONSTRAINT fk_attempt_assessment
        FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attempt_enrollment
        FOREIGN KEY (enrollment_id)
        REFERENCES enrollments(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_attempt_number
        UNIQUE (
            assessment_id,
            enrollment_id,
            numero_intento
        )
);

--evaluaciones respuestas----------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_answers (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer_text TEXT,
    is_correct BOOLEAN,
    points_awarded NUMERIC(6,2),

    CONSTRAINT fk_answer_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES assessment_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_answer_question
        FOREIGN KEY (question_id)
        REFERENCES assessment_questions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_attempt_question
        UNIQUE (attempt_id, question_id)
);

--evaluaciones opciones seleccionadas----------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_answer_options (
    answer_id BIGINT NOT NULL,
    option_id BIGINT NOT NULL,
    PRIMARY KEY (answer_id, option_id),

    CONSTRAINT fk_answer_option_answer
        FOREIGN KEY (answer_id)
        REFERENCES assessment_answers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_answer_option_option
        FOREIGN KEY (option_id)
        REFERENCES assessment_options(id)
        ON DELETE CASCADE
);

--calificaciones principal---------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grade_items (
    id BIGSERIAL PRIMARY KEY,
    offering_id BIGINT NOT NULL,
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
    peso NUMERIC(6,2),
    puntaje_maximo NUMERIC(6,2),
    activity_id BIGINT,
    assessment_id BIGINT,

    CONSTRAINT fk_grade_item_offering
        FOREIGN KEY (offering_id)
        REFERENCES course_offerings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_grade_item_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_grade_item_assessment
        FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE SET NULL
);

--calificaciones notas-------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grades (
    id BIGSERIAL PRIMARY KEY,
    grade_item_id BIGINT NOT NULL,
    enrollment_id BIGINT NOT NULL,
    score NUMERIC(6,2) NOT NULL,
    feedback TEXT,
    graded_by BIGINT,
    graded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_grade_item
        FOREIGN KEY (grade_item_id)
        REFERENCES grade_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_grade_enrollment
        FOREIGN KEY (enrollment_id)
        REFERENCES enrollments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_grade_grader
        FOREIGN KEY (graded_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_grade_student_item
        UNIQUE (grade_item_id, enrollment_id)
);

--certificados---------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL,
    module_id BIGINT,
    tipo VARCHAR(30) NOT NULL
        CHECK (
            tipo IN (
                'participacion',
                'aprobacion'
            )
        ),
    numero_certificado VARCHAR(100) NOT NULL UNIQUE,
    verification_code VARCHAR(120) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT,

    CONSTRAINT fk_certificate_enrollment
        FOREIGN KEY (enrollment_id)
        REFERENCES enrollments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_certificate_module
        FOREIGN KEY (module_id)
        REFERENCES modules(id)
        ON DELETE SET NULL
);

