"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Matricula {
  id: string;
  alumno: string;
  curso: string;
  codigo: string;
  fecha: string;
  estado: "Activa" | "Retirada" | "Pendiente";
}

const MATRICULAS_MOCK: Matricula[] = [
  {
    id: "1",
    alumno: "Gray Padilla",
    curso: "Herramientas TIC",
    codigo: "MAT001",
    fecha: "07 Sep 2026",
    estado: "Activa",
  },
  {
    id: "2",
    alumno: "Camila Soto",
    curso: "Diseño UX",
    codigo: "MAT002",
    fecha: "06 Sep 2026",
    estado: "Activa",
  },
  {
    id: "3",
    alumno: "Diego Ramos",
    curso: "Cloud básico",
    codigo: "MAT003",
    fecha: "05 Sep 2026",
    estado: "Activa",
  },
  {
    id: "4",
    alumno: "Lucía Mora",
    curso: "Investigación",
    codigo: "MAT004",
    fecha: "02 Sep 2026",
    estado: "Retirada",
  },
];

export default function TablaMatriculas() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const router = useRouter();

  const matriculasFiltradas = MATRICULAS_MOCK.filter((m) => {
    const coincideBusqueda =
      m.alumno.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.curso.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.codigo.toLowerCase().includes(busqueda.toLowerCase());

    if (filtroEstado === "activas") return coincideBusqueda && m.estado === "Activa";
    if (filtroEstado === "pendientes") return coincideBusqueda && m.estado === "Pendiente";
    return coincideBusqueda;
  });

  return (
    <div className="w-full space-y-6">
      {/* Encabezado y Botón Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
            Matrículas
          </h1>
          <p className="text-sm font-semibold text-[#64748B] mt-1">
            Gestiona alumnos inscritos por curso, cupos y cambios de estado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/administrador/matriculas/registrar")}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-sm whitespace-nowrap"
        >
          Registrar matrícula
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar alumno o curso"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroEstado("todos")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
              filtroEstado === "todos"
                ? "bg-[#A5F3FC] text-[#0891B2]"
                : "bg-white text-[#64748B] hover:bg-gray-50 border border-gray-100"
            }`}
          >
            Curso
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("activas")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
              filtroEstado === "activas"
                ? "bg-[#A5F3FC] text-[#0891B2]"
                : "bg-white text-[#64748B] hover:bg-gray-50 border border-gray-100"
            }`}
          >
            Activas
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("pendientes")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
              filtroEstado === "pendientes"
                ? "bg-[#A5F3FC] text-[#0891B2]"
                : "bg-white text-[#64748B] hover:bg-gray-50 border border-gray-100"
            }`}
          >
            Pendientes
          </button>
        </div>
      </div>

      {/* Tabla de Matrículas */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F3FF] text-[#6B21A8] text-xs font-extrabold border-b border-gray-100">
                <th className="py-4 px-6">Alumno</th>
                <th className="py-4 px-6">Curso</th>
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {matriculasFiltradas.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-bold text-[#0F2851]">
                    {item.alumno}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.curso}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.codigo}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#64748B]">
                    {item.fecha}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full font-extrabold text-xs ${
                        item.estado === "Activa"
                          ? "bg-[#BBF7D0] text-[#166534]"
                          : "bg-[#FBCFE8] text-[#9D174D]"
                      }`}
                    >
                      {item.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-6 py-2 rounded-xl transition shadow-sm"
                    >
                      {item.estado === "Retirada" ? "Historial" : "Modificar"}
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