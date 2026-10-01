"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ReporteReciente {
  id: string;
  reporte: string;
  fecha: string;
  responsable: string;
  estado: "Listo" | "Procesando";
}

const REPORTES_MOCK: ReporteReciente[] = [
  {
    id: "1",
    reporte: "Matrículas de septiembre",
    fecha: "07 Sep 2026",
    responsable: "Sistema",
    estado: "Listo",
  },
  {
    id: "2",
    reporte: "Alumnos aprobados de setiembre",
    fecha: "07 Sep 2026",
    responsable: "Admin",
    estado: "Listo",
  },
];

// --- DATOS MOCK POR PESTAÑA ---

// 1. USUARIOS
const BARRAS_USUARIOS = [
  { label: "UX", altura: "h-24", color: "bg-[#3B82F6]" },
  { label: "TIC", altura: "h-32", color: "bg-[#38BDF8]" },
  { label: "CLD", altura: "h-40", color: "bg-[#8B5CF6]" },
  { label: "INV", altura: "h-28", color: "bg-[#3B82F6]" },
  { label: "IA", altura: "h-44", color: "bg-[#38BDF8]" },
];

// 2. CURSOS
const BARRAS_CURSOS = [
  { label: "Diseño UX", altura: "h-44", color: "bg-[#38BDF8]" },
  { label: "DevOps", altura: "h-28", color: "bg-[#8B5CF6]" },
  { label: "Cloud", altura: "h-36", color: "bg-[#3B82F6]" },
  { label: "Data AI", altura: "h-40", color: "bg-[#38BDF8]" },
  { label: "Scrum", altura: "h-20", color: "bg-[#8B5CF6]" },
];

// 3. MATRÍCULAS
const BARRAS_MATRICULAS = [
  { label: "Ene", altura: "h-20", color: "bg-[#3B82F6]" },
  { label: "Mar", altura: "h-36", color: "bg-[#38BDF8]" },
  { label: "May", altura: "h-28", color: "bg-[#8B5CF6]" },
  { label: "Jul", altura: "h-40", color: "bg-[#3B82F6]" },
  { label: "Sep", altura: "h-48", color: "bg-[#38BDF8]" },
];

// 4. CALIFICACIONES
const BARRAS_CALIFICACIONES = [
  { label: "< 10", altura: "h-12", color: "bg-[#F87171]" },
  { label: "11-13", altura: "h-24", color: "bg-[#FBBF24]" },
  { label: "14-16", altura: "h-36", color: "bg-[#38BDF8]" },
  { label: "17-18", altura: "h-44", color: "bg-[#3B82F6]" },
  { label: "19-20", altura: "h-32", color: "bg-[#8B5CF6]" },
];

// 5. CERTIFICADOS
const BARRAS_CERTIFICADOS = [
  { label: "UX/UI", altura: "h-36", color: "bg-[#8B5CF6]" },
  { label: "Cloud", altura: "h-28", color: "bg-[#3B82F6]" },
  { label: "Backend", altura: "h-40", color: "bg-[#38BDF8]" },
  { label: "Frontend", altura: "h-44", color: "bg-[#8B5CF6]" },
  { label: "Data", altura: "h-24", color: "bg-[#3B82F6]" },
];

type Categoria = "Usuarios" | "Cursos" | "Matrículas" | "Calificaciones" | "Certificados";

