"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export type EstadoPagoMatricula = "Pendiente" | "Pagado" | "No aplica";

export interface MatriculaFormData {
  estudianteId: string;
  ofertaCursoId: string;
  estadoPago: EstadoPagoMatricula;
}

interface AlumnoOption {
  id: string;
  nombre: string;
  codigo: string;
}

interface OfertaOption {
  id: string;
  cursoId: string;
  nombreCurso: string;
  codigo: string;
  periodoId: string | null;
  periodoNombre: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  cupoMaximo: number;
  ocupadas: number;
  cuposDisponibles: number;
  docente: string;
}

interface OpcionesMatricula {
  alumnos: AlumnoOption[];
  ofertas: OfertaOption[];
}

interface RegistrarMatriculaProps {
  onCancelar?: () => void;
  onRegistrar?: (datos: MatriculaFormData) => Promise<void>;
}

const CLASE_INPUT =
  "w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30";


function etiquetaAlumno(alumno: AlumnoOption) {
  return `${alumno.nombre} · ${alumno.codigo}`;
}

function etiquetaOferta(oferta: OfertaOption) {
  const periodo = oferta.periodoNombre ?? "Periodo por asignar";
  return `${oferta.nombreCurso} · ${oferta.codigo} — ${periodo} (Oferta ${oferta.id})`;
}

export default function RegistrarMatricula({
  onCancelar,
  onRegistrar,
}: RegistrarMatriculaProps) {
  const router = useRouter();
  const [opciones, setOpciones] = useState<OpcionesMatricula>({
    alumnos: [],
    ofertas: [],
  });
  const [cargando, setCargando] = useState(true);
  const [alumnoTexto, setAlumnoTexto] = useState("");
  const [estudianteId, setEstudianteId] = useState("");
  const [ofertaTexto, setOfertaTexto] = useState("");
  const [ofertaCursoId, setOfertaCursoId] = useState("");
  const [mostrarSugerenciasOferta, setMostrarSugerenciasOferta] = useState(false);
  const [estadoPago, setEstadoPago] = useState<EstadoPagoMatricula>("Pendiente");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarOpciones() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(`${API_URL}/administrador/matriculas/opciones`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message ?? "No se pudieron cargar las opciones de matrícula.");
        }

        setOpciones({
          alumnos: Array.isArray(data.alumnos) ? data.alumnos : [],
          ofertas: Array.isArray(data.ofertas) ? data.ofertas : [],
        });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar las opciones.");
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    void cargarOpciones();
    return () => controller.abort();
  }, [router]);

  const alumnoSeleccionado = useMemo(
    () => opciones.alumnos.find((alumno) => alumno.id === estudianteId) ?? null,
    [opciones.alumnos, estudianteId]
  );

  const ofertaSeleccionada = useMemo(
    () => opciones.ofertas.find((oferta) => oferta.id === ofertaCursoId) ?? null,
    [opciones.ofertas, ofertaCursoId]
  );

  
