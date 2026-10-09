CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT gen_salt('bf', 12);

SELECT extname
FROM pg_extension
WHERE extname = 'pgcrypto';

select * from usuarios;
select * from codigos_restablecimiento;
select * from invitaciones_registro;

INSERT INTO usuarios (
    nombres,
    apellidos,
    usuario,
    correo,
    hash_contrasena,
    rol,
    id_persona,
    dni,
    fecha_nacimiento,
    genero,
    nacionalidad,
    direccion,
    telefono,
    empresa_aliada,
    activo
)
VALUES (
    'Gray Jean',
    'Padilla',
    'estudiante01',
    'estudiante01@talentia.local',
    crypt('Talentia123!', gen_salt('bf', 12)),
    'Estudiante',
    'ALU-001',
    '74839201',
    '2005-06-15',
    'M',
    'Peruana',
    'Av. Principal 123, Lima',
    '987654321',
    'Talentum',
    TRUE
);

INSERT INTO usuarios (
    nombres,
    apellidos,
    usuario,
    correo,
    hash_contrasena,
    rol,
    id_persona,
    dni,
    fecha_nacimiento,
    genero,
    nacionalidad,
    direccion,
    telefono,
    especialidad,
    disponibilidad,
    activo
)
VALUES (
    'Gloria',
    'Rocha',
    'docente01',
    'docente01@talentia.local',
    crypt('Talentia123!', gen_salt('bf', 12)),
    'Docente',
    'DOC-001',
    '70123456',
    '1988-04-20',
    'F',
    'Peruana',
    'Av. Universitaria 456, Lima',
    '912345678',
    'Tecnologías de la Información',
    'Lunes a viernes',
    TRUE
);

INSERT INTO usuarios (
    nombres,
    apellidos,
    usuario,
    correo,
    hash_contrasena,
    rol,
    id_persona,
    dni,
    fecha_nacimiento,
    genero,
    nacionalidad,
    direccion,
    telefono,
    activo
)
VALUES (
    'Administrador',
    'Talentia',
    'admin01',
    'admin01@talentia.local',
    crypt('Talentia123!', gen_salt('bf', 12)),
    'Administrador',
    'ADM-001',
    '71234567',
    '1985-01-10',
    'M',
    'Peruana',
    'Av. Talentia 100, Lima',
    '955555555',
    TRUE
);

INSERT INTO matriculas (
    oferta_curso_id,
    estudiante_id,
    estado,
    estado_pago
)
SELECT
    oc.id,
    u.id,
    'Activa',
    'No aplica'
FROM ofertas_curso oc
INNER JOIN cursos c
    ON c.id = oc.curso_id
INNER JOIN usuarios u
    ON u.usuario = 'graypadilla6@gmail.com'
    AND u.rol = 'Estudiante'
WHERE c.codigo IN (
    'ESP-001'
)
AND NOT EXISTS (
    SELECT 1
    FROM matriculas m
    WHERE m.oferta_curso_id = oc.id
      AND m.estudiante_id = u.id
);