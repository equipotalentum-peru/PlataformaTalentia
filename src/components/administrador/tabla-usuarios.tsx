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
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | Usuario["estado"]>("Todos");
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
    const coincideEstado = filtroEstado === "Todos" || user.estado === filtroEstado;

    const coincideBusqueda =
      user.nombre.toLowerCase().includes(textoBusqueda) ||
      user.correo.toLowerCase().includes(textoBusqueda) ||
      user.rol.toLowerCase().includes(textoBusqueda);

    return coincideRol && coincideEstado && coincideBusqueda;
  });

  return (
    <div className="w-full space-y-6">
      {/* Encabezado de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">
            Usuarios
          </h1>
          <p className="text-sm font-semibold text-talentia-muted mt-1">
            Administración de alumnos, docentes y administradores.
          </p>
        </div>

        <button onClick={() => router.push("/administrador/usuarios/crear")} className="bg-talentia-action hover:bg-talentia-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all duration-200">
          Crear usuario
        </button>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 min-[480px]:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_160px]">
        <label className="flex min-w-0 flex-col gap-2 text-[13px] font-semibold text-talentia-muted min-[480px]:col-span-2 lg:col-span-1">
          Buscar
          <input
            type="text"
            placeholder="Buscar por nombre, correo o rol"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-11 w-full rounded-lg border border-talentia-border bg-talentia-surface px-4 text-sm font-normal text-talentia-primary placeholder-talentia-placeholder outline-none transition-colors hover:border-talentia-border focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
          />
        </label>

          <label className="flex min-w-0 flex-col gap-2 text-[13px] font-semibold text-talentia-muted">
            Rol
            <select value={filtroRol}
              onChange={(event) => setFiltroRol(event.target.value as typeof filtroRol)}
              className="h-11 w-full min-w-0 cursor-pointer rounded-lg border border-talentia-border bg-talentia-surface px-3 text-sm font-normal text-talentia-primary outline-none transition-colors hover:border-talentia-border focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15">
              <option value="Todos">Todos</option>
              <option value="Alumno">Alumno</option>
              <option value="Docente">Docente</option>
              <option value="Administrador">Administrador</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-[13px] font-semibold text-talentia-muted">
            Estado
            <select value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value as typeof filtroEstado)}
              className="h-11 w-full min-w-0 cursor-pointer rounded-lg border border-talentia-border bg-talentia-surface px-3 text-sm font-normal text-talentia-primary outline-none transition-colors hover:border-talentia-border focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15">
              <option value="Todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>
      </div>

      {/* Tabla estilo Figma */}
      {errorAccion && <p role="alert" className="mb-4 text-[13px] text-talentia-danger">{errorAccion}</p>}
      <div className="bg-talentia-surface rounded-3xl shadow-sm border border-talentia-border/80 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-talentia-table-header text-talentia-primary text-[13px] font-extrabold border-b border-talentia-border">
              <th className="py-4 px-6">Usuario</th>
              <th className="py-4 px-6">Correo</th>
              <th className="py-4 px-6">Rol</th>
              <th className="py-4 px-6">Último acceso</th>
              <th className="py-4 px-6">Estado</th>
              <th className="py-4 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-talentia-border text-[13px]">
            {(cargando || error || usuariosFiltrados.length === 0) && (
              <tr>
                <td colSpan={6} className="py-6 px-6 text-talentia-muted" role={error ? "alert" : "status"}>
                  {cargando ? "Cargando usuarios..." : error || "No se encontraron usuarios."}
                </td>
              </tr>
            )}
            {!cargando && !error && usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-talentia-hover/50 transition-colors">
                <td className="py-4 px-6 font-bold text-talentia-primary">
                  {usuario.nombre}
                </td>
                <td className="py-4 px-6 text-talentia-muted font-semibold">
                  {usuario.correo}
                </td>
                <td className="py-4 px-6 text-talentia-muted font-semibold">
                  {usuario.rol}
                </td>
                <td className="py-4 px-6 text-talentia-muted font-semibold">
                  {usuario.actividad
                    ? new Date(usuario.actividad).toLocaleString("es-PE")
                    : "Sin acceso registrado"}
                </td>
                <td className="py-4 px-6">
                  {usuario.estado === "Activo" ? (
                    <span className="inline-block bg-talentia-success-bg text-talentia-success px-4 py-1.5 rounded-full font-extrabold text-[13px]">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-block bg-talentia-danger-bg text-talentia-danger px-4 py-1.5 rounded-full font-extrabold text-[13px]">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  <button type="button" data-user-actions aria-expanded={menu?.usuario.id === usuario.id}
                    aria-label={`Acciones de ${usuario.nombre}`}
                    title="Acciones"
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-xl font-bold text-talentia-muted transition hover:bg-talentia-hover disabled:opacity-50">
                    ⋮
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
          className="fixed z-50 w-56 rounded-lg border border-talentia-border bg-talentia-surface py-1 text-[13px] text-talentia-primary shadow-lg">
          {([
            "Ver detalles",
            "Editar",
            menu.usuario.estado === "Activo" ? "Desactivar" : "Activar",
            "Eliminar",
          ] as const).map((label, index) => (
            <button key={label} type="button"
              onClick={() => {
                setMenu(null);
                if (index === 0) setDetalleId(menu.usuario.id);
                else if (index === 1) router.push(`/administrador/usuarios/editar?id=${menu.usuario.id}`);
                else void cambiarUsuario(menu.usuario, index === 3);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-talentia-hover ${index === 3 ? "border-t border-talentia-border text-talentia-danger" : ""}`}>
              {label}
            </button>
          ))}
        </div>, document.body
      )}
      {detalleId && <UsuarioDetallesModal key={detalleId} id={detalleId} onClose={() => setDetalleId(null)} />}
    </div>
  );
}