const ofertasFiltradas = useMemo(() => {
  const texto = ofertaTexto.trim().toLocaleLowerCase("es");

  const coincidencias = opciones.ofertas.filter((oferta) => {
    const contenido = [
      oferta.nombreCurso,
      oferta.codigo,
      oferta.periodoNombre ?? "",
      oferta.docente,
      String(oferta.id),
    ]
      .join(" ")
      .toLocaleLowerCase("es");

    return !texto || contenido.includes(texto);
  });
  return coincidencias.slice(0, 8);
}, [opciones.ofertas, ofertaTexto]);


  const handleAlumnoChange = (value: string) => {
    setAlumnoTexto(value);
    const elegido = opciones.alumnos.find((alumno) => etiquetaAlumno(alumno) === value);
    setEstudianteId(elegido?.id ?? "");
    setError("");
  };
  
  const handleOfertaTextoChange = (value: string) => {
    setOfertaTexto(value);
    
    setOfertaCursoId("");
    setMostrarSugerenciasOferta(true);
    setError("");
  };
  
  const seleccionarOferta = (oferta: OfertaOption) => {
    setOfertaTexto(etiquetaOferta(oferta));
    setOfertaCursoId(oferta.id);
    setMostrarSugerenciasOferta(false);
    setError("");
  };

  const ejecutarRegistro = async () => {
    setError("");
    setMensaje("");

    if (!estudianteId) {
      setError("Selecciona un alumno de la lista para continuar.");
      return;
    }

    if (!ofertaSeleccionada) {
      setError("Selecciona una oferta de curso publicada y con cupos disponibles.");
      return;
    }

    if (ofertaSeleccionada.cuposDisponibles <= 0) {
      setError("La oferta seleccionada ya no tiene cupos disponibles.");
      return;
    }

    if (!onRegistrar) {
      setError("La operación de registro no está configurada.");
      return;
    }

    setGuardando(true);

    try {
      await onRegistrar({
        estudianteId,
        ofertaCursoId: ofertaSeleccionada.id,
        estadoPago,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar la matrícula.");
    } finally {
      setGuardando(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ejecutarRegistro();
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-6">
        <h2 className="text-xl font-extrabold text-[#0F2851] mb-6">
          Nueva matrícula
        </h2>

        {cargando && (
          <p className="mb-5 text-sm font-semibold text-[#64748B]">
            Cargando alumnos, cursos y periodos...
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="alumnoMatricula" className="block text-xs font-bold text-[#0F2851] mb-2">
                Alumno *
              </label>
              <input
                id="alumnoMatricula"
                type="text"
                list="alumnosDisponibles"
                value={alumnoTexto}
                onChange={(event) => handleAlumnoChange(event.target.value)}
                placeholder="Buscar por nombre o código del alumno"
                autoComplete="off"
                required
                className={CLASE_INPUT}
              />
              <datalist id="alumnosDisponibles">
                {opciones.alumnos.map((alumno) => (
                  <option key={alumno.id} value={etiquetaAlumno(alumno)} />
                ))}
              </datalist>
            </div>
            
            <div className="relative">
              <label htmlFor="cursoMatricula" className="block text-xs font-bold text-[#0F2851] mb-2">Curso *</label>
              <input id="cursoMatricula" type="text" value={ofertaTexto} onChange={(event) =>
              handleOfertaTextoChange(event.target.value)} onFocus={() => setMostrarSugerenciasOferta(true)} onBlur={() => { 
              }}
              placeholder="Buscar curso o código"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={mostrarSugerenciasOferta}
              aria-controls="ofertasDisponibles"
              required
              className={CLASE_INPUT}
              />
              
              {mostrarSugerenciasOferta && !cargando && (
                <div id="ofertasDisponibles"
                role="listbox"
                className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg"
                >
                  {ofertasFiltradas.length > 0 ? (
                    ofertasFiltradas.map((oferta) => (
                    <button
                    key={oferta.id}
                    type="button"
                    role="option"
                    aria-selected={oferta.id === ofertaCursoId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => seleccionarOferta(oferta)}
                    className={`block w-full rounded-xl px-4 py-3 text-left transition hover:bg-[#F3E8FF]/70 ${
                      oferta.id === ofertaCursoId
                      ? "bg-[#F3E8FF]"
                      : "bg-white"
                    }`}
                    >
                      <span className="block text-sm font-bold text-[#0F2851]">
                        {oferta.nombreCurso}
                        </span>
                        
                        <span className="mt-1 block text-xs font-semibold text-[#64748B]">
                          Código: {oferta.codigo}
                          {" · "}
                          {oferta.periodoNombre ?? "Periodo por asignar"}
                          </span>
                          
                          <span className="mt-1 block text-xs text-[#64748B]">
                            Oferta {oferta.id}
                            {" · "}
                            {oferta.cuposDisponibles} cupos disponibles
                            </span>
                            </button>
                            ))
                          ) : (
                          <p className="px-4 py-3 text-sm text-[#64748B]">
                            {opciones.ofertas.length === 0
                            ? "No hay ofertas publicadas con cupos disponibles."
                            : "No hay cursos que coincidan con tu búsqueda."}
                            </p>
                          )}
                          </div>
                        )}
                        </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="periodoMatricula"
                className="mb-2 block text-xs font-bold text-[#0F2851]"
              >
                Periodo académico
              </label>

              <input
                id="periodoMatricula"
                type="text"
                readOnly
                value={
                  ofertaSeleccionada
                    ? ofertaSeleccionada.periodoNombre ?? "Periodo no disponible"
                    : "Selecciona una oferta"
                }
                className={`${CLASE_INPUT} cursor-not-allowed bg-[#F8FAFC]`}
              />
            </div>

            <div>
              <label htmlFor="estadoPagoMatricula" className="block text-xs font-bold text-[#0F2851] mb-2">
                Estado *
              </label>
              <select
                id="estadoPagoMatricula"
                value={estadoPago}
                onChange={(event) => setEstadoPago(event.target.value as EstadoPagoMatricula)}
                className={`${CLASE_INPUT} cursor-pointer`}
              >
                <option value="Pendiente">Pendiente de pago</option>
                <option value="Pagado">Pagado</option>
                <option value="No aplica">No aplica</option>
              </select>
            </div>

            <div>
              <label htmlFor="cuposDisponibles" className="block text-xs font-bold text-[#0F2851] mb-2">
                Cupo disponible
              </label>
              <input
                id="cuposDisponibles"
                type="text"
                readOnly
                value={ofertaSeleccionada ? `${ofertaSeleccionada.cuposDisponibles} cupos` : "Selecciona un curso"}
                className={`${CLASE_INPUT} cursor-not-allowed`}
              />
            </div>
          </div>

          <div className="bg-[#F3E8FF]/60 rounded-2xl p-4 mt-6">
            <p className="text-xs font-extrabold text-[#0F2851] mb-3">
              Validación automática
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-extrabold px-4 py-1.5 rounded-full ${alumnoSeleccionado ? "bg-[#BBF7D0] text-[#166534]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                {alumnoSeleccionado ? "Alumno seleccionado" : "Selecciona un alumno"}
              </span>
              <span className={`text-xs font-extrabold px-4 py-1.5 rounded-full ${ofertaSeleccionada && ofertaSeleccionada.cuposDisponibles > 0 ? "bg-[#BAE6FD] text-[#0369A1]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                {ofertaSeleccionada
                  ? ofertaSeleccionada.cuposDisponibles > 0
                    ? "Cupo disponible"
                    : "Sin cupos"
                  : "Selecciona una oferta"}
              </span>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          {mensaje && (
            <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
              {mensaje}
            </p>
          )}
        </form>
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="bg-white hover:bg-gray-50 text-[#6B21A8] border border-gray-200 font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-sm disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void ejecutarRegistro()}
          disabled={guardando || cargando}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Registrando..." : "Registrar matrícula"}
        </button>
      </div>
    </div>
  );
}
