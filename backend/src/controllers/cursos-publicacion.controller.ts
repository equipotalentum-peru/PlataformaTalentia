import type { Request, Response } from "express";
import pool from "../config/database";
import { firestoreAdmin } from "../config/firebase-admin";
import {
  comprobarAdministrador,
} from "./cursos-admin.controller";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  deleteObjectFromR2,
  isR2Path,
  slugifyFileName,
  stripR2Prefix,
  uploadBufferToR2,
} from "../services/r2.service";

const COLECCION_PUBLICA = "Cursos";
const COLECCION_BORRADORES = "CursosBorrador";
const IMAGEN_PORTADA_POR_DEFECTO = "/assets/images/cursos/curso-sin-portada.svg";
const NIVELES = new Set([
  "Inicial",
  "Inicial/Intermedio",
  "Intermedio",
  "Intermedio/Avanzado",
  "Avanzado",
]);
const SERVICIOS = new Set([
  "Especializaciones Profesionales",
  "Formación Corporativa",
]);
const MODALIDADES = new Set([
  "Online sincrónico",
  "Presencial",
  "Híbrido",
]);
const CAMPOS_GENERICOS_SLUG = new Set([
  "especializacion",
  "especializaciones",
  "profesional",
  "profesionales",
  "curso",
  "cursos",
  "programa",
  "programas",
  "taller",
  "talleres",
]);
const PALABRAS_PRESCINDIBLES = new Set([
  "a", "al", "con", "de", "del", "desde", "e", "el", "en", "la", "las",
  "lo", "los", "para", "por", "y", "un", "una", "unos", "unas",
]);

type FilaCurso = {
  id: string;
  nombre: string;
  categoria: string | null;
  modalidad: string;
  descripcion: string | null;
  imagen_portada: string | null;
  estado: string;
};

type FilaModulo = {
  id: string;
  numero: number;
  titulo: string;
  orden: number;
  clases_sugeridas: number;
};

type ModuloPublico = {
  numero: number;
  titulo: string;
  horas: number;
  clases: number;
};

type DatosPublicacion = {
  documentId?: unknown;
  title?: unknown;
  category?: unknown;
  modality?: unknown;
  descripcion_larga?: unknown;
  description?: unknown;
  certificado?: unknown;
  hours?: unknown;
  idioma?: unknown;
  level?: unknown;
  servicio?: unknown;
  image?: unknown;
  dirigido_a?: unknown;
  que_aprenderas?: unknown;
  modulos?: unknown;
  publicar?: unknown;
};

type ErrorHttp = Error & { statusCode?: number };

function errorHttp(message: string, statusCode: number): ErrorHttp {
  const error = new Error(message) as ErrorHttp;
  error.statusCode = statusCode;
  return error;
}

function normalizarTexto(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokensTitulo(value: unknown): Set<string> {
  return new Set(
    normalizarTexto(value)
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => !PALABRAS_PRESCINDIBLES.has(token))
      .filter((token) => !CAMPOS_GENERICOS_SLUG.has(token))
  );
}

function similitudTitulos(a: unknown, b: unknown): number {
  const tokensA = tokensTitulo(a);
  const tokensB = tokensTitulo(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const interseccion = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union ? interseccion / union : 0;
}

function crearSlugCurso(title: string): string {
  const base = normalizarTexto(title)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !PALABRAS_PRESCINDIBLES.has(token))
    .filter((token) => !CAMPOS_GENERICOS_SLUG.has(token))
    .join("-");
  return base.slice(0, 105).replace(/^-+|-+$/g, "") || "curso-talentia";
}

function fechaActualLima(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function esTexto(value: unknown): value is string {
  return typeof value === "string";
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function enteroNoNegativo(value: unknown, label: string): number {
  const numero = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(numero) || numero < 0 || numero > 10000) {
    throw errorHttp(`${label} debe ser un número entero entre 0 y 10000.`, 400);
  }
  return numero;
}

function leerListaTextos(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw errorHttp(`${label} debe ser una lista de textos.`, 400);
  }
  const resultado: string[] = [];
  for (const elemento of value) {
    if (typeof elemento !== "string") {
      throw errorHttp(`Hay un elemento no válido en ${label}.`, 400);
    }
    const limpio = elemento.trim();
    if (!limpio) continue;
    if (limpio.length > 500) {
      throw errorHttp(`Cada elemento de ${label} admite hasta 500 caracteres.`, 400);
    }
    resultado.push(limpio);
  }
  if (resultado.length > 50) {
    throw errorHttp(`${label} admite hasta 50 elementos.`, 400);
  }
  return resultado;
}

