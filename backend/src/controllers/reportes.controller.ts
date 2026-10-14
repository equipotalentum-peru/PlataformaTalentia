import type { Response } from "express";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export const CATEGORIAS_REPORTE = [
  "Usuarios",
  "Cursos",
  "Matrículas",
  "Calificaciones",
  "Certificados",
] as const;

export type CategoriaReporte = (typeof CATEGORIAS_REPORTE)[number];

type ItemGrafico = {
  label: string;
  value: number;
};

type Indicador = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
};

function esCategoriaReporte(value: unknown): value is CategoriaReporte {
  return typeof value === "string" &&
    CATEGORIAS_REPORTE.includes(value as CategoriaReporte);
}

async function obtenerAdministradorId(
  req: AuthenticatedRequest,
  res: Response,
): Promise<number | null> {
  const usuarioId = Number(req.userId);

  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    res.status(401).json({ message: "La sesión no es válida." });
    return null;
  }

  const usuario = await pool.query<{ rol: string }>(
    "SELECT rol FROM usuarios WHERE id = $1 LIMIT 1",
    [usuarioId],
  );

  if (usuario.rows[0]?.rol !== "Administrador") {
    res.status(403).json({
      message: "Este recurso es exclusivo para administradores.",
    });
    return null;
  }

  return usuarioId;
}

async function obtenerReportesRecientes() {
  const result = await pool.query(
    `SELECT
       ha.id,
       CONCAT('Reporte de ', ha.entidad_id) AS reporte,
       ha.creado_en AS fecha,
       COALESCE(
         NULLIF(TRIM(CONCAT_WS(' ', u.nombres, u.apellidos)), ''),
         'Sistema'
       ) AS responsable,
       ha.resultado AS estado,
       ha.entidad_id AS categoria
     FROM historial_administrativo ha
     LEFT JOIN usuarios u ON u.id = ha.usuario_id
     WHERE ha.area = 'Reportes'
       AND ha.tipo_entidad = 'Reporte'
     ORDER BY ha.creado_en DESC, ha.id DESC
     LIMIT 10`,
  );

  return result.rows;
}

