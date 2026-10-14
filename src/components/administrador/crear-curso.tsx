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

export default function CrearCurso() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState({
    nombreCurso: "",
    codigo: "",
    cupos: "80",
    categoria: "Diseño",
    modalidad: "Virtual",
    descripcion: "",
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

  useEffect(() => {
    return () => {
      if (vistaPreviaImagen) {
        URL.revokeObjectURL(vistaPreviaImagen);
      }
    };
  }, [vistaPreviaImagen]);

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

    const filasConDatos = evaluaciones.filter(
      (item) => item.nombre.trim() || item.porcentaje.trim()
    );

    if (filasConDatos.some((item) => !item.nombre.trim())) {
      setErrorGuardar("Completa el nombre de cada evaluación que tenga porcentaje.");
      return;
    }

    const componentes = filasConDatos.map((item) => ({
      nombre: item.nombre.trim(),
      porcentaje: item.porcentaje.trim() === "" ? null : Number(item.porcentaje),
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
      docenteId: docenteSeleccionado?.id ?? null,
      componentes,
      publicar,
    };

    const form = new FormData();
    form.append("datos", JSON.stringify(datos));
    if (imagenPortada) form.append("imagenPortada", imagenPortada);

    setGuardando(true);
    try {
      const response = await fetch(`${API_URL}/administrador/cursos`, {
        method: "POST",
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

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-10">
      {/* Enlace de regreso y Encabezado según el paso */}
      <div className="mb-6">
        <Link
          href="/administrador/cursos"
          className="text-xs text-[#64748B] hover:text-[#0F2851] font-semibold transition flex items-center gap-1 mb-2"
        >
          ← Volver a cursos
        </Link>
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          {step === 4 ? "Publicar curso" : "Crear curso"}
        </h1>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          {step === 4
            ? "Revisión final antes de activar el curso para alumnos."
            : "Registro inicial antes de configurar contenido y docentes."}
        </p>
      </div>

      {/* Stepper Global (Visualización para Pasos 1, 2 y 3) */}
      {step <= 3 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div
              className={`text-xs font-extrabold ${
                step >= 1 ? "text-[#0F2851]" : "text-[#94A3B8]"
              }`}
            >
              1. Datos del curso
            </div>
            <div className="h-[2px] bg-gray-200 flex-1 mx-4"></div>
            <div
              className={`text-xs font-extrabold px-4 py-2 rounded-full ${
                step === 2
                  ? "bg-[#BAE6FD] text-[#0369A1]"
                  : step > 2
                  ? "text-[#0F2851]"
                  : "bg-gray-100 text-[#94A3B8]"
              }`}
            >
              2. Sistema de evaluación
            </div>
            <div className="h-[2px] bg-gray-200 flex-1 mx-4"></div>
            <div
              className={`text-xs font-extrabold px-4 py-2 rounded-full ${
                step === 3
                  ? "bg-[#E8DDFB] text-[#5B21B6]"
                  : "bg-gray-100 text-[#94A3B8]"
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
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Nombre del curso *
              </label>
              <input
                type="text"
                name="nombreCurso"
                value={formData.nombreCurso}
                onChange={handleChange}
                placeholder="Diseño UX"
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="UX001"
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Cupos *
              </label>
              <input
                type="number"
                name="cupos"
                value={formData.cupos}
                onChange={handleChange}
                placeholder="80"
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Categoría *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer font-medium"
              >
                <option value="Diseño">Diseño</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Gestión">Gestión</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Modalidad *
              </label>
              <select
                name="modalidad"
                value={formData.modalidad}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer font-medium"
              >
                <option value="Virtual">Virtual</option>
                <option value="Presencial">Presencial</option>
                <option value="Hibrido">Híbrido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Insertar descripción"
              required
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium resize-none"
            />
          </div>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <label
                htmlFor="imagenPortada"
                className="mb-2 block text-xs font-extrabold text-[#0F2851]"
              >
                Imagen de portada
              </label>

              <input
                id="imagenPortada"
                name="imagenPortada"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImagenPortadaChange}
                className="block w-full cursor-pointer rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-[#64748B] file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-[#DBEAFE] file:px-4 file:py-2 file:font-bold file:text-[#1D4ED8] hover:file:bg-[#BFDBFE]"
              />

              <p className="mt-2 text-xs text-[#64748B]">
                Formatos permitidos: JPG, PNG y WebP. Tamaño máximo: 5 MB.
              </p>

              {imagenPortada && (
                <p className="mt-2 break-all text-xs font-semibold text-[#0F2851]">
                  Archivo seleccionado: {imagenPortada.name}
                </p>
              )}

              {errorImagen && (
                <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
                  {errorImagen}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-extrabold text-[#0F2851]">
                Vista previa
              </p>

              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
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
                    <p className="text-sm font-bold text-[#64748B]">
                      Sin imagen seleccionada
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
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
            onGuardar={handleGuardarCurso}
            onVolver={() => {
              setErrorGuardar("");
              setStep(3);
            }}
            guardando={guardando}
            error={errorGuardar}
          />
        </div>
      )}

      {errorGuardar && step <= 3 && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              className="bg-white hover:bg-gray-50 text-[#0F2851] border border-gray-200 font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
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
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
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
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
            >
              Revisar curso
            </button>
          )}
        </div>
      )}
    </div>
  );
}