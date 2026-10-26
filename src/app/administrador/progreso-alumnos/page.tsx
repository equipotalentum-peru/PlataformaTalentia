"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import CertificateActions from "@/components/administrador/CertificateActions";
import CertificateDownloadButton from "@/components/alumno/certificados/CertificateDownloadButton";
import { aplicarEstilosExcelTalentia } from "@/lib/excel-talentia-format";

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
  certificado: { id: string; numero: string; disponible: boolean; visibleAlumno: boolean } | null;
  puedeGenerarCertificado: boolean;
  estado: "Aprobado" | "Desaprobado" | "En curso";
  notas: { id: string; nombre: string; porcentaje: number | null; puntajeMaximo: number | null; nota: number | null }[];
};

function NotasModal({ registro, onClose }: { registro: RegistroProgreso; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      aria-labelledby="progreso-notas-titulo"
      aria-describedby="progreso-notas-alumno"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialogRef.current?.close();
      }}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border border-talentia-border bg-talentia-surface p-5 text-talentia-primary shadow-xl backdrop:bg-talentia-primary/40 sm:p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="progreso-notas-titulo" className="text-lg font-bold">Notas de evaluaciones</h2>
          <p id="progreso-notas-alumno" className="mt-2 break-words text-[13px] font-semibold">{registro.alumno}</p>
          <p className="mt-1 break-words text-[12px] text-talentia-muted">{registro.curso} · {registro.periodo}</p>
        </div>
        <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="Cerrar notas" title="Cerrar" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-xl text-talentia-muted hover:bg-talentia-hover hover:text-talentia-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30">×</button>
      </header>
      <div className="mt-5 overflow-x-auto rounded-lg border border-talentia-border">
        <table className="w-full min-w-[480px] table-fixed border-collapse text-left text-[13px] leading-5">
          <caption className="sr-only">Notas de {registro.alumno} en {registro.curso}</caption>
          <colgroup><col className="w-[38%]" /><col className="w-[14%]" /><col className="w-[22%]" /><col className="w-[26%]" /></colgroup>
          <thead className="bg-talentia-table-header">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Evaluación</th>
              <th scope="col" className="px-2 py-3 text-center font-semibold">Peso</th>
              <th scope="col" className="px-2 py-3 text-center font-semibold">Nota</th>
              <th scope="col" className="px-3 py-3 text-center font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-talentia-border border-t border-talentia-border">
            {registro.notas.map((nota) => {
              const pendiente = nota.nota === null;
              const aprobado = !pendiente && nota.nota! >= 14;
              return (
                <tr key={nota.id}>
                  <td className="break-words px-4 py-3 font-medium">{nota.nombre}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-talentia-muted">{nota.porcentaje === null ? "—" : `${nota.porcentaje} %`}</td>
                  <td className="px-2 py-3 text-center tabular-nums">
                    {pendiente ? "—" : <><span className="font-semibold">{nota.nota!.toFixed(2)}</span>{nota.puntajeMaximo !== null && <span className="text-[12px] text-talentia-muted"> / {nota.puntajeMaximo}</span>}</>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${pendiente ? "bg-talentia-warning-bg text-talentia-warning" : aprobado ? "bg-talentia-success-bg text-talentia-success" : "bg-talentia-danger-bg text-talentia-danger"}`}>
                      {pendiente ? "Pendiente" : aprobado ? "Aprobado" : "Desaprobado"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <p className="text-talentia-muted">{registro.estado === "En curso" ? "Promedio actual" : "Promedio final"}<span className="ml-2 font-bold tabular-nums text-talentia-primary">{registro.promedio === null ? "—" : registro.promedio.toFixed(2)}</span></p>
        <button type="button" onClick={() => dialogRef.current?.close()} className="h-9 rounded-lg border border-talentia-border px-4 font-semibold hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30">Cerrar</button>
      </footer>
    </dialog>
  );
}

function useListado<T = Opcion>(ruta: string | null, campo: string, alCargar?: (opciones: T[]) => void, revision = 0) {
  const [resultado, setResultado] = useState<{ ruta: string | null; opciones: T[]; error: string; revision: number }>({
    ruta: "", opciones: [], error: "", revision: -1,
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
        setResultado({ ruta, opciones, error: "", revision });
        alCargar?.(opciones);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResultado({ ruta, opciones: [], error: error instanceof Error ? error.message : "No se pudieron cargar los datos.", revision });
      });
    return () => controller.abort();
  }, [ruta, campo, alCargar, revision]);

  const cargando = ruta !== null && (resultado.ruta !== ruta || resultado.revision !== revision);
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
  const [errorDescarga, setErrorDescarga] = useState<{ id: string; message: string } | null>(null);
  const [revisionCertificados, setRevisionCertificados] = useState(0);
  const actualizarCertificados = useCallback(() => setRevisionCertificados((actual) => actual + 1), []);
  const [notasSeleccionadas, setNotasSeleccionadas] = useState<RegistroProgreso | null>(null);
  const [exportando, setExportando] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");
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
    "registros", undefined, revisionCertificados
  );
  const cargandoRegistros = hayFiltros && (filtrosCargando || registros.cargando);
  const puedeExportar = !cargandoRegistros && !filtrosConError && !registros.error && registros.opciones.length > 0;

  async function exportarExcel() {
    if (!puedeExportar || exportando) return;
    setExportando(true);
    setErrorExportacion("");
    try {
      const XLSX = await import("xlsx-js-style");
      const fecha = new Date();
      const claveNota = (nota: RegistroProgreso["notas"][number]) => JSON.stringify([nota.nombre, nota.porcentaje, nota.puntajeMaximo]);
      const evaluaciones = new Map<string, RegistroProgreso["notas"][number]>();
      for (const registro of registros.opciones) {
        for (const nota of registro.notas) evaluaciones.set(claveNota(nota), nota);
      }
      const columnasNotas = [...evaluaciones.entries()];
      const cabeceras = [
        "Periodo", "Código del curso", "Curso", "Código del alumno", "Alumno",
        ...columnasNotas.map(([, nota]) => `${nota.nombre}${nota.porcentaje === null ? "" : ` (${nota.porcentaje} %)`}${nota.puntajeMaximo === null ? "" : ` / ${nota.puntajeMaximo} pts`}`),
        "Promedio del alumno", "Estado",
      ];
      const filas = registros.opciones.map((registro) => {
        const notas = new Map(registro.notas.map((nota) => [claveNota(nota), nota.nota]));
        return [
          registro.periodo, registro.codigoCurso, registro.curso, registro.codigoAlumno, registro.alumno,
          ...columnasNotas.map(([clave]) => notas.has(clave) ? notas.get(clave) ?? "Pendiente" : ""),
          registro.promedio ?? "", registro.estado,
        ];
      });
      const contenido = [
        ["Calificaciones de alumnos"],
        [`Periodo: ${periodos.opciones.find((opcion) => opcion.id === periodoId)?.nombre ?? "Todos los periodos"}`],
        [`Curso: ${etiqueta(curso) || "Todos los cursos"}`],
        [`Alumno: ${etiqueta(alumno) || "Todos los alumnos"}`],
        [`Fecha de exportación: ${fecha.toLocaleString("es-PE", { timeZone: "America/Lima" })}`],
        [], cabeceras, ...filas,
      ];
      const hoja = XLSX.utils.aoa_to_sheet(contenido);
      hoja["!merges"] = [0, 1, 2, 3, 4].map((fila) => ({ s: { r: fila, c: 0 }, e: { r: fila, c: cabeceras.length - 1 } }));
      hoja["!cols"] = [
        { wch: 36 }, { wch: 18 }, { wch: 36 }, { wch: 18 }, { wch: 32 },
        ...columnasNotas.map(([, nota]) => ({ wch: Math.max(22, Math.min(40, nota.nombre.length + 16)) })),
        { wch: 22 }, { wch: 18 },
      ];
      hoja["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 6, c: 0 }, e: { r: 6 + filas.length, c: cabeceras.length - 1 } }) };
      aplicarEstilosExcelTalentia(hoja as unknown as Record<string, unknown>, {
        totalColumns: cabeceras.length,
        titleRow: 0,
        metadataRows: [1, 2, 3, 4],
        headerRow: 6,
        firstDataRow: 7,
        lastDataRow: 6 + filas.length,
      });
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Calificaciones");
      const codigoSeguro = curso?.codigo?.replace(/[^a-z0-9_-]/gi, "_") || "Todos_los_cursos";
      XLSX.writeFile(libro, `Calificaciones_${codigoSeguro}_${fecha.toISOString().slice(0, 10)}.xlsx`);
    } catch {
      setErrorExportacion("No se pudo generar el archivo Excel. Inténtalo nuevamente.");
    } finally {
      setExportando(false);
    }
  }

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

        <div className="flex flex-col items-end gap-2">
          <button type="button" onClick={() => void exportarExcel()} disabled={!puedeExportar || exportando} aria-busy={exportando} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-talentia-action px-4 text-[13px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            {exportando ? "Exportando..." : "Exportar Excel"}
          </button>
          {errorExportacion && <p role="alert" className="text-[12px] text-talentia-danger">{errorExportacion}</p>}
        </div>

        <div className="overflow-hidden rounded-lg border border-talentia-border bg-talentia-surface">
          <div className="overflow-x-auto">
            <table aria-busy={cargandoRegistros} className="w-full min-w-[1160px] table-fixed border-collapse text-left text-[13px] leading-5">
              <caption className="sr-only">Progreso académico de alumnos</caption>
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[8%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-talentia-border bg-talentia-table-header font-bold text-talentia-primary">
                  <th scope="col" className="px-6 py-4">Periodo</th>
                  <th scope="col" className="px-4 py-4">Curso</th>
                  <th scope="col" className="px-4 py-4">Alumno</th>
                  <th scope="col" className="px-4 py-4 text-center">Promedio</th>
                  <th scope="col" className="px-4 py-4 text-center">Estado</th>
                  <th scope="col" className="px-4 py-4">Notas de evaluaciones</th>
                  <th scope="col" className="px-4 py-4 text-center">Certificado</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-talentia-border">
                {cargandoRegistros ? (
                  <tr><td colSpan={8} className="h-48 px-6 py-10 text-center text-talentia-muted">Cargando progreso...</td></tr>
                ) : registros.error ? (
                  <tr><td colSpan={8} role="alert" className="h-48 px-6 py-10 text-center text-talentia-danger">{registros.error}</td></tr>
                ) : registros.opciones.length === 0 ? (
                  <tr><td colSpan={8} className="h-48 px-6 py-10 text-center text-talentia-muted">No hay registros para mostrar.</td></tr>
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
                        <button type="button" aria-haspopup="dialog" onClick={() => setNotasSeleccionadas(registro)} className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-lg border border-talentia-blue/30 bg-talentia-surface px-3 text-[13px] font-semibold text-talentia-blue transition-colors hover:border-talentia-blue hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 focus-visible:ring-offset-2">Ver notas</button>
                      ) : <span className="text-talentia-muted">Sin evaluaciones configuradas.</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {registro.certificado?.disponible ? (
                        <CertificateDownloadButton
                          certificadoId={registro.certificado.id}
                          rutaDescarga={`/administrador/progreso-alumnos/${registro.id}/certificados/${registro.certificado.id}/pdf`}
                          fileName={`${registro.certificado.numero}.pdf`}
                          onBusyChange={(busy) => { if (busy) setErrorDescarga(null); }}
                          onError={(message) => setErrorDescarga({ id: registro.id, message })}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-talentia-blue/30 px-3 text-[13px] font-semibold text-talentia-blue hover:bg-talentia-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:opacity-50 [&_svg]:shrink-0"
                        />
                      ) : <span className="inline-flex min-h-10 items-center text-[12px] text-talentia-muted">Sin certificado disponible</span>}
                      {errorDescarga?.id === registro.id && <p role="alert" className="mt-2 text-[12px] text-talentia-danger">{errorDescarga.message}</p>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <CertificateActions matriculaId={registro.id} alumno={registro.alumno} codigoCurso={registro.codigoCurso} codigoAlumno={registro.codigoAlumno} certificado={registro.certificado} puedeGenerar={registro.puedeGenerarCertificado} onChanged={actualizarCertificados} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {notasSeleccionadas && <NotasModal registro={notasSeleccionadas} onClose={() => setNotasSeleccionadas(null)} />}
    </div>
  );
}