async function obtenerDatosCategoria(categoria: CategoriaReporte): Promise<{
  grafico: { titulo: string; items: ItemGrafico[] };
  indicadores: Indicador[];
}> {
  switch (categoria) {
    case "Usuarios": {
      const [metricas, grafico] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*)::INTEGER AS total,
             COUNT(*) FILTER (WHERE activo = TRUE)::INTEGER AS activos
           FROM usuarios`,
        ),
        pool.query(
          `SELECT
             rol AS label,
             COUNT(*)::INTEGER AS value
           FROM usuarios
           GROUP BY rol
           ORDER BY CASE rol
             WHEN 'Estudiante' THEN 1
             WHEN 'Docente' THEN 2
             WHEN 'Administrador' THEN 3
             ELSE 4
           END`,
        ),
      ]);

      const total = Number(metricas.rows[0]?.total ?? 0);
      const activos = Number(metricas.rows[0]?.activos ?? 0);

      return {
        grafico: {
          titulo: "Usuarios por rol",
          items: grafico.rows.map((item) => ({
            label: String(item.label),
            value: Number(item.value ?? 0),
          })),
        },
        indicadores: [
          {
            label: "usuarios activos",
            value: total ? Math.round((activos / total) * 100) : 0,
            suffix: "%",
          },
          { label: "usuarios registrados", value: total },
        ],
      };
    }

    case "Cursos": {
      const [metricas, grafico] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE c.estado = 'Activo')::INTEGER AS activos,
             COUNT(DISTINCT m.estudiante_id) FILTER (
               WHERE m.estado IN ('Activa', 'Completada')
             )::INTEGER AS alumnos_inscritos
           FROM cursos c
           LEFT JOIN ofertas_curso oc ON oc.curso_id = c.id
           LEFT JOIN matriculas m ON m.oferta_curso_id = oc.id`,
        ),
        pool.query(
          `SELECT
             c.nombre AS label,
             CASE
               WHEN COUNT(m.id) FILTER (
                 WHERE m.estado IN ('Activa', 'Completada')
               ) = 0 THEN 0
               ELSE ROUND(
                 100.0 * COUNT(m.id) FILTER (WHERE m.estado = 'Completada')
                 / NULLIF(
                   COUNT(m.id) FILTER (
                     WHERE m.estado IN ('Activa', 'Completada')
                   ),
                   0
                 )
               )::INTEGER
             END AS value
           FROM cursos c
           LEFT JOIN ofertas_curso oc ON oc.curso_id = c.id
           LEFT JOIN matriculas m ON m.oferta_curso_id = oc.id
           WHERE c.estado <> 'Archivado'
           GROUP BY c.id, c.nombre
           ORDER BY COUNT(m.id) FILTER (
             WHERE m.estado IN ('Activa', 'Completada')
           ) DESC, c.nombre
           LIMIT 5`,
        ),
      ]);

      return {
        grafico: {
          titulo: "Finalización por programa",
          items: grafico.rows.map((item) => ({
            label: String(item.label),
            value: Number(item.value ?? 0),
          })),
        },
        indicadores: [
          {
            label: "cursos activos",
            value: Number(metricas.rows[0]?.activos ?? 0),
          },
          {
            label: "alumnos inscritos",
            value: Number(metricas.rows[0]?.alumnos_inscritos ?? 0),
          },
        ],
      };
    }

    case "Matrículas": {
      const [metricas, grafico] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) FILTER (
               WHERE estado IN ('Activa', 'Completada')
             )::INTEGER AS confirmadas,
             COUNT(*) FILTER (
               WHERE estado_pago = 'Pendiente'
                 AND estado NOT IN ('Cancelada', 'Retirada')
             )::INTEGER AS pendientes_pago
           FROM matriculas`,
        ),
        pool.query(
          `WITH meses AS (
             SELECT generate_series(
               date_trunc('month', CURRENT_DATE) - INTERVAL '4 months',
               date_trunc('month', CURRENT_DATE),
               INTERVAL '1 month'
             )::DATE AS mes
           )
           SELECT
             TO_CHAR(meses.mes, 'YYYY-MM-DD') AS mes,
             COUNT(m.id)::INTEGER AS value
           FROM meses
           LEFT JOIN matriculas m
             ON m.matriculado_en >= meses.mes
            AND m.matriculado_en < meses.mes + INTERVAL '1 month'
           GROUP BY meses.mes
           ORDER BY meses.mes`,
        ),
      ]);

      const mesesEspanol = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
      ];

      return {
        grafico: {
          titulo: "Evolución de matrículas",
          items: grafico.rows.map((item) => {
            const month = Number(String(item.mes).slice(5, 7)) - 1;
            return {
              label: mesesEspanol[month] ?? String(item.mes),
              value: Number(item.value ?? 0),
            };
          }),
        },
        indicadores: [
          {
            label: "matrículas confirmadas",
            value: Number(metricas.rows[0]?.confirmadas ?? 0),
          },
          {
            label: "pendientes de pago",
            value: Number(metricas.rows[0]?.pendientes_pago ?? 0),
          },
        ],
      };
    }

    case "Calificaciones": {
      const [metricas, grafico] = await Promise.all([
        pool.query(
          `SELECT
             COALESCE(ROUND(AVG(nota), 1), 0)::NUMERIC AS promedio,
             CASE
               WHEN COUNT(*) = 0 THEN 0
               ELSE ROUND(
                 100.0 * COUNT(*) FILTER (WHERE nota >= 11) / COUNT(*)
               )::INTEGER
             END AS aprobacion
           FROM calificaciones`,
        ),
        pool.query(
          `WITH tramos(orden, label, minimo, maximo) AS (
             VALUES
               (1, '< 10', 0::NUMERIC, 10::NUMERIC),
               (2, '10-13', 10::NUMERIC, 14::NUMERIC),
               (3, '14-16', 14::NUMERIC, 17::NUMERIC),
               (4, '17-18', 17::NUMERIC, 19::NUMERIC),
               (5, '19-20', 19::NUMERIC, 21::NUMERIC)
           )
           SELECT
             t.label,
             COUNT(ca.nota)::INTEGER AS value
           FROM tramos t
           LEFT JOIN calificaciones ca
             ON ca.nota >= t.minimo
            AND ca.nota < t.maximo
           GROUP BY t.orden, t.label
           ORDER BY t.orden`,
        ),
      ]);

      return {
        grafico: {
          titulo: "Distribución de notas",
          items: grafico.rows.map((item) => ({
            label: String(item.label),
            value: Number(item.value ?? 0),
          })),
        },
        indicadores: [
          {
            label: "tasa de aprobación",
            value: Number(metricas.rows[0]?.aprobacion ?? 0),
            suffix: "%",
          },
          {
            label: "promedio general",
            value: Number(metricas.rows[0]?.promedio ?? 0),
            decimals: 1,
          },
        ],
      };
    }

    case "Certificados": {
      const [metricas, grafico] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*)::INTEGER AS total,
             COUNT(*) FILTER (
               WHERE NULLIF(TRIM(codigo_verificacion), '') IS NOT NULL
             )::INTEGER AS con_codigo
           FROM certificados`,
        ),
        pool.query(
          `SELECT
             COALESCE(NULLIF(TRIM(c.categoria), ''), 'Sin categoría') AS label,
             COUNT(cert.id)::INTEGER AS value
           FROM certificados cert
           INNER JOIN matriculas m ON m.id = cert.matricula_id
           INNER JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
           INNER JOIN cursos c ON c.id = oc.curso_id
           GROUP BY COALESCE(NULLIF(TRIM(c.categoria), ''), 'Sin categoría')
           ORDER BY COUNT(cert.id) DESC, label
           LIMIT 5`,
        ),
      ]);

      const total = Number(metricas.rows[0]?.total ?? 0);
      const conCodigo = Number(metricas.rows[0]?.con_codigo ?? 0);

      return {
        grafico: {
          titulo: "Certificados emitidos por especialidad",
          items: grafico.rows.map((item) => ({
            label: String(item.label),
            value: Number(item.value ?? 0),
          })),
        },
        indicadores: [
          { label: "certificados generados", value: total },
          {
            label: "con código de verificación",
            value: total ? Math.round((conCodigo / total) * 100) : 0,
            suffix: "%",
          },
        ],
      };
    }
  }
}

