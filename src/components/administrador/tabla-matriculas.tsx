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
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [estadoEditado, setEstadoEditado] = useState<EstadoMatricula>("Pendiente");
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

  async function guardarEstado(matricula: Matricula) {
    setError("");
    setGuardandoId(matricula.id);

    try {
      const response = await fetch(
        `${API_URL}/administrador/matriculas/${encodeURIComponent(matricula.id)}/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: estadoEditado }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo actualizar la matrícula.");
      }

      setMatriculas((actuales) =>
        actuales.map((item) =>
          item.id === matricula.id ? { ...item, estado: estadoEditado } : item
        )
      );
      setEditandoId(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo actualizar la matrícula."
      );
    } finally {
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
                    <td className="py-4 px-6 text-center">
                      {editandoId === item.id ? (
                        <div className="flex min-w-36 flex-col gap-2">
                          <select
                            value={estadoEditado}
                            onChange={(event) => setEstadoEditado(event.target.value as EstadoMatricula)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-[#0F2851]"
                          >
                            {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                          </select>
                          <button
                            type="button"
                            disabled={guardandoId === item.id}
                            onClick={() => void guardarEstado(item)}
                            className="rounded-xl bg-[#3B82F6] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {guardandoId === item.id ? "Guardando..." : "Guardar"}
                          </button>
                          <button
                            type="button"
                            disabled={guardandoId === item.id}
                            onClick={() => setEditandoId(null)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#64748B]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoId(item.id);
                            setEstadoEditado(item.estado);
                          }}
                          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-2 rounded-xl transition shadow-sm"
                        >
                          {item.estado === "Retirada" || item.estado === "Cancelada" ? "Historial" : "Modificar"}
                        </button>
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
