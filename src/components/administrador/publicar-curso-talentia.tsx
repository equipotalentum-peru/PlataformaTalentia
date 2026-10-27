"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type ModuloFicha = {
  id: string;
  numero: number;
  titulo: string;
  orden: number;
  horas: number;
  clases: number;
};

type FichaPublica = {
  documentId: string;
  title: string;
  category: string;
  modality: string;
  descripcion_larga: string;
  image: string;
  image_r2: string;
  certificado: boolean;
  description: string;
  hours: number;
  idioma: string;
  level: string;
  servicio: string;
  modulos: ModuloFicha[];
  dirigido_a: string[];
  que_aprenderas: string[];
  fecha_registro?: string;
  fecha_actualizacion?: string;
};

type CursoAcademico = {
  id: string;
  nombre: string;
  categoria: string;
  modalidad: string;
  descripcion: string;
  imagenPortada: string;
};

type RespuestaCarga = {
  cursoAcademico: CursoAcademico;
  ficha: FichaPublica;
  existePublicacion: boolean;
  estadoPublicacion: "publicado" | "oculto" | null;
  tieneBorrador: boolean;
};

const NIVELES = [
  "Inicial",
  "Inicial/Intermedio",
  "Intermedio",
  "Intermedio/Avanzado",
  "Avanzado",
];

const MODALIDADES = [
  "Online sincrónico",
  "Presencial",
  "Híbrido",
];

const SERVICIOS = [
  "Especializaciones Profesionales",
  "Formación Corporativa",
];

const IMAGEN_PORTADA_POR_DEFECTO =
  "/assets/images/cursos/curso-sin-portada.svg";

const inputClass =
  "w-full rounded-xl border border-talentia-border bg-white px-4 py-3 text-sm font-medium text-talentia-primary outline-none transition placeholder:text-talentia-placeholder focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15";
const labelClass =
  "mb-2 block text-[13px] font-bold text-talentia-primary";

function normalizarLista(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? ""))
    : [];
}

