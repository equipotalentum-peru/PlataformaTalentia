"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function EditarUsuario() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  const [formData, setFormData] = useState({
    nombreCompleto: "",
    correo: "",
    rol: "",
    telefono: "",
    estado: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    async function cargar() {
      setCargando(true);
      setError("");
      try {
        if (!userId) throw new Error("Selecciona un usuario desde la lista.");
        const response = await fetch(`${API_URL}/usuarios/${encodeURIComponent(userId)}`, {
          credentials: "include", signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "No se pudo consultar el usuario.");
        if (!controller.signal.aborted) setFormData({
          nombreCompleto: data.nombre, correo: data.correo, rol: data.rol,
          telefono: data.telefono || "", estado: data.estado,
        });
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Error de conexión.");
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }
    void cargar();
    return () => controller.abort();
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || cargando || guardandoRef.current || !formData.rol) return;
    guardandoRef.current = true;
    setGuardando(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/usuarios/${encodeURIComponent(userId)}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: formData.nombreCompleto.trim(), correo: formData.correo.trim(),
          rol: formData.rol, telefono: formData.telefono.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo guardar el usuario.");
      router.push("/administrador/usuarios");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error de conexión.");
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  const iniciales = formData.nombreCompleto
    ? formData.nombreCompleto
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Botón Volver a usuarios */}
      <Link
        href="/administrador/usuarios"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0F2851] transition mb-4"
      >
        <span>←</span> Volver a usuarios
      </Link>

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Editar usuario
        </h1>
        <p className="text-sm text-[#6F83A5] mt-1 font-medium">
          Actualizar datos y rol de una cuenta.
        </p>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {cargando ? <p role="status" className="text-sm text-slate-500">Cargando usuario...</p> : formData.rol && (
      <form onSubmit={handleSubmit}>
        {/* Tarjeta de Contenido Principal */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-12">
          {/* Cabecera del Usuario (Avatar, Nombre y Badge de Estado) */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#C4F1F9] flex items-center justify-center text-[#0F2851] text-lg font-extrabold shadow-inner">
                {iniciales}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0F2851]">
                  {formData.nombreCompleto}
                </h2>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                  {formData.rol} · {formData.correo}
                </p>
              </div>
            </div>

            {/* Badge de Estado */}
            <div>
              {formData.estado === "Activo" ? (
                <span className="inline-block bg-[#BBF7D0] text-[#166534] px-5 py-2 rounded-full font-bold text-xs">
                  Activo
                </span>
              ) : (
                <span className="inline-block bg-[#FBCFE8] text-[#9D174D] px-5 py-2 rounded-full font-bold text-xs">
                  Inactivo
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Fila 1: Nombre completo y Correo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  maxLength={100}
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Correo *
                </label>
                <input
                  type="email"
                  name="correo"
                  maxLength={150}
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Rol *
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer font-medium"
                >
                  <option value="Docente">Docente</option>
                  <option value="Alumno">Alumno</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  maxLength={20}
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
                />
              </div>

            </div>

            {/* Sección: Cursos Asignados */}
            <div className="pt-4">
              <h3 className="text-sm font-extrabold text-[#0F2851] mb-3">
                Cursos asignados
              </h3>

              <p className="text-sm text-[#64748B]">Ninguno</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción Inferiores */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => router.push("/administrador/usuarios")}
            className="bg-white hover:bg-gray-50 text-[#312E81] border border-gray-200 font-bold px-10 py-3 rounded-2xl text-sm transition-all shadow-sm"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
