"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type Periodo = {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

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

  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

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

  function limpiarFormulario() {
    setEditandoId(null);
    setForm(FORMULARIO_VACIO);
    setError("");
    setMensaje("");
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
      const url = editandoId
        ? `${API_URL}/administrador/periodos/${encodeURIComponent(editandoId)}`
        : `${API_URL}/administrador/periodos`;

      const response = await fetch(url, {
        method: editandoId ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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

      setMensaje(data.message ?? "Periodo guardado correctamente.");
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
    setEditandoId(periodo.id);
    setForm({
      nombre: periodo.nombre,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
    });
    setError("");
    setMensaje("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cambiarEstado(periodo: Periodo) {
    const activoNuevo = !periodo.activo;

    const confirmar = window.confirm(
      activoNuevo
        ? `¿Activar «${periodo.nombre}» para que pueda asignarse a nuevas ofertas?`
        : `¿Desactivar «${periodo.nombre}»? Las ofertas existentes se conservarán.`
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      const response = await fetch(
        `${API_URL}/administrador/periodos/${encodeURIComponent(periodo.id)}/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
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
      await cargarPeriodos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar el estado."
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2851]">
          Periodos académicos
        </h1>
        <p className="mt-2 text-sm font-semibold text-[#64748B]">
          Administra los calendarios que utilizarán las ofertas de cursos y las matrículas.
        </p>
      </header>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-xl font-extrabold text-[#0F2851]">
          {editandoId ? "Editar periodo" : "Registrar periodo"}
        </h2>

        <form onSubmit={guardarPeriodo} className="space-y-5">
          <div>
            <label
              htmlFor="nombrePeriodo"
              className="mb-2 block text-xs font-bold text-[#0F2851]"
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
              className="w-full rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F2851] outline-none transition focus:ring-2 focus:ring-[#3B82F6]/30"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="fechaInicio"
                className="mb-2 block text-xs font-bold text-[#0F2851]"
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
                className="w-full rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F2851] outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              />
            </div>

            <div>
              <label
                htmlFor="fechaFin"
                className="mb-2 block text-xs font-bold text-[#0F2851]"
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
                className="w-full rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F2851] outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {mensaje && (
            <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
              {mensaje}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-[#3B82F6] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : editandoId
                  ? "Guardar cambios"
                  : "Registrar periodo"}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={limpiarFormulario}
                disabled={guardando}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-[#475569] hover:bg-gray-50"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-extrabold text-[#0F2851]">
            Periodos registrados
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F5F3FF] text-xs font-extrabold text-[#6B21A8]">
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4">Fecha de inicio</th>
                <th className="px-6 py-4">Fecha de fin</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-[#0F2851]">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                    Cargando periodos...
                  </td>
                </tr>
              ) : periodos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                    Aún no hay periodos académicos. Registra el primero usando el formulario.
                  </td>
                </tr>
              ) : (
                periodos.map((periodo) => (
                  <tr key={periodo.id} className="transition hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-bold">{periodo.nombre}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#64748B]">
                      {formatearFecha(periodo.fechaInicio)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#64748B]">
                      {formatearFecha(periodo.fechaFin)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold ${
                          periodo.activo
                            ? "bg-[#BBF7D0] text-[#166534]"
                            : "bg-[#E2E8F0] text-[#475569]"
                        }`}
                      >
                        {periodo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => editarPeriodo(periodo)}
                          className="rounded-lg bg-[#3B82F6] px-3 py-2 text-xs font-bold text-white hover:bg-[#2563EB]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void cambiarEstado(periodo)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#475569] hover:bg-gray-50"
                        >
                          {periodo.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
