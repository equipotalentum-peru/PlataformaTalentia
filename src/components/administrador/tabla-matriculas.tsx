"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type EstadoMatricula =
  | "Pendiente"
  | "Activa"
  | "Completada"
  | "Retirada"
  | "Cancelada";

interface Matricula {
  id: string;
  alumno: string;
  codigo: string;
  curso: string;
  codigoCurso: string;
  periodo: string;
  fecha: string;
  estado: EstadoMatricula;
  estadoPago: "Pendiente" | "Pagado" | "No aplica";
}

const ESTADOS: EstadoMatricula[] = [
  "Pendiente",
  "Activa",
  "Completada",
  "Retirada",
  "Cancelada",
];

export default function TablaMatriculas() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const router = useRouter();

  const cargarMatriculas = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(`${API_URL}/administrador/matriculas`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudieron cargar las matrículas.");
      }

      setMatriculas(Array.isArray(data.matriculas) ? data.matriculas : []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar las matrículas desde la base de datos."
      );
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargarMatriculas();
  }, [cargarMatriculas]);

  const matriculasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return matriculas.filter((matricula) => {
      const coincideBusqueda = [
        matricula.alumno,
        matricula.curso,
        matricula.codigo,
        matricula.codigoCurso,
        matricula.periodo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(termino);

      if (!coincideBusqueda) return false;
      if (filtroEstado === "activas") return matricula.estado === "Activa";
      if (filtroEstado === "pendientes") return matricula.estado === "Pendiente";
      return true;
    });
  }, [matriculas, busqueda, filtroEstado]);
  
  async function guardarEstado(
    matricula: Matricula,
    nuevoEstado: EstadoMatricula
  ) {
    setError("");
    setGuardandoId(matricula.id);
    
    try {
      const response = await fetch(
        `${API_URL}/administrador/matriculas/${encodeURIComponent(matricula.id)}/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );
      
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      
      if (!response.ok) {
        throw new Error(
          data.message ?? "No se pudo actualizar la matrícula."
        );
      }
      
      setMatriculas((actuales) =>
        actuales.map((item) => item.id === matricula.id ? { ...item, estado: nuevoEstado } : item)
    );
    
    setMenuAbierto(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar la matrícula."
      );
    }   finally {
      setGuardandoId(null);
    }
  }

  const claseEstado = (estado: EstadoMatricula) => {
    if (estado === "Activa" || estado === "Completada") {
      return "bg-talentia-success-bg text-talentia-success";
    }
    if (estado === "Pendiente") return "bg-talentia-warning-bg text-talentia-warning";
    if (estado === "Retirada") return "bg-talentia-danger-bg text-talentia-danger";
    return "bg-talentia-surface text-talentia-muted";
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">
            Matrículas
          </h1>
          <p className="text-sm font-semibold text-talentia-muted mt-1">
            Gestiona alumnos inscritos por curso, cupos y cambios de estado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/administrador/matriculas/registrar")}
          className="bg-talentia-action hover:bg-talentia-primary text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-sm whitespace-nowrap"
        >
          Registrar matrícula
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-[13px] font-semibold text-talentia-muted">
          Buscar
          <input
            type="text"
            placeholder="Buscar alumno o curso"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="h-11 w-full rounded-lg border border-talentia-border bg-talentia-surface px-4 text-sm font-normal text-talentia-primary placeholder-talentia-placeholder outline-none transition-colors hover:border-talentia-border focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
          />
        </label>

        <div className="flex min-w-0 flex-col gap-2 lg:shrink-0">
          <span className="text-[13px] font-semibold text-talentia-muted">Estado</span>
          <div className="flex min-h-11 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroEstado("todos")}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition ${filtroEstado === "todos" ? "bg-talentia-selected text-talentia-blue" : "bg-talentia-surface text-talentia-muted hover:bg-talentia-hover border border-talentia-border"}`}
          >
            Curso
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("activas")}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition ${filtroEstado === "activas" ? "bg-talentia-selected text-talentia-blue" : "bg-talentia-surface text-talentia-muted hover:bg-talentia-hover border border-talentia-border"}`}
          >
            Activas
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("pendientes")}
            className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition ${filtroEstado === "pendientes" ? "bg-talentia-selected text-talentia-blue" : "bg-talentia-surface text-talentia-muted hover:bg-talentia-hover border border-talentia-border"}`}
          >
            Pendientes
          </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-[13px] font-semibold text-talentia-danger">
          {error}
        </p>
      )}

      <div className="bg-talentia-surface rounded-3xl shadow-sm border border-talentia-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-[22%]" />
              <col />
              <col className="w-28" />
              <col className="w-36" />
              <col className="w-36" />
              <col className="w-24" />
            </colgroup>
            <thead>
              <tr className="bg-talentia-table-header text-talentia-primary text-[13px] font-extrabold border-b border-talentia-border">
                <th className="py-4 px-6">Alumno</th>
                <th className="py-4 px-4">Curso</th>
                <th className="py-4 px-4">Código</th>
                <th className="py-4 px-4">Fecha</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-talentia-border text-[13px]">
              {cargando ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-[13px] text-talentia-muted">Cargando matrículas...</td></tr>
              ) : matriculasFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-[13px] text-talentia-muted">No se encontraron matrículas.</td></tr>
              ) : (
                matriculasFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-talentia-hover/50 transition">
                    <td className="py-4 px-6 break-words font-bold text-talentia-primary">{item.alumno}</td>
                    <td className="py-4 px-4 break-words font-semibold text-talentia-muted">{item.curso}</td>
                    <td className="py-4 px-4 whitespace-nowrap font-semibold text-talentia-muted">{item.codigo}</td>
                    <td className="py-4 px-4 whitespace-nowrap font-semibold text-talentia-muted">{item.fecha}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block whitespace-nowrap px-4 py-1.5 rounded-full font-extrabold text-[13px] ${claseEstado(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="relative py-4 px-4 text-center">
                      <button
                      type="button"
                      aria-label={`Acciones de la matrícula de ${item.alumno}`}
                      aria-expanded={menuAbierto === item.id}
                      disabled={guardandoId === item.id}
                      onClick={() =>
                        setMenuAbierto((actual) =>
                          actual === item.id ? null : item.id
                    )
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-2xl font-bold text-talentia-muted transition hover:bg-talentia-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ⋮
                    </button>
                    
                    {menuAbierto === item.id && (
                      <div className="absolute right-6 top-14 z-30 min-w-44 rounded-xl border border-talentia-border bg-talentia-surface p-2 text-left shadow-lg">
                        <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-talentia-placeholder">
                          Cambiar estado
                          </p>
                          
                          {ESTADOS.map((estado) => {
                            const seleccionado = item.estado === estado;
                            const guardando = guardandoId === item.id;
                            
                            return (
                            <button
                            key={estado}
                            type="button"
                            disabled={guardando || seleccionado}
                            onClick={() => void guardarEstado(item, estado)}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-bold transition disabled:cursor-default ${
                              seleccionado
                              ? "bg-talentia-selected text-talentia-purple"
                              : "text-talentia-muted hover:bg-talentia-hover hover:text-talentia-primary"
                            }`}
                            >
                              <span>{estado}</span>
                              {seleccionado && (
                                <span aria-label="Estado actual" className="text-talentia-purple">
                                  ✓
                                  </span>
                                )}
                                </button>
                                );
                                })}
                                
                                {guardandoId === item.id && (
                                  <p className="px-3 py-2 text-[11px] text-talentia-muted">
                                    Guardando estado...
                                    </p>
                                  )}
                                  </div>
                                )}
                                </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
