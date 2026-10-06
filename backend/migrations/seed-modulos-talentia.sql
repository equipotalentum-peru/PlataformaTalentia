-- ============================================================
-- TALENTIA - MÓDULOS DE LOS 11 CURSOS
-- Requiere que los cursos ESP-001..ESP-006 y CORP-001..CORP-005
-- ya existan en la tabla cursos.
-- ============================================================

INSERT INTO modulos_curso (
    curso_id,
    numero,
    titulo,
    descripcion,
    orden,
    activo
)
SELECT
    c.id,
    datos.numero,
    datos.titulo,
    datos.descripcion,
    datos.orden,
    TRUE
FROM (
    VALUES
    ('ESP-001', 1, 'Gestión de remuneraciones y estructura de planillas', 'Duración: 2 horas. Producto del módulo: Planilla básica de remuneraciones correctamente calculada.', 1),
    ('ESP-001', 2, 'Cálculo de CTS, gratificaciones y vacaciones', 'Duración: 2 horas. Producto del módulo: Matriz de cálculo de beneficios sociales.', 2),
    ('ESP-001', 3, 'Liquidación de beneficios sociales', 'Duración: 2 horas. Producto del módulo: Liquidación de beneficios sociales completa.', 3),
    ('ESP-001', 4, 'Taller integrador de planillas y liquidaciones', 'Duración: 2 horas. Producto del módulo: Expediente integral de planilla, beneficios y liquidación.', 4),
    ('ESP-002', 1, 'Emisión y gestión de comprobantes electrónicos', 'Duración: 2 horas. Producto del módulo: Matriz práctica para seleccionar y revisar comprobantes.', 1),
    ('ESP-002', 2, 'Registro de compras, ventas y gastos', 'Duración: 2 horas. Producto del módulo: Registro mensual simplificado de operaciones.', 2),
    ('ESP-002', 3, 'IGV y obligaciones tributarias de la MYPE', 'Duración: 2 horas. Producto del módulo: Determinación tributaria mensual simulada.', 3),
    ('ESP-002', 4, 'Taller integral de gestión contable de una MYPE', 'Duración: 2 horas. Producto del módulo: Expediente contable mensual simplificado de una MYPE.', 4),
    ('ESP-003', 1, 'Gestión de licencias, descansos médicos y ausencias', 'Duración: 2 horas. Producto del módulo: Matriz de gestión y seguimiento de licencias.', 1),
    ('ESP-003', 2, 'Cálculo de subsidios por incapacidad temporal', 'Duración: 2 horas. Producto del módulo: Hoja de cálculo de subsidio aplicada a un caso.', 2),
    ('ESP-003', 3, 'Gestión y recuperación de subsidios', 'Duración: 2 horas. Producto del módulo: Expediente práctico de gestión y recuperación de subsidio.', 3),
    ('ESP-003', 4, 'Taller integral de subsidios y licencias', 'Duración: 2 horas. Producto del módulo: Caso integral: cálculo + expediente + ruta de gestión.', 4),
    ('ESP-004', 1, 'Perfilamiento y estrategia de atracción de talento', 'Duración: 2 horas. Producto del módulo: Perfil de puesto + matriz de competencias.', 1),
    ('ESP-004', 2, 'ATS, sourcing y screening de candidatos', 'Duración: 2 horas. Producto del módulo: Shortlist sustentada + criterios de screening.', 2),
    ('ESP-004', 3, 'Entrevista y evaluación por competencias', 'Duración: 2 horas. Producto del módulo: Guía de entrevista + matriz de evaluación.', 3),
    ('ESP-004', 4, 'Assessment y decisión de selección', 'Duración: 2 horas. Producto del módulo: Informe final de evaluación y recomendación de candidato.', 4),
    ('ESP-005', 1, 'Fundamentos de Excel: domina la herramienta desde cero', 'Duración: 4 horas. Producto del módulo: Base de datos organizada y funcional.', 1),
    ('ESP-005', 2, 'Fórmulas esenciales para trabajar con datos', 'Duración: 4 horas. Producto del módulo: Plantilla de cálculo con fórmulas esenciales.', 2),
    ('ESP-005', 3, 'Excel para gestión y control', 'Duración: 4 horas. Producto del módulo: Dashboard/plantilla de control operativo básica.', 3),
    ('ESP-005', 4, 'Funciones que te hacen trabajar más rápido', 'Duración: 4 horas. Producto del módulo: Modelo automatizado de control.', 4),
    ('ESP-005', 5, 'Tablas dinámicas y análisis básico', 'Duración: 4 horas. Producto del módulo: Reporte dinámico de gestión.', 5),
    ('ESP-005', 6, 'Gráficos e informes ejecutivos', 'Duración: 4 horas. Producto del módulo: Reporte visual ejecutivo.', 6),
    ('ESP-005', 7, 'Excel aplicado a Recursos Humanos y Administración', 'Duración: 4 horas. Producto del módulo: Matriz de gestión de RR. HH./Administración.', 7),
    ('ESP-005', 8, 'Excel aplicado a ventas y gestión comercial', 'Duración: 4 horas. Producto del módulo: Tablero comercial básico.', 8),
    ('ESP-005', 9, 'Proyecto integrador: de la base de datos al reporte', 'Duración: 4 horas. Producto del módulo: Archivo integral de gestión en Excel.', 9),
    ('ESP-005', 10, 'Reto final: Excel para resolver problemas reales', 'Duración: 4 horas. Producto del módulo: Proyecto final de Excel listo para uso laboral.', 10),
    ('ESP-006', 1, 'Excel Profesional: fórmulas y funciones avanzadas', 'Duración: 4 horas. Producto del módulo: Modelo avanzado de cálculo.', 1),
    ('ESP-006', 2, 'Excel para análisis de datos y toma de decisiones', 'Duración: 4 horas. Producto del módulo: Base depurada + matriz de indicadores.', 2),
    ('ESP-006', 3, 'Tablas dinámicas avanzadas y dashboards', 'Duración: 4 horas. Producto del módulo: Dashboard ejecutivo interactivo.', 3),
    ('ESP-006', 4, 'Power Query: transforma y automatiza tus datos', 'Duración: 4 horas. Producto del módulo: Consulta automatizada para transformación de datos.', 4),
    ('ESP-006', 5, 'Modelamiento de datos y Power Pivot', 'Duración: 4 horas. Producto del módulo: Modelo de datos funcional.', 5),
    ('ESP-006', 6, 'Automatización de tareas con macros y VBA', 'Duración: 4 horas. Producto del módulo: Macro funcional para un proceso real.', 6),
    ('ESP-006', 7, 'Excel para finanzas y control de gestión', 'Duración: 4 horas. Producto del módulo: Modelo financiero de gestión.', 7),
    ('ESP-006', 8, 'Excel para RR. HH. y People Analytics', 'Duración: 4 horas. Producto del módulo: Dashboard de People Analytics.', 8),
    ('ESP-006', 9, 'Optimización de modelos y resolución de problemas', 'Duración: 4 horas. Producto del módulo: Modelo optimizado y documentado.', 9),
    ('ESP-006', 10, 'Proyecto integrador: Excel Professional Challenge', 'Duración: 4 horas. Producto del módulo: Proyecto profesional integral en Excel.', 10),
    ('CORP-001', 1, 'Conociendo nuestro equipo', 'Duración: 1 hora. Producto del módulo: Mapa de fortalezas y oportunidades del equipo.', 1),
    ('CORP-001', 2, 'Comunicación que conecta', 'Duración: 1 hora. Producto del módulo: Acuerdos de comunicación efectiva.', 2),
    ('CORP-001', 3, 'Retos colaborativos', 'Duración: 1 hora. Producto del módulo: Matriz de aprendizajes del reto.', 3),
    ('CORP-001', 4, 'Nuestro acuerdo de equipo', 'Duración: 1 hora. Producto del módulo: Team Agreement con compromisos de trabajo.', 4),
    ('CORP-002', 1, 'El líder como movilizador', 'Duración: 1 hora. Producto del módulo: Perfil de fortalezas y oportunidades del líder.', 1),
    ('CORP-002', 2, 'Comunicación y feedback', 'Duración: 1 hora. Producto del módulo: Guía de conversación de feedback.', 2),
    ('CORP-002', 3, 'Delegación y gestión del desempeño', 'Duración: 1 hora. Producto del módulo: Matriz de delegación y seguimiento.', 3),
    ('CORP-002', 4, 'Conversaciones difíciles', 'Duración: 1 hora. Producto del módulo: Plan de acción de liderazgo de 30 días.', 4),
    ('CORP-003', 1, 'Cultura preventiva y responsabilidades', 'Duración: 2 horas. Producto del módulo: Mapa de comportamientos preventivos.', 1),
    ('CORP-003', 2, 'Identificación de peligros y evaluación de riesgos', 'Duración: 2 horas. Producto del módulo: Matriz práctica de identificación y control de riesgos.', 2),
    ('CORP-003', 3, 'Prevención aplicada al trabajo', 'Duración: 2 horas. Producto del módulo: Plan de acciones preventivas.', 3),
    ('CORP-004', 1, 'IA aplicada al trabajo y prompting', 'Duración: 2 horas. Producto del módulo: Biblioteca personal de prompts aplicables al puesto.', 1),
    ('CORP-004', 2, 'IA para productividad y generación de contenidos', 'Duración: 2 horas. Producto del módulo: Kit de productividad con IA.', 2),
    ('CORP-004', 3, 'IA para procesos y toma de decisiones', 'Duración: 2 horas. Producto del módulo: Flujo de trabajo con IA aplicable al puesto.', 3),
    ('CORP-005', 1, 'Customer Experience: el cliente en el centro', 'Duración: 2 horas. Producto del módulo: Mapa de experiencia del cliente.', 1),
    ('CORP-005', 2, 'Comunicación que conecta', 'Duración: 2 horas. Producto del módulo: Guía personal de comunicación efectiva.', 2),
    ('CORP-005', 3, 'Clientes difíciles, reclamos y recuperación del servicio', 'Duración: 2 horas. Producto del módulo: Protocolo personal para manejo de clientes difíciles.', 3)
) AS datos(codigo_curso, numero, titulo, descripcion, orden)
INNER JOIN cursos c
    ON c.codigo = datos.codigo_curso
