"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Docente {
  id: string;
  nombre: string;
  especialidad: string;
  carga: string;
  disponibilidad: string;
}

const docentesLista: Docente[] = [
  {
    id: "1",
    nombre: "Gloria Rocha",
    especialidad: "Diseño y TIC",
    carga: "3 cursos",
    disponibilidad: "Lun-Mié",
  },
  {
    id: "2",
    nombre: "Luis Vega",
    especialidad: "UX Research",
    carga: "2 cursos",
    disponibilidad: "Mar-Jue",
  },
  {
    id: "3",
    nombre: "Ana Torres",
    especialidad: "Producto digital",
    carga: "4 cursos",
    disponibilidad: "Viernes",
  },
];

export default function AsignarDocente() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string | null>(null);

  const docentesFiltrados = docentesLista.filter(
    (docente) =>
      docente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.disponibilidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGuardar = () => {
    console.log("Docente asignado ID:", docenteSeleccionado);
    router.push("/administrador/cursos");
  };

  return (
    <div className="w-full max-w-5xl mx-auto">

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Asignar docente
        </h1>
        <p className="text-sm text-[#6F83A5] mt-1 font-medium">
          Selecciona profesor responsable y horarios del curso.
        </p>
      </div>

      {/* Tarjeta Principal */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-8">
        {/* Nombre del curso y Badges */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-extrabold text-[#0F2851]">
            Curso: Diseño UX
          </h2>
          <span className="bg-[#F3E8FF] text-[#6B21A8] px-4 py-1.5 rounded-full text-xs font-bold">
            Borrador
          </span>
          <span className="bg-[#FEF08A] text-[#854D0E] px-4 py-1.5 rounded-full text-xs font-bold">
            Sin docente
          </span>
        </div>

        {/* Buscador de Docentes */}
        <div className="mb-6 max-w-md">
          <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
            Buscar docente
          </label>
          <input
            type="text"
            placeholder="Nombre, especialidad o disponibilidad"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
          />
        </div>

        {/* Tabla de Docentes */}
        <div className="rounded-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3FD] text-[#312E81] text-xs font-extrabold">
                <th className="py-4 px-6">Docente</th>
                <th className="py-4 px-6">Especialidad</th>
                <th className="py-4 px-6">Carga</th>
                <th className="py-4 px-6">Disponibilidad</th>
                <th className="py-4 px-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-[#0F2851]">
              {docentesFiltrados.map((docente) => {
                const isSelected = docenteSeleccionado === docente.id;
                return (
                  <tr
                    key={docente.id}
                    className="hover:bg-gray-50/50 transition"
                  >
                    <td className="py-4 px-6 font-bold">{docente.nombre}</td>
                    <td className="py-4 px-6 text-[#64748B]">
                      {docente.especialidad}
                    </td>
                    <td className="py-4 px-6 text-[#64748B]">{docente.carga}</td>
                    <td className="py-4 px-6 text-[#64748B]">
                      {docente.disponibilidad}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => setDocenteSeleccionado(docente.id)}
                        className={`font-bold px-5 py-2 rounded-xl text-xs transition ${
                          isSelected
                            ? "bg-[#166534] text-white"
                            : "bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                        }`}
                      >
                        {isSelected ? "Asignado" : "Asignar"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {docentesFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-[#64748B] text-sm"
                  >
                    No se encontraron docentes con esos criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-between items-center">

        <button
          type="button"
          onClick={handleGuardar}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-sm"
        >
          Guardar asignación
        </button>
      </div>
    </div>
  );
}