function leerDatos(req: Request): DatosPublicacion {
  const contenido = req.body?.datos ?? req.body;
  if (typeof contenido === "string") {
    try {
      const parsed: unknown = JSON.parse(contenido);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("El formulario no tiene el formato esperado.");
      }
      return parsed as DatosPublicacion;
    } catch {
      throw errorHttp("No se pudieron interpretar los datos de la ficha pública.", 400);
    }
  }
  if (!contenido || typeof contenido !== "object" || Array.isArray(contenido)) {
    throw errorHttp("Debes enviar los datos de la ficha pública.", 400);
  }
  return contenido as DatosPublicacion;
}

function convertirModalidad(modalidad: string | null | undefined): string {
  switch (normalizarTexto(modalidad)) {
    case "virtual":
    case "online sincronico":
      return "Online sincrónico";
    case "presencial":
      return "Presencial";
    case "hibrido":
    case "hibrida":
      return "Híbrido";
    default:
      return "";
  }
}

function convertirServicio(servicio: unknown): string {
  const normalizado = normalizarTexto(servicio);
  if (normalizado === "formacion corporativa") return "Formación Corporativa";
  if (
    normalizado === "especializacion profesional" ||
    normalizado === "especializaciones profesionales"
  ) {
    return "Especializaciones Profesionales";
  }
  return "";
}

function convertirImagenPublica(imagen: string | null | undefined): string {
  const valor = texto(imagen);
  if (!valor) return "";
  if (!isR2Path(valor)) return valor;

  const base = texto(process.env.COURSE_IMAGES_WORKER_BASE_URL).replace(/\/+$/, "");
  if (!base) return "";
  const key = stripR2Prefix(valor)
    .split("/")
    .filter(Boolean)
    .map((segmento) => encodeURIComponent(segmento))
    .join("/");
  return `${base}/${key}`;
}

