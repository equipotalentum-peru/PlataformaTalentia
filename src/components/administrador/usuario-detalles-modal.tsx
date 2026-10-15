"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";

type DetallesUsuario = {
  nombre: string;
  correo: string;
  rol: string;
  estado: string;
  usuario: string;
  dni: string | null;
  telefono: string | null;
  idPersona: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  actividad: string | null;
};

export default function UsuarioDetallesModal({ id, onClose }: { id: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [usuario, setUsuario] = useState<DetallesUsuario | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
    const controller = new AbortController();
    async function cargar() {
      try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
          credentials: "include", signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "No se pudo consultar el usuario.");
        if (!controller.signal.aborted) setUsuario(data);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Error de conexión.");
      }
    }
    void cargar();
    return () => controller.abort();
  }, [id]);

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="usuario-detalles-titulo"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-slate-100 bg-white p-6 text-[#0F2851] shadow-xl backdrop:bg-[#0F2851]/40">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="usuario-detalles-titulo" className="text-xl font-bold">Detalles del usuario</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar" title="Cerrar" className="h-8 w-8 shrink-0 rounded hover:bg-slate-100">×</button>
      </div>
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : !usuario ? (
        <p role="status" className="text-sm text-slate-500">Cargando usuario...</p>
      ) : (
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {[
            ["Nombre completo", usuario.nombre], ["Correo", usuario.correo],
            ["Rol", usuario.rol], ["Estado", usuario.estado],
            ["Usuario", usuario.usuario], ["ID", usuario.idPersona],
            ["DNI", usuario.dni], ["Teléfono", usuario.telefono],
            ["Dirección", usuario.direccion], ["Fecha de nacimiento", usuario.fechaNacimiento],
            ["Último acceso", usuario.actividad ? new Date(usuario.actividad).toLocaleString("es-PE") : "Sin acceso registrado"],
            ["Cursos asignados", "Ninguno"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="mb-1 font-semibold text-slate-500">{label}</dt>
              <dd className="break-words">{value || "Sin registrar"}</dd>
            </div>
          ))}
        </dl>
      )}
    </dialog>
  );
}
