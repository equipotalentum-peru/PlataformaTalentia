import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { PoolClient } from "pg";
import pool from "../config/database";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  deleteObjectFromR2,
  getObjectFromR2,
  isR2Path,
  slugifyFileName,
  stripR2Prefix,
  streamBodyToResponse,
  uploadBufferToR2,
} from "../services/r2.service";

const MAX_PORTADA_BYTES = 5 * 1024 * 1024;
const MIME_PORTADAS = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ComponenteCalificacionEntrada = {
  nombre: string;
  porcentaje: number | null;
  tipo: "actividad" | "evaluacion" | "proyecto" | "participacion" | "otro";
};

type DatosCrearCurso = {
  nombreCurso?: unknown;
  codigo?: unknown;
  categoria?: unknown;
  modalidad?: unknown;
  descripcion?: unknown;
  cupos?: unknown;
  periodoId?: unknown;
  docenteId?: unknown;
  componentes?: unknown;
  publicar?: unknown;
};


type ComponenteParaEditar = {
  id: string | null;
  nombre: string;
  porcentaje: number | null;
  tipo: ComponenteCalificacionEntrada["tipo"];
};

type ErrorHttp = Error & {
  statusCode?: number;
};

function errorHttp(mensaje: string, statusCode: number): ErrorHttp {
  const error = new Error(mensaje) as ErrorHttp;
  error.statusCode = statusCode;
  return error;
}

function esAdministradorActivo(rol: unknown, activo: unknown) {
  return rol === "Administrador" && activo === true;
}

async function comprobarAdministrador(
  req: AuthenticatedRequest,
  res: Response
): Promise<number | null> {
  const usuarioId = Number(req.userId);

  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    res.status(401).json({ message: "La sesión no es válida." });
    return null;
  }

  const resultado = await pool.query<{ rol: string; activo: boolean }>(
    "SELECT rol, activo FROM usuarios WHERE id = $1 LIMIT 1",
    [usuarioId]
  );

  if (!resultado.rowCount || !resultado.rows[0].activo) {
    res.status(401).json({ message: "El usuario no existe o está inactivo." });
    return null;
  }

  if (!esAdministradorActivo(resultado.rows[0].rol, resultado.rows[0].activo)) {
    res.status(403).json({ message: "Esta operación es exclusiva para administradores." });
    return null;
  }

  return usuarioId;
}

function tieneFirmaDeImagen(mime: string, buffer: Buffer) {
  if (mime === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mime === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }

  if (mime === "image/webp") {
    return buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }

  return false;
}

const multerPortada = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PORTADA_BYTES, files: 1, fields: 1, parts: 2 },
  fileFilter: (_req, file, callback) => {
    if (!MIME_PORTADAS.has(file.mimetype)) {
      callback(new Error("Selecciona una imagen JPG, PNG o WebP de hasta 5 MB."));
      return;
    }
    callback(null, true);
  },
}).single("imagenPortada");

export function recibirImagenPortada(req: Request, res: Response, next: NextFunction) {
  multerPortada(req, res, (error: unknown) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "La imagen no debe superar los 5 MB."
          : error instanceof Error
            ? error.message
            : "No se pudo recibir la imagen.";

      res.status(400).json({ message });
      return;
    }

    if (req.file && !tieneFirmaDeImagen(req.file.mimetype, req.file.buffer)) {
      res.status(400).json({ message: "El archivo no parece ser una imagen válida." });
      return;
    }

    next();
  });
}

function inferirTipoComponente(nombre: string): ComponenteCalificacionEntrada["tipo"] {
  const normalizado = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (normalizado.includes("proyecto")) return "proyecto";
  if (normalizado.includes("participacion")) return "participacion";
  if (/actividad|practica|tarea/.test(normalizado)) return "actividad";
  if (/examen|evaluacion|cuestionario|quiz|prueba/.test(normalizado)) return "evaluacion";
  return "otro";
}

function leerComponentes(valor: unknown): ComponenteCalificacionEntrada[] {
  if (!Array.isArray(valor)) {
    throw new Error("La configuración de evaluaciones no es válida.");
  }

  const componentes: ComponenteCalificacionEntrada[] = [];

  for (const item of valor) {
    if (!item || typeof item !== "object") {
      throw new Error("Hay una evaluación con datos no válidos.");
    }

    const fila = item as { nombre?: unknown; porcentaje?: unknown };
    const nombre = typeof fila.nombre === "string" ? fila.nombre.trim() : "";
    const rawPorcentaje = fila.porcentaje == null ? "" : String(fila.porcentaje).replace(/%/g, "").trim();

    // Las filas vacías del formulario se ignoran; una fila parcialmente completada no.
    if (!nombre && !rawPorcentaje) continue;
    if (!nombre) throw new Error("Completa el nombre de cada evaluación que tenga porcentaje.");
    if (nombre.length > 200) throw new Error("Cada evaluación admite un máximo de 200 caracteres.");

    let porcentaje: number | null = null;
    if (rawPorcentaje !== "") {
      porcentaje = Number(rawPorcentaje);
      if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        throw new Error(`El porcentaje de «${nombre}» debe estar entre 0 y 100.`);
      }
    }

    componentes.push({ nombre, porcentaje, tipo: inferirTipoComponente(nombre) });
  }

  return componentes;
}