export async function obtenerReporte(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const adminId = await obtenerAdministradorId(req, res);
    if (!adminId) return;

    const categoriaParam = req.query.categoria ?? "Usuarios";
    if (!esCategoriaReporte(categoriaParam)) {
      return res.status(400).json({
        message: "La categoría de reporte no es válida.",
      });
    }

    const [datos, reportesRecientes] = await Promise.all([
      obtenerDatosCategoria(categoriaParam),
      obtenerReportesRecientes(),
    ]);

    return res.status(200).json({
      categoria: categoriaParam,
      ...datos,
      reportesRecientes,
    });
  } catch (error) {
    console.error("Error obteniendo reporte administrativo:", error);
    return res.status(500).json({
      message: "No se pudo cargar el reporte. Inténtalo nuevamente.",
    });
  }
}

function escaparCSV(value: unknown): string {
  let texto = "";

  if (value === null || value === undefined) {
    texto = "";
  } else if (value instanceof Date) {
    texto = value.toISOString();
  } else {
    texto = String(value);
  }

  return `"${texto.replace(/"/g, '""')}"`;
}

async function consultarFilasExportacion(categoria: CategoriaReporte) {
  switch (categoria) {
    case "Usuarios":
      return pool.query(
        `SELECT
           id AS "ID",
           CONCAT_WS(' ', nombres, apellidos) AS "Nombre completo",
           correo AS "Correo",
           usuario AS "Usuario",
           COALESCE(id_persona, dni, '') AS "Documento",
           rol AS "Rol",
           CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END AS "Estado",
           creado_en AS "Registrado el",
           ultimo_acceso_en AS "Último acceso"
         FROM usuarios
         ORDER BY creado_en DESC, id DESC`,
      );

    case "Cursos":
      return pool.query(
        `SELECT
           c.id AS "ID",
           c.codigo AS "Código",
           c.nombre AS "Curso",
           COALESCE(c.categoria, 'Sin categoría') AS "Categoría",
           c.modalidad AS "Modalidad",
           c.estado AS "Estado",
           COUNT(DISTINCT oc.id)::INTEGER AS "Ofertas",
           COUNT(DISTINCT m.id) FILTER (
             WHERE m.estado IN ('Activa', 'Completada')
           )::INTEGER AS "Matrículas vigentes"
         FROM cursos c
         LEFT JOIN ofertas_curso oc ON oc.curso_id = c.id
         LEFT JOIN matriculas m ON m.oferta_curso_id = oc.id
         GROUP BY c.id, c.codigo, c.nombre, c.categoria, c.modalidad, c.estado
         ORDER BY c.nombre`,
      );

    case "Matrículas":
      return pool.query(
        `SELECT
           m.id AS "ID de matrícula",
           CONCAT_WS(' ', u.nombres, u.apellidos) AS "Alumno",
           u.id AS "ID de alumno",
           c.codigo AS "Código de curso",
           c.nombre AS "Curso",
           oc.fecha_inicio AS "Fecha de inicio",
           oc.fecha_fin AS "Fecha final",
           m.estado AS "Estado",
           m.estado_pago AS "Estado de pago",
           m.matriculado_en AS "Fecha de matrícula"
         FROM matriculas m
         INNER JOIN usuarios u ON u.id = m.estudiante_id
         INNER JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
         INNER JOIN cursos c ON c.id = oc.curso_id
         ORDER BY m.matriculado_en DESC, m.id DESC`,
      );

    case "Calificaciones":
      return pool.query(
        `SELECT
           ca.id AS "ID de calificación",
           CONCAT_WS(' ', u.nombres, u.apellidos) AS "Alumno",
           c.codigo AS "Código de curso",
           c.nombre AS "Curso",
           comp.nombre AS "Componente",
           comp.tipo AS "Tipo",
           comp.porcentaje AS "Porcentaje",
           ca.nota AS "Nota sobre 20",
           ca.retroalimentacion AS "Retroalimentación",
           ca.calificado_en AS "Fecha de calificación"
         FROM calificaciones ca
         INNER JOIN matriculas m ON m.id = ca.matricula_id
         INNER JOIN usuarios u ON u.id = m.estudiante_id
         INNER JOIN componentes_calificacion comp ON comp.id = ca.componente_id
         INNER JOIN ofertas_curso oc ON oc.id = comp.oferta_curso_id
         INNER JOIN cursos c ON c.id = oc.curso_id
         ORDER BY ca.calificado_en DESC, ca.id DESC`,
      );

    case "Certificados":
      return pool.query(
        `SELECT
           cert.id AS "ID",
           cert.numero_certificado AS "Número de certificado",
           cert.codigo_verificacion AS "Código de verificación",
           cert.tipo AS "Tipo",
           CONCAT_WS(' ', u.nombres, u.apellidos) AS "Alumno",
           c.codigo AS "Código de curso",
           c.nombre AS "Curso",
           COALESCE(c.categoria, 'Sin categoría') AS "Categoría",
           cert.emitido_en AS "Emitido el"
         FROM certificados cert
         INNER JOIN matriculas m ON m.id = cert.matricula_id
         INNER JOIN usuarios u ON u.id = m.estudiante_id
         INNER JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
         INNER JOIN cursos c ON c.id = oc.curso_id
         ORDER BY cert.emitido_en DESC, cert.id DESC`,
      );
  }
}