export default function PublicarCursoTalentia({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const [carga, setCarga] = useState<RespuestaCarga | null>(null);
  const [ficha, setFicha] = useState<FichaPublica | null>(null);
  const [paso, setPaso] = useState(1);
  const [imagenPortada, setImagenPortada] = useState<File | null>(null);
  const [vistaPreviaImagen, setVistaPreviaImagen] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    return () => {
      if (vistaPreviaImagen?.startsWith("blob:")) {
        URL.revokeObjectURL(vistaPreviaImagen);
      }
    };
  }, [vistaPreviaImagen]);

  const cargarFicha = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      setAviso("");

      const response = await fetch(
        `${API_URL}/administrador/cursos/${encodeURIComponent(cursoId)}/publicacion-talentia`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo cargar la ficha comercial del curso.");
      }

      const respuesta = data as RespuestaCarga;
      const fichaRecibida = respuesta.ficha;
      setCarga(respuesta);
      setFicha({
        ...fichaRecibida,
        modulos: Array.isArray(fichaRecibida.modulos) ? fichaRecibida.modulos : [],
        dirigido_a: normalizarLista(fichaRecibida.dirigido_a),
        que_aprenderas: normalizarLista(fichaRecibida.que_aprenderas),
        idioma: "Español",
      });
      setImagenPortada(null);
      setVistaPreviaImagen(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la ficha comercial del curso."
      );
    } finally {
      setCargando(false);
    }
  }, [cursoId, router]);

  useEffect(() => {
    void cargarFicha();
  }, [cargarFicha]);

  const cambioTexto = (
    campo: "title" | "category" | "modality" | "descripcion_larga" |
      "description" | "level" | "servicio",
    valor: string
  ) => {
    setFicha((actual) => actual ? { ...actual, [campo]: valor } : actual);
    setError("");
    setAviso("");
  };

  const cambiarModulo = (
    id: string,
    campo: "horas" | "clases",
    valor: string
  ) => {
    const numero = valor === "" ? 0 : Number(valor);
    setFicha((actual) => actual ? {
      ...actual,
      modulos: actual.modulos.map((modulo) =>
        modulo.id === id
          ? { ...modulo, [campo]: Number.isFinite(numero) ? numero : 0 }
          : modulo
      ),
    } : actual);
    setError("");
  };

  const cambiarElementoLista = (
    campo: "dirigido_a" | "que_aprenderas",
    indice: number,
    valor: string
  ) => {
    setFicha((actual) => {
      if (!actual) return actual;
      const lista = [...actual[campo]];
      lista[indice] = valor;
      return { ...actual, [campo]: lista };
    });
  };

  const agregarElementoLista = (campo: "dirigido_a" | "que_aprenderas") => {
    setFicha((actual) => actual ? { ...actual, [campo]: [...actual[campo], ""] } : actual);
  };

  const eliminarElementoLista = (
    campo: "dirigido_a" | "que_aprenderas",
    indice: number
  ) => {
    setFicha((actual) => actual ? {
      ...actual,
      [campo]: actual[campo].filter((_, index) => index !== indice),
    } : actual);
  };

  const cambiarImagen = (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.currentTarget.files?.[0] ?? null;
    setError("");
    setAviso("");

    if (!archivo) {
      setImagenPortada(null);
      setVistaPreviaImagen(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      setError("Selecciona una imagen JPG, PNG o WebP.");
      event.currentTarget.value = "";
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5 MB.");
      event.currentTarget.value = "";
      return;
    }

    if (vistaPreviaImagen?.startsWith("blob:")) {
      URL.revokeObjectURL(vistaPreviaImagen);
    }
    setImagenPortada(archivo);
    setVistaPreviaImagen(URL.createObjectURL(archivo));
  };

  const problemasPasoUno = useMemo(() => {
    if (!ficha) return [];
    const problemas: string[] = [];
    if (!ficha.title.trim()) problemas.push("Escribe el nombre del curso.");
    if (!ficha.category.trim()) problemas.push("Completa la categoría.");
    if (!ficha.modality.trim()) problemas.push("Selecciona la modalidad.");
    if (!ficha.descripcion_larga.trim()) problemas.push("Completa la descripción extensa.");
    if (!ficha.description.trim()) problemas.push("Escribe el lema del curso.");
    if (!ficha.level) problemas.push("Selecciona el nivel del curso.");
    if (!ficha.servicio) problemas.push("Selecciona el servicio.");
    if (!Number.isInteger(Number(ficha.hours)) || Number(ficha.hours) <= 0) {
      problemas.push("Las horas generales deben ser mayores que cero.");
    }
    return problemas;
  }, [ficha]);

  const totalHorasModulos = useMemo(
    () => ficha?.modulos.reduce((suma, modulo) => suma + (Number(modulo.horas) || 0), 0) ?? 0,
    [ficha]
  );
  const horasModulosCoinciden = Boolean(
    ficha &&
    Number.isInteger(Number(ficha.hours)) &&
    Number(ficha.hours) > 0 &&
    totalHorasModulos === Number(ficha.hours)
  );

  const validarPasoUno = () => {
    if (problemasPasoUno.length > 0) {
      setError(problemasPasoUno[0]);
      return false;
    }
    setError("");
    return true;
  };

  const validarPasoDos = () => {
    if (!ficha) return false;
    if (ficha.modulos.length === 0) {
      setError("El curso debe tener al menos un módulo creado por el docente.");
      return false;
    }
    if (!horasModulosCoinciden) {
      setError(
        `Las horas de los módulos suman ${totalHorasModulos} y deben coincidir exactamente con las ${Number(ficha.hours) || 0} horas generales.`
      );
      return false;
    }
    const moduloInvalido = ficha.modulos.find(
      (modulo) =>
        !Number.isInteger(Number(modulo.horas)) ||
        !Number.isInteger(Number(modulo.clases)) ||
        Number(modulo.horas) <= 0 ||
        Number(modulo.clases) <= 0
    );
    if (moduloInvalido) {
      setError(`Completa las horas y clases del módulo ${moduloInvalido.numero}. Ambas cantidades deben ser números enteros mayores que cero.`);
      return false;
    }
    setError("");
    return true;
  };

  const guardar = async (publicar: boolean) => {
    if (!ficha || !carga) return;

    setError("");
    setAviso("");

    if (publicar) {
      if (!validarPasoUno()) {
        setPaso(1);
        return;
      }
      if (ficha.modulos.length === 0) {
        setError("El curso debe tener al menos un módulo creado por el docente.");
        setPaso(2);
        return;
      }
      const sumaHorasModulos = ficha.modulos.reduce(
        (suma, modulo) => suma + (Number(modulo.horas) || 0),
        0
      );
      if (sumaHorasModulos !== Number(ficha.hours)) {
        setError(
          `Las horas de los módulos suman ${sumaHorasModulos} y deben coincidir exactamente con las ${Number(ficha.hours) || 0} horas generales.`
        );
        setPaso(2);
        return;
      }
      const moduloInvalido = ficha.modulos.find(
        (modulo) =>
          !Number.isInteger(Number(modulo.horas)) ||
          !Number.isInteger(Number(modulo.clases)) ||
          Number(modulo.horas) <= 0 ||
          Number(modulo.clases) <= 0
      );
      if (moduloInvalido) {
        setError(`Completa las horas y clases del módulo ${moduloInvalido.numero}. Ambas cantidades deben ser mayores que cero.`);
        setPaso(2);
        return;
      }
      if (!ficha.dirigido_a.some((item) => item.trim())) {
        setError("Agrega al menos un elemento en «¿A quiénes va dirigido?»."); 
        setPaso(3);
        return;
      }
      if (!ficha.que_aprenderas.some((item) => item.trim())) {
        setError("Agrega al menos un aprendizaje antes de publicar.");
        setPaso(3);
        return;
      }
      if (!ficha.image && !imagenPortada) {
        setError("Selecciona una imagen de portada antes de publicar.");
        setPaso(1);
        return;
      }
    }

    const payload = {
      documentId: ficha.documentId,
      title: ficha.title.trim(),
      category: ficha.category.trim(),
      modality: ficha.modality,
      descripcion_larga: ficha.descripcion_larga.trim(),
      image: ficha.image,
      certificado: ficha.certificado,
      description: ficha.description.trim(),
      hours: Number(ficha.hours) || 0,
      idioma: "Español",
      level: ficha.level,
      servicio: ficha.servicio,
      modulos: ficha.modulos.map((modulo) => ({
        id: modulo.id,
        horas: Number(modulo.horas) || 0,
        clases: Number(modulo.clases) || 0,
      })),
      dirigido_a: ficha.dirigido_a.map((item) => item.trim()).filter(Boolean),
      que_aprenderas: ficha.que_aprenderas.map((item) => item.trim()).filter(Boolean),
      publicar,
    };

    const formData = new FormData();
    formData.append("datos", JSON.stringify(payload));
    if (imagenPortada) formData.append("imagenPortada", imagenPortada);

    setGuardando(true);
    try {
      const response = await fetch(
        `${API_URL}/administrador/cursos/${encodeURIComponent(cursoId)}/publicacion-talentia`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        }
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo guardar la ficha pública.");
      }

      setAviso(data.message ?? (publicar ? "Ficha publicada correctamente." : "Borrador guardado correctamente."));
      if (publicar) {
        router.push("/administrador/cursos");
        router.refresh();
      } else {
        // Al guardar borrador, recargar los metadatos para conservar el ID estable
        // sin perder las modificaciones que siguen en la interfaz.
        setFicha((actual) => actual ? {
          ...actual,
          documentId: data.documentId ?? actual.documentId,
          image: typeof data.image === "string" ? data.image : actual.image,
          image_r2: typeof data.image_r2 === "string" ? data.image_r2 : actual.image_r2,
        } : actual);
        if (vistaPreviaImagen?.startsWith("blob:")) {
          URL.revokeObjectURL(vistaPreviaImagen);
        }
        setImagenPortada(null);
        setVistaPreviaImagen(null);
        setCarga((actual) => actual ? { ...actual, tieneBorrador: true } : actual);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No se pudo guardar la ficha pública."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="mx-auto max-w-5xl p-10 text-center text-sm font-semibold text-talentia-muted">Cargando datos del curso y su ficha pública…</div>;
  }

  if (error && !ficha) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 rounded-3xl border border-talentia-border bg-talentia-surface p-8">
        <p role="alert" className="text-sm font-semibold text-talentia-danger">{error}</p>
        <button type="button" onClick={() => router.push("/administrador/cursos")} className="app-back-link">
          <span aria-hidden="true">{"<"}</span> Volver a cursos
        </button>
        <button type="button" onClick={() => void cargarFicha()} className="rounded-xl bg-talentia-action px-4 py-2 text-sm font-bold text-white">Reintentar</button>
      </div>
    );
  }

  if (!ficha || !carga) return null;

  const imagenVisible = vistaPreviaImagen ??
    (/^https?:\/\//i.test(ficha.image) || /^\/assets\//i.test(ficha.image)
      ? ficha.image
      : IMAGEN_PORTADA_POR_DEFECTO);

  const estadoPublicacion = carga.existePublicacion
    ? carga.estadoPublicacion !== "publicado"
      ? (carga.tieneBorrador
        ? "Publicación oculta · hay un borrador guardado"
        : "Publicación oculta")
      : (carga.tieneBorrador
        ? "Publicación en línea · hay un borrador guardado"
        : "Publicación en línea")
    : carga.tieneBorrador
      ? "Borrador guardado"
      : "Todavía no publicado";

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-10">
      <div>
        <button
          type="button"
          onClick={() => router.push("/administrador/cursos")}
          className="app-back-link mb-3"
        >
          <span aria-hidden="true">{"<"}</span> Volver a cursos
        </button>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-talentia-primary">
              {carga.existePublicacion
                ? "Editar publicación en Talentia"
                : carga.tieneBorrador
                  ? "Editar borrador de publicación en Talentia"
                  : "Publicar en página Talentia"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-talentia-muted">
              Completa la ficha comercial que verá el público. Los cambios se guardan en Firebase y no modifican los datos académicos de PostgreSQL.
            </p>
          </div>
          <span className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-extrabold ${
            carga.existePublicacion && carga.estadoPublicacion === "publicado"
              ? "bg-talentia-success-bg text-talentia-success"
              : carga.existePublicacion || carga.tieneBorrador
                ? "bg-talentia-purple-soft text-talentia-purple"
                : "bg-talentia-surface text-talentia-muted"
          }`}>
            {estadoPublicacion}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-talentia-border bg-talentia-surface p-4 shadow-sm sm:p-6">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2 sm:gap-5">
          {[
            { numero: 1, label: "Datos generales" },
            { numero: 2, label: "Módulos" },
            { numero: 3, label: "Público y aprendizajes" },
          ].map((item, index) => (
            <button
              key={item.numero}
              type="button"
              onClick={() => {
                if (item.numero <= paso) {
                  setPaso(item.numero);
                  setError("");
                }
              }}
              className="group text-left"
            >
              <div className="mb-3 flex items-center">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                  paso === item.numero
                    ? "bg-talentia-action text-white"
                    : paso > item.numero
                      ? "bg-talentia-success-bg text-talentia-success"
                      : "bg-talentia-hover text-talentia-muted"
                }`}>
                  {paso > item.numero ? "✓" : item.numero}
                </span>
                {index < 2 && <span className={`ml-2 h-1 flex-1 rounded-full ${paso > item.numero ? "bg-talentia-success" : "bg-talentia-border"}`} />}
              </div>
              <span className={`text-xs font-extrabold sm:text-sm ${paso === item.numero ? "text-talentia-primary" : "text-talentia-muted"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {paso === 1 && (
        <section className="space-y-6 rounded-3xl border border-talentia-border bg-talentia-surface p-5 shadow-sm sm:p-8">
          <div>
            <h2 className="text-xl font-extrabold text-talentia-primary">Datos generales</h2>
            <p className="mt-1 text-sm text-talentia-muted">Información comercial de la ficha pública. Editar estos campos no altera el curso académico del LMS.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="title">Nombre del curso</label>
              <input id="title" className={inputClass} maxLength={200} value={ficha.title} onChange={(event) => cambioTexto("title", event.target.value)} placeholder="Nombre visible en la web pública" />
            </div>
            <div>
              <label className={labelClass} htmlFor="category">Categoría</label>
              <input id="category" className={inputClass} maxLength={120} value={ficha.category} onChange={(event) => cambioTexto("category", event.target.value)} placeholder="Ej. Recursos Humanos y Gestión Laboral" />
            </div>
            <div>
              <label className={labelClass} htmlFor="modality">Modalidad</label>
              <select id="modality" className={inputClass} value={ficha.modality} onChange={(event) => cambioTexto("modality", event.target.value)}>
                <option value="">Selecciona modalidad</option>
                {MODALIDADES.map((modalidad) => <option key={modalidad} value={modalidad}>{modalidad}</option>)}
              </select>
              <p className="mt-1 text-xs text-talentia-muted">La modalidad académica «Virtual» se muestra como «Online sincrónico» en la web.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="level">Nivel del curso</label>
              <select id="level" className={inputClass} value={ficha.level} onChange={(event) => cambioTexto("level", event.target.value)}>
                <option value="">Selecciona nivel</option>
                {NIVELES.map((nivel) => <option key={nivel} value={nivel}>{nivel}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="servicio">Servicio</label>
              <select id="servicio" className={inputClass} value={ficha.servicio} onChange={(event) => cambioTexto("servicio", event.target.value)}>
                <option value="">Selecciona servicio</option>
                {SERVICIOS.map((servicio) => <option key={servicio} value={servicio}>{servicio}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="hours">Horas generales</label>
              <input id="hours" type="number" min={1} step={1} className={inputClass} value={ficha.hours} onChange={(event) => setFicha((actual) => actual ? { ...actual, hours: event.target.value === "" ? 0 : Number(event.target.value) } : actual)} />
              <p className="mt-1 text-xs text-talentia-muted">Tiempo estimado para completar los contenidos, sin contar las clases por Zoom.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="certificado">¿Incluye certificado?</label>
              <select id="certificado" className={inputClass} value={ficha.certificado ? "si" : "no"} onChange={(event) => setFicha((actual) => actual ? { ...actual, certificado: event.target.value === "si" } : actual)}>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="idioma">Idioma</label>
              <input id="idioma" className={`${inputClass} cursor-not-allowed bg-talentia-hover`} value="Español" readOnly />
              <p className="mt-1 text-xs text-talentia-muted">Este campo está fijo para los cursos actuales.</p>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="description">Lema del curso</label>
            <input id="description" className={inputClass} maxLength={500} value={ficha.description} onChange={(event) => cambioTexto("description", event.target.value)} placeholder="Frase breve que aparecerá en el catálogo" />
          </div>

          <div>
            <label className={labelClass} htmlFor="descripcion_larga">Descripción</label>
            <textarea id="descripcion_larga" className={`${inputClass} min-h-36 resize-y`} maxLength={10000} value={ficha.descripcion_larga} onChange={(event) => cambioTexto("descripcion_larga", event.target.value)} placeholder="Describe el programa, sus contenidos y el resultado esperado." />
            <p className="mt-1 text-right text-xs text-talentia-muted">{ficha.descripcion_larga.length}/10000</p>
          </div>

          <div>
            <label className={labelClass} htmlFor="imagenPortada">Imagen de portada</label>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="flex min-h-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-talentia-border bg-talentia-hover p-3">
                {imagenVisible ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagenVisible}
                    alt="Vista previa de la portada del curso"
                    className="max-h-64 w-full rounded-xl object-contain"
                    onError={(event) => {
                      if (!event.currentTarget.src.endsWith(IMAGEN_PORTADA_POR_DEFECTO)) {
                        event.currentTarget.src = IMAGEN_PORTADA_POR_DEFECTO;
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-sm text-talentia-muted">
                    <span className="mb-2 block text-2xl" aria-hidden="true">▧</span>
                    <span>La portada actual usa una ruta de la web pública o aún no se ha seleccionado una imagen.</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input id="imagenPortada" type="file" accept="image/jpeg,image/png,image/webp" onChange={cambiarImagen} className="block w-full text-sm text-talentia-muted file:mr-3 file:rounded-xl file:border-0 file:bg-talentia-selected file:px-4 file:py-3 file:text-xs file:font-extrabold file:text-talentia-primary hover:file:bg-talentia-hover" />
                <p className="text-xs text-talentia-muted">Formatos JPG, PNG o WebP; máximo 5 MB. La nueva imagen se subirá a R2 y se guardará su URL pública en Firebase.</p>
                {imagenPortada && <p className="rounded-xl bg-talentia-success-bg p-3 text-xs font-bold text-talentia-success">Nueva portada seleccionada: {imagenPortada.name}</p>}
                {ficha.image && <p className="break-all rounded-xl bg-talentia-hover p-3 text-xs text-talentia-muted">Imagen guardada: {ficha.image}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-talentia-border pt-5">
            <button type="button" onClick={() => { if (validarPasoUno()) setPaso(2); }} className="rounded-xl bg-talentia-action px-7 py-3 text-sm font-extrabold text-white transition hover:bg-talentia-primary">Siguiente: Módulos →</button>
          </div>
        </section>
      )}

      {paso === 2 && (
        <section className="space-y-6 rounded-3xl border border-talentia-border bg-talentia-surface p-5 shadow-sm sm:p-8">
          <div>
            <h2 className="text-xl font-extrabold text-talentia-primary">Módulos</h2>
            <p className="mt-1 text-sm text-talentia-muted">Los nombres y números vienen de los módulos académicos creados por el docente. Solo puedes modificar las horas y la cantidad de clases de la ficha pública.</p>
          </div>

          {ficha.modulos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-talentia-border p-8 text-center">
              <p className="font-bold text-talentia-primary">Este curso todavía no tiene módulos activos.</p>
              <p className="mt-2 text-sm text-talentia-muted">Primero deben crearse desde el curso académico del docente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-talentia-border">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-talentia-table-header text-xs font-extrabold text-talentia-primary">
                    <th className="px-4 py-4">Nombre del módulo</th>
                    <th className="w-28 px-4 py-4">N.º de orden</th>
                    <th className="w-40 px-4 py-4">Horas del módulo</th>
                    <th className="w-44 px-4 py-4">Cantidad de clases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-talentia-border">
                  {ficha.modulos.map((modulo) => (
                    <tr key={modulo.id} className="align-middle">
                      <td className="px-4 py-4">
                        <p className="font-bold text-talentia-primary">{modulo.titulo}</p>
                        <p className="mt-1 text-xs text-talentia-muted">Nombre de origen académico · Solo lectura</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-talentia-muted">{modulo.numero}</td>
                      <td className="px-4 py-4">
                        <input aria-label={`Horas del módulo ${modulo.numero}`} type="number" min={0} max={10000} step={1} className={inputClass} value={modulo.horas} onChange={(event) => cambiarModulo(modulo.id, "horas", event.target.value)} />
                      </td>
                      <td className="px-4 py-4">
                        <input aria-label={`Cantidad de clases del módulo ${modulo.numero}`} type="number" min={0} max={10000} step={1} className={inputClass} value={modulo.clases} onChange={(event) => cambiarModulo(modulo.id, "clases", event.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-talentia-border pt-5 sm:flex-row">
            <button type="button" onClick={() => { setPaso(1); setError(""); }} className="rounded-xl border border-talentia-border px-6 py-3 text-sm font-extrabold text-talentia-primary hover:bg-talentia-hover">← Anterior</button>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <p
                role="status"
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  horasModulosCoinciden
                    ? "bg-talentia-success-bg text-talentia-success"
                    : "bg-talentia-danger-bg text-talentia-danger"
                }`}
              >
                Horas de los módulos: <strong>{totalHorasModulos}</strong> de{" "}
                <strong>{Number(ficha.hours) || 0}</strong> horas generales.
                {!horasModulosCoinciden && (
                  <span className="mt-1 block">
                    Para continuar, la suma debe ser exactamente igual a las horas generales.
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => { if (validarPasoDos()) setPaso(3); }}
                disabled={!horasModulosCoinciden || guardando}
                className="rounded-xl bg-talentia-action px-7 py-3 text-sm font-extrabold text-white transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente: Público y aprendizajes →
              </button>
            </div>
          </div>
        </section>
      )}

      {paso === 3 && (
        <section className="space-y-8 rounded-3xl border border-talentia-border bg-talentia-surface p-5 shadow-sm sm:p-8">
          <div>
            <h2 className="text-xl font-extrabold text-talentia-primary">¿A quiénes va dirigido y qué aprenderán?</h2>
            <p className="mt-1 text-sm text-talentia-muted">Cada elemento se guarda como una entrada independiente del array en Firestore.</p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-talentia-primary">¿A quiénes va dirigido?</h3>
              <p className="mt-1 text-sm text-talentia-muted">Describe los perfiles de personas que pueden aprovechar este curso.</p>
            </div>
            {ficha.dirigido_a.map((item, index) => (
              <div key={`dirigido-${index}`} className="flex items-start gap-2">
                <label className="sr-only" htmlFor={`dirigido-${index}`}>Público objetivo {index + 1}</label>
                <input id={`dirigido-${index}`} className={inputClass} maxLength={500} value={item} onChange={(event) => cambiarElementoLista("dirigido_a", index, event.target.value)} placeholder={`Público objetivo ${index + 1}`} />
                <button type="button" aria-label={`Eliminar público objetivo ${index + 1}`} onClick={() => eliminarElementoLista("dirigido_a", index)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-talentia-border text-lg font-bold text-talentia-danger hover:bg-talentia-danger-bg">×</button>
              </div>
            ))}
            <button type="button" onClick={() => agregarElementoLista("dirigido_a")} className="rounded-xl border border-talentia-border px-4 py-2.5 text-sm font-extrabold text-talentia-primary transition hover:bg-talentia-hover">+ Agregar público objetivo</button>
          </div>

          <div className="space-y-4 border-t border-talentia-border pt-7">
            <div>
              <h3 className="text-base font-extrabold text-talentia-primary">¿Qué aprenderán?</h3>
              <p className="mt-1 text-sm text-talentia-muted">Agrega los resultados de aprendizaje que se mostrarán en el detalle público del curso.</p>
            </div>
            {ficha.que_aprenderas.map((item, index) => (
              <div key={`aprendizaje-${index}`} className="flex items-start gap-2">
                <label className="sr-only" htmlFor={`aprendizaje-${index}`}>Aprendizaje {index + 1}</label>
                <input id={`aprendizaje-${index}`} className={inputClass} maxLength={500} value={item} onChange={(event) => cambiarElementoLista("que_aprenderas", index, event.target.value)} placeholder={`Aprendizaje ${index + 1}`} />
                <button type="button" aria-label={`Eliminar aprendizaje ${index + 1}`} onClick={() => eliminarElementoLista("que_aprenderas", index)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-talentia-border text-lg font-bold text-talentia-danger hover:bg-talentia-danger-bg">×</button>
              </div>
            ))}
            <button type="button" onClick={() => agregarElementoLista("que_aprenderas")} className="rounded-xl border border-talentia-border px-4 py-2.5 text-sm font-extrabold text-talentia-primary transition hover:bg-talentia-hover">+ Agregar aprendizaje</button>
          </div>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-talentia-border pt-5 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => { setPaso(2); setError(""); }} disabled={guardando} className="rounded-xl border border-talentia-border px-6 py-3 text-sm font-extrabold text-talentia-primary hover:bg-talentia-hover disabled:opacity-50">← Anterior</button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void guardar(false)} disabled={guardando} className="rounded-xl border border-talentia-border px-6 py-3 text-sm font-extrabold text-talentia-purple hover:bg-talentia-hover disabled:opacity-50">{guardando ? "Guardando…" : "Guardar borrador"}</button>
              <button type="button" onClick={() => void guardar(true)} disabled={guardando} className="rounded-xl bg-talentia-action px-7 py-3 text-sm font-extrabold text-white transition hover:bg-talentia-primary disabled:opacity-50">{guardando ? "Publicando…" : carga.existePublicacion ? "Guardar cambios y publicar" : carga.tieneBorrador ? "Publicar el borrador en Talentia" : "Publicar en página Talentia"}</button>
            </div>
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-2xl border border-talentia-danger/20 bg-talentia-danger-bg px-5 py-4 text-sm font-semibold text-talentia-danger">{error}</p>
      )}
      {aviso && (
        <p role="status" className="rounded-2xl border border-talentia-success/20 bg-talentia-success-bg px-5 py-4 text-sm font-semibold text-talentia-success">{aviso}</p>
      )}

      <div className="rounded-2xl border border-talentia-border bg-talentia-surface p-4 text-xs leading-5 text-talentia-muted">
        <strong className="text-talentia-primary">Separación de datos:</strong> el nombre, categoría, modalidad, descripción, portada, horas, módulos y listas aquí editados se guardan en Firebase. Los nombres y el orden de los módulos se vuelven a leer desde PostgreSQL, y la ficha no actualiza la información académica.
      </div>
    </div>
  );
}