function parseDatos(req: AuthenticatedRequest): DatosCrearCurso {
  const raw = req.body?.datos;
  if (typeof raw !== "string") {
    throw new Error("No se recibieron los datos del curso.");
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Formato incorrecto.");
    }
    return parsed as DatosCrearCurso;
  } catch {
    throw new Error("Los datos del curso no tienen un formato JSON válido.");
  }
}

function leerComponentesParaEditar(
  valor: unknown
): ComponenteParaEditar[] {
  if (!Array.isArray(valor)) {
    throw errorHttp("La configuración de evaluaciones no es válida.", 400);
  }

  const componentes: ComponenteParaEditar[] = [];
  const idsExistentes = new Set<string>();

  for (const elemento of valor) {
    if (!elemento || typeof elemento !== "object") {
      throw errorHttp("Hay un componente con datos no válidos.", 400);
    }

    const fila = elemento as {
      id?: unknown;
      nombre?: unknown;
      porcentaje?: unknown;
    };

    const nombre =
      typeof fila.nombre === "string" ? fila.nombre.trim() : "";

    const porcentajeTexto =
      fila.porcentaje == null
        ? ""
        : String(fila.porcentaje).replace(/%/g, "").trim();

    if (!nombre && !porcentajeTexto) continue;

    if (!nombre) {
      throw errorHttp("Completa el nombre de cada componente.", 400);
    }

    if (nombre.length > 200) {
      throw errorHttp(
        "Cada componente admite hasta 200 caracteres.",
        400
      );
    }

    let porcentaje: number | null = null;

    if (porcentajeTexto !== "") {
      porcentaje = Number(porcentajeTexto);

      if (
        !Number.isFinite(porcentaje) ||
        porcentaje < 0 ||
        porcentaje > 100
      ) {
        throw errorHttp(
          `El porcentaje de «${nombre}» debe estar entre 0 y 100.`,
          400
        );
      }
    }

    let id: string | null = null;

    if (typeof fila.id === "string" && fila.id.startsWith("db-")) {
      const idNumerico = fila.id.slice(3);

      if (!/^[1-9]\d*$/.test(idNumerico)) {
        throw errorHttp("Se recibió un ID de componente no válido.", 400);
      }

      id = idNumerico;

      if (idsExistentes.has(id)) {
        throw errorHttp("Hay un componente duplicado en el formulario.", 400);
      }

      idsExistentes.add(id);
    }

    componentes.push({
      id,
      nombre,
      porcentaje,
      tipo: inferirTipoComponente(nombre),
    });
  }

  return componentes;
}

export async function listarCursosAdministrador(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const resultado = await pool.query(
      `SELECT
         c.id::TEXT AS id,
         c.nombre,
         c.codigo,
         c.estado,
         COALESCE(oc.cupo_maximo, 0)::INTEGER AS cupos,
         COALESCE((
           SELECT COUNT(*)::INTEGER
           FROM matriculas m
           WHERE m.oferta_curso_id = oc.id
             AND m.estado IN ('Activa', 'Completada')
         ), 0) AS matriculados,
         COALESCE(
           NULLIF(BTRIM(CONCAT_WS(' ', NULLIF(u.nombres, ''), NULLIF(u.apellidos, ''))), ''),
           'Sin asignar'
         ) AS docente
       FROM cursos c
       LEFT JOIN LATERAL (
         SELECT id, docente_id, cupo_maximo, actualizado_en
         FROM ofertas_curso
         WHERE curso_id = c.id
         ORDER BY actualizado_en DESC, id DESC
         LIMIT 1
       ) oc ON TRUE
       LEFT JOIN usuarios u ON u.id = oc.docente_id
       ORDER BY c.creado_en DESC, c.id DESC`
    );

    return res.status(200).json({ cursos: resultado.rows });
  } catch (error) {
    console.error("Error listando cursos del administrador:", error);
    return res.status(500).json({ message: "No se pudieron cargar los cursos." });
  }
}

export async function listarDocentesAdministrador(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const resultado = await pool.query(
      `SELECT
         u.id::TEXT AS id,
         BTRIM(CONCAT_WS(' ', u.nombres, u.apellidos)) AS nombre,
         COALESCE(u.especialidad, 'Sin especificar') AS especialidad,
         COALESCE(u.disponibilidad, 'No especificada') AS disponibilidad,
         COUNT(DISTINCT oc.id) FILTER (WHERE oc.estado <> 'Cancelado')::INTEGER AS carga
       FROM usuarios u
       LEFT JOIN ofertas_curso oc ON oc.docente_id = u.id
       WHERE u.rol = 'Docente'
         AND u.activo = TRUE
       GROUP BY u.id
       ORDER BY u.nombres, u.apellidos`
    );

    return res.status(200).json({ docentes: resultado.rows });
  } catch (error) {
    console.error("Error listando docentes:", error);
    return res.status(500).json({ message: "No se pudieron cargar los docentes." });
  }
}

