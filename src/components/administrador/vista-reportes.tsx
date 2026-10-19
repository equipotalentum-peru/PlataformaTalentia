"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type Categoria =
  | "Usuarios"
  | "Cursos"
  | "Matrículas"
  | "Calificaciones"
  | "Certificados";

interface ItemGrafico {
  label: string;
  value: number;
}

interface Indicador {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
}

interface ReporteReciente {
  id: number;
  reporte: string;
  fecha: string;
  responsable: string;
  estado: string;
  categoria: Categoria;
}

interface DatosReporte {
  categoria: Categoria;
  grafico: {
    titulo: string;
    items: ItemGrafico[];
  };
  indicadores: Indicador[];
  reportesRecientes: ReporteReciente[];
}

const CATEGORIAS: Categoria[] = [
  "Usuarios",
  "Cursos",
  "Matrículas",
  "Calificaciones",
  "Certificados",
];

const COLORES_GRAFICO: Record<Categoria, string[]> = {
  Usuarios: ["bg-talentia-blue", "bg-talentia-teal", "bg-talentia-purple"],
  Cursos: [
    "bg-talentia-teal",
    "bg-talentia-purple",
    "bg-talentia-blue",
    "bg-talentia-teal",
    "bg-talentia-purple",
  ],
  "Matrículas": [
    "bg-talentia-blue",
    "bg-talentia-teal",
    "bg-talentia-purple",
    "bg-talentia-blue",
    "bg-talentia-teal",
  ],
  Calificaciones: [
    "bg-talentia-danger",
    "bg-talentia-warning",
    "bg-talentia-teal",
    "bg-talentia-blue",
    "bg-talentia-purple",
  ],
  Certificados: [
    "bg-talentia-purple",
    "bg-talentia-blue",
    "bg-talentia-teal",
    "bg-talentia-purple",
    "bg-talentia-blue",
  ],
};

const COLORES_INDICADORES: Record<Categoria, [string, string]> = {
  Usuarios: ["text-talentia-blue", "text-talentia-purple"],
  Cursos: ["text-talentia-purple", "text-talentia-blue"],
  "Matrículas": ["text-talentia-blue", "text-talentia-warning"],
  Calificaciones: ["text-talentia-success", "text-talentia-blue"],
  Certificados: ["text-talentia-blue", "text-talentia-success"],
};

function formatearFecha(value: string) {
  if (!value) return "—";
  const fecha = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(fecha);
}

