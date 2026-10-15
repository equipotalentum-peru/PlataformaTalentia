"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

interface CursoApi {
  id: string | number;
  nombre: string;
  codigo: string;
  docente: string;
  cupos: number | string;
  matriculados: number | string;
  estado: string;
}

interface Curso {
  id: string;
  nombre: string;
  codigo: string;
  docente: string;
  matriculas: string;
  estado: "Borrador" | "Activo" | "Inactivo";
}

export default function TablaCursos() {
  
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | "Activos" | "Inactivos" | "Borrador">("Todos");
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [cursoEnAccion, setCursoEnAccion] = useState<string | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCursos() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(
          `${API_URL}/administrador/cursos`,
          {
            method: "GET",
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
            data.message || "No se pudieron cargar los cursos."
          );
        }

        const lista: CursoApi[] = Array.isArray(data.cursos)
          ? data.cursos.filter(
              (curso: CursoApi) => curso.estado !== "Archivado"
            )
          : [];

        setCursos(
          lista.map((curso) => ({
            id: String(curso.id),
            nombre: curso.nombre,
            codigo: curso.codigo,
            docente: curso.docente || "Sin asignar",
            matriculas: `${Number(curso.matriculados) || 0} / ${
              Number(curso.cupos) || 0
            }`,
            estado: curso.estado === "Activo" ? "Activo" : curso.estado === "Inactivo" ? "Inactivo" : "Borrador",
          }))
        );
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los cursos."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarCursos();

    return () => controller.abort();
  }, [router]);
  
  const cambiarEstadoCurso = async (
    curso: Curso,
    nuevoEstado: "Activo" | "Inactivo" | "Archivado"
  ) => {
    const accion =
      nuevoEstado === "Activo"
        ? "activar"
        : nuevoEstado === "Inactivo"
          ? "desactivar"
          : "retirar";

    const mensaje =
      nuevoEstado === "Archivado"
        ? `¿Deseas retirar «${curso.nombre}»? El curso dejará de aparecer en los listados habituales, pero sus registros permanecerán en la base de datos.`
        : `¿Deseas ${accion} «${curso.nombre}»?`;

    if (!window.confirm(mensaje)) return;

    setCursoEnAccion(curso.id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/administrador/cursos/${encodeURIComponent(curso.id)}/estado`,
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
          data.message ?? "No se pudo cambiar el estado del curso."
        );
      }

      if (nuevoEstado === "Archivado") {
        setCursos((actuales) =>
          actuales.filter((item) => item.id !== curso.id)
        );
      } else {
        setCursos((actuales) =>
          actuales.map((item) =>
            item.id === curso.id
              ? { ...item, estado: nuevoEstado }
              : item
          )
        );
      }

      setMenuAbierto(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del curso."
      );
    } finally {
      setCursoEnAccion(null);
    }
  };

  // Filtrado por búsqueda y categoría
  const cursosFiltrados = cursos.filter((curso) => {
    const termino = searchTerm.trim().toLowerCase();

    const coincideBusqueda =
      curso.nombre.toLowerCase().includes(termino) ||
      curso.codigo.toLowerCase().includes(termino);

    if (filtroEstado === "Todos") return coincideBusqueda;

    if (filtroEstado === "Activos") {
      return coincideBusqueda && curso.estado === "Activo";
    }

    if (filtroEstado === "Inactivos") {
      return coincideBusqueda && curso.estado === "Inactivo";
    }

    return coincideBusqueda && curso.estado === "Borrador";
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Encabezado y Botón Crear Curso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
            Cursos
          </h1>
          <p className="text-sm text-[#6F83A5] mt-1 font-medium">
            Administración de cursos, docentes, publicación y cupos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/administrador/cursos/crear")}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-sm self-start sm:self-auto"
        >
          Crear curso
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por curso o código"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100/80 rounded-2xl px-5 py-3 text-sm text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition"
          />
        </div>

        {/* Píldoras de Filtro */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroEstado("Todos")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
              filtroEstado === "Todos"
                ? "bg-[#C4F1F9] text-[#0F2851]"
                : "bg-white text-[#475569] hover:bg-gray-50"
            }`}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("Activos")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
              filtroEstado === "Activos"
                ? "bg-[#C4F1F9] text-[#0F2851]"
                : "bg-white text-[#475569] hover:bg-gray-50"
            }`}
          >
            Activos
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("Inactivos")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
              filtroEstado === "Inactivos"
                ? "bg-[#C4F1F9] text-[#0F2851]"
                : "bg-white text-[#475569] hover:bg-gray-50"
            }`}
          >
            Inactivos
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("Borrador")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
              filtroEstado === "Borrador"
                ? "bg-[#C4F1F9] text-[#0F2851]"
                : "bg-white text-[#475569] hover:bg-gray-50"
            }`}
          >
            Borrador
          </button>
        </div>
      </div>

      {/* Tabla de Cursos */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3FD] text-[#312E81] text-xs font-extrabold">
                <th className="py-4 px-6">Curso</th>
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6">Docente</th>
                <th className="py-4 px-6">Matrículas</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-[#0F2851]">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B]">
                    Cargando cursos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : (
                <>
                  {cursosFiltrados.map((curso) => (
                    <tr key={curso.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6 font-bold">{curso.nombre}</td>
                      <td className="py-4 px-6 text-[#64748B]">{curso.codigo}</td>
                      <td className="py-4 px-6 text-[#64748B]">{curso.docente}</td>
                      <td className="py-4 px-6 text-[#64748B]">{curso.matriculas}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold ${
                            curso.estado === "Activo"
                              ? "bg-[#BBF7D0] text-[#166534]"
                              : curso.estado === "Inactivo"
                                ? "bg-[#E2E8F0] text-[#475569]"
                                : "bg-[#F3E8FF] text-[#6B21A8]"
                          }`}
                        >
                          {curso.estado}
                        </span>
                      </td>
                      <td className="relative py-4 px-6 text-center">
                        <button
                          type="button"
                          aria-label={`Acciones de ${curso.nombre}`}
                          aria-expanded={menuAbierto === curso.id}
                          disabled={cursoEnAccion === curso.id}
                          onClick={() =>
                            setMenuAbierto((actual) =>
                              actual === curso.id ? null : curso.id
                            )
                          }
                          className="rounded-xl px-4 py-2 text-xl font-bold text-[#475569] transition hover:bg-[#F1F5F9] disabled:opacity-50"
                        >
                          ⋮
                        </button>

                        {menuAbierto === curso.id && (
                          <div className="absolute right-6 top-14 z-30 min-w-40 rounded-xl border border-gray-200 bg-white p-1 text-left shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuAbierto(null);
                                router.push(
                                  `/administrador/cursos/configurar?id=${curso.id}`
                                );
                              }}
                              className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-[#0F2851] hover:bg-[#F1F5F9]"
                            >
                              Editar
                            </button>

                            {curso.estado === "Activo" && (
                              <button
                                type="button"
                                disabled={cursoEnAccion === curso.id}
                                onClick={() =>
                                  void cambiarEstadoCurso(curso, "Inactivo")
                                }
                                className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50"
                              >
                                Desactivar
                              </button>
                            )}

                            {curso.estado === "Inactivo" && (
                              <button
                                type="button"
                                disabled={cursoEnAccion === curso.id}
                                onClick={() =>
                                  void cambiarEstadoCurso(curso, "Activo")
                                }
                                className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                Activar
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={cursoEnAccion === curso.id}
                              onClick={() =>
                                void cambiarEstadoCurso(curso, "Archivado")
                              }
                              className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Retirar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {cursosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748B] text-sm">
                        No se encontraron cursos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}