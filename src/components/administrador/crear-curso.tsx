"use client";

import { useState } from "react";
import Link from "next/link";
import ConfigurarCurso from "./configurar-curso";
import AsignarDocente from "./asignar-docente";

export default function CrearCurso() {
  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState({
    nombreCurso: "",
    codigo: "",
    cupos: "80",
    categoria: "Diseño",
    modalidad: "Virtual",
    descripcion: "",
    docenteAsignado: "Gloria Rocha",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-10">
      {/* Enlace de regreso y Encabezado según el paso */}
      <div className="mb-6">
        <Link
          href="/administrador/cursos"
          className="text-xs text-[#64748B] hover:text-[#0F2851] font-semibold transition flex items-center gap-1 mb-2"
        >
          ← Volver a cursos
        </Link>
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          {step === 4 ? "Publicar curso" : "Crear curso"}
        </h1>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          {step === 4
            ? "Revisión final antes de activar el curso para alumnos."
            : "Registro inicial antes de configurar contenido y docentes."}
        </p>
      </div>

      {/* Stepper Global (Visualización para Pasos 1, 2 y 3) */}
      {step <= 3 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div
              className={`text-xs font-extrabold ${
                step >= 1 ? "text-[#0F2851]" : "text-[#94A3B8]"
              }`}
            >
              1. Datos del curso
            </div>
            <div className="h-[2px] bg-gray-200 flex-1 mx-4"></div>
            <div
              className={`text-xs font-extrabold px-4 py-2 rounded-full ${
                step === 2
                  ? "bg-[#BAE6FD] text-[#0369A1]"
                  : step > 2
                  ? "text-[#0F2851]"
                  : "bg-gray-100 text-[#94A3B8]"
              }`}
            >
              2. Sistema de evaluación
            </div>
            <div className="h-[2px] bg-gray-200 flex-1 mx-4"></div>
            <div
              className={`text-xs font-extrabold px-4 py-2 rounded-full ${
                step === 3
                  ? "bg-[#E8DDFB] text-[#5B21B6]"
                  : "bg-gray-100 text-[#94A3B8]"
              }`}
            >
              3. Docentes y visibilidad
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZADO DE COMPONENTES SEGÚN EL PASO */}

      {/* PASO 1: Formulario de Datos Iniciales */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Nombre del curso *
              </label>
              <input
                type="text"
                name="nombreCurso"
                value={formData.nombreCurso}
                onChange={handleChange}
                placeholder="Diseño UX"
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="UX001"
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Cupos *
              </label>
              <input
                type="number"
                name="cupos"
                value={formData.cupos}
                onChange={handleChange}
                placeholder="80"
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Categoría *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer font-medium"
              >
                <option value="Diseño">Diseño</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Gestión">Gestión</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                Modalidad *
              </label>
              <select
                name="modalidad"
                value={formData.modalidad}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition cursor-pointer font-medium"
              >
                <option value="Virtual">Virtual</option>
                <option value="Presencial">Presencial</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Insertar descripción"
              required
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-sm text-[#0F2851] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white transition font-medium resize-none"
            />
          </div>
        </div>
      )}

      {/* PASO 2: Configuración del Sistema de Evaluaciones */}
      {step === 2 && (
        <div className="mb-8">
          <ConfigurarCurso esPasoWizard={true} />
        </div>
      )}

      {/* PASO 3: Asignación de Docente responsable */}
      {step === 3 && (
        <div className="mb-8">
          <AsignarDocente esPasoWizard={true} />
        </div>
      )}

      {/* BOTONES DE NAVEGACIÓN PARA LOS PASOS 1 A 3 */}
      {step <= 3 && (
        <div className="flex justify-between items-center mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-white hover:bg-gray-50 text-[#0F2851] border border-gray-200 font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
            >
              Anterior
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(4)}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-10 py-3.5 rounded-2xl text-sm transition shadow-sm cursor-pointer"
            >
              Guardar curso
            </button>
          )}
        </div>
      )}
    </div>
  );
}