export default function VistaReportes() {
  const router = useRouter();
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>("Usuarios");
  const [datos, setDatos] = useState<DatosReporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState<Categoria | null>(null);
  const [actualizacion, setActualizacion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarReporte() {
      setCargando(true);
      setError("");
      setDatos(null);

      try {
        const params = new URLSearchParams({ categoria: categoriaActiva });
        const response = await fetch(`${API_URL}/reportes?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : "No se pudo cargar el reporte.",
          );
        }

        setDatos(body as DatosReporte);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo conectar con el servidor.",
        );
        setDatos(null);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    void cargarReporte();
    return () => controller.abort();
  }, [categoriaActiva, actualizacion]);

  const itemsGrafico = datos?.grafico.items ?? [];
  const valorMaximo = useMemo(
    () => Math.max(1, ...itemsGrafico.map((item) => item.value)),
    [itemsGrafico],
  );

  const descargarReporte = useCallback(async (categoria: Categoria) => {
    setDescargando(categoria);
    setError("");

    try {
      const params = new URLSearchParams({ categoria });
      const response = await fetch(
        `${API_URL}/reportes/exportar?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          typeof body.message === "string"
            ? body.message
            : "No se pudo descargar el reporte.",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      const contentDisposition = response.headers.get("content-disposition");
      const nombreArchivo = contentDisposition?.match(/filename="([^"]+)"/i)?.[1]
        ?? `reporte-${categoria.toLowerCase()}.csv`;

      enlace.href = url;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      setActualizacion((current) => current + 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo conectar con el servidor.",
      );
    } finally {
      setDescargando(null);
    }
  }, []);

  const indicadores = datos?.indicadores ?? [];

  return (
    <div className="w-full space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">
          Reportes
        </h1>
        <p className="text-sm font-semibold text-talentia-muted mt-1">
          Consulta usuarios, cursos, progreso, calificaciones y certificados.
        </p>
      </div>

      {/* Barra superior de pestañas y botón Exportar */}
      <div className="bg-talentia-surface rounded-3xl p-4 shadow-sm border border-talentia-border/80 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIAS.map((categoria) => (
            <button
              key={categoria}
              type="button"
              onClick={() => setCategoriaActiva(categoria)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition ${
                categoriaActiva === categoria
                  ? "bg-talentia-selected text-talentia-blue"
                  : "text-talentia-purple hover:bg-talentia-hover"
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void descargarReporte(categoriaActiva)}
          disabled={descargando !== null || cargando}
          className="bg-talentia-action hover:bg-talentia-primary disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-2.5 rounded-2xl text-sm transition shadow-sm w-full sm:w-auto"
        >
          {descargando === categoriaActiva ? "Exportando..." : "Exportar"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-talentia-danger/20 bg-talentia-danger-bg px-5 py-3 text-sm font-semibold text-talentia-danger"
        >
          {error}
        </div>
      )}

      {/* Gráfico e indicadores: se conserva el diseño de Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-talentia-surface rounded-3xl p-6 shadow-sm border border-talentia-border/80 flex flex-col justify-between">
          <h2 className="text-sm font-extrabold text-talentia-primary mb-6">
            {datos?.grafico.titulo ?? (
              categoriaActiva === "Usuarios"
                ? "Usuarios por rol"
                : categoriaActiva === "Cursos"
                  ? "Finalización por programa"
                  : categoriaActiva === "Matrículas"
                    ? "Evolución de matrículas"
                    : categoriaActiva === "Calificaciones"
                      ? "Distribución de notas"
                      : "Certificados emitidos por especialidad"
            )}
          </h2>
          <div className="flex items-end justify-around gap-3 h-48 pt-4 border-b border-talentia-border pb-2">
            {cargando && !datos ? (
              <p className="text-[13px] font-semibold text-talentia-muted">
                Cargando datos...
              </p>
            ) : itemsGrafico.length === 0 ? (
              <p className="text-[13px] font-semibold text-talentia-muted">
                No hay datos disponibles.
              </p>
            ) : (
              itemsGrafico.map((item, index) => {
                const altura = item.value <= 0
                  ? 4
                  : Math.max(8, (item.value / valorMaximo) * 150);

                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    title={`${item.label}: ${item.value}`}
                  >
                    <div
                      className={`w-8 max-w-full ${
                        COLORES_GRAFICO[categoriaActiva][
                          index % COLORES_GRAFICO[categoriaActiva].length
                        ]
                      } rounded-t-xl transition-all duration-300`}
                      style={{ height: `${altura}px` }}
                      aria-label={`${item.label}: ${item.value}`}
                    />
                    <span className="max-w-full truncate text-[13px] font-bold text-talentia-muted">
                      {item.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-talentia-surface rounded-3xl p-6 shadow-sm border border-talentia-border/80">
          <h2 className="text-sm font-extrabold text-talentia-primary mb-6">
            {categoriaActiva === "Usuarios"
              ? "Indicadores clave"
              : categoriaActiva === "Cursos"
                ? "Métricas de cursos"
                : categoriaActiva === "Matrículas"
                  ? "Estado de inscripciones"
                  : categoriaActiva === "Calificaciones"
                    ? "Rendimiento académico"
                    : "Emisión de certificados"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((index) => {
              const indicador = indicadores[index];
              const valor = indicador
                ? `${new Intl.NumberFormat("es-PE", {
                    maximumFractionDigits: indicador.decimals ?? 0,
                  }).format(indicador.value)}${indicador.suffix ?? ""}`
                : "—";

              return (
                <div
                  key={indicador?.label ?? `indicador-vacio-${index}`}
                  className="border border-talentia-border rounded-2xl p-5 bg-talentia-surface"
                >
                  <p
                    className={`text-3xl font-extrabold ${
                      COLORES_INDICADORES[categoriaActiva][index]
                    }`}
                  >
                    {cargando && !datos ? "—" : valor}
                  </p>
                  <p className="text-[13px] font-bold text-talentia-muted mt-2">
                    {indicador?.label ?? "Cargando indicador"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla de reportes exportados recientemente */}
      <div className="bg-talentia-surface rounded-3xl p-6 shadow-sm border border-talentia-border/80">
        <div className="flex justify-between items-center mb-6 gap-3">
          <h2 className="text-sm font-extrabold text-talentia-primary">
            Reporte reciente
          </h2>
          <button
            type="button"
            onClick={() => router.push("/administrador/reportes/historial")}
            className="text-[13px] font-bold text-talentia-purple hover:text-talentia-purple bg-talentia-surface hover:bg-talentia-hover px-4 py-2 rounded-xl transition"
          >
            Ver historial administrativo →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-talentia-table-header text-talentia-primary text-[13px] font-extrabold border-b border-talentia-border">
                <th className="py-4 px-6">Reporte</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Responsable</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-talentia-border text-[13px]">
              {(datos?.reportesRecientes ?? []).map((item) => (
                <tr key={item.id} className="hover:bg-talentia-hover/50 transition">
                  <td className="py-4 px-6 font-bold text-talentia-primary">
                    {item.reporte}
                  </td>
                  <td className="py-4 px-6 font-semibold text-talentia-muted">
                    {formatearFecha(item.fecha)}
                  </td>
                  <td className="py-4 px-6 font-semibold text-talentia-muted">
                    {item.responsable}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-talentia-success-bg text-talentia-success text-[13px] font-extrabold px-4 py-1.5 rounded-full inline-block">
                      {item.estado === "Completo" ? "Listo" : item.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => void descargarReporte(item.categoria)}
                      disabled={descargando !== null}
                      className="bg-talentia-action hover:bg-talentia-primary disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-xl transition shadow-sm"
                    >
                      {descargando === item.categoria ? "Descargando..." : "Descargar"}
                    </button>
                  </td>
                </tr>
              ))}
              {!cargando && (datos?.reportesRecientes ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 px-6 text-center font-semibold text-talentia-muted"
                  >
                    Todavía no se han exportado reportes.
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
