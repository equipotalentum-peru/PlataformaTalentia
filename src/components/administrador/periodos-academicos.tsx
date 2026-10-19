"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type Periodo = {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

type MenuPeriodo = {
  periodo: Periodo;
  top: number;
  left: number;
} | null;

const FORMULARIO_VACIO = {
  nombre: "",
  fechaInicio: "",
  fechaFin: "",
};

function formatearFecha(valor: string) {
  if (!valor) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${valor}T00:00:00Z`));
}

export default function PeriodosAcademicos() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [menu, setMenu] = useState<MenuPeriodo>(null);

  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarPeriodos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(`${API_URL}/administrador/periodos`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudieron cargar los periodos.");
      }

      setPeriodos(Array.isArray(data.periodos) ? data.periodos : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los periodos académicos."
      );
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargarPeriodos();
  }, [cargarPeriodos]);

  useEffect(() => {
    if (!menu) return;

    function cerrarFuera(event: MouseEvent) {
      const destino = event.target;
      if (
        destino instanceof Element &&
        !menuRef.current?.contains(destino) &&
        !destino.closest("[data-periodo-actions]")
      ) {
        setMenu(null);
      }
    }

    function cerrar() {
      setMenu(null);
    }

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }

    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarConEscape);
    window.addEventListener("resize", cerrar);
    window.addEventListener("scroll", cerrar, true);

    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarConEscape);
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("scroll", cerrar, true);
    };
  }, [menu]);

  function limpiarFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setForm(FORMULARIO_VACIO);
    setError("");
    setMensaje("");
  }

  function abrirFormularioNuevo() {
    if (mostrarFormulario) {
      limpiarFormulario();
      return;
    }

    setEditandoId(null);
    setForm(FORMULARIO_VACIO);
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  async function guardarPeriodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMensaje("");

    const nombre = form.nombre.trim();

    if (!nombre) {
      setError("Escribe el nombre del periodo.");
      return;
    }

    if (!form.fechaInicio || !form.fechaFin) {
      setError("Debes indicar las fechas de inicio y fin.");
      return;
    }

    if (form.fechaFin < form.fechaInicio) {
      setError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    setGuardando(true);

    try {
      const eraEdicion = Boolean(editandoId);
      const url = editandoId
        ? `${API_URL}/administrador/periodos/${encodeURIComponent(editandoId)}`
        : `${API_URL}/administrador/periodos`;

      const response = await fetch(url, {
        method: editandoId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo guardar el periodo.");
      }

      setMensaje(
        data.message ??
          (eraEdicion
            ? "Periodo actualizado correctamente."
            : "Periodo registrado correctamente.")
      );
      setMostrarFormulario(false);
      setForm(FORMULARIO_VACIO);
      setEditandoId(null);
      await cargarPeriodos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el periodo."
      );
    } finally {
      setGuardando(false);
    }
  }

  function editarPeriodo(periodo: Periodo) {
    setMenu(null);
    setEditandoId(periodo.id);
    setForm({
      nombre: periodo.nombre,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
    });
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cambiarEstado(periodo: Periodo) {
    setMenu(null);
    const activoNuevo = !periodo.activo;

    const confirmar = window.confirm(
      activoNuevo
        ? `¿Activar «${periodo.nombre}» para que pueda asignarse a nuevas ofertas?`
        : `¿Desactivar «${periodo.nombre}»? Las ofertas existentes se conservarán.`
    );
    if (!confirmar) return;

    setError("");
    setMensaje("");
    setCambiandoEstadoId(periodo.id);

    try {
      const response = await fetch(
        `${API_URL}/administrador/periodos/${encodeURIComponent(periodo.id)}/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo: activoNuevo }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo cambiar el estado.");
      }

      setMensaje(data.message ?? "Estado actualizado.");
      setPeriodos((actuales) =>
        actuales.map((item) =>
          item.id === periodo.id ? { ...item, activo: activoNuevo } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar el estado."
      );
    } finally {
      setCambiandoEstadoId(null);
    }
  }

  async function eliminarPeriodo(periodo: Periodo) {
    setMenu(null);

    const confirmar = window.confirm(
      `¿Eliminar el periodo «${periodo.nombre}»? Las ofertas de cursos vinculadas se conservarán, pero quedarán sin periodo académico asignado.`
    );
    if (!confirmar) return;

    setError("");
    setMensaje("");
    setEliminandoId(periodo.id);

    try {
      const response = await fetch(
        `${API_URL}/administrador/periodos/${encodeURIComponent(periodo.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo eliminar el periodo.");
      }

      setPeriodos((actuales) =>
        actuales.filter((item) => item.id !== periodo.id)
      );
      setMensaje(data.message ?? "Periodo académico eliminado correctamente.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el periodo."
      );
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2851]">
            Periodos académicos
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">
            Administra los calendarios que utilizarán las ofertas de cursos y las matrículas.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirFormularioNuevo}
          className="self-start rounded-2xl bg-[#3B82F6] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2563EB] sm:self-auto"
        >
          {mostrarFormulario ? "Cerrar formulario" : "Registrar periodo"}
        </button>
      </header>

      {error && !mostrarFormulario && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {mensaje && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
          {mensaje}
        </p>
      )}

      {mostrarFormulario && (
        <section className="space-y-6 rounded-3xl border border-gray-100/80 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#0F2851]">
            {editandoId ? "Editar periodo" : "Registrar periodo"}
          </h2>

          <form onSubmit={guardarPeriodo} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="nombrePeriodo"
                  className="mb-2 block text-xs font-extrabold text-[#0F2851]"
                >
                  Nombre del periodo *
                </label>
                <input
                  id="nombrePeriodo"
                  required
                  maxLength={100}
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((actual) => ({
                      ...actual,
                      nombre: event.target.value,
                    }))
                  }
                  placeholder="Ej. Agosto - Diciembre 2026"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label
                  htmlFor="fechaInicio"
                  className="mb-2 block text-xs font-extrabold text-[#0F2851]"
                >
                  Fecha de inicio *
                </label>
                <input
                  id="fechaInicio"
                  type="date"
                  required
                  value={form.fechaInicio}
                  onChange={(event) =>
                    setForm((actual) => ({
                      ...actual,
                      fechaInicio: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F2851] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label
                  htmlFor="fechaFin"
                  className="mb-2 block text-xs font-extrabold text-[#0F2851]"
                >
                  Fecha de fin *
                </label>
                <input
                  id="fechaFin"
                  type="date"
                  required
                  min={form.fechaInicio || undefined}
                  value={form.fechaFin}
                  onChange={(event) =>
                    setForm((actual) => ({
                      ...actual,
                      fechaFin: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#0F2851] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-2xl bg-[#3B82F6] px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Registrar periodo"}
              </button>
              <button
                type="button"
                onClick={limpiarFormulario}
                disabled={guardando}
                className="rounded-2xl border border-gray-200 bg-white px-10 py-3 text-sm font-bold text-[#312E81] shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="overflow-x-auto rounded-3xl border border-gray-100/80 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
          <colgroup>
            <col />
            <col className="w-44" />
            <col className="w-44" />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-[#F5F3FF] text-[13px] font-extrabold text-[#6B21A8]">
              <th className="px-6 py-4">Periodo</th>
              <th className="px-4 py-4">Fecha de inicio</th>
              <th className="px-4 py-4">Fecha de fin</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-[#64748B]">
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                  Cargando periodos...
                </td>
              </tr>
            ) : periodos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[13px] text-[#64748B]">
                  Aún no hay periodos académicos. Usa «Registrar periodo» para crear el primero.
                </td>
              </tr>
            ) : (
              periodos.map((periodo) => {
                const trabajando =
                  eliminandoId === periodo.id || cambiandoEstadoId === periodo.id;

                return (
                  <tr key={periodo.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="break-words px-6 py-4 font-bold text-[#0F2851]">
                      {periodo.nombre}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#64748B]">
                      {formatearFecha(periodo.fechaInicio)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#64748B]">
                      {formatearFecha(periodo.fechaFin)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-extrabold ${
                          periodo.activo
                            ? "bg-[#BBF7D0] text-[#166534]"
                            : "bg-[#E2E8F0] text-[#475569]"
                        }`}
                      >
                        {periodo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        data-periodo-actions
                        aria-label={`Acciones de ${periodo.nombre}`}
                        aria-expanded={menu?.periodo.id === periodo.id}
                        disabled={trabajando}
                        onClick={(event) => {
                          if (menu?.periodo.id === periodo.id) {
                            setMenu(null);
                            return;
                          }

                          const rect = event.currentTarget.getBoundingClientRect();
                          const altoMenu = 160;
                          setMenu({
                            periodo,
                            top:
                              rect.bottom + altoMenu > window.innerHeight
                                ? Math.max(8, rect.top - altoMenu - 6)
                                : rect.bottom + 6,
                            left: Math.max(
                              8,
                              Math.min(rect.right - 224, window.innerWidth - 232)
                            ),
                          });
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-xl font-bold text-[#475569] transition hover:bg-[#F1F5F9] disabled:opacity-50"
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {menu && createPortal(
        <div
          ref={menuRef}
          id="periodo-acciones"
          role="menu"
          aria-label={`Acciones de ${menu.periodo.nombre}`}
          style={{ top: menu.top, left: menu.left }}
          className="fixed z-50 w-56 rounded-lg border border-slate-100 bg-white py-1 text-[13px] text-[#0F2851] shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => editarPeriodo(menu.periodo)}
            className="block w-full px-4 py-3 text-left hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={cambiandoEstadoId === menu.periodo.id}
            onClick={() => void cambiarEstado(menu.periodo)}
            className="block w-full px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50"
          >
            {cambiandoEstadoId === menu.periodo.id
              ? "Actualizando..."
              : menu.periodo.activo
                ? "Desactivar"
                : "Activar"}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={eliminandoId === menu.periodo.id}
            onClick={() => void eliminarPeriodo(menu.periodo)}
            className="block w-full border-t border-slate-100 px-4 py-3 text-left text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {eliminandoId === menu.periodo.id ? "Eliminando..." : "Eliminar"}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
