-- ============================================================
-- SEMILLERO DE CURSOS, OFERTAS Y MATRÍCULAS - TALENTIA
-- Todos los cursos del portafolio documental se registran en cursos.
-- El alumno de prueba estudiante01 recibe SOLO los 5 primeros.
-- ============================================================

-- 1. CURSOS DEL CATÁLOGO
INSERT INTO cursos (
    nombre,
    codigo,
    categoria,
    modalidad,
    descripcion,
    imagen_portada,
    estado,
    creado_por
)
VALUES
(
    'Especialización en Gestión de Planillas, Remuneraciones y Beneficios Laborales',
    'ESP-001',
    'Recursos Humanos y Gestión Laboral',
    'Virtual',
    'Programa práctico orientado a desarrollar las habilidades necesarias para gestionar remuneraciones, beneficios sociales y liquidaciones. Combina fundamentos técnicos con ejercicios aplicados, casos laborales y herramientas de trabajo. El participante culmina resolviendo un caso integral de planilla y liquidación.',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Especialización en Contabilidad Práctica para la Gestión de MYPES',
    'ESP-002',
    'Contabilidad, Tributación y Gestión Empresarial',
    'Virtual',
    'Programa diseñado para comprender y ejecutar las principales operaciones contables y tributarias de una MYPE. El participante trabajará con comprobantes, compras, ventas, gastos, IGV y obligaciones tributarias. El aprendizaje se desarrolla mediante ejercicios y un caso empresarial integral.',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Especialización en Gestión de Subsidios y Licencias Laborales',
    'ESP-003',
    'Recursos Humanos y Legislación Laboral',
    'Virtual',
    'Programa práctico para profesionales que gestionan incidencias laborales, licencias y subsidios. Se trabaja desde la identificación del derecho y el cálculo hasta la preparación documental, seguimiento y recuperación de prestaciones. Incluye casos de incapacidad temporal y maternidad.',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Especialización en Atracción y Selección de Talento con IA, ATS y Evaluación por Competencias',
    'ESP-004',
    'Gestión del Talento y Atracción de Personas',
    'Virtual',
    'Programa actualizado y práctico para fortalecer la gestión de atracción y selección de talento. Integra perfilamiento, sourcing, ATS, inteligencia artificial, entrevistas y evaluación por competencias. El participante culmina con un proceso completo de selección y una recomendación sustentada.',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Especialización en Excel desde Cero: de Principiante a Profesional',
    'ESP-005',
    'Excel, Productividad y Gestión de Datos',
    'Virtual',
    'Programa práctico para personas que necesitan aprender Excel desde las bases y avanzar progresivamente hacia un uso profesional. Combina fundamentos, fórmulas, análisis, reportes, tablas dinámicas y aplicaciones laborales.',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Especialización en Excel Profesional: Análisis, Automatización y Business Intelligence',
    'ESP-006',
    'Excel Avanzado, Análisis de Datos y Business Intelligence',
    'Virtual',
    'Programa avanzado orientado a profesionales que ya manejan Excel y quieren llevarlo a un nivel de análisis, modelamiento y automatización. Integra funciones avanzadas, dashboards, Power Query, Power Pivot, DAX, macros y modelos aplicados a gestión.',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Team Building: Conecta, Colabora y Logra',
    'CORP-001',
    'Cultura, Integración y Trabajo en Equipo',
    'Virtual',
    'Taller experiencial orientado a fortalecer la integración, comunicación y colaboración entre los miembros de un equipo. A través de dinámicas, retos y ejercicios prácticos, los participantes identificarán fortalezas, oportunidades de mejora y acuerdos concretos para trabajar mejor juntos.',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Liderazgo en Acción: Del Equipo a los Resultados',
    'CORP-002',
    'Liderazgo y Gestión de Personas',
    'Virtual',
    'Taller práctico dirigido a líderes y mandos medios que necesitan fortalecer sus habilidades para gestionar personas, comunicar expectativas, entregar feedback y enfrentar situaciones difíciles. Se trabaja mediante casos, role play y simulaciones de situaciones reales.',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Seguridad y Salud en el Trabajo: Cultura Preventiva y Gestión de Riesgos',
    'CORP-003',
    'Seguridad, Salud Ocupacional y Gestión Preventiva',
    'Virtual',
    'Curso práctico orientado a fortalecer la cultura preventiva y brindar herramientas para identificar peligros, evaluar riesgos y promover comportamientos seguros en el trabajo. Se desarrollan casos y situaciones aplicables a diferentes entornos laborales.',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Inteligencia Artificial para la Productividad Laboral',
    'CORP-004',
    'Innovación, Tecnología y Productividad',
    'Virtual',
    'Curso práctico orientado a incorporar herramientas de inteligencia artificial en actividades cotidianas de trabajo. Los participantes aprenderán a crear prompts, generar y analizar información, mejorar documentos y diseñar flujos de trabajo que eleven su productividad.',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
),
(
    'Customer Experience & Service Excellence: Excelencia en Servicio',
    'CORP-005',
    'Experiencia del Cliente y Servicio',
    'Virtual',
    'Programa práctico orientado a fortalecer las competencias de atención y servicio, integrando comunicación, empatía, manejo de emociones, resolución de problemas y gestión de clientes difíciles. Los participantes trabajan situaciones reales mediante casos, simulaciones y role play.',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    'Activo',
    (SELECT id FROM usuarios WHERE usuario = 'admin01' AND rol = 'Administrador' LIMIT 1)
)
ON CONFLICT (codigo) DO NOTHING;