export async function crearCursoAdministrador(
  req: AuthenticatedRequest,
  res: Response
) {
  let adminId: number | null = null;
  let archivoR2Key: string | null = null;
  let client: PoolClient | null = null;
  let transaccionAbierta = false;

  try {
    adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    let datos: DatosCrearCurso;
    try {
      datos = parseDatos(req);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Los datos del curso no son válidos.",
      });
    }

    const nombre = typeof datos.nombreCurso === "string" ? datos.nombreCurso.trim() : "";
    const codigo = typeof datos.codigo === "string" ? datos.codigo.trim().toUpperCase() : "";
    const categoria = typeof datos.categoria === "string" ? datos.categoria.trim() : "";
    const modalidad = typeof datos.modalidad === "string" ? datos.modalidad : "";
    const descripcion = typeof datos.descripcion === "string" ? datos.descripcion.trim() : "";
    const cupos = Number(datos.cupos);
    const publicar = datos.publicar === true;
    const docenteId = datos.docenteId == null || datos.docenteId === "" ? null : Number(datos.docenteId);
    const periodoId = datos.periodoId == null || datos.periodoId === "" ? null : Number(datos.periodoId);

    if (periodoId !== null && (!Number.isSafeInteger(periodoId) || periodoId <= 0)) {
      return res.status(400).json({
        message: "El periodo académico seleccionado no es válido.",
      });
    }

    if (publicar && periodoId === null) {
      return res.status(400).json({
        message: "Asigna un periodo académico antes de publicar el curso.",
      });
    }

    if (!nombre || nombre.length > 200) {
      return res.status(400).json({ message: "El nombre del curso es obligatorio y admite hasta 200 caracteres." });
    }
    if (!codigo || codigo.length > 50) {
      return res.status(400).json({ message: "El código del curso es obligatorio y admite hasta 50 caracteres." });
    }
    if (!categoria || categoria.length > 120) {
      return res.status(400).json({ message: "Selecciona una categoría válida." });
    }
    if (!["Virtual", "Presencial", "Hibrido"].includes(modalidad)) {
      return res.status(400).json({ message: "Selecciona una modalidad válida." });
    }
    if (!descripcion) {
      return res.status(400).json({ message: "La descripción del curso es obligatoria." });
    }
    if (!Number.isSafeInteger(cupos) || cupos <= 0) {
      return res.status(400).json({ message: "Los cupos deben ser un número entero mayor que cero." });
    }
    if (docenteId !== null && (!Number.isSafeInteger(docenteId) || docenteId <= 0)) {
      return res.status(400).json({ message: "El docente seleccionado no es válido." });
    }

    let componentes: ComponenteCalificacionEntrada[];
    try {
      componentes = leerComponentes(datos.componentes);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "La configuración de evaluaciones no es válida.",
      });
    }

    if (publicar) {
      if (componentes.length === 0) {
        return res.status(400).json({ message: "Agrega al menos un componente de calificación antes de publicar." });
      }
      if (componentes.some((item) => item.porcentaje === null)) {
        return res.status(400).json({ message: "Todas las evaluaciones deben tener un porcentaje para publicar." });
      }
      const total = componentes.reduce((suma, item) => suma + (item.porcentaje ?? 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({ message: `Los porcentajes deben sumar 100 %. Actualmente suman ${total} %.` });
      }
      if (docenteId === null) {
        return res.status(400).json({ message: "Asigna un docente antes de publicar el curso." });
      }
    }

    if (docenteId !== null) {
      const docente = await pool.query(
        `SELECT id FROM usuarios
         WHERE id = $1 AND rol = 'Docente' AND activo = TRUE
         LIMIT 1`,
        [docenteId]
      );
      if (!docente.rowCount) {
        return res.status(400).json({ message: "El docente seleccionado no existe, está inactivo o no tiene el rol Docente." });
      }
    }

    let imagenPortada: string | null = null;
    const file = req.file;

    if (file) {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeName = slugifyFileName(path.basename(file.originalname));
      archivoR2Key = `courses/covers/${randomUUID()}-${safeName || `portada${extension}`}`;
      imagenPortada = await uploadBufferToR2({
        buffer: file.buffer,
        key: archivoR2Key,
        contentType: file.mimetype,
        contentLength: file.size,
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transaccionAbierta = true;

    if (periodoId !== null) {
      const periodoResult = await client.query(
        `SELECT id
        FROM periodos_academicos
        WHERE id = $1
          AND activo = TRUE
        FOR SHARE`,
        [periodoId]
      );

      if (!periodoResult.rowCount) {
        throw errorHttp(
          "El periodo seleccionado no existe o está inactivo.",
          400
        );
      }
    }

    const cursoResult = await client.query<{
      id: string;
      nombre: string;
      codigo: string;
      estado: string;
      imagen_portada: string | null;
    }>(
      `INSERT INTO cursos (
         nombre, codigo, categoria, modalidad, descripcion,
         imagen_portada, estado, creado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id::TEXT AS id, nombre, codigo, estado, imagen_portada`,
      [nombre, codigo, categoria, modalidad, descripcion, imagenPortada, publicar ? "Activo" : "Borrador", adminId]
    );

    const curso = cursoResult.rows[0];

    const ofertaResult = await client.query<{ id: string }>(
      `INSERT INTO ofertas_curso (
        curso_id,
        periodo_id,
        cupo_maximo,
        docente_id,
        estado,
        publicado
      ) VALUES ($1, $2, $3, $4, 'Programado', $5)
      RETURNING id::TEXT AS id`,
      [curso.id, periodoId, cupos, docenteId, publicar]
    );

    const ofertaCursoId = ofertaResult.rows[0].id;

    for (const componente of componentes) {
      await client.query(
        `INSERT INTO componentes_calificacion (
           oferta_curso_id, nombre, tipo, porcentaje, puntaje_maximo
         ) VALUES ($1, $2, $3, $4, $5)`,
        [ofertaCursoId, componente.nombre, componente.tipo, componente.porcentaje, 20]
      );
    }

    await client.query("COMMIT");
    transaccionAbierta = false;

    return res.status(201).json({
      message: publicar ? "El curso se creó y publicó correctamente." : "El curso se guardó como borrador correctamente.",
      curso: { ...curso, ofertaCursoId, cupos, docenteId, componentes: componentes.length },
    });
  } catch (error) {
    if (client && transaccionAbierta) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    if (archivoR2Key) {
      await deleteObjectFromR2(archivoR2Key).catch((cleanupError) => {
        console.error("No se pudo eliminar una portada de R2 tras fallar el registro:", cleanupError);
      });
    }

    const codigoHttp = (error as ErrorHttp).statusCode;

    if (codigoHttp) {
      return res.status(codigoHttp).json({
        message: (error as Error).message,
      });
    }

    const pgError = error as { code?: string };
    if (pgError?.code === "23505") {
      return res.status(409).json({ message: "Ya existe un curso con ese código. Usa otro código." });
    }

    console.error("Error creando curso del administrador:", error);
    return res.status(500).json({
      message: error instanceof Error && error.message.includes("Cloudflare R2")
        ? error.message
        : "No se pudo guardar el curso. Revisa la configuración y vuelve a intentarlo.",
    });
  } finally {
    client?.release();
  }
}

export async function obtenerPortadaCurso(
  req: AuthenticatedRequest,
  res: Response
) {
  const cursoId = Number(req.params.cursoId);
  const usuarioId = Number(req.userId);

  if (!Number.isSafeInteger(cursoId) || cursoId <= 0 || !Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ message: "La solicitud no es válida." });
  }

  try {
    const acceso = await pool.query<{ imagen_portada: string | null }>(
      `SELECT c.imagen_portada
       FROM cursos c
       JOIN usuarios u ON u.id = $2 AND u.activo = TRUE
       WHERE c.id = $1
         AND (
           u.rol = 'Administrador'
           OR (
             c.estado = 'Activo'
             AND u.rol = 'Docente'
             AND EXISTS (
               SELECT 1 FROM ofertas_curso oc
               WHERE oc.curso_id = c.id
                 AND oc.docente_id = u.id
                 AND oc.publicado = TRUE
                 AND oc.estado <> 'Cancelado'
             )
           )
           OR (
             c.estado = 'Activo'
             AND u.rol = 'Estudiante'
             AND EXISTS (
               SELECT 1
               FROM matriculas m
               JOIN ofertas_curso oc ON oc.id = m.oferta_curso_id
               WHERE oc.curso_id = c.id
                 AND m.estudiante_id = u.id
                 AND m.estado IN ('Activa', 'Completada')
                 AND oc.publicado = TRUE
             )
           )
         )
       LIMIT 1`,
      [cursoId, usuarioId]
    );

    const imagen = acceso.rows[0]?.imagen_portada;
    if (!imagen) return res.status(404).end();

    if (/^https?:\/\//i.test(imagen)) {
      return res.redirect(302, imagen);
    }

    if (!isR2Path(imagen)) {
      return res.status(404).end();
    }

    const objeto = await getObjectFromR2(stripR2Prefix(imagen));
    if (!objeto.Body) return res.status(404).end();

    const mimePermitidos = new Set(["image/jpeg", "image/png", "image/webp"]);
    const contentType = objeto.ContentType && mimePermitidos.has(objeto.ContentType)
      ? objeto.ContentType
      : "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");
    if (objeto.ContentLength !== undefined) {
      res.setHeader("Content-Length", objeto.ContentLength);
    }

    streamBodyToResponse(objeto.Body, res);
    return;
  } catch (error) {
    console.error("Error obteniendo portada del curso:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "No se pudo cargar la portada del curso." });
    }
    return res.end();
  }
}