export async function exportarReporte(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const adminId = await obtenerAdministradorId(req, res);
    if (!adminId) return;

    const categoriaParam = req.query.categoria;
    if (!esCategoriaReporte(categoriaParam)) {
      return res.status(400).json({
        message: "La categoría de reporte no es válida.",
      });
    }

    const result = await consultarFilasExportacion(categoriaParam);
    const headers = result.fields.map((field) => field.name);
    const contenido = [
      headers.map(escaparCSV).join(","),
      ...result.rows.map((row) =>
        headers.map((header) => escaparCSV(row[header])).join(","),
      ),
    ].join("\r\n");

    await pool.query(
      `INSERT INTO historial_administrativo
         (usuario_id, accion, area, tipo_entidad, entidad_id, resultado, detalles)
       VALUES ($1, $2, 'Reportes', 'Reporte', $3, 'Completo', $4)`,
      [
        adminId,
        `Exportó reporte de ${categoriaParam}`,
        categoriaParam,
        `Se exportó el reporte de ${categoriaParam} en formato CSV con ${result.rowCount ?? 0} registros.`,
      ],
    );

    const nombreArchivo = `reporte-${categoriaParam
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`,
    );
    res.setHeader("Cache-Control", "no-store");

    // El BOM facilita que Excel detecte correctamente los acentos.
    return res.status(200).send(`\uFEFF${contenido}\r\n`);
  } catch (error) {
    console.error("Error exportando reporte administrativo:", error);
    return res.status(500).json({
      message: "No se pudo exportar el reporte.",
    });
  }
}

