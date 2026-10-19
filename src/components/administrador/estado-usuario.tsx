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
        className="app-back-link mb-4"
      >
          <span aria-hidden="true">{"<"}</span>
         Volver a usuarios
      </Link>

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">
          Cambiar estado de usuario
        </h1>
        <p className="text-sm text-talentia-muted mt-1 font-medium">
          Confirmación antes de activar o desactivar una cuenta.
        </p>
      </div>

      {/* Contenedor Principal Blanco */}
      <div className="bg-talentia-surface rounded-3xl p-12 min-h-[420px] flex items-center justify-center shadow-sm border border-talentia-border/80">
        {/* Card Centrada de Confirmación */}
        <div className="bg-talentia-surface rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-extrabold text-talentia-primary">
            {esActivo ? "Desactivar usuario" : "Activar usuario"}
          </h2>

          <p className="text-sm text-talentia-muted leading-relaxed font-medium px-2">
            {usuario.nombre} {esActivo ? "perderá" : "recuperará"} acceso temporal a
            cursos, entregas y certificados publicados.
          </p>

          {/* Badges de Rol y Estado */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="bg-talentia-selected text-talentia-blue px-4 py-1.5 rounded-full text-xs font-bold">
              {usuario.rol}
            </span>

            {esActivo ? (
              <span className="bg-talentia-success-bg text-talentia-success px-4 py-1.5 rounded-full text-xs font-bold">
                Actualmente activo
              </span>
            ) : (
              <span className="bg-talentia-danger-bg text-talentia-danger px-4 py-1.5 rounded-full text-xs font-bold">
                Actualmente inactivo
              </span>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/administrador/usuarios")}
              className="w-1/2 bg-talentia-surface hover:bg-talentia-border text-talentia-blue font-bold py-3 px-6 rounded-2xl text-sm transition shadow-sm"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmar}
              className={`w-1/2 font-bold py-3 px-6 rounded-2xl text-sm text-white transition shadow-sm ${
                esActivo
                  ? "bg-talentia-action hover:bg-talentia-primary"
                  : "bg-talentia-success hover:bg-talentia-success"
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