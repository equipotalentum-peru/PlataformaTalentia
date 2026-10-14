"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: "Alumno" | "Docente" | "Administrador";
  actividad: string | null;
  estado: "Activo" | "Inactivo";
}

export default function UsuariosTable() {
  const [filtroRol, setFiltroRol] = useState<"Todos" | Usuario["rol"]>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    async function cargarUsuarios() {
      try {
        const response = await fetch(`${API_URL}/usuarios`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "No se pudo cargar la lista de usuarios.");
        }
        if (!controller.signal.aborted) setUsuarios(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Error de conexión.");
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    void cargarUsuarios();
    return () => controller.abort();
  }, []);

  const textoBusqueda = busqueda.trim().toLowerCase();
  const usuariosFiltrados = usuarios.filter((user) => {
    const coincideRol = filtroRol === "Todos" || user.rol === filtroRol;

    const coincideBusqueda =
      user.nombre.toLowerCase().includes(textoBusqueda) ||
      user.correo.toLowerCase().includes(textoBusqueda) ||
      user.rol.toLowerCase().includes(textoBusqueda);

    return coincideRol && coincideBusqueda;
  });

  return (
    <div className="w-full">
      {/* Encabezado de la página */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
            Usuarios
          </h1>
          <p className="text-sm text-[#6F83A5] mt-1 font-medium">
            Administración de alumnos, docentes y administradores.
          </p>
        </div>

        <button onClick={() => router.push("/administrador/usuarios/crear")} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all duration-200">
          Crear usuario
        </button>
      </div>

      {/* Controles: Búsqueda y Filtros de Píldora */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o rol"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        {/* Píldoras de Filtro */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-transparent p-1">
          {([
            ["Todos", "Todos"],
            ["Alumno", "Alumnos"],
            ["Docente", "Docentes"],
            ["Administrador", "Administradores"],
          ] as const).map(([rol, etiqueta]) => (
            <button
              key={rol}
              onClick={() => setFiltroRol(rol)}
              aria-pressed={filtroRol === rol}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                filtroRol === rol
                  ? "bg-[#C4F1F9] text-[#0F2851]"
                  : "bg-white text-[#475569] hover:bg-gray-100"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla estilo Figma */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F1EBFD]">
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Usuario</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Correo</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Rol</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Último acceso</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Estado</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs">
            {(cargando || error || usuariosFiltrados.length === 0) && (
              <tr>
                <td colSpan={6} className="py-6 px-6 text-[#64748B]" role={error ? "alert" : "status"}>
                  {cargando ? "Cargando usuarios..." : error || "No se encontraron usuarios."}
                </td>
              </tr>
            )}
            {!cargando && !error && usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6 font-extrabold text-[#0F2851]">
                  {usuario.nombre}
                </td>
                <td className="py-4 px-6 text-[#64748B] font-medium">
                  {usuario.correo}
                </td>
                <td className="py-4 px-6 text-[#64748B] font-medium">
                  {usuario.rol}
                </td>
                <td className="py-4 px-6 text-[#64748B] font-medium">
                  {usuario.actividad
                    ? new Date(usuario.actividad).toLocaleString("es-PE")
                    : "Sin acceso registrado"}
                </td>
                <td className="py-4 px-6">
                  {usuario.estado === "Activo" ? (
                    <span className="inline-block bg-[#BBF7D0] text-[#166534] px-4 py-1.5 rounded-full font-bold text-[11px]">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-block bg-[#FBCFE8] text-[#9D174D] px-4 py-1.5 rounded-full font-bold text-[11px]">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="py-4 px-6">
                  {usuario.estado === "Activo" && (
                    <button onClick={() => router.push(`/administrador/usuarios/editar?id=${usuario.id}`)} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-4 py-2 rounded-xl text-xs transition">
                      Ver / Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