function validarReferenciaImagen(value: unknown): string {
  const imagen = texto(value);
  if (!imagen) return "";
  if (/^https?:\/\//i.test(imagen)) return imagen;
  if (/^\/assets\/[a-zA-Z0-9_./-]+$/.test(imagen)) return imagen;
  throw errorHttp("La imagen debe ser una URL HTTPS o una ruta pública /assets/ válida.", 400);
}

function obtenerImagenR2(value: unknown, imagenR2Previa: unknown): string | null {
  const previa = texto(imagenR2Previa);
  if (isR2Path(previa)) return previa;
  const valor = texto(value);
  return isR2Path(valor) ? valor : null;
}

async function cargarCursoAcademico(cursoId: number): Promise<FilaCurso | null> {
  const resultado = await pool.query<FilaCurso>(
    `SELECT
       id::TEXT AS id,
       nombre,
       categoria,
       modalidad,
       descripcion,
       imagen_portada,
       estado
     FROM cursos
     WHERE id = $1
     LIMIT 1`,
    [cursoId]
  );
  return resultado.rows[0] ?? null;
}

async function cargarModulosAcademicos(cursoId: number): Promise<FilaModulo[]> {
  const resultado = await pool.query<FilaModulo>(
    `SELECT
       mc.id::TEXT AS id,
       mc.numero,
       mc.titulo,
       mc.orden,
       COUNT(cc.id) FILTER (WHERE cc.estado <> 'Oculto')::INTEGER AS clases_sugeridas
     FROM modulos_curso mc
     LEFT JOIN contenidos_curso cc ON cc.modulo_id = mc.id
     WHERE mc.curso_id = $1
       AND mc.activo = TRUE
     GROUP BY mc.id, mc.numero, mc.titulo, mc.orden
     ORDER BY mc.orden, mc.id`,
    [cursoId]
  );
  return resultado.rows;
}

type PublicDoc = {
  id: string;
  data: Record<string, unknown>;
};

async function buscarPublicacionPublica(
  cursoId: string,
  nombreCurso: string
): Promise<PublicDoc | null> {
  const collection = firestoreAdmin.collection(COLECCION_PUBLICA);
  const vinculada = await collection
    .where("curso_id_postgres", "==", String(cursoId))
    .limit(1)
    .get();

  if (!vinculada.empty) {
    const doc = vinculada.docs[0];
    return { id: doc.id, data: doc.data() as Record<string, unknown> };
  }

  const todos = await collection.get();
  const candidato = crearSlugCurso(nombreCurso);
  const porId = todos.docs.find((doc) => doc.id === candidato);
  if (porId) {
    const score = similitudTitulos(nombreCurso, porId.get("title"));
    if (!porId.get("title") || score >= 0.45) {
      return { id: porId.id, data: porId.data() as Record<string, unknown> };
    }
  }

  const matches = todos.docs
    .map((doc) => ({
      doc,
      score: similitudTitulos(nombreCurso, doc.get("title")),
    }))
    .filter((item) => item.score >= 0.72)
    .sort((a, b) => b.score - a.score);

  if (matches.length > 0) {
    const mejor = matches[0];
    const segundo = matches[1];
    if (!segundo || mejor.score - segundo.score >= 0.12 || mejor.score >= 0.9) {
      return { id: mejor.doc.id, data: mejor.doc.data() as Record<string, unknown> };
    }
  }
  return null;
}

async function elegirIdDocumento(
  cursoId: string,
  nombreCurso: string,
  publicacion: PublicDoc | null,
  borrador: Record<string, unknown> | null
): Promise<string> {
  const idBorrador = texto(borrador?.publicacion_id);
  if (idBorrador) return idBorrador;
  if (publicacion) return publicacion.id;

  const base = crearSlugCurso(nombreCurso);
  const baseRef = firestoreAdmin.collection(COLECCION_PUBLICA).doc(base);
  const baseSnapshot = await baseRef.get();
  if (!baseSnapshot.exists) return base;

  const owner = texto(baseSnapshot.get("curso_id_postgres"));
  if (owner === String(cursoId)) return base;

  return `${base}-${cursoId}`;
}

function mapearModulos(
  modulosAcademicos: FilaModulo[],
  fuente: unknown
): Array<ModuloPublico & { id: string; orden: number }> {
  const existentes = Array.isArray(fuente)
    ? fuente.filter((item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item)
      )
    : [];

  return modulosAcademicos.map((modulo) => {
    const guardado =
      existentes.find((item) => Number(item.numero) === modulo.numero) ??
      existentes.find((item) => normalizarTexto(item.titulo) === normalizarTexto(modulo.titulo));
    return {
      id: modulo.id,
      numero: modulo.numero,
      titulo: modulo.titulo,
      orden: modulo.orden,
      horas: Number.isSafeInteger(Number(guardado?.horas)) && Number(guardado?.horas) >= 0
        ? Number(guardado?.horas)
        : 0,
      clases: Number.isSafeInteger(Number(guardado?.clases)) && Number(guardado?.clases) >= 0
        ? Number(guardado?.clases)
        : modulo.clases_sugeridas,
    };
  });
}

function datosPublicacionDesde(
  borrador: Record<string, unknown> | null,
  publicada: Record<string, unknown> | null,
  curso: FilaCurso,
  modulosAcademicos: FilaModulo[]
) {
  const fuente = borrador ?? publicada ?? {};
  const imageGuardada = texto(fuente.image);
  const imagenAcademica = texto(curso.imagen_portada);
  const imageInicial = convertirImagenPublica(imagenAcademica);
  const imageR2Guardada =
    texto(fuente.image_r2) ||
    (isR2Path(imageGuardada) ? imageGuardada : "") ||
    (!imageGuardada && isR2Path(imagenAcademica) ? imagenAcademica : "") ||
    (imageGuardada && imageGuardada === imageInicial && isR2Path(imagenAcademica) ? imagenAcademica : "");

  return {
    documentId: "",
    title: texto(fuente.title) || curso.nombre,
    category: texto(fuente.category) || texto(curso.categoria),
    modality: convertirModalidad(texto(fuente.modality) || curso.modalidad),
    descripcion_larga: texto(fuente.descripcion_larga) || texto(curso.descripcion),
    image: (imageGuardada ? convertirImagenPublica(imageGuardada) : "") ||
      imageInicial ||
      IMAGEN_PORTADA_POR_DEFECTO,
    image_r2: imageR2Guardada,
    certificado: typeof fuente.certificado === "boolean" ? fuente.certificado : false,
    description: texto(fuente.description),
    hours: Number.isSafeInteger(Number(fuente.hours)) && Number(fuente.hours) >= 0
      ? Number(fuente.hours)
      : 0,
    idioma: texto(fuente.idioma) || "Español",
    level: texto(fuente.level),
    servicio: convertirServicio(fuente.servicio),
    modulos: mapearModulos(modulosAcademicos, fuente.modulos),
    dirigido_a: Array.isArray(fuente.dirigido_a)
      ? fuente.dirigido_a.filter((item): item is string => typeof item === "string")
      : [],
    que_aprenderas: Array.isArray(fuente.que_aprenderas)
      ? fuente.que_aprenderas.filter((item): item is string => typeof item === "string")
      : [],
    fecha_registro: texto(fuente.fecha_registro),
    fecha_actualizacion: texto(fuente.fecha_actualizacion),
  };
}

function construirDatosValidados(
  datos: DatosPublicacion,
  modulosAcademicos: FilaModulo[],
  imagenFinal: string,
  imagenR2Final: string | null,
  publicar: boolean
) {
  const title = texto(datos.title);
  const category = texto(datos.category);
  const modality = texto(datos.modality);
  const descripcionLarga = texto(datos.descripcion_larga);
  const description = texto(datos.description);
  const level = texto(datos.level);
  const servicio = convertirServicio(datos.servicio);
  const certificado = datos.certificado;
  const hours = enteroNoNegativo(datos.hours, "Las horas generales");
  const idioma = "Español";
  const dirigidoA = leerListaTextos(datos.dirigido_a, "¿A quiénes va dirigido?");
  const queAprenderas = leerListaTextos(datos.que_aprenderas, "¿Qué aprenderán?");

  if (!title || title.length > 200) {
    throw errorHttp("El nombre público del curso es obligatorio y admite hasta 200 caracteres.", 400);
  }
  if (!category || category.length > 120) {
    throw errorHttp("La categoría es obligatoria y admite hasta 120 caracteres.", 400);
  }
  if (publicar) {
    if (!MODALIDADES.has(modality)) {
      throw errorHttp("Selecciona una modalidad válida.", 400);
    }
    if (!descripcionLarga || descripcionLarga.length > 10000) {
      throw errorHttp("La descripción extensa es obligatoria y admite hasta 10000 caracteres.", 400);
    }
    if (!description || description.length > 500) {
      throw errorHttp("El lema del curso es obligatorio y admite hasta 500 caracteres.", 400);
    }
    if (hours <= 0) {
      throw errorHttp("Las horas generales deben ser mayores que cero para publicar.", 400);
    }
    if (!NIVELES.has(level)) {
      throw errorHttp("Selecciona un nivel válido.", 400);
    }
    if (!SERVICIOS.has(servicio)) {
      throw errorHttp("Selecciona un servicio válido.", 400);
    }
    if (typeof certificado !== "boolean") {
      throw errorHttp("Indica si el curso incluye certificado.", 400);
    }
    if (!imagenFinal) {
      throw errorHttp("Selecciona una imagen de portada antes de publicar.", 400);
    }
    if (modulosAcademicos.length === 0) {
      throw errorHttp("El curso debe tener al menos un módulo creado por el docente.", 400);
    }
    if (modulosAcademicos.some((modulo) => {
      const presentado = Array.isArray(datos.modulos)
        ? datos.modulos.find((item) => item && typeof item === "object" && String((item as Record<string, unknown>).id) === modulo.id) as Record<string, unknown> | undefined
        : undefined;
      if (!presentado) return true;
      return enteroNoNegativo(presentado.horas, `Las horas del módulo ${modulo.numero}`) <= 0 ||
        enteroNoNegativo(presentado.clases, `Las clases del módulo ${modulo.numero}`) <= 0;
    })) {
      throw errorHttp("Cada módulo debe tener al menos una hora y una clase configuradas.", 400);
    }

    const horasTotalesModulos = modulosAcademicos.reduce((suma, modulo) => {
      const presentado = Array.isArray(datos.modulos)
        ? datos.modulos.find((item) =>
            Boolean(item) &&
            typeof item === "object" &&
            String((item as Record<string, unknown>).id) === modulo.id
          ) as Record<string, unknown> | undefined
        : undefined;
      return suma + enteroNoNegativo(
        presentado?.horas,
        `Las horas del módulo ${modulo.numero}`
      );
    }, 0);

    if (horasTotalesModulos !== hours) {
      throw errorHttp(
        `Las horas de los módulos suman ${horasTotalesModulos} y deben coincidir exactamente con las ${hours} horas generales.`,
        400
      );
    }

    if (dirigidoA.length === 0) {
      throw errorHttp("Agrega al menos un elemento en «¿A quiénes va dirigido?».", 400);
    }
    if (queAprenderas.length === 0) {
      throw errorHttp("Agrega al menos un aprendizaje antes de publicar.", 400);
    }
  } else if (modality && !MODALIDADES.has(modality)) {
    throw errorHttp("Selecciona una modalidad válida.", 400);
  }

  if (certificado !== undefined && typeof certificado !== "boolean") {
    throw errorHttp("El campo de certificado debe ser Sí o No.", 400);
  }
  if (descripcionLarga.length > 10000 || description.length > 500) {
    throw errorHttp("La descripción o el lema superan la longitud permitida.", 400);
  }

  const modulosPublicos: ModuloPublico[] = modulosAcademicos.map((modulo) => {
    const presentado = Array.isArray(datos.modulos)
      ? datos.modulos.find((item) =>
          Boolean(item) &&
          typeof item === "object" &&
          String((item as Record<string, unknown>).id) === modulo.id
        ) as Record<string, unknown> | undefined
      : undefined;
    return {
      // El nombre y el número proceden siempre de PostgreSQL: son de solo lectura en la ficha.
      numero: modulo.numero,
      titulo: modulo.titulo,
      horas: enteroNoNegativo(presentado?.horas ?? 0, `Las horas del módulo ${modulo.numero}`),
      clases: enteroNoNegativo(presentado?.clases ?? modulo.clases_sugeridas, `Las clases del módulo ${modulo.numero}`),
    };
  });

  return {
    cantidad_modulos: modulosPublicos.length,
    category,
    certificado: certificado === true,
    descripcion_larga: descripcionLarga,
    description,
    dirigido_a: dirigidoA,
    hours,
    idioma,
    image: imagenFinal,
    image_r2: imagenR2Final ?? "",
    level,
    modality,
    modulos: modulosPublicos,
    que_aprenderas: queAprenderas,
    servicio,
    title,
  };
}

async function validarIdDocumento(
  cursoId: string,
  nombreAcademico: string,
  documentId: string
) {
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(documentId)) {
    throw errorHttp("El identificador de la ficha pública no es válido.", 400);
  }
  const ref = firestoreAdmin.collection(COLECCION_PUBLICA).doc(documentId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return;

  const propietario = texto(snapshot.get("curso_id_postgres"));
  if (propietario && propietario !== String(cursoId)) {
    throw errorHttp("El identificador público ya está asociado a otro curso.", 409);
  }

  const actual = await buscarPublicacionPublica(cursoId, nombreAcademico);
  if (!propietario && (!actual || actual.id !== documentId)) {
    throw errorHttp("La ficha pública ya existe y no se pudo confirmar que corresponda a este curso.", 409);
  }
}

type EstadoPublicacionTalentia = "publicado" | "oculto";

function obtenerEstadoDocumentoPublicacion(
  data: Record<string, unknown>
): EstadoPublicacionTalentia | null {
  const estado = normalizarTexto(data.estado);
  if (estado === "publicado") return "publicado";
  if (estado === "oculto") return "oculto";
  // Compatibilidad con documentos anteriores a la incorporación de `estado`.
  if (estado) return "oculto";
  if (typeof data.publicado === "boolean") {
    return data.publicado ? "publicado" : "oculto";
  }
  // Si un documento antiguo no tiene ni estado ni el booleano publicado,
  // no se presume visible: el administrador puede volver a mostrarlo desde la tabla.
  return null;
}

export async function obtenerFichaPublicaCurso(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const cursoIdNum = Number(req.params.cursoId);
    if (!Number.isSafeInteger(cursoIdNum) || cursoIdNum <= 0) {
      return res.status(400).json({ message: "El ID del curso no es válido." });
    }

    const curso = await cargarCursoAcademico(cursoIdNum);
    if (!curso || curso.estado === "Archivado") {
      return res.status(404).json({ message: "El curso no existe o fue retirado del catálogo académico." });
    }

    const modulos = await cargarModulosAcademicos(cursoIdNum);
    const draftRef = firestoreAdmin.collection(COLECCION_BORRADORES).doc(String(curso.id));
    const [borradorSnap, publicacion] = await Promise.all([
      draftRef.get(),
      buscarPublicacionPublica(curso.id, curso.nombre),
    ]);
    const borrador = borradorSnap.exists ? borradorSnap.data() as Record<string, unknown> : null;
    const publicData = publicacion?.data ?? null;
    const ficha = datosPublicacionDesde(borrador, publicData, curso, modulos);
    const documentId = await elegirIdDocumento(curso.id, curso.nombre, publicacion, borrador);
    ficha.documentId = documentId;

    return res.status(200).json({
      cursoAcademico: {
        id: curso.id,
        nombre: curso.nombre,
        categoria: curso.categoria ?? "",
        modalidad: curso.modalidad,
        descripcion: curso.descripcion ?? "",
        imagenPortada: curso.imagen_portada ?? "",
      },
      ficha,
      existePublicacion: Boolean(publicacion),
      estadoPublicacion: publicacion ? obtenerEstadoDocumentoPublicacion(publicacion.data) : null,
      tieneBorrador: Boolean(borrador),
    });
  } catch (error) {
    console.error("Error obteniendo la ficha pública de Talentia:", error);
    const statusCode = (error as ErrorHttp).statusCode;
    return res.status(statusCode ?? 500).json({
      message: statusCode
        ? (error as Error).message
        : "No se pudo cargar la ficha pública. Verifica la conexión con Firebase y el backend.",
    });
  }
}

