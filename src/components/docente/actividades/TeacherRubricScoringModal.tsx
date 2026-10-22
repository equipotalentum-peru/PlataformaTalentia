"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RubricCriterion = {
  id: number;
  nombre: string;
  descripcion: string | null;
  puntaje_maximo: number | string;
  orden?: number;
};

type RubricInfo = {
  titulo?: string;
  criterios: RubricCriterion[];
};

type CriterionScore = {
  criterioId: number;
  puntaje: string;
};

type AppliedCriterionScore = {
  criterioId: number;
  puntaje: number;
};

type Props = {
  rubrica: RubricInfo;
  maxGrade: number;
  initialScores: CriterionScore[];
  onClose: () => void;
  onApply: (scores: AppliedCriterionScore[]) => void;
};

function formatPoints(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export default function TeacherRubricScoringModal({
  rubrica,
  maxGrade,
  initialScores,
  onClose,
  onApply,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scores, setScores] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const criterion of rubrica.criterios) {
      initial[Number(criterion.id)] =
        initialScores.find((item) => item.criterioId === Number(criterion.id))?.puntaje ?? "";
    }
    return initial;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const criteriaTotal = rubrica.criterios.reduce(
    (sum, criterion) => sum + Number(criterion.puntaje_maximo),
    0,
  );

  const currentTotal = useMemo(() => rubrica.criterios.reduce((sum, criterion) => {
    const raw = scores[Number(criterion.id)] ?? "";
    if (raw.trim() === "") return sum;
    const value = Number(raw);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0), [rubrica.criterios, scores]);

  const allScoresValid = rubrica.criterios.every((criterion) => {
    const raw = scores[Number(criterion.id)] ?? "";
    if (raw.trim() === "") return false;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 && value <= Number(criterion.puntaje_maximo);
  });

  const rubricMaximumMatches = Math.round(criteriaTotal * 100) === Math.round(maxGrade * 100);
  const allScoresWithinOverallMaximum = currentTotal <= maxGrade + 0.00001;

  function apply() {
    if (!allScoresValid || !allScoresWithinOverallMaximum || !rubricMaximumMatches) return;
    onApply(rubrica.criterios.map((criterion) => ({
      criterioId: Number(criterion.id),
      puntaje: Math.round(Number(scores[Number(criterion.id)]) * 100) / 100,
    })));
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rubric-grading-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[88dvh] w-[92vw] max-w-[1000px] overflow-hidden rounded-xl border-0 bg-talentia-surface p-0 text-talentia-primary shadow-2xl backdrop:bg-black/55"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-talentia-border px-6 py-5 sm:px-8">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-talentia-blue">Calificación por criterios</p>
            <h2 id="rubric-grading-title" className="mt-1 text-[22px] font-bold text-talentia-primary sm:text-[25px]">
              {rubrica.titulo || "Rúbrica de evaluación"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar rúbrica"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[26px] text-talentia-primary transition hover:bg-talentia-hover"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
          <div className="rounded-lg border border-talentia-border bg-talentia-selected px-4 py-3 text-[14px] leading-relaxed text-talentia-primary">
            Asigna los puntos obtenidos en cada criterio. La calificación del intento se calculará sumando estas puntuaciones.
          </div>

          <div className="overflow-x-auto rounded-lg border border-talentia-border">
            <table className="w-full min-w-[680px] border-collapse text-[14px]">
              <thead className="bg-talentia-table-header">
                <tr>
                  <th className="w-[56px] border-b border-r border-talentia-border px-3 py-3 text-center font-bold">#</th>
                  <th className="w-[210px] border-b border-r border-talentia-border px-4 py-3 text-left font-bold">Criterio</th>
                  <th className="border-b border-r border-talentia-border px-4 py-3 text-left font-bold">Descripción</th>
                  <th className="w-[135px] border-b border-r border-talentia-border px-4 py-3 text-center font-bold">Máximo</th>
                  <th className="w-[160px] border-b border-talentia-border px-4 py-3 text-center font-bold">Puntos obtenidos</th>
                </tr>
              </thead>
              <tbody>
                {rubrica.criterios.map((criterion, index) => {
                  const criterionId = Number(criterion.id);
                  const maximum = Number(criterion.puntaje_maximo);
                  const raw = scores[criterionId] ?? "";
                  const invalid = raw.trim() !== "" && (
                    !Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > maximum
                  );

                  return (
                    <tr key={criterionId} className="border-t border-talentia-border align-top">
                      <td className="border-r border-talentia-border px-3 py-4 text-center">{index + 1}</td>
                      <td className="border-r border-talentia-border px-4 py-4">
                        <p className="font-bold">{criterion.nombre}</p>
                      </td>
                      <td className="border-r border-talentia-border px-4 py-4 leading-relaxed text-talentia-muted">
                        {criterion.descripcion || "—"}
                      </td>
                      <td className="border-r border-talentia-border px-4 py-4 text-center font-semibold">{formatPoints(maximum)} pts</td>
                      <td className="px-4 py-3">
                        <label className="sr-only" htmlFor={`rubric-score-${criterionId}`}>
                          Puntos para {criterion.nombre}
                        </label>
                        <input
                          id={`rubric-score-${criterionId}`}
                          type="number"
                          min={0}
                          max={maximum}
                          step="0.01"
                          inputMode="decimal"
                          value={raw}
                          onChange={(event) => setScores((previous) => ({
                            ...previous,
                            [criterionId]: event.target.value,
                          }))}
                          aria-invalid={invalid}
                          placeholder={`0–${formatPoints(maximum)}`}
                          className={`w-full rounded-md border bg-talentia-surface px-3 py-2.5 text-[14px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/20 ${invalid ? "border-talentia-danger" : "border-talentia-border"}`}
                        />
                        {invalid && <p className="mt-1 text-[11px] text-talentia-danger">Debe estar entre 0 y {formatPoints(maximum)}.</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-talentia-border bg-talentia-selected px-4 py-4">
            <div>
              <p className="text-[13px] text-talentia-muted">Puntos acumulados</p>
              <p className="mt-1 text-[22px] font-bold text-talentia-primary">
                {formatPoints(currentTotal)} <span className="text-[14px] font-medium">/ {formatPoints(maxGrade)} puntos</span>
              </p>
            </div>
            <p className="text-[12px] text-talentia-muted">
              Máximo configurado en criterios: {formatPoints(criteriaTotal)} pts
            </p>
          </div>

          {!allScoresValid && (
            <p className="text-[12px] text-talentia-muted">Completa todos los campos, incluido 0 si no corresponde otorgar puntos.</p>
          )}
          {!rubricMaximumMatches && (
            <p role="alert" className="text-[13px] font-semibold text-talentia-danger">La suma de los puntos máximos de la rúbrica ({formatPoints(criteriaTotal)}) no coincide con la puntuación de la actividad ({formatPoints(maxGrade)}). Pide que se corrija la configuración antes de calificar.</p>
          )}
          {!allScoresWithinOverallMaximum && (
            <p role="alert" className="text-[13px] font-semibold text-talentia-danger">La suma supera la puntuación máxima de la actividad.</p>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-talentia-border px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="min-h-10 rounded-md px-5 py-2 text-[13px] font-semibold text-talentia-primary transition hover:bg-talentia-hover">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!allScoresValid || !allScoresWithinOverallMaximum || !rubricMaximumMatches}
            onClick={apply}
            className="activity-primary min-h-10 rounded-md px-6 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Aplicar criterios
          </button>
        </footer>
      </div>
    </dialog>
  );
}
