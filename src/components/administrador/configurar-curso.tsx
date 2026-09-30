"use client";

import { useState } from "react";

export interface ConfigurarCursoProps {
  esPasoWizard?: boolean;
  onContinuar?: () => void;
}

export default function ConfigurarCurso({ esPasoWizard = false, onContinuar }: ConfigurarCursoProps) {
  const [evaluaciones, setEvaluaciones] = useState([
    { id: "1", nombre: "Examen 1", porcentaje: "20" },
    { id: "2", nombre: "Examen 2", porcentaje: "20" },
    { id: "3", nombre: "Proyecto final", porcentaje: "50" },
  ]);

  const handleEvaluacionChange = (id: string, field: "nombre" | "porcentaje", value: string) => {
    setEvaluaciones((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAgregarEvaluacion = () => {
    const newId = (evaluaciones.length + 1).toString();
    setEvaluaciones([...evaluaciones, { id: newId, nombre: "", porcentaje: "" }]);
  };

  const handleEliminarEvaluacion = (id: string) => {
    setEvaluaciones(evaluaciones.filter((item) => item.id !== id));
  };

  const sumaPorcentaje = evaluaciones.reduce(
    (acc, item) => acc + (parseFloat(item.porcentaje) || 0),
    0
  );
  const porcentajeFaltante = Math.max(0, 100 - sumaPorcentaje);

  const getBadgeStyle = (index: number) => {
    const styles = [
      "bg-[#E8DDFB] text-[#5B21B6]",
      "bg-[#BBF7D0] text-[#166534]",
      "bg-[#BAE6FD] text-[#0369A1]",
      "bg-[#FEF08A] text-[#854D0E]",
    ];
    return styles[index % styles.length];
  };

  return (
    <div className="w-full">
      {/* Título independiente: solo se muestra si NO estamos en el wizard */}
      {!esPasoWizard && (
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">Configurar curso</h1>
          <p className="text-base font-bold text-[#0F2851] mt-1">Diseño UX</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Formulario */}
        <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 w-full">
          <h2 className="text-xl font-extrabold text-[#0F2851] mb-6">Sistema de evaluaciones</h2>

          <div className="space-y-6 mb-8">
            {evaluaciones.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-extrabold text-[#0F2851] mb-2">
                    {item.nombre || `Evaluación ${index + 1}`}
                  </label>
                  <input
                    type="text"
                    value={item.nombre}
                    onChange={(e) => handleEvaluacionChange(item.id, "nombre", e.target.value)}
                    placeholder={`Examen ${index + 1}`}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-sm text-[#0F2851] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div className="w-32">
                  <label className="block text-xs font-extrabold text-[#0F2851] mb-2">Porcentaje (%)</label>
                  <input
                    type="text"
                    value={item.porcentaje ? `${item.porcentaje}%` : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/%/g, "");
                      handleEvaluacionChange(item.id, "porcentaje", val);
                    }}
                    placeholder="20%"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-sm text-[#0F2851] text-center focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleEliminarEvaluacion(item.id)}
                    className="bg-[#E9D5FF]/60 hover:bg-[#E9D5FF] text-[#6B21A8] font-bold py-3 px-5 rounded-2xl text-xs transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAgregarEvaluacion}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-5 py-3 rounded-2xl text-sm transition shadow-sm flex items-center gap-2"
          >
            <span>+</span> Agregar evaluación
          </button>
        </div>

        {/* Resumen lateral */}
        <div className="w-full lg:w-80 bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 flex flex-col justify-between min-h-[420px]">
          <div>
            <h2 className="text-xl font-extrabold text-[#0F2851] mb-6">Evaluaciones</h2>

            <div className="space-y-3 mb-6">
              {evaluaciones.map((item, index) => (
                <div key={item.id}>
                  <span
                    className={`inline-block w-full text-center px-4 py-2.5 rounded-full text-xs font-extrabold transition ${getBadgeStyle(
                      index
                    )}`}
                  >
                    {item.nombre || `Evaluación ${index + 1}`} - {item.porcentaje || "0"}%
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-[#6F83A5] font-medium leading-relaxed">
                Porcentaje faltante por asignar:
                <br />
                <span className="font-extrabold text-[#0F2851] text-sm">{porcentajeFaltante}% de nota</span>
              </p>
            </div>
          </div>

          {!esPasoWizard && (
            <div className="pt-6">
              <button
                type="button"
                onClick={onContinuar}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition shadow-sm text-center"
              >
                Guardar configuración
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}