export default function VistaReportes() {
  const router = useRouter();
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>("Usuarios");

  const categorias: Categoria[] = [
    "Usuarios",
    "Cursos",
    "Matrículas",
    "Calificaciones",
    "Certificados",
  ];

  return (
    <div className="w-full space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Reportes
        </h1>
        <p className="text-sm font-semibold text-[#64748B] mt-1">
          Consulta usuarios, cursos, progreso, calificaciones y certificados.
        </p>
      </div>

      {/* Barra superior de pestañas y botón Exportar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaActiva(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition ${
                categoriaActiva === cat
                  ? "bg-[#A5F3FC] text-[#0891B2]"
                  : "text-[#6B21A8] hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-2.5 rounded-2xl text-sm transition shadow-sm w-full sm:w-auto"
        >
          Exportar
        </button>
      </div>

      {/* CONTENIDO DINÁMICO SEGÚN PESTAÑA */}

      {/* 1. USUARIOS */}
      {categoriaActiva === "Usuarios" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 flex flex-col justify-between">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">
              Progreso por curso
            </h2>
            <div className="flex items-end justify-around h-48 pt-4 border-b border-gray-100 pb-2">
              {BARRAS_USUARIOS.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-8 ${item.altura} ${item.color} rounded-t-xl transition-all duration-300`} />
                  <span className="text-xs font-bold text-[#64748B]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">Indicadores clave</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#3B82F6]">92%</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">usuarios activos</p>
              </div>
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#6B21A8]">15.8</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">promedio general</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CURSOS */}
      {categoriaActiva === "Cursos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 flex flex-col justify-between">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">
              Finalización por programa
            </h2>
            <div className="flex items-end justify-around h-48 pt-4 border-b border-gray-100 pb-2">
              {BARRAS_CURSOS.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-8 ${item.altura} ${item.color} rounded-t-xl transition-all duration-300`} />
                  <span className="text-xs font-bold text-[#64748B]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">Métricas de cursos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#8B5CF6]">24</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">cursos activos</p>
              </div>
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#38BDF8]">88%</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">satisfacción general</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MATRÍCULAS */}
      {categoriaActiva === "Matrículas" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 flex flex-col justify-between">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">
              Evolución de matrículas (2026)
            </h2>
            <div className="flex items-end justify-around h-48 pt-4 border-b border-gray-100 pb-2">
              {BARRAS_MATRICULAS.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-8 ${item.altura} ${item.color} rounded-t-xl transition-all duration-300`} />
                  <span className="text-xs font-bold text-[#64748B]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">Estado de inscripciones</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#3B82F6]">1,240</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">matrículas confirmadas</p>
              </div>
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#F59E0B]">45</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">pendientes de pago</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CALIFICACIONES */}
      {categoriaActiva === "Calificaciones" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 flex flex-col justify-between">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">
              Distribución de notas
            </h2>
            <div className="flex items-end justify-around h-48 pt-4 border-b border-gray-100 pb-2">
              {BARRAS_CALIFICACIONES.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-8 ${item.altura} ${item.color} rounded-t-xl transition-all duration-300`} />
                  <span className="text-xs font-bold text-[#64748B]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">Rendimiento académico</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#10B981]">94%</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">tasa de aprobación</p>
              </div>
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#8B5CF6]">16.4</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">nota más frecuente</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CERTIFICADOS */}
      {categoriaActiva === "Certificados" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 flex flex-col justify-between">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">
              Certificados emitidos por especialidad
            </h2>
            <div className="flex items-end justify-around h-48 pt-4 border-b border-gray-100 pb-2">
              {BARRAS_CERTIFICADOS.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className={`w-8 ${item.altura} ${item.color} rounded-t-xl transition-all duration-300`} />
                  <span className="text-xs font-bold text-[#64748B]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
            <h2 className="text-lg font-extrabold text-[#0F2851] mb-6">Emisión de certificados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#3B82F6]">860</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">certificados generados</p>
              </div>
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <p className="text-3xl font-extrabold text-[#10B981]">100%</p>
                <p className="text-xs font-bold text-[#64748B] mt-2">verificados con QR</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Reporte reciente */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-extrabold text-[#0F2851]">
            Reporte reciente
          </h2>
          <button
            type="button"
            onClick={() => router.push("/administrador/reportes/historial")}
            className="text-xs font-bold text-[#6B21A8] hover:text-[#581c87] bg-[#F5F3FF] hover:bg-[#e9e5ff] px-4 py-2 rounded-xl transition"
          >
            Ver historial administrativo →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F3FF] text-[#6B21A8] text-xs font-extrabold border-b border-gray-100">
                <th className="py-4 px-6">Reporte</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Responsable</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {REPORTES_MOCK.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-bold text-[#0F2851]">
                    {item.reporte}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.fecha}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.responsable}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-[#BBF7D0] text-[#166534] text-xs font-extrabold px-4 py-1.5 rounded-full inline-block">
                      {item.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-2 rounded-xl transition shadow-sm"
                    >
                      Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}