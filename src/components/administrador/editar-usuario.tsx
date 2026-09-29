"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function EditarUsuario() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [formData, setFormData] = useState({
    nombreCompleto: "Gloria Rocha",
    correo: "gloria@talentum.pe",
    rol: "Docente",
    telefono: "987 654 321",
    estado: "Activo",
    cursosAsignados: ["Herramientas TIC", "Diseño UX"],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleEstado = () => {
    setFormData((prev) => ({
      ...prev,
      estado: prev.estado === "Activo" ? "Inactivo" : "Activo",
    }));
  };

  const handleRemoveCurso = (cursoNombre: string) => {
    setFormData((prev) => ({
      ...prev,
      cursosAsignados: prev.cursosAsignados.filter((c) => c !== cursoNombre),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Guardando datos del usuario:", userId, formData);
    router.push("/administrador/usuarios");
  };

  const iniciales = formData.nombreCompleto
    ? formData.nombreCompleto
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "GR";

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
          Actualizar datos, rol y estado de una cuenta.
        </p>
      </div>

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
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
                />
              </div>
            </div>

            {/* Fila 2: Rol, Teléfono y Estado */}
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
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer font-medium"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Sección: Cursos Asignados */}
            <div className="pt-4">
              <h3 className="text-sm font-extrabold text-[#0F2851] mb-3">
                Cursos asignados
              </h3>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                {formData.cursosAsignados.map((curso, idx) => {
                  const isPurple = idx % 2 !== 0;
                  return (
                    <span
                      key={curso}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold ${
                        isPurple
                          ? "bg-[#E9D5FF] text-[#6B21A8]"
                          : "bg-[#C4F1F9] text-[#0F2851]"
                      }`}
                    >
                      {curso}
                      <button
                        type="button"
                        onClick={() => handleRemoveCurso(curso)}
                        className="hover:opacity-75 transition"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Botón Cambiar estado */}
              <button
                type="button"
                onClick={() => router.push(`/administrador/usuarios/cambiar-estado?id=${userId}`)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-gray-100 text-[#6B21A8] font-extrabold px-6 py-3 rounded-2xl text-xs transition"
              >
                Cambiar estado
              </button>
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
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-sm"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}