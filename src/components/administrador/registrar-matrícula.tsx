"use client";

import React, { useState } from "react";

// 1. Interfaz para los datos del formulario
export interface MatriculaFormData {
  alumno: string;
  curso: string;
  periodo: string;
  estado: string;
  cupoDisponible: string;
}

interface RegistrarMatriculaProps {
  onCancelar?: () => void;
  // 2. Usar la interfaz en lugar de 'any'
  onRegistrar?: (datos: MatriculaFormData) => void;
}

export default function RegistrarMatricula({
  onCancelar,
  onRegistrar,
}: RegistrarMatriculaProps) {
  const [alumno, setAlumno] = useState("Camila Soto · ALU002");
  const [curso, setCurso] = useState("Diseño UX · UX001");
  const [periodo, setPeriodo] = useState("Ago. 2026 - Dic. 2026");
  const [estado, setEstado] = useState("Pendiente de pago");
  const [cupoDisponible] = useState("16 cupos");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegistrar) {
      onRegistrar({ alumno, curso, periodo, estado, cupoDisponible });
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-6">
        <h2 className="text-xl font-extrabold text-[#0F2851] mb-6">
          Nueva matrícula
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#0F2851] mb-2">
                Alumno *
              </label>
              <input
                type="text"
                value={alumno}
                onChange={(e) => setAlumno(e.target.value)}
                placeholder="Seleccionar alumno"
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F2851] mb-2">
                Curso *
              </label>
              <input
                type="text"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                placeholder="Seleccionar curso"
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#0F2851] mb-2">
                Periodo *
              </label>
              <input
                type="text"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="Periodo"
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F2851] mb-2">
                Estado *
              </label>
              <input
                type="text"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                placeholder="Estado"
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#0F2851] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F2851] mb-2">
                Cupo disponible
              </label>
              <input
                type="text"
                readOnly
                value={cupoDisponible}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#0F2851] shadow-sm focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-[#F3E8FF]/60 rounded-2xl p-4 mt-6">
            <p className="text-xs font-extrabold text-[#0F2851] mb-3">
              Validación automática
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-[#BBF7D0] text-[#166534] text-xs font-extrabold px-4 py-1.5 rounded-full">
                Sin duplicados
              </span>
              <span className="bg-[#BAE6FD] text-[#0369A1] text-xs font-extrabold px-4 py-1.5 rounded-full">
                Cupo disponible
              </span>
            </div>
          </div>
        </form>
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onCancelar}
          className="bg-white hover:bg-gray-50 text-[#6B21A8] border border-gray-200 font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-sm"
        >
          Registrar matrícula
        </button>
      </div>
    </div>
  );
}