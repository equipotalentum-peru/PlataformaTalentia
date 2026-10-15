"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import UsuarioDetallesModal from "./usuario-detalles-modal";

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
  const [menu, setMenu] = useState<{ usuario: Usuario; top: number; left: number } | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const cambiandoRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!menu) return;
    function cerrarFuera(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node) &&
          !(event.target as Element).closest("[data-user-actions]")) setMenu(null);
    }
    function cerrar() { setMenu(null); }
    function teclado(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }
    menuRef.current?.querySelector("button")?.focus();
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", teclado);
    window.addEventListener("resize", cerrar);
    window.addEventListener("scroll", cerrar, true);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", teclado);
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("scroll", cerrar, true);
    };
  }, [menu]);

  async function cambiarUsuario(usuario: Usuario, eliminar: boolean) {
    if (cambiandoRef.current) return;
    setMenu(null);
    const accion = eliminar ? "eliminar definitivamente" : usuario.estado === "Activo" ? "desactivar" : "activar";
    if (!window.confirm(`¿Deseas ${accion} a ${usuario.nombre}?`)) return;
    cambiandoRef.current = true;
    setCambiando(true);
    setErrorAccion("");
    try {
      const activo = usuario.estado !== "Activo";
      const response = await fetch(`${API_URL}/usuarios/${usuario.id}${eliminar ? "" : "/estado"}`, {
        method: eliminar ? "DELETE" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: eliminar ? undefined : JSON.stringify({ activo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo guardar el cambio.");
      setUsuarios((prev) => eliminar ? prev.filter((item) => item.id !== usuario.id) :
        prev.map((item) => item.id === usuario.id ? { ...item, estado: activo ? "Activo" : "Inactivo" } : item));
    } catch (error) {
      setErrorAccion(error instanceof Error ? error.message : "Error de conexión.");
    } finally {
      cambiandoRef.current = false;
      setCambiando(false);
    }
  }

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
      {errorAccion && <p role="alert" className="mb-4 text-sm text-red-600">{errorAccion}</p>}
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
                  <button type="button" data-user-actions aria-expanded={menu?.usuario.id === usuario.id}
                    aria-controls={menu?.usuario.id === usuario.id ? "usuario-acciones" : undefined}
                    disabled={cambiando}
                    onClick={(event) => {
                      if (menu?.usuario.id === usuario.id) { setMenu(null); return; }
                      const rect = event.currentTarget.getBoundingClientRect();
                      setMenu({ usuario,
                        top: rect.bottom + 200 > window.innerHeight ? Math.max(8, rect.top - 192) : rect.bottom + 6,
                        left: Math.max(8, Math.min(rect.right - 224, window.innerWidth - 232)),
                      });
                    }}
                    className="bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F2851] font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50">
                    Acciones
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {menu && createPortal(
        <div ref={menuRef} id="usuario-acciones" aria-label={`Acciones de ${menu.usuario.nombre}`}
          style={{ top: menu.top, left: menu.left }}
          className="fixed z-50 w-56 rounded-lg border border-slate-100 bg-white py-1 text-sm text-[#0F2851] shadow-lg">
          {([
            ["Ver detalles", "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6"],
            ["Editar", "m16 3 5 5M3 21l5-1L21 7a2 2 0 0 0-5-5L3 16v5Z"],
            [menu.usuario.estado === "Activo" ? "Desactivar" : "Activar", "M12 2v10M6 5a9 9 0 1 0 12 0"],
            ["Eliminar", "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"],
          ] as const).map(([label, path], index) => (
            <button key={label} type="button"
              onClick={() => {
                setMenu(null);
                if (index === 0) setDetalleId(menu.usuario.id);
                else if (index === 1) router.push(`/administrador/usuarios/editar?id=${menu.usuario.id}`);
                else void cambiarUsuario(menu.usuario, index === 3);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 ${index === 3 ? "border-t border-slate-100 text-red-600" : ""}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><path d={path} /></svg>
              {label}
            </button>
          ))}
        </div>, document.body
      )}
      {detalleId && <UsuarioDetallesModal key={detalleId} id={detalleId} onClose={() => setDetalleId(null)} />}
    </div>
  );
}