export async function guardarFichaPublicaCurso(
  req: AuthenticatedRequest,
  res: Response
) {
  let archivoR2Nuevo: string | null = null;
  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const cursoIdNum = Number(req.params.cursoId);
    if (!Number.isSafeInteger(cursoIdNum) || cursoIdNum <= 0) {
      return res.status(400).json({ message: "El ID del curso no es válido." });
    }

    const datos = leerDatos(req);
    const curso = await cargarCursoAcademico(cursoIdNum);
    if (!curso || curso.estado === "Archivado") {
      return res.status(404).json({ message: "El curso no existe o fue retirado del catálogo académico." });
    }
    const modulosAcademicos = await cargarModulosAcademicos(cursoIdNum);

    const draftRef = firestoreAdmin.collection(COLECCION_BORRADORES).doc(String(curso.id));
    const [borradorSnap, publicacion] = await Promise.all([
      draftRef.get(),
      buscarPublicacionPublica(curso.id, curso.nombre),
    ]);
    const borradorAnterior = borradorSnap.exists
      ? borradorSnap.data() as Record<string, unknown>
      : null;
    const documentoAnterior = borradorAnterior ?? publicacion?.data ?? null;

    const documentId = texto(datos.documentId) ||
      await elegirIdDocumento(curso.id, curso.nombre, publicacion, borradorAnterior);
    await validarIdDocumento(curso.id, curso.nombre, documentId);

    let imagenFinal = validarReferenciaImagen(datos.image);
    let imageR2Final = obtenerImagenR2(datos.image, documentoAnterior?.image_r2);

    if (req.file) {
      const extension = req.file.mimetype === "image/png"
        ? "png"
        : req.file.mimetype === "image/webp"
          ? "webp"
          : "jpg";
      const nombreSeguro = slugifyFileName(req.file.originalname.replace(/\.[^.]+$/, ""));
      const uuid = await import("node:crypto").then(({ randomUUID }) => randomUUID());
      const key = `courses/covers/${uuid}-${nombreSeguro || "portada"}.${extension}`;
      archivoR2Nuevo = `r2://${key}`;
      await uploadBufferToR2({
        buffer: req.file.buffer,
        key,
        contentType: req.file.mimetype,
        contentLength: req.file.size,
      });
      imagenFinal = convertirImagenPublica(archivoR2Nuevo);
      imageR2Final = archivoR2Nuevo;
      if (!imagenFinal) {
        throw errorHttp("Falta configurar COURSE_IMAGES_WORKER_BASE_URL para publicar imágenes de R2.", 500);
      }
    } else if (!imagenFinal && isR2Path(texto(curso.imagen_portada))) {
      imageR2Final = texto(curso.imagen_portada);
      imagenFinal = convertirImagenPublica(curso.imagen_portada);
    } else if (!imageR2Final && isR2Path(texto(curso.imagen_portada)) &&
        imagenFinal === convertirImagenPublica(curso.imagen_portada)) {
      imageR2Final = texto(curso.imagen_portada);
    }

    // Si no hay portada académica ni se seleccionó una nueva, se usa una imagen estática común.
    if (!imagenFinal) {
      imagenFinal = IMAGEN_PORTADA_POR_DEFECTO;
    }

    const publicar = req.body?.publicar === "true" ||
      req.body?.publicar === true ||
      datos["publicar"] === true;
    const campos = construirDatosValidados(
      datos,
      modulosAcademicos,
      imagenFinal,
      imageR2Final,
      publicar
    );

    const fechaHoy = fechaActualLima();
    const fechaRegistro =
      texto(documentoAnterior?.fecha_registro) ||
      texto(publicacion?.data.fecha_registro) ||
      fechaHoy;
    const fechaActualizacion = fechaHoy;
    const cursoIdPostgres = String(curso.id);

    if (!publicar) {
      await draftRef.set({
        ...campos,
        curso_id_postgres: cursoIdPostgres,
        publicacion_id: documentId,
        estado_publicacion: "Borrador",
        fecha_registro: fechaRegistro,
        fecha_actualizacion: fechaActualizacion,
        guardado_por: String(adminId),
      }, { merge: true });

      return res.status(200).json({
        message: "El borrador de la ficha pública se guardó correctamente. La web pública no se modificó.",
        documentId,
        estado: "Borrador",
        image: campos.image,
        image_r2: campos.image_r2,
      });
    }

    const refPublica = firestoreAdmin.collection(COLECCION_PUBLICA).doc(documentId);
    const batch = firestoreAdmin.batch();
    batch.set(refPublica, {
      ...campos,
      curso_id_postgres: cursoIdPostgres,
      fecha_registro: fechaRegistro,
      fecha_actualizacion: fechaActualizacion,
      estado: "publicado",
      publicado: true,
    }, { merge: true });
    batch.delete(draftRef);
    await batch.commit();

    return res.status(200).json({
      message: publicacion
        ? "Los cambios de la ficha de Talentia se publicaron correctamente."
        : "El curso se publicó correctamente en la página de Talentia.",
      documentId,
      estado: "Publicado",
    });
  } catch (error) {
    if (archivoR2Nuevo) {
      await deleteObjectFromR2(stripR2Prefix(archivoR2Nuevo)).catch((cleanupError) => {
        console.error("No se pudo limpiar la imagen nueva tras fallar la publicación:", cleanupError);
      });
    }
    const statusCode = (error as ErrorHttp).statusCode;
    if (statusCode) {
      return res.status(statusCode).json({ message: (error as Error).message });
    }
    console.error("Error guardando la ficha pública de Talentia:", error);
    return res.status(500).json({
      message: "No se pudo guardar la ficha pública. No se modificaron los datos académicos de PostgreSQL.",
    });
  }
}


