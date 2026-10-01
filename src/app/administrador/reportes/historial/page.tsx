"use client";

import HistorialAdministrativo from "@/components/administrador/historial-administrativo";
import Link from "next/link";

export default function HistorialPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-4">
      {/* Botón Volver */}
      <Link
        href="/administrador/reportes"
        className="text-xs font-bold text-[#64748B] hover:text-[#0F2851] flex items-center gap-1 mb-2"
      >
        ← Volver a reportes
      </Link>

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Historial administrativo
        </h1>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Trazabilidad de cambios importantes en la plataforma.
        </p>
      </div>

      {/* Componente principal */}
      <HistorialAdministrativo />
    </div>
  );
}