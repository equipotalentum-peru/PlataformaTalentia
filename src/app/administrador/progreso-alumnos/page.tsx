"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import CertificateDownloadButton from "@/components/alumno/certificados/CertificateDownloadButton";

type Opcion = { id: string; nombre: string; codigo?: string };

type RegistroProgreso = {
  id: string;
  ofertaId: string;
  periodo: string;
  curso: string;
  codigoCurso: string;
  alumno: string;
  codigoAlumno: string;
  promedio: number | null;
  certificado: { id: string; numero: string } | null;
  estado: "Aprobado" | "Desaprobado" | "En curso";
  notas: { id: string; nombre: string; porcentaje: number | null; puntajeMaximo: number | null; nota: number | null }[];
};

function useListado<T = Opcion>(ruta: string | null, campo: string, alCargar?: (opciones: T[]) => void) {
  const [resultado, setResultado] = useState<{ ruta: string | null; opciones: T[]; error: string }>({
    ruta: "", opciones: [], error: "",
  });

  useEffect(() => {
    if (ruta === null) return;
    const controller = new AbortController();
    fetch(`${API_URL}${ruta}`, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? "No se pudieron cargar los datos.");
        if (!Array.isArray(data[campo])) throw new Error("La respuesta no es válida.");
        const opciones = data[campo] as T[];
        if (controller.signal.aborted) return;
        setResultado({ ruta, opciones, error: "" });
        alCargar?.(opciones);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResultado({ ruta, opciones: [], error: error instanceof Error ? error.message : "No se pudieron cargar los datos." });
      });
    return () => controller.abort();
  }, [ruta, campo, alCargar]);

  const cargando = ruta !== null && resultado.ruta !== ruta;
  return { opciones: ruta === null || cargando ? [] : resultado.opciones, error: ruta === null || cargando ? "" : resultado.error, cargando };
}

function etiqueta(opcion: Opcion | null) {
  return opcion ? `${opcion.nombre}${opcion.codigo ? ` · ${opcion.codigo}` : ""}` : "";
}

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-PE").trim();
}