/**
 * Devuelve el estado de las fichas públicas para que la tabla del administrador
 * pueda mostrar «Editar publicación», «Ocultar» y «Eliminar» sin consultar cada curso por separado.
 */
export async function listarEstadosPublicacionCursos(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const adminId = await comprobarAdministrador(req, res);
    if (!adminId) return;

    const cursosResult = await pool.query<{ id: string; nombre: string }>(
      `SELECT id::TEXT AS id, nombre
       FROM cursos
       WHERE COALESCE(estado, '') <> 'Archivado'
       ORDER BY creado_en DESC, id DESC`
    );

    const [publicasSnapshot, borradoresSnapshot] = await Promise.all([
      firestoreAdmin.collection(COLECCION_PUBLICA).get(),
      firestoreAdmin.collection(COLECCION_BORRADORES).get(),
    ]);

    const publicas: PublicDoc[] = publicasSnapshot.docs.map((documento) => ({
      id: documento.id,
      data: documento.data() as Record<string, unknown>,
    }));
    const borradoresPorCurso = new Map(
      borradoresSnapshot.docs.map((documento) => [
        documento.id,
        documento.data() as Record<string, unknown>,
      ])
    );
    const documentosAsignados = new Set<string>();
    const estados: Record<string, {
      existePublicacion: boolean;
      estado: EstadoPublicacionTalentia | null;
      tieneBorrador: boolean;
      documentId: string | null;
    }> = {};

    for (const curso of cursosResult.rows) {
      const idCurso = String(curso.id);
      let publicacion =
        publicas.find((documento) =>
          String(documento.data.curso_id_postgres ?? "") === idCurso
        ) ?? null;

      if (!publicacion) {
        const candidato = crearSlugCurso(curso.nombre);
        publicacion = publicas.find((documento) => {
          if (documentosAsignados.has(documento.id)) return false;
          const propietario = String(documento.data.curso_id_postgres ?? "");
          if (propietario && propietario !== idCurso) return false;
          if (documento.id !== candidato) return false;
          const titulo = documento.data.title;
          return !titulo || similitudTitulos(curso.nombre, titulo) >= 0.45;
        }) ?? null;
      }

      if (!publicacion) {
        const coincidencias = publicas
          .filter((documento) => {
            if (documentosAsignados.has(documento.id)) return false;
            const propietario = String(documento.data.curso_id_postgres ?? "");
            return !propietario || propietario === idCurso;
          })
          .map((documento) => ({
            documento,
            puntuacion: similitudTitulos(curso.nombre, documento.data.title),
          }))
          .filter((item) => item.puntuacion >= 0.72)
          .sort((a, b) => b.puntuacion - a.puntuacion);

        const primera = coincidencias[0];
        const segunda = coincidencias[1];
        if (
          primera &&
          (!segunda ||
            primera.puntuacion - segunda.puntuacion >= 0.12 ||
            primera.puntuacion >= 0.9)
        ) {
          publicacion = primera.documento;
        }
      }

      if (publicacion) documentosAsignados.add(publicacion.id);
      const borrador = borradoresPorCurso.get(idCurso);

      estados[idCurso] = {
        existePublicacion: Boolean(publicacion),
        estado: publicacion
          ? obtenerEstadoDocumentoPublicacion(publicacion.data)
          : null,
        tieneBorrador: Boolean(borrador),
        documentId: publicacion?.id ??
          (typeof borrador?.publicacion_id === "string"
            ? borrador.publicacion_id
            : null),
      };
    }

    return res.status(200).json({ estados });
  } catch (error) {
    console.error("Error consultando los estados de publicación de Talentia:", error);
    const statusCode = (error as ErrorHttp).statusCode;
    return res.status(statusCode ?? 500).json({
      message: statusCode
        ? (error as Error).message
        : "No se pudieron consultar los estados de publicación de Talentia.",
    });
  }
}