export async function obtenerCursoAdministrador(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const cursoId = Number(req.params.cursoId);

    if (!Number.isSafeInteger(cursoId) || cursoId <= 0) {
      return res.status(400).json({ message: "El ID del curso no es válido." });
    }

    const resultado = await pool.query(
      `SELECT
         c.id::TEXT AS id,
         c.nombre,
         c.codigo,
         c.categoria,
         c.modalidad,
         c.descripcion,
         c.imagen_portada,
         c.estado,
         oc.id::TEXT AS oferta_id,
         oc.periodo_id::TEXT AS periodo_id,
         p.nombre AS periodo_nombre,
         p.activo AS periodo_activo,
         COALESCE(oc.cupo_maximo, 0)::INTEGER AS cupos,
         oc.docente_id::TEXT AS docente_id,
         BTRIM(CONCAT_WS(' ', u.nombres, u.apellidos)) AS docente_nombre,
         COALESCE(u.especialidad, 'Sin especificar') AS docente_especialidad,
         COALESCE(u.disponibilidad, 'No especificada') AS docente_disponibilidad,
         COALESCE((
           SELECT COUNT(*)
           FROM ofertas_curso oc2
           WHERE oc2.docente_id = u.id
             AND oc2.estado <> 'Cancelado'
         ), 0)::INTEGER AS docente_carga
       FROM cursos c
       LEFT JOIN LATERAL (
         SELECT *
         FROM ofertas_curso
         WHERE curso_id = c.id
         ORDER BY actualizado_en DESC, id DESC
         LIMIT 1
       ) oc ON TRUE
       LEFT JOIN periodos_academicos p ON p.id = oc.periodo_id
       LEFT JOIN usuarios u ON u.id = oc.docente_id
       WHERE c.id = $1
       LIMIT 1`,
      [cursoId]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ message: "El curso no existe." });
    }

    const fila = resultado.rows[0];

    if (fila.estado === "Archivado") {
      return res.status(404).json({
        message: "El curso archivado no está disponible para edición.",
      });
    }

    const componentes = fila.oferta_id
      ? await pool.query(
          `SELECT
             id::TEXT AS id,
             nombre,
             tipo,
             porcentaje::TEXT AS porcentaje
           FROM componentes_calificacion
           WHERE oferta_curso_id = $1
           ORDER BY id`,
          [fila.oferta_id]
        )
      : { rows: [] };

    const docente = fila.docente_id
      ? {
          id: String(fila.docente_id),
          nombre: fila.docente_nombre || "Docente",
          especialidad: fila.docente_especialidad || "Sin especificar",
          disponibilidad: fila.docente_disponibilidad || "No especificada",
          carga: Number(fila.docente_carga) || 0,
        }
      : null;

    return res.status(200).json({
      curso: {
        id: fila.id,
        nombreCurso: fila.nombre,
        codigo: fila.codigo,
        categoria: fila.categoria ?? "Diseño",
        modalidad: fila.modalidad,
        descripcion: fila.descripcion ?? "",
        cupos: String(fila.cupos),
        estado: fila.estado,
        imagenPortada: fila.imagen_portada,
        periodoId: fila.periodo_id ? String(fila.periodo_id) : "",
        periodoNombre: fila.periodo_nombre ?? null,
        periodoActivo: fila.periodo_activo ?? false,
      },
      evaluaciones: componentes.rows.map((componente) => ({
        id: `db-${componente.id}`,
        nombre: componente.nombre,
        porcentaje: componente.porcentaje ?? "",
      })),
      docente,
    });
  } catch (error) {
    console.error("Error obteniendo el curso para editar:", error);

    return res.status(500).json({
      message: "No se pudieron cargar los datos del curso.",
    });
  }
}

