"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function CrearUsuarioForm() {
  const router = useRouter();
  const enviandoRef = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombreCompleto: "",
    correoElectronico: "",
    rol: "Docente",
    dni: "",
    telefono: "",
  });

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
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/send-registration-invitation`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombreCompleto.trim(),
          correo: formData.correoElectronico.trim().toLowerCase(),
          dni: formData.dni.trim(),
          rol: formData.rol,
          telefono: formData.telefono.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo enviar la invitación.");
      alert("Invitación enviada. El usuario debe completar su registro desde el correo.");
      router.push("/administrador/usuarios");
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo enviar la invitación.");
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

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
          Crear usuario
        </h1>
        <p className="text-sm text-[#6F83A5] mt-1 font-medium">
          Alta de docente o administrador con acceso inicial.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
        {/* Tarjeta del Formulario */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-12">
          <h2 className="text-xl font-extrabold text-[#0F2851] mb-6">
            Datos de la cuenta
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  name="correoElectronico"
                  value={formData.correoElectronico}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Rol *
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer"
                >
                  <option value="Docente">Docente</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  name="dni"
                  required
                  maxLength={8}
                  pattern="[0-9]{8}"
                  inputMode="numeric"
                  value={formData.dni}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition"
                />
              </div>

              <div>
                <label htmlFor="crear-usuario-telefono" className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Teléfono *
                </label>
                <input
                  id="crear-usuario-telefono"
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  autoComplete="tel"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Botones de Acción (Inferiores) */}
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
            disabled={enviando}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}