function FiltroBusqueda({ id, label, placeholder, emptyText, todos, valor, opciones, cargando, error, onChange }: {
  id: string;
  label: string;
  placeholder: string;
  emptyText: string;
  todos: string;
  valor: Opcion | null;
  opciones: Opcion[];
  cargando: boolean;
  error: string;
  onChange: (opcion: Opcion | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [indice, setIndice] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const termino = normalizar(busqueda);
  const filtradas = opciones.filter((opcion) => normalizar(etiqueta(opcion)).includes(termino));
  const visibles = [{ id: "", nombre: todos }, ...filtradas];
  const indiceActivo = Math.min(indice, visibles.length - 1);

  function seleccionar(opcion: Opcion) {
    onChange(opcion.id ? opcion : null);
    setAbierto(false);
    setBusqueda("");
    setIndice(0);
  }

  return (
    <div
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setAbierto(false);
      }}
    >
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-talentia-muted">
        {label}
      </label>
      <div className="flex h-11 items-center rounded-lg border border-talentia-border bg-talentia-surface transition-colors hover:border-talentia-placeholder focus-within:border-talentia-blue focus-within:ring-2 focus-within:ring-talentia-blue/15">
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${id}-opciones`}
          aria-autocomplete="list"
          aria-activedescendant={abierto ? `${id}-opcion-${indiceActivo}` : undefined}
          aria-busy={cargando}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          value={abierto ? busqueda : etiqueta(valor)}
          onChange={(event) => {
            setBusqueda(event.target.value);
            setAbierto(true);
            setIndice(0);
            if (valor) onChange(null);
          }}
          onFocus={() => {
            setBusqueda("");
            setIndice(0);
            setAbierto(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setAbierto(false);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setAbierto(true);
              setIndice((actual) => Math.max(0, Math.min(visibles.length - 1, actual + (event.key === "ArrowDown" ? 1 : -1))));
            }
            if (event.key === "Enter" && abierto) {
              event.preventDefault();
              seleccionar(visibles[indiceActivo]);
            }
          }}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 rounded-l-lg bg-transparent px-4 text-sm text-talentia-primary outline-none placeholder:text-talentia-placeholder"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Mostrar opciones de ${label.toLowerCase()}`}
          aria-controls={`${id}-opciones`}
          aria-expanded={abierto}
          title={`Mostrar opciones de ${label.toLowerCase()}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (abierto) setAbierto(false);
            else {
              inputRef.current?.focus();
              setBusqueda("");
              setIndice(0);
              setAbierto(true);
            }
          }}
          className="flex h-full w-11 shrink-0 items-center justify-center rounded-r-lg text-talentia-muted hover:bg-talentia-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={abierto ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
          </svg>
        </button>
      </div>
      {abierto && (
        <ul id={`${id}-opciones`} role="listbox" aria-label={label} aria-busy={cargando} className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-talentia-border bg-talentia-surface p-2 shadow-sm">
          {visibles.map((opcion, posicion) => (
            <li key={opcion.id} id={`${id}-opcion-${posicion}`} role="option" aria-selected={(valor?.id ?? "") === opcion.id}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setIndice(posicion)}
              onClick={() => seleccionar(opcion)}
              className={`cursor-pointer rounded-md px-3 py-3 text-[13px] text-talentia-primary ${posicion === indiceActivo ? "bg-talentia-selected" : "hover:bg-talentia-hover"}`}>
              {etiqueta(opcion)}
            </li>
          ))}
          {(cargando || error || filtradas.length === 0) && (
            <li role="option" aria-selected="false" aria-disabled="true" className="px-3 py-3 text-[13px] text-talentia-muted">
              {cargando ? "Cargando..." : error ? "Opciones no disponibles." : opciones.length > 0 ? "No se encontraron coincidencias." : emptyText}
            </li>
          )}
        </ul>
      )}
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-[12px] text-talentia-danger">{error}</p>}
    </div>
  );
}

export default function ProgresoAlumnosPage() {
  const [periodoId, setPeriodoId] = useState("");
  const [curso, setCurso] = useState<Opcion | null>(null);
  const [alumno, setAlumno] = useState<Opcion | null>(null);
  const validarCurso = useCallback((opciones: Opcion[]) => {
    setCurso((actual) => actual && !opciones.some((opcion) => opcion.id === actual.id) ? null : actual);
  }, []);
  const validarAlumno = useCallback((opciones: Opcion[]) => {
    setAlumno((actual) => actual && !opciones.some((opcion) => opcion.id === actual.id) ? null : actual);
  }, []);
  const periodos = useListado("/administrador/periodos", "periodos");
  const parametrosCursos = new URLSearchParams();
  const parametrosAlumnos = new URLSearchParams();
  if (periodoId) {
    parametrosCursos.set("periodoId", periodoId);
    parametrosAlumnos.set("periodoId", periodoId);
  }
  if (curso) parametrosAlumnos.set("cursoId", curso.id);
  const cursos = useListado(`/administrador/progreso-alumnos/cursos?${parametrosCursos}`, "cursos", validarCurso);
  const alumnos = useListado(`/administrador/progreso-alumnos/alumnos?${parametrosAlumnos}`, "alumnos", validarAlumno);
  const hayFiltros = Boolean(periodoId || curso || alumno);
  const filtrosCargando = periodos.cargando || cursos.cargando || alumnos.cargando;
  const filtrosConError = Boolean(periodos.error || cursos.error || alumnos.error);
  const parametrosRegistros = new URLSearchParams(parametrosAlumnos);
  if (alumno) parametrosRegistros.set("alumnoId", alumno.id);
  const registros = useListado<RegistroProgreso>(
    hayFiltros && !filtrosCargando && !filtrosConError ? `/administrador/progreso-alumnos?${parametrosRegistros}` : null,
    "registros"
  );
  const cargandoRegistros = hayFiltros && (filtrosCargando || registros.cargando);

  return (
    <div className="mx-auto min-h-screen max-w-7xl bg-talentia-surface p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-talentia-primary">
            Progreso de alumnos
          </h1>
          <p className="mt-1 text-sm font-semibold text-talentia-muted">
            Historial académico, calificaciones y certificados de los alumnos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor="progreso-periodo" className="mb-2 block text-[13px] font-semibold text-talentia-muted">
              Periodo
            </label>
            <select id="progreso-periodo" value={periodoId} onChange={(event) => setPeriodoId(event.target.value)} disabled={periodos.cargando} aria-invalid={Boolean(periodos.error)} aria-describedby={periodos.error ? "progreso-periodo-error" : undefined} className="h-11 w-full rounded-lg border border-talentia-border bg-talentia-surface px-4 text-sm text-talentia-primary outline-none transition-colors hover:border-talentia-placeholder focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15">
              <option value="">{periodos.cargando ? "Cargando periodos..." : "Todos los periodos"}</option>
              {periodos.opciones.map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.nombre}</option>)}
            </select>
            {periodos.error && <p id="progreso-periodo-error" role="alert" className="mt-2 text-[12px] text-talentia-danger">{periodos.error}</p>}
          </div>
          <FiltroBusqueda id="progreso-curso" label="Curso" placeholder="Buscar curso" emptyText="No hay cursos disponibles." todos="Todos los cursos" valor={curso} opciones={cursos.opciones} cargando={cursos.cargando} error={cursos.error} onChange={setCurso} />
          <FiltroBusqueda id="progreso-alumno" label="Alumno" placeholder="Buscar alumno" emptyText="No hay alumnos disponibles." todos="Todos los alumnos" valor={alumno} opciones={alumnos.opciones} cargando={alumnos.cargando} error={alumnos.error} onChange={setAlumno} />
        </div>

        <div className="overflow-hidden rounded-lg border border-talentia-border bg-talentia-surface">
          <div className="overflow-x-auto">
            <table aria-busy={cargandoRegistros} className="w-full min-w-[1160px] table-fixed border-collapse text-left text-[13px] leading-5">
              <caption className="sr-only">Progreso académico de alumnos</caption>
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[17%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-talentia-border bg-talentia-table-header font-bold text-talentia-primary">
                  <th scope="col" className="px-6 py-4">Periodo</th>
                  <th scope="col" className="px-4 py-4">Curso</th>
                  <th scope="col" className="px-4 py-4">Alumno</th>
                  <th scope="col" className="px-4 py-4 text-center">Promedio</th>
                  <th scope="col" className="px-4 py-4 text-center">Estado</th>
                  <th scope="col" className="px-4 py-4">Notas de evaluaciones</th>
                  <th scope="col" className="px-4 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-talentia-border">
                {cargandoRegistros ? (
                  <tr><td colSpan={7} className="h-48 px-6 py-10 text-center text-talentia-muted">Cargando progreso...</td></tr>
                ) : registros.error ? (
                  <tr><td colSpan={7} role="alert" className="h-48 px-6 py-10 text-center text-talentia-danger">{registros.error}</td></tr>
                ) : registros.opciones.length === 0 ? (
                  <tr><td colSpan={7} className="h-48 px-6 py-10 text-center text-talentia-muted">No hay registros para mostrar.</td></tr>
                ) : registros.opciones.map((registro) => (
                  <tr key={registro.id} className="align-top text-talentia-primary hover:bg-talentia-hover [&>td]:py-5">
                    <td className="break-words px-6 py-4">{registro.periodo}</td>
                    <td className="break-words px-4 py-4">
                      <p className="font-semibold">{registro.curso}</p>
                      <p className="mt-1 text-[12px] text-talentia-muted">{registro.codigoCurso}</p>
                    </td>
                    <td className="break-words px-4 py-4">
                      <p className="font-semibold">{registro.alumno}</p>
                      <p className="mt-1 text-[12px] text-talentia-muted">{registro.codigoAlumno}</p>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold tabular-nums">{registro.promedio === null ? "—" : registro.promedio.toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold ${registro.estado === "Aprobado" ? "bg-talentia-success-bg text-talentia-success" : registro.estado === "Desaprobado" ? "bg-talentia-danger-bg text-talentia-danger" : "bg-talentia-warning-bg text-talentia-warning"}`}>
                        {registro.estado}
                      </span>
                    </td>
                    <td className="break-words px-4 py-4">
                      {registro.notas.length > 0 ? (
                        <details className="group">
                          <summary className="flex h-10 cursor-pointer list-none items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-talentia-blue/30 bg-talentia-surface px-3 text-[13px] font-semibold text-talentia-blue transition-colors hover:border-talentia-blue hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                            Ver notas
                            <span aria-hidden="true" className="mb-1 h-2 w-2 shrink-0 rotate-45 border-b-2 border-r-2 border-current transition-transform group-open:mb-0 group-open:rotate-[225deg]" />
                          </summary>
                          <ul className="mt-3 space-y-3">
                            {registro.notas.map((nota) => (
                              <li key={nota.id} className="border-t border-talentia-border pt-2">
                                <p className="font-medium">{nota.nombre}</p>
                                {nota.porcentaje !== null && <p className="text-[12px] text-talentia-muted">{nota.porcentaje} %</p>}
                                <p className="mt-1 tabular-nums">{nota.nota === null ? "Pendiente" : `${nota.nota.toFixed(2)}${nota.puntajeMaximo !== null ? ` / ${nota.puntajeMaximo}` : ""}`}</p>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : <span className="text-talentia-muted">Sin evaluaciones configuradas.</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {registro.certificado ? (
                        <CertificateDownloadButton
                          certificadoId={registro.certificado.id}
                          rutaDescarga={`/administrador/progreso-alumnos/${registro.id}/certificados/${registro.certificado.id}/pdf`}
                          fileName={`${registro.certificado.numero}.pdf`}
                          label="Descargar"
                          className="inline-flex h-10 w-36 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-talentia-blue/30 bg-talentia-surface px-3 text-[13px] font-semibold text-talentia-blue transition-colors hover:border-talentia-blue hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 [&_svg]:shrink-0"
                        />
                      ) : (
                        <span className="inline-flex h-10 w-36 items-center justify-center text-center text-[12px] leading-5 text-talentia-muted">Sin certificado disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
