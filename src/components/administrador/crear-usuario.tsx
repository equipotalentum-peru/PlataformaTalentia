"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CrearUsuarioForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombreCompleto: "",
    correoInstitucional: "",
    rol: "Docente",
    dniCodigo: "",
    estado: "Activo",
    cursoAsignado: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos del nuevo usuario:", formData);
    
    router.push("/administrador/usuarios");
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
          Alta de alumno o docente con acceso inicial.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tarjeta del Formulario */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-12">
          <h2 className="text-xl font-extrabold text-[#0F2851] mb-6">
            Datos de la cuenta
          </h2>

          <div className="space-y-6">
            {/* Fila 1: Nombre completo y Correo institucional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  placeholder="Carla Mendoza"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  Correo institucional *
                </label>
                <input
                  type="email"
                  name="correoInstitucional"
                  placeholder="carla@talentum.pe"
                  value={formData.correoInstitucional}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Fila 2: Rol, DNI/Código y Estado */}
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
                  <option value="Alumno">Alumno</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                  DNI / Código
                </label>
                <input
                  type="text"
                  name="dniCodigo"
                  placeholder="DOC086"
                  value={formData.dniCodigo}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition"
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
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Fila 3: Curso asignado (opcional) */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Curso asignado (opcional)
              </label>
              <select
                name="cursoAsignado"
                value={formData.cursoAsignado}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer"
              >
                <option value="">Seleccionar curso</option>
                <option value="especializacion-mantenimiento">
                  Especialización en Gestión de Mantenimiento
                </option>
                <option value="seguridad-industrial">
                  Seguridad Industrial y Salud Ocupacional
                </option>
                <option value="gestion-proyectos">
                  Gestión Estratégica de Proyectos
                </option>
              </select>
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
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-sm"
          >
            Crear usuario
          </button>
        </div>
      </form>
    </div>
  );
}