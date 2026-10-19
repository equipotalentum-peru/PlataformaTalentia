"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import type { ComponenteCalificacionDraft, DocenteDisponible } from "@/lib/cursos-admin-types";
import ConfigurarCurso from "./configurar-curso";
import AsignarDocente from "./asignar-docente";
import VistaPublicarCurso from "@/components/administrador/vista-publicar-curso";
import { resolverImagenPortadaCurso } from "@/lib/curso-imagen";

type PeriodoAcademicoOption = {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

export default function CrearCurso({
  cursoId,
}: {
  cursoId?: string;
}) {
  const modoEdicion = Boolean(cursoId);
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState({
    nombreCurso: "",
    codigo: "",
    cupos: "80",
    categoria: "Diseño",
    modalidad: "Virtual",
    descripcion: "",
    periodoId: "",
  });
  const [evaluaciones, setEvaluaciones] = useState<ComponenteCalificacionDraft[]>([
    { id: "1", nombre: "Examen 1", porcentaje: "20" },
    { id: "2", nombre: "Examen 2", porcentaje: "20" },
    { id: "3", nombre: "Proyecto final", porcentaje: "50" },
  ]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<DocenteDisponible | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [imagenPortada, setImagenPortada] = useState<File | null>(null);
  const [vistaPreviaImagen, setVistaPreviaImagen] = useState<string | null>(null);
  const [errorImagen, setErrorImagen] = useState("");
  const [cargandoCurso, setCargandoCurso] = useState(Boolean(cursoId));
  const [errorCargaCurso, setErrorCargaCurso] = useState("");
  const [imagenExistente, setImagenExistente] = useState<string | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoAcademicoOption[]>([]);
  const [cargandoPeriodos, setCargandoPeriodos] = useState(true);
  const [errorPeriodos, setErrorPeriodos] = useState("");

  useEffect(() => {
    return () => {
      if (vistaPreviaImagen?.startsWith("blob:")) {
        URL.revokeObjectURL(vistaPreviaImagen);
      }
    };
  }, [vistaPreviaImagen]);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarPeriodos() {
      try {
        setCargandoPeriodos(true);
        setErrorPeriodos("");

        const response = await fetch(
          `${API_URL}/administrador/periodos`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ?? "No se pudieron cargar los periodos académicos."
          );
        }

        setPeriodos(
          Array.isArray(data.periodos) ? data.periodos : []
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        setErrorPeriodos(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los periodos académicos."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargandoPeriodos(false);
        }
      }
    }

    void cargarPeriodos();

    return () => controller.abort();
  }, [router]);

  const handleImagenPortadaChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivo = e.currentTarget.files?.[0] ?? null;

    setErrorImagen("");

    if (!archivo) {
      setImagenPortada(null);
      setVistaPreviaImagen(null);
      return;
    }

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(archivo.type)) {
      setErrorImagen("Selecciona una imagen JPG, PNG o WebP.");
      setImagenPortada(null);
      setVistaPreviaImagen(null);
      e.currentTarget.value = "";
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setErrorImagen("La imagen no debe superar los 5 MB.");
      setImagenPortada(null);
      setVistaPreviaImagen(null);
      e.currentTarget.value = "";
      return;
    }

    setImagenPortada(archivo);
    setVistaPreviaImagen(URL.createObjectURL(archivo));
  };
  
  
  
  useEffect(() => {
    const idCursoSeguro: string = String(cursoId ?? "").trim();

    if (idCursoSeguro.length === 0) return;

    const controller = new AbortController();

    async function cargarCursoParaEditar() {
      try {
        setCargandoCurso(true);
        setErrorCargaCurso("");

        const response = await fetch(
          `${API_URL}/administrador/cursos/${encodeURIComponent(idCursoSeguro)}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ?? "No se pudieron cargar los datos del curso."
          );
        }

        const curso = data.curso;

        if (!curso) {
          throw new Error("El backend no devolvió los datos del curso.");
        }

        setFormData({
          nombreCurso: curso.nombreCurso ?? "",
          codigo: curso.codigo ?? "",
          cupos: String(curso.cupos ?? ""),
          categoria: curso.categoria ?? "Diseño",
          modalidad: curso.modalidad ?? "Virtual",
          descripcion: curso.descripcion ?? "",
          periodoId: String(curso.periodoId ?? ""),
        });

        const portada: string | null = curso.imagenPortada ?? null;

        setImagenExistente(portada);
        setImagenPortada(null);

        setVistaPreviaImagen(
          portada
            ? resolverImagenPortadaCurso(portada, curso.id)
            : null
        );

        setEvaluaciones(
          Array.isArray(data.evaluaciones)
            ? data.evaluaciones.map(
                (item: {
                  id: string;
                  nombre: string;
                  porcentaje: string | number | null;
                }) => ({
                  id: String(item.id),
                  nombre: item.nombre,
                  porcentaje:
                    item.porcentaje == null
                      ? ""
                      : String(item.porcentaje),
                })
              )
            : []
        );

        setDocenteSeleccionado(data.docente ?? null);
      } catch (error) {
        if (controller.signal.aborted) return;

        setErrorCargaCurso(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos del curso."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargandoCurso(false);
        }
      }
    }

    void cargarCursoParaEditar();

    return () => controller.abort();
  }, [cursoId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarCurso = async (publicar: boolean) => {
    setErrorGuardar("");

    if (!formData.nombreCurso.trim() || !formData.codigo.trim() || !formData.descripcion.trim()) {
      setErrorGuardar("Completa el nombre, código y descripción del curso antes de guardar.");
      return;
    }

    if (!Number.isInteger(Number(formData.cupos)) || Number(formData.cupos) <= 0) {
      setErrorGuardar("Los cupos deben ser un número entero mayor que cero.");
      return;
    }

    if (publicar && !formData.periodoId) {
      setErrorGuardar(
        "Selecciona un periodo académico activo antes de publicar el curso."
      );
      return;
    }

    const filasConDatos = evaluaciones.filter(
      (item) => item.nombre.trim() || item.porcentaje.trim()
    );

    if (filasConDatos.some((item) => !item.nombre.trim())) {
      setErrorGuardar("Completa el nombre de cada evaluación que tenga porcentaje.");
      return;
    }

    const componentes = filasConDatos.map((item) => ({
      id: item.id,
      nombre: item.nombre.trim(),
      porcentaje:
        item.porcentaje.trim() === ""
          ? null
          : Number(item.porcentaje),
    }));

    if (publicar) {
      if (!docenteSeleccionado) {
        setErrorGuardar("Asigna un docente antes de publicar el curso.");
        return;
      }

      if (componentes.length === 0 || componentes.some((item) => item.porcentaje === null || !Number.isFinite(item.porcentaje))) {
        setErrorGuardar("Completa el porcentaje de todas las evaluaciones antes de publicar.");
        return;
      }

      const total = componentes.reduce((suma, item) => suma + (item.porcentaje ?? 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        setErrorGuardar(`Los porcentajes deben sumar 100 %. Actualmente suman ${total} %.`);
        return;
      }
    }

    const datos = {
      nombreCurso: formData.nombreCurso.trim(),
      codigo: formData.codigo.trim(),
      categoria: formData.categoria,
      modalidad: formData.modalidad,
      descripcion: formData.descripcion.trim(),
      cupos: Number(formData.cupos),
      periodoId: formData.periodoId || null,
      docenteId: docenteSeleccionado?.id ?? null,
      componentes,
      publicar,
    };

    const form = new FormData();
    form.append("datos", JSON.stringify(datos));
    if (imagenPortada) form.append("imagenPortada", imagenPortada);

    setGuardando(true);
    try {
      const url = cursoId
        ? `${API_URL}/administrador/cursos/${encodeURIComponent(cursoId)}`
        : `${API_URL}/administrador/cursos`;

      const response = await fetch(url, {
        method: cursoId ? "PATCH" : "POST",
        credentials: "include",
        body: form,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo guardar el curso.");
      }

      router.push("/administrador/cursos");
      router.refresh();
    } catch (error) {
      setErrorGuardar(error instanceof Error ? error.message : "No se pudo guardar el curso.");
    } finally {
      setGuardando(false);
    }
  };

  const handleContinuarPasoUno = () => {
    setErrorGuardar("");

    if (!formData.nombreCurso.trim() || !formData.codigo.trim() || !formData.descripcion.trim()) {
      setErrorGuardar("Completa el nombre, código y descripción del curso para continuar.");
      return;
    }

    if (!Number.isInteger(Number(formData.cupos)) || Number(formData.cupos) <= 0) {
      setErrorGuardar("Los cupos deben ser un número entero mayor que cero.");
      return;
    }

    setStep(2);
  };

  if (modoEdicion && cargandoCurso) {
    return (
      <div className="mx-auto w-full max-w-[1600px] p-8 text-center text-talentia-muted">
        Cargando datos del curso...
      </div>
    );
  }

  if (modoEdicion && errorCargaCurso) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-4 p-8">
        <p role="alert" className="text-sm font-semibold text-talentia-danger">
          {errorCargaCurso}
        </p>

        <button
          type="button"
          onClick={() => router.push("/administrador/cursos")}
          className="app-back-link"
        >
          <span aria-hidden="true">{"<"}</span>
          Volver a cursos
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-10">
      {/* Enlace de regreso y Encabezado según el paso */}
      <div className="mb-6">
        <Link
          href="/administrador/cursos"
          className="app-back-link mb-2"
        >
          <span aria-hidden="true">{"<"}</span>
          Volver a cursos
        </Link>
        <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">
          {modoEdicion ? step === 4 ? "Revisar cambios" : "Editar curso" : step === 4 ? "Publicar curso" : "Crear curso"}
        </h1>
        <p className="text-xs font-semibold text-talentia-muted mt-1">
          {modoEdicion
            ? "Actualiza los datos del curso, su sistema de calificación y el docente responsable."
            : step === 4
              ? "Revisión final antes de activar el curso para alumnos."
              : "Registro inicial antes de configurar contenido y docentes."}
        </p>
      </div>

      {/* Stepper Global (Visualización para Pasos 1, 2 y 3) */}
      {step <= 3 && (
        <div className="bg-talentia-surface rounded-3xl p-6 shadow-sm border border-talentia-border mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div
              className={`text-xs font-extrabold ${
                step >= 1 ? "text-talentia-primary" : "text-talentia-placeholder"
              }`}
            >
              1. Datos del curso
            </div>
            <div className="h-[2px] bg-talentia-border flex-1 mx-4"></div>
            <div
              className={`text-xs font-extrabold px-4 py-2 rounded-full ${
                step === 2
                  ? "bg-talentia-selected text-talentia-blue"
                  : step > 2
                  ? "text-talentia-primary"
                  : "bg-talentia-surface text-talentia-placeholder"
              }`}
            >
              2. Evaluaciones
            </div>
            <div className="h-[2px] bg-talentia-border flex-1 mx-4"></div>
            <div
              className={`text-xs font-extrabold px-4 py-2 rounded-full ${
                step === 3
                  ? "bg-talentia-purple-soft text-talentia-purple"
                  : "bg-talentia-surface text-talentia-placeholder"
              }`}
            >
              3. Docentes y visibilidad
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZADO DE COMPONENTES SEGÚN EL PASO */}

      {/* PASO 1: Formulario de Datos Iniciales */}
      {step === 1 && (
        <div className="bg-talentia-surface rounded-3xl p-8 shadow-sm border border-talentia-border/80 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-talentia-primary mb-2">
                Nombre del curso *
              </label>
              <input
                type="text"
                name="nombreCurso"
                value={formData.nombreCurso}
                onChange={handleChange}
                placeholder="Diseño UX"
                required
                className="w-full bg-talentia-surface border border-talentia-border rounded-2xl px-4 py-3.5 text-sm text-talentia-primary focus:outline-none focus:ring-2 focus:ring-talentia-blue focus:bg-talentia-surface transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-talentia-primary mb-2">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="UX001"
                required
                className="w-full bg-talentia-surface border border-talentia-border rounded-2xl px-4 py-3.5 text-sm text-talentia-primary focus:outline-none focus:ring-2 focus:ring-talentia-blue focus:bg-talentia-surface transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-talentia-primary mb-2">
                Cupos *
              </label>
              <input
                type="number"
                name="cupos"
                value={formData.cupos}
                onChange={handleChange}
                placeholder="80"
                required
                className="w-full bg-talentia-surface border border-talentia-border rounded-2xl px-4 py-3.5 text-sm text-talentia-primary focus:outline-none focus:ring-2 focus:ring-talentia-blue focus:bg-talentia-surface transition font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-talentia-primary mb-2">
                Categoría *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full bg-talentia-surface border border-talentia-border rounded-2xl px-4 py-3.5 text-sm text-talentia-primary focus:outline-none focus:ring-2 focus:ring-talentia-blue focus:bg-talentia-surface transition cursor-pointer font-medium"
              >
                <option value="Diseño">Diseño</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Gestión">Gestión</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-talentia-primary mb-2">
                Modalidad *
              </label>
              <select
                name="modalidad"
                value={formData.modalidad}
                onChange={handleChange}
                required
                className="w-full bg-talentia-surface border border-talentia-border rounded-2xl px-4 py-3.5 text-sm text-talentia-primary focus:outline-none focus:ring-2 focus:ring-talentia-blue focus:bg-talentia-surface transition cursor-pointer font-medium"
              >
                <option value="Virtual">Virtual</option>
                <option value="Presencial">Presencial</option>
                <option value="Hibrido">Híbrido</option>
              </select>
            </div>
          </div>
          
          <div>
            <label
              htmlFor="periodoId"
              className="mb-2 block text-xs font-extrabold text-talentia-primary"
            >
              Periodo académico
            </label>

            <select
              id="periodoId"
              name="periodoId"
              value={formData.periodoId}
              onChange={handleChange}
              disabled={cargandoPeriodos}
              className="w-full rounded-2xl border border-talentia-border bg-talentia-surface px-4 py-3.5 text-sm font-medium text-talentia-primary outline-none transition focus:bg-talentia-surface focus:ring-2 focus:ring-talentia-blue disabled:opacity-50"
            >
              <option value="">
                Sin periodo asignado (solo borrador)
              </option>

              {periodos
                .filter(
                  (periodo) =>
                    periodo.activo || periodo.id === formData.periodoId
                )
                .map((periodo) => (
                  <option
                    key={periodo.id}
                    value={periodo.id}
                    disabled={!periodo.activo}
                  >
                    {periodo.nombre}
                    {!periodo.activo ? " (Inactivo)" : ""}
                  </option>
                ))}
            </select>

            <p className="mt-2 text-xs text-talentia-muted">
              El periodo define las fechas de la oferta. Es obligatorio
              para publicar el curso.
            </p>

            {errorPeriodos && (
              <p role="alert" className="mt-2 text-sm text-talentia-danger">
                {errorPeriodos}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-talentia-primary mb-2">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Insertar descripción"
              required
              className="w-full bg-talentia-surface border border-talentia-border rounded-2xl p-4 text-sm text-talentia-primary placeholder-talentia-placeholder focus:outline-none focus:ring-2 focus:ring-talentia-blue focus:bg-talentia-surface transition font-medium resize-none"
            />
          </div>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <label
                htmlFor="imagenPortada"
                className="mb-2 block text-xs font-extrabold text-talentia-primary"
              >
                Imagen de portada
              </label>

              <input
                id="imagenPortada"
                name="imagenPortada"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImagenPortadaChange}
                className="block w-full cursor-pointer rounded-2xl border border-talentia-border bg-talentia-surface p-3 text-sm text-talentia-muted file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-talentia-selected file:px-4 file:py-2 file:font-bold file:text-talentia-blue hover:file:bg-talentia-hover"
              />

              <p className="mt-2 text-xs text-talentia-muted">
                Formatos permitidos: JPG, PNG y WebP. Tamaño máximo: 5 MB.
              </p>

              {imagenPortada && (
                <p className="mt-2 break-all text-xs font-semibold text-talentia-primary">
                  Archivo seleccionado: {imagenPortada.name}
                </p>
              )}

              {errorImagen && (
                <p role="alert" className="mt-2 text-sm font-semibold text-talentia-danger">
                  {errorImagen}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-extrabold text-talentia-primary">
                Vista previa
              </p>

              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-talentia-border bg-talentia-surface">
                {vistaPreviaImagen ? (
                  <Image
                    src={vistaPreviaImagen}
                    alt="Vista previa de la imagen de portada"
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="px-4 text-center">
                    <p className="text-sm font-bold text-talentia-muted">
                      Sin imagen seleccionada
                    </p>
                    <p className="mt-1 text-xs text-talentia-placeholder">
                      La imagen del curso aparecerá aquí.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: Configuración del Sistema de Evaluaciones */}
      {step === 2 && (
        <div className="mb-8">
          <ConfigurarCurso
            esPasoWizard={true}
            evaluaciones={evaluaciones}
            onEvaluacionesChange={setEvaluaciones}
          />
        </div>
      )}

      {/* PASO 3: Asignación de Docente responsable */}
      {step === 3 && (
        <div className="mb-8">
          <AsignarDocente
            esPasoWizard={true}
            nombreCurso={formData.nombreCurso || "Curso nuevo"}
            docenteSeleccionadoId={docenteSeleccionado?.id ?? null}
            onSeleccionarDocente={setDocenteSeleccionado}
          />
        </div>
      )}

      {/* PASO 4: Publicar Curso */}
      {step === 4 && (
        <div className="mb-8">
          <VistaPublicarCurso
            curso={formData}
            evaluaciones={evaluaciones}
            docente={docenteSeleccionado}
            imagenPortada={imagenPortada}
            imagenExistente={imagenExistente}
            onGuardar={handleGuardarCurso}
            onVolver={() => {
              setErrorGuardar("");
              setStep(3);
            }}
            guardando={guardando}
            error={errorGuardar}
            modoEdicion={modoEdicion}
          />
        </div>
      )}

      {errorGuardar && step <= 3 && (
        <p role="alert" className="mb-4 rounded-xl border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-sm text-talentia-danger">
          {errorGuardar}
        </p>
      )}

      {/* BOTONES DE NAVEGACIÓN PARA LOS PASOS 1 A 3 */}
      {step <= 3 && (
        <div className="flex justify-between items-center mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-talentia-surface hover:bg-talentia-hover text-talentia-primary border border-talentia-border font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
            >
              Anterior
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={step === 1 ? handleContinuarPasoUno : () => { setErrorGuardar(""); setStep(step + 1); }}
              className="bg-talentia-action hover:bg-talentia-primary text-white font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorGuardar("");
                setStep(4);
              }}
              className="bg-talentia-action hover:bg-talentia-primary text-white font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
            >
              Revisar curso
            </button>
          )}
        </div>
      )}
    </div>
  );
}