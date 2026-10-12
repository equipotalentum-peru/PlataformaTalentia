import pool from "../config/database";

export async function obtenerRubrica(actividadId: number) {
  const result = await pool.query(
    `SELECT r.id, r.titulo, r.nombre_archivo, r.ruta_archivo,
       COALESCE(json_agg(json_build_object(
         'id', cr.id, 'nombre', cr.nombre, 'descripcion', cr.descripcion,
         'puntaje_maximo', cr.puntaje_maximo
       ) ORDER BY cr.orden) FILTER (WHERE cr.id IS NOT NULL), '[]') AS criterios
     FROM rubricas r LEFT JOIN criterios_rubrica cr ON cr.rubrica_id = r.id
     WHERE r.actividad_id = $1 GROUP BY r.id`,
    [actividadId]
  );
  return result.rows[0] ?? null;
}