export async function cambiarEstadoPublicacionCurso(
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

    const estadoSolicitado = texto(req.body?.estado).toLowerCase();
    if (estadoSolicitado !== "publicado" && estadoSolicitado !== "oculto") {
      return res.status(400).json({
        message: 'El estado de la publicación debe ser "publicado" u "oculto".',
      });
    }

    const resultadoCurso = await pool.query<{ id: string; nombre: string }>(
      `SELECT id::TEXT AS id, nombre FROM cursos WHERE id = $1 LIMIT 1`,
      [cursoId]
    );
    const curso = resultadoCurso.rows[0];
    if (!curso) {
      return res.status(404).json({ message: "El curso académico no existe." });
    }

    const publicacion = await buscarPublicacionPublica(curso.id, curso.nombre);
    if (!publicacion) {
      return res.status(404).json({
        message: "No existe una publicación en Talentia para este curso.",
      });
    }

    const estado: EstadoPublicacionTalentia = estadoSolicitado;
    await firestoreAdmin.collection(COLECCION_PUBLICA).doc(publicacion.id).set({
      estado,
      publicado: estado === "publicado",
      fecha_actualizacion: fechaActualLima(),
      actualizado_por: String(adminId),
    }, { merge: true });

    return res.status(200).json({
      message: estado === "oculto"
        ? "La publicación se ocultó en la página de Talentia. El documento se conserva en Firebase."
        : "La publicación volvió a mostrarse en la página de Talentia.",
      documentId: publicacion.id,
      estado,
    });
  } catch (error) {
    console.error("Error cambiando el estado de una publicación de Talentia:", error);
    const statusCode = (error as ErrorHttp).statusCode;
    return res.status(statusCode ?? 500).json({
      message: statusCode
        ? (error as Error).message
        : "No se pudo cambiar el estado de la publicación.",
    });
  }
}

