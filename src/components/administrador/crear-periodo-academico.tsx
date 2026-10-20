"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const FORMULARIO_VACIO = {
  nombre: "",
  fechaInicio: "",
  fechaFin: "",
};

export default function CrearPeriodoAcademico() {
  const router = useRouter();
  const enviandoRef = useRef(false);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardarPeriodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;

    setError("");

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

    enviandoRef.current = true;
    setGuardando(true);

    try {
      const response = await fetch(`${API_URL}/administrador/periodos`, {
        method: "POST",
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
        throw new Error(data.message ?? "No se pudo registrar el periodo.");
      }

      try {
        window.sessionStorage.setItem(
          "talentia-periodo-academico-mensaje",
          data.message ?? "Periodo registrado correctamente."
        );
      } catch {
        // La navegación y el registro siguen funcionando aunque el navegador bloquee sessionStorage.
      }

      router.push("/administrador/periodos");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar el periodo."
      );
    } finally {
      enviandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Link href="/administrador/periodos" className="app-back-link mb-4">
        <span aria-hidden="true">{"<"}</span>
        Volver a periodos académicos
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-talentia-primary">
          Registrar periodo académico
        </h1>
        <p className="mt-1 text-sm font-semibold text-talentia-muted">
          Define el nombre y las fechas que utilizará el periodo académico.
        </p>
      </header>

      <section className="space-y-6 rounded-3xl border border-talentia-border/80 bg-talentia-surface p-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-talentia-primary">
          Datos del periodo
        </h2>

        <form onSubmit={guardarPeriodo} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="nombrePeriodo"
                className="mb-2 block text-xs font-extrabold text-talentia-primary"
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
                className="w-full rounded-2xl border border-talentia-border bg-talentia-surface px-4 py-3.5 text-sm text-talentia-primary placeholder-talentia-placeholder transition focus:bg-talentia-surface focus:outline-none focus:ring-2 focus:ring-talentia-blue"
              />
            </div>

            <div>
              <label
                htmlFor="fechaInicio"
                className="mb-2 block text-xs font-extrabold text-talentia-primary"
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
                className="w-full rounded-2xl border border-talentia-border bg-talentia-surface px-4 py-3.5 text-sm text-talentia-primary transition focus:bg-talentia-surface focus:outline-none focus:ring-2 focus:ring-talentia-blue"
              />
            </div>

            <div>
              <label
                htmlFor="fechaFin"
                className="mb-2 block text-xs font-extrabold text-talentia-primary"
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
                className="w-full rounded-2xl border border-talentia-border bg-talentia-surface px-4 py-3.5 text-sm text-talentia-primary transition focus:bg-talentia-surface focus:outline-none focus:ring-2 focus:ring-talentia-blue"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-sm text-talentia-danger"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-2xl bg-talentia-action px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Registrar periodo"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/administrador/periodos")}
              disabled={guardando}
              className="rounded-2xl border border-talentia-border bg-talentia-surface px-10 py-3 text-sm font-bold text-talentia-primary shadow-sm transition-all hover:bg-talentia-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