export async function actualizarCursoAdministrador(
  req: AuthenticatedRequest,
  res: Response
) {
  let client: PoolClient | null = null;
  let transaccionAbierta = false;
  let nuevaImagenKey: string | null = null;

  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const cursoId = Number(req.params.cursoId);

    if (!Number.isSafeInteger(cursoId) || cursoId <= 0) {
      return res.status(400).json({ message: "El ID del curso no es válido." });
    }

    let datos: DatosCrearCurso;

    try {
      datos = parseDatos(req);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Los datos del curso no son válidos.",
      });
    }

    const nombre = typeof datos.nombreCurso === "string" ? datos.nombreCurso.trim() : "";
    const codigo = typeof datos.codigo === "string" ? datos.codigo.trim().toUpperCase() : "";
    const categoria = typeof datos.categoria === "string" ? datos.categoria.trim() : "";
    const modalidad = typeof datos.modalidad === "string" ? datos.modalidad : "";
    const descripcion = typeof datos.descripcion === "string" ? datos.descripcion.trim() : "";
    const cupos = Number(datos.cupos);
    const publicar = datos.publicar === true;
    const docenteId = datos.docenteId == null || datos.docenteId === "" ? null : Number(datos.docenteId);
    const periodoId = datos.periodoId == null || datos.periodoId === "" ? null : Number(datos.periodoId);

    if (
      periodoId !== null &&
      (!Number.isSafeInteger(periodoId) || periodoId <= 0)
    ) {
      return res.status(400).json({
        message: "El periodo académico seleccionado no es válido.",
      });
    }

    if (!nombre || nombre.length > 200) {
      return res.status(400).json({ message: "El nombre del curso no es válido." });
    }

    if (!codigo || codigo.length > 50) {
      return res.status(400).json({ message: "El código del curso no es válido." });
    }

    if (!categoria || categoria.length > 120) {
      return res.status(400).json({ message: "La categoría no es válida." });
    }

    if (!["Virtual", "Presencial", "Hibrido"].includes(modalidad)) {
      return res.status(400).json({ message: "La modalidad no es válida." });
    }

    if (!descripcion) {
      return res.status(400).json({ message: "La descripción es obligatoria." });
    }

    if (!Number.isSafeInteger(cupos) || cupos <= 0) {
      return res.status(400).json({ message: "Los cupos deben ser mayores que cero." });
    }

    if (
      docenteId !== null &&
      (!Number.isSafeInteger(docenteId) || docenteId <= 0)
    ) {
      return res.status(400).json({ message: "El docente no es válido." });
    }

    let componentes: ComponenteParaEditar[];

    try {
      componentes = leerComponentesParaEditar(datos.componentes);
    } catch (error) {
      return res.status(
        (error as ErrorHttp).statusCode ?? 400
      ).json({
        message:
          error instanceof Error
            ? error.message
            : "La configuración de calificaciones no es válida.",
      });
    }

    if (publicar) {
      const suma = componentes.reduce(
        (total, item) => total + (item.porcentaje ?? 0),
        0
      );

      if (
        !docenteId ||
        componentes.length === 0 ||
        componentes.some((item) => item.porcentaje === null) ||
        Math.abs(suma - 100) > 0.01
      ) {
        return res.status(400).json({
          message:
            "Para publicar necesitas un docente asignado y componentes cuyos porcentajes sumen 100 %.",
        });
      }
    }

    if (docenteId !== null) {
      const docente = await pool.query(
        `SELECT id
         FROM usuarios
         WHERE id = $1
           AND rol = 'Docente'
           AND activo = TRUE
         LIMIT 1`,
        [docenteId]
      );

      if (!docente.rowCount) {
        return res.status(400).json({
          message: "El docente debe estar registrado, activo y tener el rol Docente.",
        });
      }
    }

    let nuevaImagen: string | null = null;

    if (req.file) {
      const extension = path.extname(req.file.originalname).toLowerCase();
      const safeName = slugifyFileName(path.basename(req.file.originalname));

      nuevaImagenKey =
        `courses/covers/${randomUUID()}-${safeName || `portada${extension}`}`;

      nuevaImagen = await uploadBufferToR2({
        buffer: req.file.buffer,
        key: nuevaImagenKey,
        contentType: req.file.mimetype,
        contentLength: req.file.size,
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transaccionAbierta = true;

    const cursoResult = await client.query(
      `SELECT id, estado, imagen_portada
       FROM cursos
       WHERE id = $1
       FOR UPDATE`,
      [cursoId]
    );

    if (!cursoResult.rowCount) {
      throw errorHttp("El curso no existe.", 404);
    }

    const cursoActual = cursoResult.rows[0];

    if (cursoActual.estado === "Archivado") {
      throw errorHttp("No se puede editar un curso archivado.", 409);
    }

    const ofertaResult = await client.query(
      `SELECT
        id,
        docente_id,
        publicado,
        periodo_id::TEXT AS periodo_id
       FROM ofertas_curso
       WHERE curso_id = $1
       ORDER BY actualizado_en DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [cursoId]
    );

    if (!ofertaResult.rowCount) {
      throw errorHttp(
        "El curso no tiene una oferta asociada que se pueda editar.",
        409
      );
    }

    const oferta = ofertaResult.rows[0];
    const ofertaId = String(oferta.id);
    const publicarEfectivamente = publicar || (cursoActual.estado === "Activo" && oferta.publicado === true);
    const periodoAnteriorId = oferta.periodo_id ? String(oferta.periodo_id) : null;
    const periodoNuevoId = periodoId === null ? null : String(periodoId);
    const cambiaPeriodo = periodoAnteriorId !== periodoNuevoId;

    if (publicarEfectivamente && periodoId === null) {
      throw errorHttp(
        "Asigna un periodo académico antes de publicar el curso.",
        400
      );
    }

    if (periodoId !== null && (cambiaPeriodo || publicarEfectivamente)) {
      const periodoResult = await client.query(
        `SELECT id
        FROM periodos_academicos
        WHERE id = $1
          AND activo = TRUE
        FOR SHARE`,
        [periodoId]
      );

      if (!periodoResult.rowCount) {
        throw errorHttp(
          "El periodo seleccionado no existe o está inactivo.",
          400
        );
      }
    }

    if (cambiaPeriodo) {
      const matriculasExistentes = await client.query(
        `SELECT 1
        FROM matriculas
        WHERE oferta_curso_id = $1
        LIMIT 1`,
        [ofertaId]
      );

      if (matriculasExistentes.rowCount) {
        throw errorHttp(
          "Esta oferta ya tiene matrículas y no puede cambiar de periodo. Crea una nueva oferta para el nuevo periodo.",
          409
        );
      }
    }

    if (publicarEfectivamente) {
      const suma = componentes.reduce(
        (total, item) => total + (item.porcentaje ?? 0),
        0
      );

      if (
        !docenteId ||
        componentes.length === 0 ||
        componentes.some((item) => item.porcentaje === null) ||
        Math.abs(suma - 100) > 0.01
      ) {
        throw errorHttp(
          "Para mantener o activar el curso necesitas docente y porcentajes que sumen 100 %.",
          400
        );
      }
    }

    const estadoFinal = publicar ? "Activo" : cursoActual.estado;
    const imagenFinal = nuevaImagen ?? cursoActual.imagen_portada;

    await client.query(
      `UPDATE cursos
       SET nombre = $2,
           codigo = $3,
           categoria = $4,
           modalidad = $5,
           descripcion = $6,
           imagen_portada = $7,
           estado = $8,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [
        cursoId,
        nombre,
        codigo,
        categoria,
        modalidad,
        descripcion,
        imagenFinal,
        estadoFinal,
      ]
    );

    const publicacionFinal =
      publicar ||
      (cursoActual.estado === "Activo" && oferta.publicado === true);
    
    await client.query(
      `UPDATE ofertas_curso
      SET periodo_id = $2,
          cupo_maximo = $3,
          docente_id = $4,
          publicado = $5,
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [ofertaId, periodoId, cupos, docenteId, publicacionFinal]
    );

    const existentesResult = await client.query(
      `SELECT id::TEXT AS id
       FROM componentes_calificacion
       WHERE oferta_curso_id = $1`,
      [ofertaId]
    );

    const idsExistentes = new Set<string>(
      existentesResult.rows.map((fila) => String(fila.id))
    );

    for (const componente of componentes) {
      if (componente.id !== null && !idsExistentes.has(componente.id)) {
        throw errorHttp(
          "Un componente pertenece a otra oferta o ya no existe. Recarga el curso.",
          409
        );
      }
    }

    const idsConservar = new Set(
      componentes.flatMap((componente) =>
        componente.id === null ? [] : [componente.id]
      )
    );

    const idsEliminar = [...idsExistentes].filter(
      (id) => !idsConservar.has(id)
    );

    if (idsEliminar.length > 0) {
      const notas = await client.query(
        `SELECT DISTINCT componente_id::TEXT AS id
         FROM calificaciones
         WHERE componente_id = ANY($1::BIGINT[])`,
        [idsEliminar]
      );

      if (notas.rowCount) {
        throw errorHttp(
          "No puedes eliminar un componente que ya tiene calificaciones. Cambia su nombre o porcentaje para conservar las notas.",
          409
        );
      }

      await client.query(
        `DELETE FROM componentes_calificacion
         WHERE oferta_curso_id = $1
           AND id = ANY($2::BIGINT[])`,
        [ofertaId, idsEliminar]
      );
    }

    for (const componente of componentes) {
      if (componente.id !== null) {
        await client.query(
          `UPDATE componentes_calificacion
           SET nombre = $2,
               tipo = $3,
               porcentaje = $4
           WHERE id = $1
             AND oferta_curso_id = $5`,
          [
            componente.id,
            componente.nombre,
            componente.tipo,
            componente.porcentaje,
            ofertaId,
          ]
        );
      } else {
        await client.query(
          `INSERT INTO componentes_calificacion (
             oferta_curso_id,
             nombre,
             tipo,
             porcentaje,
             puntaje_maximo
           ) VALUES ($1, $2, $3, $4, 20)`,
          [
            ofertaId,
            componente.nombre,
            componente.tipo,
            componente.porcentaje,
          ]
        );
      }
    }

    await client.query("COMMIT");
    transaccionAbierta = false;

    if (
      nuevaImagen &&
      cursoActual.imagen_portada &&
      isR2Path(cursoActual.imagen_portada)
    ) {
      await deleteObjectFromR2(
        stripR2Prefix(cursoActual.imagen_portada)
      ).catch((error) => {
        console.error("No se pudo retirar la portada anterior de R2:", error);
      });
    }

    return res.status(200).json({
      message: publicar
        ? "Los cambios se guardaron y el curso está activo."
        : "Los cambios del curso se guardaron correctamente.",
      curso: {
        id: String(cursoId),
        estado: estadoFinal,
        imagen_portada: imagenFinal,
      },
    });
  } catch (error) {
    if (client && transaccionAbierta) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    if (nuevaImagenKey) {
      await deleteObjectFromR2(nuevaImagenKey).catch(() => undefined);
    }

    const codigo = (error as ErrorHttp).statusCode;

    if (codigo) {
      return res.status(codigo).json({
        message: (error as Error).message,
      });
    }

    const errorPostgres = error as { code?: string };

    if (errorPostgres.code === "23505") {
      return res.status(409).json({
        message: "Ya existe un curso con ese código.",
      });
    }

    console.error("Error actualizando el curso:", error);

    return res.status(500).json({
      message: "No se pudo actualizar el curso.",
    });
  } finally {
    client?.release();
  }
}

export async function cambiarEstadoCursoAdministrador(
  req: AuthenticatedRequest,
  res: Response
) {
  let client: PoolClient | null = null;
  let transaccionAbierta = false;

  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const cursoId = Number(req.params.cursoId);
    const estadoSolicitado = req.body?.estado;

    if (!Number.isSafeInteger(cursoId) || cursoId <= 0) {
      return res.status(400).json({ message: "El ID del curso no es válido." });
    }

    if (!["Activo", "Inactivo", "Archivado"].includes(estadoSolicitado)) {
      return res.status(400).json({ message: "El estado solicitado no es válido." });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transaccionAbierta = true;

    const cursoResult = await client.query(
      `SELECT id, estado
       FROM cursos
       WHERE id = $1
       FOR UPDATE`,
      [cursoId]
    );

    if (!cursoResult.rowCount) {
      throw errorHttp("El curso no existe.", 404);
    }

    const curso = cursoResult.rows[0];

    if (curso.estado === "Archivado") {
      throw errorHttp("Un curso archivado no se puede reactivar desde esta pantalla.", 409);
    }

    const ofertaResult = await client.query(
      `SELECT id, docente_id, periodo_id
       FROM ofertas_curso
       WHERE curso_id = $1
       ORDER BY actualizado_en DESC, id DESC
       LIMIT 1
       FOR UPDATE`,
      [cursoId]
    );

    if (estadoSolicitado === "Activo") {
      if (!ofertaResult.rowCount) {
        throw errorHttp("El curso no tiene una oferta configurada.", 400);
      }

      const oferta = ofertaResult.rows[0];

      if (!oferta.periodo_id) {
        throw errorHttp(
          "No puedes publicar el curso sin asignar un periodo académico.",
          400
        );
      }

      const periodoResult = await client.query(
        `SELECT id
        FROM periodos_academicos
        WHERE id = $1
          AND activo = TRUE
        FOR SHARE`,
        [oferta.periodo_id]
      );

      if (!periodoResult.rowCount) {
        throw errorHttp(
          "El periodo académico de esta oferta está inactivo. Selecciona un periodo activo antes de publicar.",
          400
        );
      }

      if (!oferta.docente_id) {
        throw errorHttp(
          "No puedes activar el curso sin asignar un docente.",
          400
        );
      }

      const docente = await client.query(
        `SELECT id
         FROM usuarios
         WHERE id = $1
           AND rol = 'Docente'
           AND activo = TRUE`,
        [oferta.docente_id]
      );

      if (!docente.rowCount) {
        throw errorHttp(
          "El docente asignado no está activo. Edita el curso y selecciona otro docente.",
          400
        );
      }

      const sumaResult = await client.query(
        `SELECT
           COUNT(*)::INTEGER AS cantidad,
           COUNT(*) FILTER (WHERE porcentaje IS NULL)::INTEGER AS faltantes,
           COALESCE(SUM(porcentaje), 0)::NUMERIC AS total
         FROM componentes_calificacion
         WHERE oferta_curso_id = $1`,
        [oferta.id]
      );

      const resumen = sumaResult.rows[0];
      const total = Number(resumen.total);

      if (
        Number(resumen.cantidad) === 0 ||
        Number(resumen.faltantes) > 0 ||
        Math.abs(total - 100) > 0.01
      ) {
        throw errorHttp(
          `Para activar el curso, configura sus componentes de calificación y asegúrate de que sumen 100 %. Total actual: ${total} %.`,
          400
        );
      }
    }

    await client.query(
      `UPDATE cursos
       SET estado = $2,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [cursoId, estadoSolicitado]
    );

    if (ofertaResult.rowCount) {
      await client.query(
        `UPDATE ofertas_curso
         SET publicado = $2,
             estado = CASE
               WHEN $2 = TRUE AND estado = 'Cancelado' THEN 'Programado'
               ELSE estado
             END,
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          ofertaResult.rows[0].id,
          estadoSolicitado === "Activo",
        ]
      );
    }

    await client.query("COMMIT");
    transaccionAbierta = false;

    return res.status(200).json({
      message:
        estadoSolicitado === "Activo"
          ? "El curso está activo."
          : estadoSolicitado === "Inactivo"
            ? "El curso se desactivó correctamente."
            : "El curso se retiró y quedó archivado.",
      estado: estadoSolicitado,
    });
  } catch (error) {
    if (client && transaccionAbierta) {
      await client.query("ROLLBACK").catch(() => undefined);
    }

    const codigo = (error as ErrorHttp).statusCode;

    if (codigo) {
      return res.status(codigo).json({
        message: (error as Error).message,
      });
    }

    console.error("Error cambiando estado del curso:", error);

    return res.status(500).json({
      message: "No se pudo cambiar el estado del curso.",
    });
  } finally {
    client?.release();
  }
}