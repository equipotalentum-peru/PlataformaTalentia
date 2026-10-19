"use client";

import CourseContentIcon from "@/components/common/contenido/CourseContentIcon";

type AddContentModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (type: "file" | "activity" | "quiz" | "link") => void;
};

const cards = [
  {
    type: "file" as const,
    title: "Subir archivo",
    description: "Sube un documento, presentación, hoja de cálculo u otros.",
    formats: "PDF, DOC, PPT, XLS",
    className: "bg-talentia-purple-soft",
    iconType: "pdf" as const,
  },
  {
    type: "activity" as const,
    title: "Crear actividad",
    description: "Crea una actividad para que los estudiantes realicen.",
    formats: "PDF, DOC, PPT, XLS",
    className: "bg-[#dff6cb]",
    iconType: "activity" as const,
  },
  {
    type: "quiz" as const,
    title: "Crear evaluación",
    description: "Crea un examen con preguntas de opción múltiple, verdadero o falso, etc.",
    formats: "Opciones múltiple, verdadero o falso, etc.",
    className: "bg-talentia-selected",
    iconType: "quiz" as const,
  },
  {
    type: "link" as const,
    title: "Insertar enlace",
    description: "Añade un recurso externo o un recurso web.",
    formats: "Enlace URL/link",
    className: "bg-[#f9e6dd]",
    iconType: "link" as const,
  },
];

export default function AddContentModal({ open, onClose, onSelect }: AddContentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="add-content-title">
      <div className="w-full max-w-[360px] rounded-xl bg-talentia-surface px-4 pb-4 pt-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="add-content-title" className="text-[14px] font-bold text-talentia-primary">Agregar contenido</h2>
            <p className="text-[9px] text-talentia-muted">Selecciona el tipo de contenido a subir</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[24px] leading-none text-talentia-primary hover:bg-talentia-hover" aria-label="Cerrar">×</button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <button
              key={card.type}
              type="button"
              onClick={() => onSelect(card.type)}
              className={`group min-h-[110px] rounded-md ${card.className} p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-talentia-surface/55">
                  <CourseContentIcon type={card.iconType} className="h-5 w-5 text-talentia-blue" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-talentia-primary">{card.title}</span>
                    <span className="text-[17px] leading-none text-talentia-muted">›</span>
                  </div>
                  <p className="mt-1 text-[8.5px] leading-[1.25] text-talentia-primary">{card.description}</p>
                  <p className="mt-2 text-[7px] font-medium text-talentia-muted">{card.formats}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button type="button" onClick={onClose} className="mx-auto mt-3 flex h-9 w-[94px] items-center justify-center rounded-md bg-talentia-surface text-[11px] font-semibold text-talentia-primary hover:bg-talentia-border">
          Cancelar
        </button>
      </div>
    </div>
  );
}