ON CONFLICT (curso_id, numero)
DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden,
    activo = TRUE,
    actualizado_en = CURRENT_TIMESTAMP;

-- COMPROBAR LOS 53 MÓDULOS
SELECT
    c.codigo,
    c.nombre AS curso,
    mc.numero,
    mc.titulo,
    mc.descripcion,
    mc.orden,
    mc.activo
FROM modulos_curso mc
INNER JOIN cursos c
    ON c.id = mc.curso_id
WHERE c.codigo IN (
    'ESP-001','ESP-002','ESP-003','ESP-004','ESP-005','ESP-006',
    'CORP-001','CORP-002','CORP-003','CORP-004','CORP-005'
)
ORDER BY c.id, mc.orden;

-- COMPROBAR CUÁNTOS MÓDULOS HAY POR CURSO
SELECT
    c.codigo,
    c.nombre,
    COUNT(mc.id) AS cantidad_modulos
FROM cursos c
LEFT JOIN modulos_curso mc
    ON mc.curso_id = c.id
WHERE c.codigo IN (
    'ESP-001','ESP-002','ESP-003','ESP-004','ESP-005','ESP-006',
    'CORP-001','CORP-002','CORP-003','CORP-004','CORP-005'
)
GROUP BY c.id, c.codigo, c.nombre
ORDER BY c.id;
