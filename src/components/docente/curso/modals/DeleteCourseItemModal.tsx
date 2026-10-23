"use client";

import { useEffect, useRef } from "react";

type DeleteCourseItemModalProps = {
  itemTitle: string;
  kind?: "module" | "file" | "quiz" | "activity" | "link";
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const itemMessages = {
  module: { title: "Eliminar módulo", label: "Módulo seleccionado", warning: "Se eliminará todo su contenido", description: "Documentos, videos, actividades y evaluaciones, incluidos los archivos asociados y los datos académicos vinculados que correspondan." },
  file: { title: "Eliminar archivo", label: "Archivo seleccionado", warning: "Se eliminará este archivo", description: "Este archivo se eliminará del curso." },
  quiz: { title: "Eliminar evaluación", label: "Evaluación seleccionada", warning: "Se eliminará esta evaluación", description: "Se eliminarán sus preguntas, respuestas, intentos y calificaciones asociadas." },
  activity: { title: "Eliminar actividad", label: "Actividad seleccionada", warning: "Se eliminará esta actividad", description: "Esta actividad se eliminará del curso." },
  link: { title: "Eliminar enlace", label: "Enlace seleccionado", warning: "Se eliminará este enlace", description: "Este enlace se eliminará del curso." },
};

export default function DeleteCourseItemModal({ itemTitle, kind = "module", deleting, onClose, onConfirm }: DeleteCourseItemModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const message = itemMessages[kind];

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-module-title"
      aria-describedby="delete-module-description"
      onCancel={(event) => { if (deleting) event.preventDefault(); }}
      onClose={(event) => { if (!event.currentTarget.open && !deleting) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-lg border border-talentia-border bg-talentia-surface p-0 text-talentia-primary shadow-xl backdrop:bg-talentia-primary/40"
    >
      <div className="flex max-h-[85dvh] flex-col" aria-busy={deleting}>
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-talentia-border px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-talentia-selected text-talentia-blue">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M9 7V4h6v3" />
                <path d="M7 7l1 13h8l1-13" />
              </svg>
            </span>
            <h2 id="delete-module-title" className="text-[18px] font-bold">{message.title}</h2>
          </div>
          <button type="button" disabled={deleting} onClick={onClose} aria-label="Cerrar confirmación" title="Cerrar" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-xl text-talentia-muted transition-colors hover:bg-talentia-hover hover:text-talentia-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:cursor-not-allowed disabled:opacity-50">×</button>
        </header>
        <div id="delete-module-description" className="min-h-0 overflow-y-auto px-5 py-6 text-[13px] leading-relaxed sm:px-6">
          <p className="text-[12px] font-medium text-talentia-muted">{message.label}</p>
          <p className="mt-1 break-words text-[16px] font-semibold leading-6">{itemTitle}</p>

          <div className="mt-5 border-l-[3px] border-talentia-teal bg-talentia-selected px-4 py-4">
            <p className="font-semibold text-talentia-primary">{message.warning}</p>
            <p className="mt-2 text-talentia-primary">{message.description}</p>
            <p className="mt-3 text-[12px] font-semibold text-talentia-muted">Esta acción es definitiva y no se puede deshacer.</p>
          </div>

        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-talentia-border bg-talentia-hover/40 px-5 py-4 sm:px-6">
          <button type="button" autoFocus disabled={deleting} onClick={onClose} className="h-10 min-w-[104px] rounded-md border border-talentia-border bg-talentia-surface px-4 text-[13px] font-semibold transition-colors hover:bg-talentia-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
          <button type="button" disabled={deleting} onClick={onConfirm} className="h-10 min-w-[144px] rounded-md bg-talentia-action px-4 text-[13px] font-semibold text-white transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? "Eliminando..." : message.title}</button>
        </footer>
      </div>
    </dialog>
  );
}
