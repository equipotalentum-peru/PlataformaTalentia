"use client";

import type { ComponenteCalificacionDraft, DocenteDisponible } from "@/lib/cursos-admin-types";

type CursoParaRevisar = {
  nombreCurso: string;
  codigo: string;
  categoria: string;
  modalidad: string;
  descripcion: string;
  cupos: string;
};

export interface VistaPublicarCursoProps {
  curso: CursoParaRevisar;
  evaluaciones: ComponenteCalificacionDraft[];
  docente: DocenteDisponible | null;
  imagenPortada: File | null;
  onGuardar: (publicar: boolean) => Promise<void>;
  onVolver: () => void;
  guardando: boolean;
  error?: string;
}

export default function VistaPublicarCurso({
  curso,
  evaluaciones,
  docente,
  imagenPortada,
  onGuardar,
  onVolver,
  guardando,
  error = "",
}: VistaPublicarCursoProps) {
  const componentesCompletos = evaluaciones.filter(
    (item) => item.nombre.trim() && item.porcentaje.trim() !== ""
  );
  const totalPorcentaje = componentesCompletos.reduce(
    (total, item) => total + (Number(item.porcentaje) || 0),
    0
  );
  const datosCompletos = Boolean(
    curso.nombreCurso.trim() &&
    curso.codigo.trim() &&
    curso.descripcion.trim() &&
    Number(curso.cupos) > 0
  );
  const evaluacionesCompletas =
    componentesCompletos.length > 0 &&
    componentesCompletos.length === evaluaciones.filter((item) => item.nombre.trim()).length &&
    Math.abs(totalPorcentaje - 100) < 0.01;

  const ItemChecklist = ({
    etiqueta,
    valor,
    correcto,
  }: {
    etiqueta: string;
    valor: string;
    correcto: boolean;
  }) => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <span className="text-sm font-bold text-[#0F2851]">{etiqueta}</span>
      <span className={`max-w-[60%] rounded-full px-4 py-1.5 text-right text-xs font-extrabold ${correcto ? "bg-[#C6F6D5] text-[#22543D]" : "bg-[#FEF3C7] text-[#92400E]"}`}>
        {valor}
      </span>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div className="max-w-5xl space-y-6 rounded-3xl border border-gray-100/80 bg-white p-8 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F2851]">Revisión del curso</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Comprueba los datos antes de guardar el borrador o publicar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-xs font-bold text-[#64748B]">Nombre del curso</p>
            <p className="mt-1 break-words font-extrabold text-[#0F2851]">{curso.nombreCurso || "Sin nombre"}</p>
          </div>
          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-xs font-bold text-[#64748B]">Código</p>
            <p className="mt-1 font-extrabold text-[#0F2851]">{curso.codigo || "Sin código"}</p>
          </div>
          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-xs font-bold text-[#64748B]">Categoría y modalidad</p>
            <p className="mt-1 font-extrabold text-[#0F2851]">{curso.categoria} · {curso.modalidad}</p>
          </div>
          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-xs font-bold text-[#64748B]">Cupos máximos</p>
            <p className="mt-1 font-extrabold text-[#0F2851]">{curso.cupos || "0"}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-extrabold text-[#0F2851]">Descripción</h3>
          <p className="whitespace-pre-wrap break-words rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#475569]">
            {curso.descripcion || "No se ha ingresado una descripción."}
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-extrabold text-[#0F2851]">Imagen de portada</h3>
          <p className="rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#475569]">
            {imagenPortada ? imagenPortada.name : "No se seleccionó una imagen; el curso se guardará sin portada."}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-extrabold text-[#0F2851]">Sistema de evaluación</h3>
          {evaluaciones.filter((item) => item.nombre.trim()).length === 0 ? (
            <p className="rounded-xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">No hay componentes configurados.</p>
          ) : (
            <div className="space-y-2">
              {evaluaciones.filter((item) => item.nombre.trim()).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3">
                  <span className="text-sm font-bold text-[#0F2851]">{item.nombre}</span>
                  <span className="text-sm font-extrabold text-[#1D4ED8]">
                    {item.porcentaje ? `${item.porcentaje}%` : "Sin porcentaje"}
                  </span>
                </div>
              ))}
              <p className={`text-sm font-bold ${Math.abs(totalPorcentaje - 100) < 0.01 ? "text-green-700" : "text-amber-700"}`}>
                Total asignado: {totalPorcentaje}%
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-extrabold text-[#0F2851]">Docente responsable</h3>
          <p className="rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#475569]">
            {docente ? `${docente.nombre} · ${docente.especialidad}` : "Sin docente asignado"}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#0F2851]">Checklist de publicación</h3>
          <ItemChecklist etiqueta="Datos completos" valor={datosCompletos ? "Completo" : "Pendiente"} correcto={datosCompletos} />
          <ItemChecklist etiqueta="Evaluaciones suman 100 %" valor={evaluacionesCompletas ? "Completo" : "Pendiente"} correcto={evaluacionesCompletas} />
          <ItemChecklist etiqueta="Docente asignado" valor={docente ? docente.nombre : "Sin asignar"} correcto={Boolean(docente)} />
          <ItemChecklist etiqueta="Cupos definidos" valor={Number(curso.cupos) > 0 ? `${curso.cupos} cupos` : "Pendiente"} correcto={Number(curso.cupos) > 0} />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="rounded-2xl bg-[#F3E8FF] p-4 text-center">
          <p className="text-xs font-extrabold text-[#6B21A8]">
            {datosCompletos && evaluacionesCompletas && docente
              ? "El curso cumple los requisitos visuales para publicar."
              : "Puedes guardar un borrador mientras completas los requisitos para publicar."}
          </p>
        </div>
      </div>

      <div className="flex max-w-5xl flex-col-reverse justify-between gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={onVolver}
          disabled={guardando}
          className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-extrabold text-[#0F2851] shadow-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={() => void onGuardar(false)}
          disabled={guardando}
          className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-extrabold text-[#6B21A8] shadow-xs transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar borrador"}
        </button>

        <button
          type="button"
          onClick={() => void onGuardar(true)}
          disabled={guardando}
          className="rounded-2xl bg-[#3B82F6] px-8 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Publicar curso"}
        </button>
      </div>
    </div>
  );
}
