"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

export interface ItemHistorial {
  id: number | string;
  hora: string;
  fecha: string;
  accion: string;
  area: string;
  usuario: string;
  resultado: "Completo" | "Confirmado" | "Pendiente" | "Fallido" | string;
}

interface HistorialAdministrativoProps {
  onVolver?: () => void;
}

interface FiltrosHistorial {
  accion: string;
  area: string;
  fecha: string;
}

interface FiltrosDisponibles {
  acciones: string[];
  areas: string[];
}

function IconoChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoBuscar() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <circle
        cx="10.8"
        cy="10.8"
        r="6.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HistorialAdministrativo({
  onVolver,
}: HistorialAdministrativoProps) {
  const [accionFiltro, setAccionFiltro] = useState("Todas");
  const [areaFiltro, setAreaFiltro] = useState("Todas");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosHistorial>({
    accion: "Todas",
    area: "Todas",
    fecha: "",
  });
  const [filtrosDisponibles, setFiltrosDisponibles] =
    useState<FiltrosDisponibles>({ acciones: [], areas: [] });
  const [historial, setHistorial] = useState<ItemHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarHistorial() {
      setCargando(true);
      setError("");

      try {
        const params = new URLSearchParams({
          accion: filtrosAplicados.accion,
          area: filtrosAplicados.area,
          fecha: filtrosAplicados.fecha,
        });

        const response = await fetch(
          `${API_URL}/reportes/historial?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : "No se pudo cargar el historial.",
          );
        }

        setHistorial(Array.isArray(body.historial) ? body.historial : []);
        setFiltrosDisponibles({
          acciones: Array.isArray(body.filtros?.acciones)
            ? body.filtros.acciones.filter(
                (valor: unknown): valor is string =>
                  typeof valor === "string" && valor.trim().length > 0,
              )
            : [],
          areas: Array.isArray(body.filtros?.areas)
            ? body.filtros.areas.filter(
                (valor: unknown): valor is string =>
                  typeof valor === "string" && valor.trim().length > 0,
              )
            : [],
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo conectar con el servidor.",
        );
        setHistorial([]);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    void cargarHistorial();
    return () => controller.abort();
  }, [filtrosAplicados]);

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      accion: accionFiltro,
      area: areaFiltro,
      fecha: fechaFiltro,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Se conserva la disposición y el estilo visual del diseño original. */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label
              htmlFor="historial-accion"
              className="block text-xs font-bold text-[#0F2851] mb-2"
            >
              Buscar acción
            </label>
            <div className="relative">
              <select
                id="historial-accion"
                value={accionFiltro}
                onChange={(e) => setAccionFiltro(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#64748B] appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 cursor-pointer pr-10"
              >
                <option value="Todas">Todas</option>
                {filtrosDisponibles.acciones.map((accion) => (
                  <option key={accion} value={accion}>
                    {accion}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                <IconoChevron />
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="historial-area"
              className="block text-xs font-bold text-[#0F2851] mb-2"
            >
              Área
            </label>
            <div className="relative">
              <select
                id="historial-area"
                value={areaFiltro}
                onChange={(e) => setAreaFiltro(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#64748B] appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 cursor-pointer pr-10"
              >
                <option value="Todas">Todas</option>
                {filtrosDisponibles.areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                <IconoChevron />
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="historial-fecha"
              className="block text-xs font-bold text-[#0F2851] mb-2"
            >
              Fecha
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="historial-fecha"
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  aria-label="Filtrar por fecha"
                  className="w-full min-w-0 bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#64748B] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                />
              </div>
              <button
                type="button"
                onClick={aplicarFiltros}
                aria-label="Buscar en el historial"
                title="Buscar"
                className="p-3.5 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl text-[#3B82F6] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              >
                <IconoBuscar />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F3FF] text-[#6B21A8] text-xs font-extrabold border-b border-gray-100">
                <th className="py-4 px-6">Hora</th>
                <th className="py-4 px-6">Acción</th>
                <th className="py-4 px-6">Área</th>
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {historial.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-bold text-[#0F2851]">
                    {item.hora}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.accion}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.area}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.usuario}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full font-extrabold text-xs ${
                        item.resultado === "Completo"
                          ? "bg-[#BBF7D0] text-[#166534]"
                          : item.resultado === "Fallido"
                            ? "bg-red-100 text-red-700"
                            : "bg-[#BAE6FD] text-[#0369A1]"
                      }`}
                    >
                      {item.resultado}
                    </span>
                  </td>
                </tr>
              ))}
              {!cargando && !error && historial.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 px-6 text-center font-semibold text-[#64748B]"
                  >
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {cargando && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 px-6 text-center font-semibold text-[#64748B]"
                  >
                    Cargando historial...
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
