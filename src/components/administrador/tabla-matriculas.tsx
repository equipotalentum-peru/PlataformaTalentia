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
      return "bg-[#BBF7D0] text-[#166534]";
    }
    if (estado === "Pendiente") return "bg-[#FEF3C7] text-[#92400E]";
    if (estado === "Retirada") return "bg-[#FBCFE8] text-[#9D174D]";
    return "bg-[#E2E8F0] text-[#475569]";
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
            Matrículas
          </h1>
          <p className="text-sm font-semibold text-[#64748B] mt-1">
            Gestiona alumnos inscritos por curso, cupos y cambios de estado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/administrador/matriculas/registrar")}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-sm whitespace-nowrap"
        >
          Registrar matrícula
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar alumno o curso"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroEstado("todos")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${filtroEstado === "todos" ? "bg-[#A5F3FC] text-[#0891B2]" : "bg-white text-[#64748B] hover:bg-gray-50 border border-gray-100"}`}
          >
            Curso
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("activas")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${filtroEstado === "activas" ? "bg-[#A5F3FC] text-[#0891B2]" : "bg-white text-[#64748B] hover:bg-gray-50 border border-gray-100"}`}
          >
            Activas
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("pendientes")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${filtroEstado === "pendientes" ? "bg-[#A5F3FC] text-[#0891B2]" : "bg-white text-[#64748B] hover:bg-gray-50 border border-gray-100"}`}
          >
            Pendientes
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F3FF] text-[#6B21A8] text-xs font-extrabold border-b border-gray-100">
                <th className="py-4 px-6">Alumno</th>
                <th className="py-4 px-6">Curso</th>
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {cargando ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-[#64748B]">Cargando matrículas...</td></tr>
              ) : matriculasFiltradas.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-[#64748B]">No se encontraron matrículas.</td></tr>
              ) : (
                matriculasFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-bold text-[#0F2851]">{item.alumno}</td>
                    <td className="py-4 px-6 font-semibold text-[#64748B]">{item.curso}</td>
                    <td className="py-4 px-6 font-semibold text-[#64748B]">{item.codigo}</td>
                    <td className="py-4 px-6 font-semibold text-[#64748B]">{item.fecha}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-4 py-1.5 rounded-full font-extrabold text-xs ${claseEstado(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="relative py-4 px-6 text-center">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-2xl font-bold text-[#475569] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ⋮
                    </button>
                    
                    {menuAbierto === item.id && (
                      <div className="absolute right-6 top-14 z-30 min-w-44 rounded-xl border border-gray-200 bg-white p-2 text-left shadow-lg">
                        <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#94A3B8]">
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
                            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition disabled:cursor-default ${
                              seleccionado
                              ? "bg-[#F3E8FF] text-[#6B21A8]"
                              : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F2851]"
                            }`}
                            >
                              <span>{estado}</span>
                              {seleccionado && (
                                <span aria-label="Estado actual" className="text-[#6B21A8]">
                                  ✓
                                  </span>
                                )}
                                </button>
                                );
                                })}
                                
                                {guardandoId === item.id && (
                                  <p className="px-3 py-2 text-[11px] text-[#64748B]">
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
