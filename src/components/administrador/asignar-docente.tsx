"use client";

import { useState } from "react";

export interface AsignarDocenteProps {
  esPasoWizard?: boolean;
}

export default function AsignarDocente({
  esPasoWizard = false,
}: AsignarDocenteProps) {
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string | null>("1");

  const docentes = [
    { id: "1", nombre: "Gloria Rocha", especialidad: "Diseño y TIC", carga: "3 cursos", disponibilidad: "Lun-Mié" },
    { id: "2", nombre: "Luis Vega", especialidad: "UX Research", carga: "2 cursos", disponibilidad: "Mar-Jue" },
    { id: "3", nombre: "Ana Torres", especialidad: "Producto digital", carga: "4 cursos", disponibilidad: "Viernes" },
  ];

  return (
    <div className="w-full">
      {/* Encabezado: solo si NO es el wizard */}
      {!esPasoWizard && (
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">Asignar docente</h1>
          <p className="text-sm text-[#6F83A5] font-medium mt-1">Selecciona profesor responsable y horarios del curso.</p>
        </div>
      )}

      {/* Contenido principal */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-[#0F2851] mb-2">Curso: Diseño UX</h2>
          <div className="flex gap-2">
            <span className="bg-[#F3E8FF] text-[#6B21A8] text-xs font-extrabold px-3 py-1 rounded-full">Borrador</span>
            <span className="bg-[#FEF08A] text-[#854D0E] text-xs font-extrabold px-3 py-1 rounded-full">Sin docente</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-extrabold text-[#0F2851] mb-2">Buscar docente</label>
          <input
            type="text"
            placeholder="Nombre, especialidad o disponibilidad"
            className="w-full max-w-md bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        {/* Tabla de docentes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] text-xs font-extrabold text-[#0F2851]">
                <th className="p-4 rounded-l-2xl">Docente</th>
                <th className="p-4">Especialidad</th>
                <th className="p-4">Carga</th>
                <th className="p-4">Disponibilidad</th>
                <th className="p-4 rounded-r-2xl">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-[#0F2851]">
              {docentes.map((d) => (
                <tr key={d.id}>
                  <td className="p-4 font-bold">{d.nombre}</td>
                  <td className="p-4 text-[#6F83A5]">{d.especialidad}</td>
                  <td className="p-4 text-[#6F83A5]">{d.carga}</td>
                  <td className="p-4 text-[#6F83A5]">{d.disponibilidad}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => setDocenteSeleccionado(d.id)}
                      className={`px-5 py-2 rounded-xl text-xs font-extrabold transition ${
                        docenteSeleccionado === d.id
                          ? "bg-[#166534] text-white"
                          : "bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                      }`}
                    >
                      {docenteSeleccionado === d.id ? "Asignado" : "Asignar"}
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