export async function eliminarPublicacionCurso(
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

    const resultadoCurso = await pool.query<{ id: string; nombre: string }>(
      `SELECT id::TEXT AS id, nombre FROM cursos WHERE id = $1 LIMIT 1`,
      [cursoId]
    );
    const curso = resultadoCurso.rows[0];
    if (!curso) {
      return res.status(404).json({ message: "El curso académico no existe." });
    }

    const borradorRef = firestoreAdmin.collection(COLECCION_BORRADORES).doc(String(curso.id));
    const [borradorSnapshot, publicacion] = await Promise.all([
      borradorRef.get(),
      buscarPublicacionPublica(curso.id, curso.nombre),
    ]);

    if (!publicacion && !borradorSnapshot.exists) {
      return res.status(404).json({
        message: "No existe una publicación ni un borrador de Talentia para eliminar.",
      });
    }

    const batch = firestoreAdmin.batch();
    if (publicacion) {
      batch.delete(firestoreAdmin.collection(COLECCION_PUBLICA).doc(publicacion.id));
    }
    if (borradorSnapshot.exists) {
      batch.delete(borradorRef);
    }
    await batch.commit();

    console.info("Administrador eliminó la ficha de Talentia", {
      adminId,
      cursoId: curso.id,
      documentId: publicacion?.id ?? null,
    });

    return res.status(200).json({
      message: "Se eliminó la ficha de Talentia y cualquier borrador asociado de Firebase.",
    });
  } catch (error) {
    console.error("Error eliminando la publicación de Talentia:", error);
    const statusCode = (error as ErrorHttp).statusCode;
    return res.status(statusCode ?? 500).json({
      message: statusCode
        ? (error as Error).message
        : "No se pudo eliminar la publicación de Talentia.",
    });
  }
}
