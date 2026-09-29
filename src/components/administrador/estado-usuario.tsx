"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function CambiarEstadoUsuario() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  // Estado del usuario (ejemplo inicial basado en el prototipo)
  const [usuario, setUsuario] = useState({
    nombre: "Camila Soto",
    rol: "Alumno",
    estadoActual: "Activo", // "Activo" o "Inactivo"
  });

  const esActivo = usuario.estadoActual === "Activo";

  const handleConfirmar = () => {
    const nuevoEstado = esActivo ? "Inactivo" : "Activo";
    console.log(`Cambiando estado de usuario ID ${userId} a: ${nuevoEstado}`);
    router.push("/administrador/usuarios");
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Enlace volver */}
      <Link
        href="/administrador/usuarios"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0F2851] transition mb-4"
      >
        <span>←</span> Volver a usuarios
      </Link>

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Cambiar estado de usuario
        </h1>
        <p className="text-sm text-[#6F83A5] mt-1 font-medium">
          Confirmación antes de activar o desactivar una cuenta.
        </p>
      </div>

      {/* Contenedor Principal Blanco */}
      <div className="bg-white rounded-3xl p-12 min-h-[420px] flex items-center justify-center shadow-sm border border-gray-100/80">
        {/* Card Centrada de Confirmación */}
        <div className="bg-[#F3F4FD] rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-extrabold text-[#0F2851]">
            {esActivo ? "Desactivar usuario" : "Activar usuario"}
          </h2>

          <p className="text-sm text-[#5B6B8A] leading-relaxed font-medium px-2">
            {usuario.nombre} {esActivo ? "perderá" : "recuperará"} acceso temporal a
            cursos, entregas y certificados publicados.
          </p>

          {/* Badges de Rol y Estado */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="bg-[#CBE8FF] text-[#0284C7] px-4 py-1.5 rounded-full text-xs font-bold">
              {usuario.rol}
            </span>

            {esActivo ? (
              <span className="bg-[#BBF7D0] text-[#166534] px-4 py-1.5 rounded-full text-xs font-bold">
                Actualmente activo
              </span>
            ) : (
              <span className="bg-[#FBCFE8] text-[#9D174D] px-4 py-1.5 rounded-full text-xs font-bold">
                Actualmente inactivo
              </span>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/administrador/usuarios")}
              className="w-1/2 bg-white hover:bg-gray-50 text-[#4F46E5] font-bold py-3 px-6 rounded-2xl text-sm transition shadow-sm"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmar}
              className={`w-1/2 font-bold py-3 px-6 rounded-2xl text-sm text-white transition shadow-sm ${
                esActivo
                  ? "bg-[#3B82F6] hover:bg-[#2563EB]"
                  : "bg-[#10B981] hover:bg-[#059669]"
              }`}
            >
              {esActivo ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}