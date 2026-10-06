import type { Response } from "express";
import type { PoolClient } from "pg";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

class ForumError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function id(value: unknown): string {
  if ((typeof value !== "string" && typeof value !== "number") || !/^\d+$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw new ForumError(400, "Identificador no válido.");
  return String(value);
}

async function usuario(req: AuthenticatedRequest) {
  if (!req.userId) throw new ForumError(401, "Debes iniciar sesión.");
  const result = await pool.query(
    "SELECT id, rol, CONCAT_WS(' ', nombres, apellidos) AS nombre FROM usuarios WHERE id = $1 AND activo = TRUE", [id(req.userId)]
  );
  if (!result.rowCount) throw new ForumError(401, "Sesión no válida.");
  if (!["Docente", "Estudiante"].includes(result.rows[0].rol)) throw new ForumError(403, "No tienes acceso a los foros.");
  return result.rows[0] as { id: string; rol: string; nombre: string };
}

const accesoOferta = `(($2 = 'Docente' AND oc.docente_id = $1) OR
  ($2 = 'Estudiante' AND oc.publicado = TRUE AND oc.estado IN ('Programado', 'En curso', 'Finalizado')
   AND EXISTS (SELECT 1 FROM matriculas m WHERE m.oferta_curso_id = oc.id
     AND m.estudiante_id = $1 AND m.estado IN ('Activa', 'Completada'))))`;

function fallo(res: Response, error: unknown) {
  if (error instanceof ForumError) return res.status(error.status).json({ message: error.message });
  console.error("Error en foros:", error);
  return res.status(500).json({ message: "No se pudo procesar la solicitud del foro." });
}

function valores(body: Record<string, unknown> | undefined, creando: boolean) {
  const titulo = typeof body?.titulo === "string" ? body.titulo.trim() : "";
  const descripcion = typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const estado = body?.estado;
  const estados = creando ? ["Borrador", "Publicado"] : ["Borrador", "Publicado", "Cerrado", "Oculto"];
  if (!titulo || titulo.length > 200 || !descripcion || descripcion.length > 10000 ||
      typeof estado !== "string" || !estados.includes(estado) ||
      typeof body?.permitir_respuestas_estudiantes !== "boolean" ||
      typeof body?.mostrar_respuestas_despues_participar !== "boolean") {
    throw new ForumError(400, "Revisa título, descripción, estado y opciones de participación.");
  }
  let cierre: string | null = null;
  const fecha = body.fecha_cierre;
  if (fecha !== undefined && fecha !== null && fecha !== "") {
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new ForumError(400, "Fecha de cierre no válida.");
    const date = new Date(`${fecha}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== fecha) throw new ForumError(400, "Fecha de cierre no válida.");
    cierre = `${fecha}T23:59:59-05:00`;
    if (creando && new Date(cierre).getTime() <= Date.now()) throw new ForumError(400, "La fecha de cierre debe ser futura.");
  }
  return [titulo, descripcion, estado, body.permitir_respuestas_estudiantes, body.mostrar_respuestas_despues_participar, cierre];
}

export async function obtenerOfertasDocente(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await usuario(req);
    if (user.rol !== "Docente") throw new ForumError(403, "Solo los docentes pueden acceder.");
    const result = await pool.query(
      `SELECT oc.id AS oferta_curso_id, c.id AS curso_id, c.codigo, c.nombre, oc.estado, oc.publicado
       FROM ofertas_curso oc JOIN cursos c ON c.id = oc.curso_id WHERE oc.docente_id = $1
       AND oc.estado <> 'Cancelado' AND c.estado = 'Activo' ORDER BY c.nombre, oc.id`, [user.id]
    );
    return res.json({ ofertas: result.rows });
  } catch (error) { return fallo(res, error); }
}

export async function obtenerContextoForos(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await usuario(req);
    const cursoId = id(req.params.cursoId);
    const result = await pool.query(
      `SELECT oc.id AS oferta_curso_id, oc.estado, c.id AS curso_id, c.nombre, c.imagen_portada AS imagen,
       c.codigo FROM ofertas_curso oc JOIN cursos c ON c.id = oc.curso_id
       WHERE ${accesoOferta} AND c.id = $3 AND c.estado = 'Activo' AND oc.estado <> 'Cancelado'
       ORDER BY oc.id`, [user.id, user.rol, cursoId]
    );
    if (!result.rowCount) throw new ForumError(403, "No tienes acceso a este curso.");
    const first = result.rows[0];
    return res.json({ usuario: user, curso: { id: first.curso_id, nombre: first.nombre, imagen: first.imagen, codigo: first.codigo },
      ofertas: result.rows.map(row => ({ oferta_curso_id: row.oferta_curso_id, estado: row.estado })) });
  } catch (error) { return fallo(res, error); }
}

export async function obtenerForosDocente(req: AuthenticatedRequest, res: Response) { return listar(req, res, true); }
export async function obtenerForos(req: AuthenticatedRequest, res: Response) { return listar(req, res, false); }

async function listar(req: AuthenticatedRequest, res: Response, soloDocente: boolean) {
  try {
    const user = await usuario(req);
    if (soloDocente && user.rol !== "Docente") throw new ForumError(403, "Solo los docentes pueden acceder.");
    const ofertaId = id(req.params.ofertaId);
    const access = await pool.query(`SELECT oc.id FROM ofertas_curso oc JOIN cursos c ON c.id = oc.curso_id
      WHERE ${accesoOferta} AND oc.id = $3 AND c.estado = 'Activo' AND oc.estado <> 'Cancelado'`, [user.id, user.rol, ofertaId]);
    if (!access.rowCount) throw new ForumError(403, "No tienes acceso a esta oferta.");
    const result = await pool.query(
      `SELECT f.*, CONCAT_WS(' ', u.nombres, u.apellidos) AS autor_nombre,
       CASE WHEN f.estado = 'Publicado' AND f.fecha_cierre <= CURRENT_TIMESTAMP THEN 'Cerrado' ELSE f.estado END AS estado,
       (SELECT COUNT(*)::integer FROM respuestas_foro r WHERE r.foro_id = f.id) AS respuestas_total,
       EXISTS (SELECT 1 FROM respuestas_foro r WHERE r.foro_id = f.id AND r.autor_id = $1) AS participo
       FROM foros f JOIN usuarios u ON u.id = f.autor_id JOIN ofertas_curso oc ON oc.id = f.oferta_curso_id
       WHERE ${accesoOferta} AND oc.id = $3 AND ($2 = 'Docente' OR f.estado IN ('Publicado', 'Cerrado'))
       ORDER BY f.creado_en DESC, f.id DESC`, [user.id, user.rol, ofertaId]
    );
    return res.json({ foros: result.rows });
  } catch (error) { return fallo(res, error); }
}

export async function crearForo(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await usuario(req);
    if (user.rol !== "Docente") throw new ForumError(403, "Solo los docentes pueden crear foros.");
    const ofertaId = id(req.body?.oferta_curso_id);
    const fields = valores(req.body, true);
    const result = await pool.query(
      `INSERT INTO foros (oferta_curso_id, autor_id, titulo, descripcion, estado,
       permitir_respuestas_estudiantes, mostrar_respuestas_despues_participar, fecha_cierre)
       SELECT oc.id, $2, $3, $4, $5, $6, $7, $8 FROM ofertas_curso oc JOIN cursos c ON c.id = oc.curso_id
       WHERE oc.id = $1 AND oc.docente_id = $2 AND oc.publicado = TRUE
       AND oc.estado IN ('Programado', 'En curso') AND c.estado = 'Activo' RETURNING *`, [ofertaId, user.id, ...fields]
    );
    if (!result.rowCount) throw new ForumError(403, "No puedes crear foros en esa oferta.");
    return res.status(201).json({ foro: result.rows[0] });
  } catch (error) { return fallo(res, error); }
}

async function foroAccesible(client: PoolClient, user: { id: string; rol: string }, foroId: string, cursoId: string, lock = false) {
  const result = await client.query(
    `SELECT f.*, oc.curso_id, oc.estado AS estado_oferta,
     (f.fecha_cierre IS NOT NULL AND f.fecha_cierre <= CURRENT_TIMESTAMP) AS vencido
     FROM foros f JOIN ofertas_curso oc ON oc.id = f.oferta_curso_id JOIN cursos c ON c.id = oc.curso_id
     WHERE ${accesoOferta} AND f.id = $3 AND c.id = $4 AND c.estado = 'Activo' AND oc.estado <> 'Cancelado'
     AND ($2 = 'Docente' OR f.estado IN ('Publicado', 'Cerrado')) ${lock ? 'FOR UPDATE OF f, oc' : ''}`,
    [user.id, user.rol, foroId, cursoId]
  );
  if (!result.rowCount) throw new ForumError(404, "Foro no disponible.");
  return result.rows[0];
}

export async function obtenerDetalleForo(req: AuthenticatedRequest, res: Response) {
  let client: PoolClient | undefined;
  try {
    const user = await usuario(req);
    const foroId = id(req.params.foroId);
    const cursoId = id(req.query.cursoId);
    client = await pool.connect();
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const foro = await foroAccesible(client, user, foroId, cursoId);
    const participation = await client.query("SELECT 1 FROM respuestas_foro WHERE foro_id = $1 AND autor_id = $2 LIMIT 1", [foroId, user.id]);
    const visible = user.rol === "Docente" || !foro.mostrar_respuestas_despues_participar || Boolean(participation.rowCount);
    const respuestas = visible ? await client.query(
      `SELECT r.*, CONCAT_WS(' ', u.nombres, u.apellidos) AS autor_nombre
       FROM respuestas_foro r JOIN usuarios u ON u.id = r.autor_id WHERE r.foro_id = $1 ORDER BY r.creado_en, r.id`, [foroId]
    ) : { rows: [] };
    await client.query("COMMIT");
    const abierto = foro.estado === "Publicado" && !foro.vencido && ["Programado", "En curso"].includes(foro.estado_oferta);
    return res.json({ foro: { ...foro, estado: foro.estado === "Publicado" && foro.vencido ? "Cerrado" : foro.estado },
      respuestas: respuestas.rows, usuario: user, respuestas_visibles: visible,
      puede_responder: abierto && (user.rol === "Docente" || foro.permitir_respuestas_estudiantes) });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return fallo(res, error);
  } finally { client?.release(); }
}

export async function responderForo(req: AuthenticatedRequest, res: Response) {
  let client: PoolClient | undefined;
  try {
    const user = await usuario(req);
    const foroId = id(req.params.foroId);
    const cursoId = id(req.body?.curso_id);
    const contenido = typeof req.body?.contenido === "string" ? req.body.contenido.trim() : "";
    if (!contenido || contenido.length > 10000) throw new ForumError(400, "Escribe una respuesta de hasta 10000 caracteres.");
    const padre = req.body?.respuesta_padre_id == null ? null : id(req.body.respuesta_padre_id);
    client = await pool.connect();
    await client.query("BEGIN");
    const foro = await foroAccesible(client, user, foroId, cursoId, true);
    if (foro.estado !== "Publicado" || foro.vencido || !["Programado", "En curso"].includes(foro.estado_oferta) ||
        (user.rol === "Estudiante" && !foro.permitir_respuestas_estudiantes)) throw new ForumError(403, "Este foro no admite nuevas respuestas.");
    if (padre) {
      if (user.rol === "Estudiante" && foro.mostrar_respuestas_despues_participar) {
        const participo = await client.query("SELECT 1 FROM respuestas_foro WHERE foro_id = $1 AND autor_id = $2 LIMIT 1", [foroId, user.id]);
        if (!participo.rowCount) throw new ForumError(403, "Participa primero para responder a otros usuarios.");
      }
      const parent = await client.query("SELECT id FROM respuestas_foro WHERE id = $1 AND foro_id = $2", [padre, foroId]);
      if (!parent.rowCount) throw new ForumError(400, "La participación no pertenece a este foro.");
    }
    const result = await client.query(
      `INSERT INTO respuestas_foro (foro_id, autor_id, respuesta_padre_id, contenido) VALUES ($1, $2, $3, $4) RETURNING id`,
      [foroId, user.id, padre, contenido]
    );
    await client.query("COMMIT");
    return res.status(201).json({ respuesta: result.rows[0] });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return fallo(res, error);
  } finally { client?.release(); }
}

export async function editarForo(req: AuthenticatedRequest, res: Response) {
  let client: PoolClient | undefined;
  try {
    const user = await usuario(req);
    if (user.rol !== "Docente") throw new ForumError(403, "Solo el docente asignado puede editar.");
    const foroId = id(req.params.foroId);
    const cursoId = id(req.body?.curso_id);
    const fields = valores(req.body, false);
    client = await pool.connect();
    await client.query("BEGIN");
    const foro = await foroAccesible(client, user, foroId, cursoId, true);
    if (fields[5] && new Date(String(fields[5])).getTime() <= new Date(foro.creado_en).getTime()) throw new ForumError(400, "El cierre debe ser posterior a la creación del foro.");
    const result = await client.query(
      `UPDATE foros SET titulo = $2, descripcion = $3, estado = $4, permitir_respuestas_estudiantes = $5,
       mostrar_respuestas_despues_participar = $6, fecha_cierre = $7, actualizado_en = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [foroId, ...fields]
    );
    await client.query("COMMIT");
    return res.json({ foro: result.rows[0] });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return fallo(res, error);
  } finally { client?.release(); }
}

export async function eliminarForo(req: AuthenticatedRequest, res: Response) {
  let client: PoolClient | undefined;
  try {
    const user = await usuario(req);
    if (user.rol !== "Docente") throw new ForumError(403, "Solo el docente asignado puede eliminar.");
    const foroId = id(req.params.foroId);
    const cursoId = id(req.query.cursoId);
    client = await pool.connect();
    await client.query("BEGIN");
    await foroAccesible(client, user, foroId, cursoId, true);
    await client.query("DELETE FROM foros WHERE id = $1", [foroId]);
    await client.query("COMMIT");
    return res.status(204).end();
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return fallo(res, error);
  } finally { client?.release(); }
}
