"use client";

import React, { useState } from "react";

export interface ItemHistorial {
  id: string;
  hora: string;
  accion: string;
  area: string;
  usuario: string;
  resultado: "Completo" | "Confirmado" | "Pendiente";
}

const HISTORIAL_MOCK: ItemHistorial[] = [
  {
    id: "1",
    hora: "09:40",
    accion: "Asignó docente a Diseño UX",
    area: "Cursos",
    usuario: "Admin Talentum",
    resultado: "Completo",
  },
  {
    id: "2",
    hora: "10:15",
    accion: "Desactivó usuario temporal",
    area: "Usuarios",
    usuario: "Admin Talentum",
    resultado: "Confirmado",
  },
  {
    id: "3",
    hora: "11:20",
    accion: "Registró matrícula MAT002",
    area: "Matrículas",
    usuario: "Admin Talentum",
    resultado: "Completo",
  },
];

interface HistorialAdministrativoProps {
  onVolver?: () => void;
}

export default function HistorialAdministrativo({
  onVolver,
}: HistorialAdministrativoProps) {
  const [accionFiltro, setAccionFiltro] = useState("Todas");
  const [areaFiltro, setAreaFiltro] = useState("Todas");
  const [fechaFiltro, setFechaFiltro] = useState("Todas");

  const historialFiltrado = HISTORIAL_MOCK.filter((item) => {
    const coincideArea =
      areaFiltro === "Todas" || item.area.toLowerCase() === areaFiltro.toLowerCase();
    return coincideArea;
  });

  return (
    <div className="w-full space-y-6">
      {/* Tarjeta de Filtros */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Buscar acción */}
          <div>
            <label className="block text-xs font-bold text-[#0F2851] mb-2">
              Buscar acción
            </label>
            <div className="relative">
              <select
                value={accionFiltro}
                onChange={(e) => setAccionFiltro(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#64748B] appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 cursor-pointer pr-10"
              >
                <option value="Todas">Todas</option>
                <option value="Asignación">Asignación</option>
                <option value="Modificación">Modificación</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                ▼
              </div>
            </div>
          </div>

          {/* Área */}
          <div>
            <label className="block text-xs font-bold text-[#0F2851] mb-2">
              Área
            </label>
            <div className="relative">
              <select
                value={areaFiltro}
                onChange={(e) => setAreaFiltro(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#64748B] appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 cursor-pointer pr-10"
              >
                <option value="Todas">Todas</option>
                <option value="Cursos">Cursos</option>
                <option value="Usuarios">Usuarios</option>
                <option value="Matrículas">Matrículas</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                ▼
              </div>
            </div>
          </div>

          {/* Fecha y Botón Buscar */}
          <div>
            <label className="block text-xs font-bold text-[#0F2851] mb-2">
              Fecha
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#64748B] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 pr-10"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                  📅
                </div>
              </div>
              <button
                type="button"
                className="p-3.5 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl text-[#3B82F6] transition shadow-sm"
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla del Historial */}
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
              {historialFiltrado.map((item) => (
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
                          : "bg-[#BAE6FD] text-[#0369A1]"
                      }`}
                    >
                      {item.resultado}
                    </span>
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