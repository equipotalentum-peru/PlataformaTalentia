"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VistaPublicarCurso() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePublicar = async () => {
    setLoading(true);
    // Simulación de guardado y publicación
    setTimeout(() => {
      setLoading(false);
      router.push("/administrador/cursos");
    }, 1000);
  };

  return (
    <div className="w-full space-y-6">

      {/* Tarjeta Principal de Checklist */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 space-y-6 max-w-5xl">
        <h2 className="text-xl font-extrabold text-[#0F2851]">
          Checklist de publicación
        </h2>

        {/* Items del Checklist */}
        <div className="space-y-3">
          {/* Datos completos */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
            <span className="text-sm font-bold text-[#0F2851]">
              Datos completos
            </span>
            <span className="bg-[#C6F6D5] text-[#22543D] text-xs font-extrabold px-5 py-1.5 rounded-full">
              Completo
            </span>
          </div>

          {/* Evaluaciones definidas */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
            <span className="text-sm font-bold text-[#0F2851]">
              Evaluaciones definidas
            </span>
            <span className="bg-[#C6F6D5] text-[#22543D] text-xs font-extrabold px-5 py-1.5 rounded-full">
              Completo
            </span>
          </div>

          {/* Docente asignado */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
            <span className="text-sm font-bold text-[#0F2851]">
              Docente asignado
            </span>
            <span className="bg-[#E0F2FE] text-[#0369A1] text-xs font-extrabold px-5 py-1.5 rounded-full">
              Gloria Rocha
            </span>
          </div>

          {/* Cupos definidos */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
            <span className="text-sm font-bold text-[#0F2851]">
              Cupos definidos
            </span>
            <span className="bg-[#E0F2FE] text-[#0369A1] text-xs font-extrabold px-5 py-1.5 rounded-full">
              80 cupos
            </span>
          </div>
        </div>

        {/* Banner Informativo */}
        <div className="bg-[#F3E8FF] rounded-2xl p-4 text-center">
          <p className="text-xs font-extrabold text-[#6B21A8]">
            El curso quedará visible para alumnos y disponible para matrícula.
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-between max-w-5xl pt-4">
        <button
          type="button"
          onClick={() => router.push("/administrador/cursos")}
          className="bg-white border border-gray-200 text-[#6B21A8] hover:bg-gray-50 text-xs font-extrabold px-6 py-3 rounded-2xl transition shadow-xs"
        >
          Guardar borrador
        </button>

        <button
          type="button"
          onClick={handlePublicar}
          disabled={loading}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-extrabold px-8 py-3 rounded-2xl transition shadow-sm disabled:opacity-50"
        >
          {loading ? "Publicando..." : "Publicar curso"}
        </button>
      </div>
    </div>
  );
}