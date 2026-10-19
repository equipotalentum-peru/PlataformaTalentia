-- Ejecutar una sola vez sobre la base PostgreSQL de Talentia.
-- El documento binario se almacena en Cloudflare R2; PostgreSQL guarda su ruta y metadatos.
BEGIN;

-- Campos usados por la pantalla del docente al registrar una calificación.
ALTER TABLE entregas_actividades
  ADD COLUMN IF NOT EXISTS nota NUMERIC(6,2)
    CHECK (nota IS NULL OR nota >= 0),
  ADD COLUMN IF NOT EXISTS retroalimentacion TEXT,
  ADD COLUMN IF NOT EXISTS calificado_por BIGINT
    REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS calificado_en TIMESTAMPTZ;

-- En el proyecto los contenidos tipo "actividad" ya pueden existir en
-- contenidos_curso aunque todavía no tengan fila asociada en actividades.
-- Creamos la configuración inicial para todas las actividades publicadas.
-- Si una actividad ya existe, no sobrescribimos su configuración.
INSERT INTO actividades (
  contenido_id,
  instrucciones,
  intentos_permitidos,
  puntaje_maximo,
  permitir_archivo,
  formatos_permitidos,
  tamano_maximo_mb,
  calificada,
  estado
)

SELECT
  cc.id,
  cc.descripcion,
  3,
  20,
  TRUE,
  'pdf,doc,docx,ppt,pptx,xls,xlsx,png,jpg,jpeg,zip,rar',
  20,
  TRUE,
  'Publicada'
FROM contenidos_curso cc
JOIN modulos_curso mc ON mc.id = cc.modulo_id
JOIN cursos c ON c.id = mc.curso_id
WHERE cc.tipo = 'actividad'
  AND cc.estado = 'Publicado'
  AND mc.activo = TRUE
  AND c.estado = 'Activo'
  AND NOT EXISTS (
    SELECT 1
    FROM actividades a
    WHERE a.contenido_id = cc.id
  )
ON CONFLICT (contenido_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_entregas_actividad_matricula
  ON entregas_actividades (actividad_id, matricula_id, numero_intento DESC);

COMMIT;
