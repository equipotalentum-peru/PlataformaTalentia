"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Curso {
  id: string;
  nombre: string;
  codigo: string;
  docente: string;
  matriculas: string;
  estado: "Borrador" | "Activo";
}

const cursosIniciales: Curso[] = [
  {
    id: "1",
    nombre: "Diseño UX",
    codigo: "UX001",
    docente: "Sin asignar",
    matriculas: "64 / 80",
    estado: "Borrador",
  },
  {
    id: "2",
    nombre: "Herramientas TIC",
    codigo: "TIC002",
    docente: "Gloria Rocha",
    matriculas: "126 / 140",
    estado: "Activo",
  },
  {
    id: "3",
    nombre: "Cloud básico",
    codigo: "CLD003",
    docente: "Luis Vega",
    matriculas: "88 / 100",
    estado: "Activo",
  },
  {
    id: "4",
    nombre: "Investigación",
    codigo: "INV004",
    docente: "Ana Torres",
    matriculas: "42 / 60",
    estado: "Activo",
  },
];

export default function TablaCursos() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | "Activos" | "Borrador">("Todos");

  // Filtrado por búsqueda y categoría
  const cursosFiltrados = cursosIniciales.filter((curso) => {
    const coincideBusqueda =
      curso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    if (filtroEstado === "Todos") return coincideBusqueda;
    if (filtroEstado === "Activos") return coincideBusqueda && curso.estado === "Activo";
    if (filtroEstado === "Borrador") return coincideBusqueda && curso.estado === "Borrador";

    return coincideBusqueda;
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
              {cursosFiltrados.map((curso) => (
                <tr key={curso.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 px-6 font-bold">{curso.nombre}</td>
                  <td className="py-4 px-6 text-[#64748B]">{curso.codigo}</td>
                  <td className="py-4 px-6 text-[#64748B]">{curso.docente}</td>
                  <td className="py-4 px-6 text-[#64748B]">{curso.matriculas}</td>
                  <td className="py-4 px-6">
                    {curso.estado === "Activo" ? (
                      <span className="inline-block bg-[#BBF7D0] text-[#166534] px-4 py-1.5 rounded-full text-xs font-bold">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-block bg-[#F3E8FF] text-[#6B21A8] px-4 py-1.5 rounded-full text-xs font-bold">
                        Borrador
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/administrador/cursos/configurar?id=${curso.id}`)
                      }
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-5 py-2 rounded-xl text-xs transition"
                    >
                      Configurar
                    </button>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}