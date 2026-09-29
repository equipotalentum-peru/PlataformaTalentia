"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: "Alumno" | "Docente";
  actividad: string;
  estado: "Activo" | "Inactivo";
}

const usuariosIniciales: Usuario[] = [
  {
    id: 1,
    nombre: "Gray Padilla",
    correo: "gray@talentum.pe",
    rol: "Alumno",
    actividad: "Hace 2 días",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Gloria Rocha",
    correo: "gloria@talentum.pe",
    rol: "Docente",
    actividad: "Hoy",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Luis Vega",
    correo: "lvega@talentum.pe",
    rol: "Docente",
    actividad: "Ayer",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Camila Soto",
    correo: "camila@talentum.pe",
    rol: "Alumno",
    actividad: "Hace 8 días",
    estado: "Inactivo",
  },
  {
    id: 5,
    nombre: "Marco Ruiz",
    correo: "marco@talentum.pe",
    rol: "Docente",
    actividad: "Hace 12 días",
    estado: "Inactivo",
  },
];

export default function UsuariosTable() {
  const [filtroRol, setFiltroRol] = useState<"Todos" | "Alumnos" | "Docentes">("Todos");
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  const usuariosFiltrados = usuariosIniciales.filter((user) => {
    const coincideRol =
      filtroRol === "Todos" ||
      (filtroRol === "Alumnos" && user.rol === "Alumno") ||
      (filtroRol === "Docentes" && user.rol === "Docente");

    const coincideBusqueda =
      user.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.rol.toLowerCase().includes(busqueda.toLowerCase());

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
            Administración de alumnos, docentes y estados de acceso.
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
        <div className="flex items-center gap-2 bg-transparent p-1">
          <button
            onClick={() => setFiltroRol("Todos")}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              filtroRol === "Todos"
                ? "bg-[#C4F1F9] text-[#0F2851]"
                : "bg-white text-[#475569] hover:bg-gray-100"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroRol("Alumnos")}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              filtroRol === "Alumnos"
                ? "bg-[#C4F1F9] text-[#0F2851]"
                : "bg-white text-[#475569] hover:bg-gray-100"
            }`}
          >
            Alumnos
          </button>
          <button
            onClick={() => setFiltroRol("Docentes")}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              filtroRol === "Docentes"
                ? "bg-[#C4F1F9] text-[#0F2851]"
                : "bg-white text-[#475569] hover:bg-gray-100"
            }`}
          >
            Docentes
          </button>
        </div>
      </div>

      {/* Tabla estilo Figma */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F1EBFD]">
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Usuario</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Correo</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Rol</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Actividad</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Estado</th>
              <th className="py-4 px-6 text-xs font-bold text-[#7C3AED]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs">
            {usuariosFiltrados.map((usuario) => (
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
                  {usuario.actividad}
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