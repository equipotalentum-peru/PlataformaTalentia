CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,

    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(150) UNIQUE,

    password_hash TEXT NOT NULL,

    rol VARCHAR(20) NOT NULL
        CHECK (rol IN ('Estudiante', 'Docente')),

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