-- 2. OFERTAS: una oferta por cada curso.
-- No se fija periodo ni docente todavía; eso puede asignarse posteriormente
-- desde la administración.
INSERT INTO ofertas_curso (
    curso_id,
    periodo_id,
    fecha_inicio,
    fecha_fin,
    cupo_maximo,
    docente_id,
    estado,
    publicado
)
SELECT
    c.id,
    NULL,
    NULL,
    NULL,
    0,
    NULL,
    'Programado',
    TRUE
FROM cursos c
WHERE c.codigo IN (
    'ESP-001',
    'ESP-002',
    'ESP-003',
    'ESP-004',
    'ESP-005',
    'ESP-006',
    'CORP-001',
    'CORP-002',
    'CORP-003',
    'CORP-004',
    'CORP-005'
)
AND NOT EXISTS (
    SELECT 1
    FROM ofertas_curso oc
    WHERE oc.curso_id = c.id
      AND oc.periodo_id IS NULL
);


-- 3. MATRÍCULAS DEL ALUMNO DE PRUEBA
-- estudiante01 es el alumno creado en "usuarios insert into.sql".
-- Se le asignan SOLO 5 cursos para demostrar que los cursos son por usuario.
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
    ON u.usuario = 'estudiante01'
    AND u.rol = 'Estudiante'
WHERE c.codigo IN (
    'ESP-001',
    'ESP-002',
    'ESP-003',
    'ESP-004',
    'ESP-005'
)
AND NOT EXISTS (
    SELECT 1
    FROM matriculas m
    WHERE m.oferta_curso_id = oc.id
      AND m.estudiante_id = u.id
);


-- ============================================================
-- COMPROBACIÓN
-- ============================================================

-- Todos los cursos del catálogo:
SELECT
    id,
    codigo,
    nombre,
    categoria,
    estado
FROM cursos
ORDER BY id;

-- Cursos que realmente verá el alumno estudiante01:
SELECT
    u.usuario,
    u.nombres,
    c.codigo,
    c.nombre,
    m.estado AS estado_matricula
FROM matriculas m
INNER JOIN usuarios u
    ON u.id = m.estudiante_id
INNER JOIN ofertas_curso oc
    ON oc.id = m.oferta_curso_id
INNER JOIN cursos c
    ON c.id = oc.curso_id
WHERE u.usuario = 'estudiante01'
ORDER BY c.id;
