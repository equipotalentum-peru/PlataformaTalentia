"use client";

import { useEffect, useRef } from "react";

type RubricTypeModalProps = {
  open: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSelect: (type: "pdf" | "criterios") => void;
};

export default function RubricTypeModal({
  open,
  onClose,
  onSkip,
  onSelect,
}: RubricTypeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rubric-type-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[90vw] max-w-md rounded-lg border-0 bg-talentia-surface p-5 text-talentia-primary shadow-xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="rubric-type-title"
          className="text-lg font-semibold text-talentia-primary"
        >
          Añadir rúbrica
        </h2>
        <button
          type="button"
          aria-label="Cerrar selector de rúbrica"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-2xl hover:bg-talentia-hover"
        >
          ×
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("pdf")}
          className="min-h-14 rounded-md border border-talentia-border px-4 py-3 text-sm font-medium hover:border-talentia-blue hover:bg-talentia-hover"
        >
          Adjuntar PDF
        </button>
        <button
          type="button"
          onClick={() => onSelect("criterios")}
          className="min-h-14 rounded-md border border-talentia-border bg-talentia-selected px-4 py-3 text-sm font-medium hover:bg-talentia-hover"
        >
          Configurar criterios
        </button>
      </div>
      <div className="mt-4 flex justify-end border-t border-talentia-border pt-4">
        <button
          type="button"
          onClick={onSkip}
          className="min-h-10 rounded-md bg-talentia-selected px-4 py-2 text-sm font-medium text-talentia-primary hover:bg-talentia-hover"
        >
          Continuar sin rúbrica
        </button>
      </div>
    </dialog>
  );
}
