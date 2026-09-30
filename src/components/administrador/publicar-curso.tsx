"use client";

export interface PublicarCursoProps {
  esPasoWizard?: boolean;
  docenteAsignado?: string;
  cupos?: string;
  onPublicar?: () => void;
  onGuardarBorrador?: () => void;
}

export default function PublicarCurso({
  esPasoWizard = false,
  docenteAsignado = "Gloria Rocha",
  cupos = "80 cupos",
  onPublicar,
  onGuardarBorrador,
}: PublicarCursoProps) {
  return (
    <div className="w-full">
      {/* Encabezado: Solo fuera del wizard */}
      {!esPasoWizard && (
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
            Publicar curso
          </h1>
          <p className="text-xs font-semibold text-[#64748B] mt-1">
            Revisión final antes de activar el curso para alumnos.
          </p>
        </div>
      )}

      {/* Tarjeta del Checklist */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100/80 mb-6">
        <h2 className="text-xl font-extrabold text-[#0F2851] mb-6">
          Checklist de publicación
        </h2>

        <div className="space-y-4 mb-8">
          {/* Fila 1 */}
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white">
            <span className="text-sm font-bold text-[#0F2851]">
              Datos completos
            </span>
            <span className="bg-[#BBF7D0] text-[#166534] text-xs font-extrabold px-4 py-1.5 rounded-full">
              Completo
            </span>
          </div>

          {/* Fila 2 */}
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white">
            <span className="text-sm font-bold text-[#0F2851]">
              Evaluaciones definidas
            </span>
            <span className="bg-[#BBF7D0] text-[#166534] text-xs font-extrabold px-4 py-1.5 rounded-full">
              Completo
            </span>
          </div>

          {/* Fila 3 */}
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white">
            <span className="text-sm font-bold text-[#0F2851]">
              Docente asignado
            </span>
            <span className="bg-[#BAE6FD] text-[#0369A1] text-xs font-extrabold px-4 py-1.5 rounded-full">
              {docenteAsignado}
            </span>
          </div>

          {/* Fila 4 */}
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white">
            <span className="text-sm font-bold text-[#0F2851]">
              Cupos definidos
            </span>
            <span className="bg-[#BAE6FD] text-[#0369A1] text-xs font-extrabold px-4 py-1.5 rounded-full">
              {cupos}
            </span>
          </div>
        </div>

        {/* Banner informativo en morado claro */}
        <div className="bg-[#F3E8FF]/60 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-[#6B21A8]">
            El curso quedará visible para alumnos y disponible para matrícula.
          </p>
        </div>
      </div>

      {/* Botones independientes: Solo fuera del wizard */}
      {!esPasoWizard && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onGuardarBorrador}
            className="bg-white hover:bg-gray-50 text-[#6B21A8] border border-gray-200 font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-sm"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={onPublicar}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-sm"
          >
            Publicar curso
          </button>
        </div>
      )}
    </div>
  );
}