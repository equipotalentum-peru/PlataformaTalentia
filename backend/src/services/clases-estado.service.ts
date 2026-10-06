import pool from "../config/database";

let sincronizando = false;

export async function sincronizarEstadosClases() {
  if (sincronizando) {
    return;
  }

  sincronizando = true;

  try {
    await pool.query(`
      WITH estados AS (
        SELECT
          id,
          CASE
            WHEN estado = 'Cancelada'
              THEN 'Cancelada'

            WHEN estado = 'Finalizada'
              THEN 'Finalizada'

            WHEN termina_en <= CURRENT_TIMESTAMP
              THEN 'Finalizada'

            WHEN estado = 'En curso'
              THEN 'En curso'

            WHEN inicia_en <= CURRENT_TIMESTAMP
              THEN 'En curso'

            WHEN inicia_en <= CURRENT_TIMESTAMP + INTERVAL '48 hours'
              THEN 'Proxima'

            ELSE 'Programada'
          END AS nuevo_estado
        FROM sesiones_clase
      )

      UPDATE sesiones_clase sc
      SET
        estado = e.nuevo_estado,
        actualizado_en = CURRENT_TIMESTAMP
      FROM estados e
      WHERE sc.id = e.id
        AND sc.estado IS DISTINCT FROM e.nuevo_estado
    `);
  } catch (error) {
    console.error(
      "Error sincronizando estados de clases:",
      error
    );
  } finally {
    sincronizando = false;
  }
}