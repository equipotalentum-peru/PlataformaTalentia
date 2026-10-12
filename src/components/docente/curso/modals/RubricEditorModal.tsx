"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

export type RubricCriterion = {
  nombre: string;
  descripcion: string;
  puntaje_maximo: number;
};

export type RubricDraft =
  | { tipo: "pdf"; archivo: File }
  | { tipo: "criterios"; criterios: RubricCriterion[] };

type CriterionRow = { id: string; nombre: string; descripcion: string; puntos: string };
type Props = {
  type: RubricDraft["tipo"];
  draft: RubricDraft | null;
  maxGrade: number;
  onClose: () => void;
  onConfirm: (draft: RubricDraft) => void;
};

const MAX_PDF_BYTES = 200 * 1024 * 1024;
const inputClass = "mt-1.5 w-full rounded-md border border-[#cfd9e6] bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#3186d8] focus:ring-2 focus:ring-[#3186d8]/15";

export default function RubricEditorModal({ type, draft, maxGrade, onClose, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(draft?.tipo === "pdf" ? draft.archivo : null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<CriterionRow[]>(() =>
    draft?.tipo === "criterios"
      ? draft.criterios.map((item, index) => ({ id: `criterio-${index}`, nombre: item.nombre, descripcion: item.descripcion, puntos: String(item.puntaje_maximo) }))
      : [{ id: "criterio-inicial", nombre: "", descripcion: "", puntos: "" }]
  );
  const total = rows.reduce((sum, row) => sum + (Number.isFinite(Number(row.puntos)) ? Math.round(Number(row.puntos) * 100) : 0), 0);
  const maximum = Math.round(maxGrade * 100);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function updateRow(id: string, field: "nombre" | "descripcion" | "puntos", value: string) {
    setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
    setError("");
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    if (checking) return;
    const selected = event.target.files?.[0] ?? null;
    setFile(null);
    setError("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pdf") || selected.size === 0 || selected.size > MAX_PDF_BYTES) {
      event.target.value = "";
      setError("Selecciona un PDF válido de hasta 200 MB.");
      return;
    }
    setChecking(true);
    try {
      if (await selected.slice(0, 5).text() !== "%PDF-") {
        throw new Error("El contenido del archivo no corresponde a un PDF.");
      }
      setFile(selected);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo leer el PDF seleccionado.");
    } finally {
      setChecking(false);
    }
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) return;
    if (type === "pdf") {
      if (!file) { setError("Selecciona un PDF antes de adjuntarlo."); return; }
      onConfirm({ tipo: "pdf", archivo: file });
      return;
    }
    if (!rows.length || rows.some(row => !row.nombre.trim())) {
      setError("Añade al menos un criterio y completa sus nombres.");
      return;
    }
    if (total !== maximum) {
      setError(`Los criterios deben sumar ${maxGrade} puntos. Actualmente suman ${total / 100}.`);
      return;
    }
    onConfirm({ tipo: "criterios", criterios: rows.map(row => ({ nombre: row.nombre.trim(), descripcion: row.descripcion.trim(), puntaje_maximo: Number(row.puntos) })) });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rubric-editor-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[85dvh] w-[90vw] max-w-2xl overflow-y-auto rounded-lg border-0 bg-white p-5 text-gray-800 shadow-xl backdrop:bg-black/50"
    >
      <form onSubmit={confirm}>
        <div className="flex items-center justify-between gap-4">
          <h2 id="rubric-editor-title" className="text-lg font-semibold text-[#3186d8]">
            {type === "pdf" ? "Adjuntar rúbrica PDF" : "Configurar criterios"}
          </h2>
          <button type="button" aria-label="Cerrar editor de rúbrica" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-2xl hover:bg-gray-100">×</button>
        </div>

        {type === "pdf" ? (
          <div className="mt-5">
            <label htmlFor="rubric-pdf" className="block text-sm font-medium">Documento PDF</label>
            <input id="rubric-pdf" type="file" accept=".pdf,application/pdf" disabled={checking} onChange={chooseFile} className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#eff7ff] file:px-3 file:py-2 file:text-[#3186d8]`} />
            <p className="mt-2 text-xs text-gray-500">Máximo 200 MB</p>
            {checking && <p role="status" className="mt-3 text-sm text-gray-600">Validando PDF…</p>}
            {file && <p className="mt-3 break-all text-sm text-gray-700">Seleccionado: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>}
          </div>
        ) : (
          <div className="mt-5">
            {rows.map((row, index) => (
              <fieldset key={row.id} className="min-w-0 border-b border-[#d9e2ec] pb-4 pt-3 first:pt-0">
                <legend className="text-sm font-semibold text-gray-700">Criterio {index + 1}</legend>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
                  <div className="min-w-0">
                    <label htmlFor={`${row.id}-name`} className="text-sm">Nombre</label>
                    <input id={`${row.id}-name`} required value={row.nombre} maxLength={200} onChange={event => updateRow(row.id, "nombre", event.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor={`${row.id}-points`} className="text-sm">Puntos</label>
                    <input id={`${row.id}-points`} required type="number" min={0} max={maxGrade} step="0.01" value={row.puntos} onChange={event => updateRow(row.id, "puntos", event.target.value)} className={inputClass} />
                  </div>
                </div>
                <label htmlFor={`${row.id}-description`} className="mt-3 block text-sm">Descripción</label>
                <textarea id={`${row.id}-description`} rows={2} maxLength={2000} value={row.descripcion} onChange={event => updateRow(row.id, "descripcion", event.target.value)} className={`${inputClass} resize-y`} />
                <button type="button" aria-label={`Quitar criterio ${index + 1}`} onClick={() => { setRows(current => current.filter(item => item.id !== row.id)); setError(""); }} className="mt-2 rounded px-1 py-1 text-sm font-medium text-red-600 hover:bg-red-50">Quitar criterio</button>
              </fieldset>
            ))}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button type="button" disabled={rows.length >= 20} onClick={() => { setRows(current => [...current, { id: crypto.randomUUID(), nombre: "", descripcion: "", puntos: "" }]); setError(""); }} className="min-h-10 rounded-md border border-[#3186d8] px-3 py-2 text-sm font-medium text-[#3186d8] hover:bg-[#eff7ff] disabled:opacity-50">+ Añadir criterio</button>
              <output aria-live="polite" className={`text-sm font-semibold ${total === maximum ? "text-[#167b6a]" : "text-gray-700"}`}>Total: {total / 100} / {maxGrade} puntos</output>
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-[#d9e2ec] pt-4">
          <button type="button" onClick={onClose} className="min-h-10 rounded-md bg-[#efe6fa] px-4 py-2 text-sm font-medium text-[#4b5fa7] hover:bg-[#e7dcf4]">Cancelar</button>
          <button type="submit" disabled={checking} className="min-h-10 rounded-md bg-[#3186d8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2777c1] disabled:opacity-50">{type === "pdf" ? "Adjuntar rúbrica" : "Aplicar criterios"}</button>
        </div>
      </form>
    </dialog>
  );
}
