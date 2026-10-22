"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";

type AsistenciaAlumno = {
  alumno: { nombre: string; correo: string };
  curso: { nombre: string };
  resumen: { asistidas: number; faltas: number; registradas: number; porcentaje: number | null };
  historial: { id: string; numero: number; tema: string; iniciaEn: string; estado: "Presente" | "Falta" | null }[];
};

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Lima" });

export default function StudentAttendanceModal({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [intento, setIntento] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<{ intento: number; datos: AsistenciaAlumno | null; error: string }>({ intento: -1, datos: null, error: "" });
  const cargando = resultado.intento !== intento;
  const datos = cargando ? null : resultado.datos;
  const totalPaginas = Math.max(1, Math.ceil((datos?.historial.length ?? 0) / 5));
  const paginaActual = Math.min(pagina, totalPaginas);
  const clasesPagina = datos?.historial.slice((paginaActual - 1) * 5, paginaActual * 5) ?? [];
  const primeraPagina = Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4));
  const paginas = Array.from({ length: Math.min(totalPaginas, 5) }, (_, indice) => primeraPagina + indice);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function cargar() {
      try {
        const response = await fetch(`${API_URL}/asistencias/alumno/${courseId}`, { credentials: "include", cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? "No se pudo cargar tu asistencia.");
        if (!controller.signal.aborted) setResultado({ intento, datos: data, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setResultado({ intento, datos: null, error: error instanceof Error ? error.message : "No se pudo cargar tu asistencia." });
      }
    }
    void cargar();
    return () => controller.abort();
  }, [courseId, intento]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="alumno-asistencia-titulo"
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-lg border border-talentia-border bg-talentia-surface p-0 text-talentia-primary shadow-xl backdrop:bg-talentia-primary/40"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-talentia-border px-5 py-4 sm:px-6">
          <h2 id="alumno-asistencia-titulo" className="text-[18px] font-bold">Mi asistencia</h2>
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="Cerrar asistencia" title="Cerrar" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-xl text-talentia-muted transition-colors hover:bg-talentia-hover hover:text-talentia-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30">×</button>
        </header>
        <div aria-busy={cargando} className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          {cargando ? <p role="status" className="py-12 text-center text-[13px] text-talentia-muted">Cargando tu asistencia...</p> : resultado.error ? (
            <div className="py-8 text-center">
              <p role="alert" className="text-[13px] text-talentia-danger">{resultado.error}</p>
              <button type="button" onClick={() => setIntento((actual) => actual + 1)} className="mt-4 h-9 rounded-lg border border-talentia-border px-4 text-[13px] font-semibold hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30">Reintentar</button>
            </div>
          ) : datos && (
            <>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-talentia-selected text-[14px] font-bold text-talentia-blue">{datos.alumno.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("")}</span>
                <div className="min-w-0">
                  <p className="break-words text-[14px] font-semibold">{datos.alumno.nombre}</p>
                  <p className="mt-0.5 break-all text-[12px] text-talentia-muted">{datos.alumno.correo}</p>
                </div>
              </div>
              <p className="mt-4 break-words text-[13px] font-medium">{datos.curso.nombre}</p>
              <dl className="mt-4 grid divide-x divide-talentia-border border-y border-talentia-border py-4 text-center" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                <div className="px-1">
                  <dd className="text-[22px] font-bold tabular-nums text-talentia-blue">{datos.resumen.porcentaje === null ? "—" : `${datos.resumen.porcentaje}%`}</dd>
                  <dt className="mt-1 text-[12px] text-talentia-muted">Asistencia</dt>
                </div>
                <div className="px-1">
                  <dd className="text-[22px] font-bold tabular-nums text-talentia-success">{datos.resumen.asistidas}</dd>
                  <dt className="mt-1 text-[12px] text-talentia-muted">Asistidas</dt>
                </div>
                <div className="px-1">
                  <dd className="text-[22px] font-bold tabular-nums text-talentia-danger">{datos.resumen.faltas}</dd>
                  <dt className="mt-1 text-[12px] text-talentia-muted">Faltas</dt>
                </div>
              </dl>
              <div className="mb-3 mt-5 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] font-semibold">Historial de clases</h3>
                <span className="text-[12px] text-talentia-muted">{datos.resumen.registradas} {datos.resumen.registradas === 1 ? "asistencia registrada" : "asistencias registradas"}</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-talentia-border">
                <table className="w-full table-fixed border-collapse text-left text-[13px] leading-5">
                  <caption className="sr-only">Historial de asistencia de {datos.alumno.nombre} en {datos.curso.nombre}</caption>
                  <colgroup><col className="w-[65%]" /><col className="w-[35%]" /></colgroup>
                  <thead className="bg-talentia-table-header"><tr><th scope="col" className="px-3 py-3 font-semibold sm:px-4">Fecha y clase</th><th scope="col" className="px-2 py-3 text-center font-semibold sm:px-3">Estado</th></tr></thead>
                  <tbody id="alumno-asistencia-historial" className="divide-y divide-talentia-border border-t border-talentia-border">
                    {datos.historial.length === 0 ? <tr><td colSpan={2} className="px-4 py-8 text-center text-talentia-muted">Aún no hay clases realizadas para mostrar.</td></tr> : clasesPagina.map((sesion) => (
                      <tr key={sesion.id}>
                        <td className="px-3 py-3 sm:px-4">
                          <time dateTime={sesion.iniciaEn} className="font-medium">{formatoFecha.format(new Date(sesion.iniciaEn))}</time>
                          <p className="mt-0.5 break-words text-[12px] text-talentia-muted">Clase {sesion.numero}: {sesion.tema}</p>
                        </td>
                        <td className="px-2 py-3 text-center sm:px-3">
                          <span className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-semibold ${sesion.estado === "Presente" ? "bg-talentia-success-bg text-talentia-success" : sesion.estado === "Falta" ? "bg-talentia-danger-bg text-talentia-danger" : "bg-talentia-warning-bg text-talentia-warning"}`}>
                            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                            {sesion.estado ?? "Sin registrar"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPaginas > 1 && (
                <nav aria-label="Páginas del historial de asistencia" className="mt-4 flex flex-col items-center gap-2">
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <button type="button" aria-label="Página anterior" title="Página anterior" aria-controls="alumno-asistencia-historial" disabled={paginaActual === 1} onClick={() => setPagina(paginaActual - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded border border-talentia-border text-lg hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:cursor-not-allowed disabled:opacity-40">‹</button>
                    {paginas.map((numero) => (
                      <button key={numero} type="button" aria-label={`Página ${numero}`} aria-current={numero === paginaActual ? "page" : undefined} aria-controls="alumno-asistencia-historial" onClick={() => setPagina(numero)} className={`inline-flex h-8 w-8 items-center justify-center rounded border text-[12px] font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 ${numero === paginaActual ? "border-talentia-blue bg-talentia-blue text-white" : "border-talentia-border hover:bg-talentia-hover"}`}>{numero}</button>
                    ))}
                    <button type="button" aria-label="Página siguiente" title="Página siguiente" aria-controls="alumno-asistencia-historial" disabled={paginaActual === totalPaginas} onClick={() => setPagina(paginaActual + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded border border-talentia-border text-lg hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:cursor-not-allowed disabled:opacity-40">›</button>
                  </div>
                  <p aria-live="polite" className="text-[12px] text-talentia-muted">Página {paginaActual} de {totalPaginas}</p>
                </nav>
              )}
            </>
          )}
        </div>
        <footer className="flex shrink-0 justify-end border-t border-talentia-border px-5 py-3 sm:px-6">
          <button type="button" onClick={() => dialogRef.current?.close()} className="h-9 rounded-lg border border-talentia-border px-4 text-[13px] font-semibold transition-colors hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30">Cerrar</button>
        </footer>
      </div>
    </dialog>
  );
}