export async function obtenerHistorialReportes(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const adminId = await obtenerAdministradorId(req, res);
    if (!adminId) return;

    const accion = typeof req.query.accion === "string" && req.query.accion.trim()
      ? req.query.accion.trim()
      : "Todas";
    const area = typeof req.query.area === "string" && req.query.area.trim()
      ? req.query.area.trim()
      : "Todas";
    const fecha = typeof req.query.fecha === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(req.query.fecha)
      ? req.query.fecha
      : "";

    // La normalización ignora mayúsculas/minúsculas y diferencias de acentuación.
    // Las opciones de los select se consultan desde los valores reales de la tabla.
    const [result, accionesResult, areasResult] = await Promise.all([
      pool.query(
        `SELECT
           ha.id,
           TO_CHAR(ha.creado_en, 'HH24:MI') AS hora,
           TO_CHAR(ha.creado_en, 'YYYY-MM-DD') AS fecha,
           ha.accion AS accion,
           ha.area AS area,
           COALESCE(
             NULLIF(TRIM(CONCAT_WS(' ', u.nombres, u.apellidos)), ''),
             'Usuario eliminado'
           ) AS usuario,
           ha.resultado AS resultado
         FROM historial_administrativo ha
         LEFT JOIN usuarios u ON u.id = ha.usuario_id
         WHERE
           (
             $1 = 'Todas'
             OR TRANSLATE(LOWER(TRIM(ha.accion)), 'áéíóúüñ', 'aeiouun')
                = TRANSLATE(LOWER(TRIM($1)), 'áéíóúüñ', 'aeiouun')
           )
           AND (
             $2 = 'Todas'
             OR TRANSLATE(LOWER(TRIM(ha.area)), 'áéíóúüñ', 'aeiouun')
                = TRANSLATE(LOWER(TRIM($2)), 'áéíóúüñ', 'aeiouun')
           )
           AND ($3 = '' OR TO_CHAR(ha.creado_en, 'YYYY-MM-DD') = $3)
         ORDER BY ha.creado_en DESC, ha.id DESC
         LIMIT 500`,
        [accion, area, fecha],
      ),
      pool.query<{ accion: string }>(
        `SELECT MIN(TRIM(accion)) AS accion
         FROM historial_administrativo
         WHERE NULLIF(TRIM(accion), '') IS NOT NULL
         GROUP BY TRANSLATE(LOWER(TRIM(accion)), 'áéíóúüñ', 'aeiouun')
         ORDER BY MIN(TRIM(accion)) ASC`,
      ),
      pool.query<{ area: string }>(
        `SELECT MIN(TRIM(area)) AS area
         FROM historial_administrativo
         WHERE NULLIF(TRIM(area), '') IS NOT NULL
         GROUP BY TRANSLATE(LOWER(TRIM(area)), 'áéíóúüñ', 'aeiouun')
         ORDER BY MIN(TRIM(area)) ASC`,
      ),
    ]);

    return res.status(200).json({
      historial: result.rows,
      filtros: {
        acciones: accionesResult.rows.map((row) => row.accion),
        areas: areasResult.rows.map((row) => row.area),
      },
    });
  } catch (error) {
    console.error("Error consultando historial administrativo:", error);
    return res.status(500).json({
      message: "No se pudo cargar el historial administrativo.",
    });
  }
}
