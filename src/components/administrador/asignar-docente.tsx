"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import type { DocenteDisponible } from "@/lib/cursos-admin-types";

export interface AsignarDocenteProps {
  esPasoWizard?: boolean;
  nombreCurso?: string;
  docenteSeleccionadoId?: string | null;
  onSeleccionarDocente?: (docente: DocenteDisponible | null) => void;
}

export default function AsignarDocente({
  esPasoWizard = false,
  nombreCurso = "Curso por configurar",
  docenteSeleccionadoId,
  onSeleccionarDocente,
}: AsignarDocenteProps) {
  const [docentes, setDocentes] = useState<DocenteDisponible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionLocal, setSeleccionLocal] = useState<string | null>(null);

  const seleccionControlada = typeof onSeleccionarDocente === "function";
  const seleccionadoId = seleccionControlada
    ? docenteSeleccionadoId ?? null
    : seleccionLocal;

  useEffect(() => {
    const controller = new AbortController();

    async function cargarDocentes() {
      setCargando(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/administrador/cursos/docentes`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "No se pudieron cargar los docentes.");
        }

        setDocentes(Array.isArray(data.docentes) ? data.docentes : []);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar los docentes.");
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    void cargarDocentes();
    return () => controller.abort();
  }, []);

  const docentesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return docentes;

    return docentes.filter((docente) =>
      docente.nombre
        .toLowerCase()
        .includes(termino)
    );
  }, [busqueda, docentes]);

  const seleccionar = (docente: DocenteDisponible) => {
    if (seleccionControlada) {
      onSeleccionarDocente?.(seleccionadoId === docente.id ? null : docente);
    } else {
      setSeleccionLocal(seleccionadoId === docente.id ? null : docente.id);
    }
  };

  const docenteActual = docentes.find((docente) => docente.id === seleccionadoId);

  return (
    <div className="w-full">
      {!esPasoWizard && (
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">Asignar docente</h1>
          <p className="text-sm text-talentia-muted font-medium mt-1">
            Selecciona al profesor responsable del curso.
          </p>
        </div>
      )}

      <div className="bg-talentia-surface rounded-3xl p-8 shadow-sm border border-talentia-border/80">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-talentia-primary mb-2">Curso: {nombreCurso}</h2>
          <div className="flex flex-wrap gap-2">
            <span className="bg-talentia-purple-soft text-talentia-purple text-xs font-extrabold px-3 py-1 rounded-full">
              Borrador
            </span>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${docenteActual ? "bg-talentia-success-bg text-talentia-success" : "bg-talentia-warning-bg text-talentia-warning"}`}>
              {docenteActual ? `Docente: ${docenteActual.nombre}` : "Sin docente"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="buscar-docente" className="block text-xs font-extrabold text-talentia-primary mb-2">
            Buscar docente
          </label>
          <input
            id="buscar-docente"
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre del docente"
            className="w-full max-w-md bg-talentia-surface border border-talentia-border rounded-2xl px-4 py-3 text-sm text-talentia-primary focus:outline-none focus:ring-2 focus:ring-talentia-blue"
          />
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-sm text-talentia-danger">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-talentia-surface text-xs font-extrabold text-talentia-primary">
                <th className="p-4 rounded-l-2xl">Docente</th>
                <th className="p-4">Carga</th>
                <th className="p-4 rounded-r-2xl">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-talentia-border text-sm font-medium text-talentia-primary">
              {cargando ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-talentia-muted">Cargando docentes...</td>
                </tr>
              ) : docentesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-talentia-muted">
                    {docentes.length === 0 ? "No hay docentes activos registrados." : "No hay docentes que coincidan con la búsqueda."}
                  </td>
                </tr>
              ) : (
                docentesFiltrados.map((docente) => {
                  const seleccionado = seleccionadoId === docente.id;
                  return (
                    <tr key={docente.id}>
                      <td className="p-4 font-bold">{docente.nombre}</td>
                      <td className="p-4 text-talentia-muted">{docente.carga} cursos</td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => seleccionar(docente)}
                          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition ${seleccionado ? "bg-talentia-success text-white" : "bg-talentia-action hover:bg-talentia-primary text-white"}`}
                        >
                          {seleccionado ? "Asignado" : "Asignar"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {seleccionadoId && (
          <button
            type="button"
            onClick={() => {
              if (seleccionControlada) onSeleccionarDocente?.(null);
              else setSeleccionLocal(null);
            }}
            className="mt-5 text-sm font-bold text-talentia-purple hover:underline"
          >
            Quitar docente asignado
          </button>
        )}
      </div>
    </div>
  );
}
