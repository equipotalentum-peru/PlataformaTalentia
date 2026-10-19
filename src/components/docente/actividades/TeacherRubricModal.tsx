"use client";

import {
  useEffect,
  useRef,
} from "react";

import type {
  RubricInfo,
} from "@/components/common/curso/RubricDetails";


type Props = {
  rubrica: RubricInfo;
  maxGrade: number;
  onClose: () => void;
};


export default function TeacherRubricModal({
  rubrica,
  maxGrade,
  onClose,
}: Props) {
  const dialogRef =
    useRef<HTMLDialogElement>(
      null
    );


  useEffect(() => {
    const dialog =
      dialogRef.current;

    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);


  const total =
    rubrica.criterios.reduce(
      (
        acumulado,
        criterio
      ) =>
        acumulado +
        Number(
          criterio.puntaje_maximo
        ),
      0
    );


  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="teacher-rubric-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="
        m-auto
        max-h-[88dvh]
        w-[92vw]
        max-w-[900px]
        overflow-hidden
        rounded-[12px]
        border-0
        bg-talentia-surface
        p-0
        text-talentia-primary
        shadow-2xl
        backdrop:bg-black/55
      "
    >
      <div className="flex max-h-[88dvh] flex-col">
        {/* CABECERA */}
        <div className="flex shrink-0 items-center justify-between px-7 pb-3 pt-6">
          <h2
            id="teacher-rubric-title"
            className="text-[24px] font-bold text-talentia-primary"
          >
            Rúbrica de evaluación
          </h2>

          <button
            type="button"
            aria-label="Cerrar rúbrica"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-[26px] font-light text-talentia-primary transition hover:bg-talentia-hover"
          >
            ×
          </button>
        </div>


        {/* CONTENIDO */}
        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-4">
          {/* INFORMACIÓN */}
          <div className="rounded-[8px] border border-talentia-border bg-talentia-selected px-5 py-4">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-talentia-blue text-[13px] font-bold text-talentia-blue">
                i
              </span>

              <div>
                <p className="text-[12px] font-semibold text-talentia-primary">
                  Estos son los criterios que se utilizan para evaluar esta actividad.
                </p>

                <p className="mt-1 text-[11px] leading-[1.4] text-talentia-primary">
                  Cada criterio tiene un puntaje específico y la suma total equivale a la puntuación máxima de la actividad.
                </p>
              </div>
            </div>
          </div>


          {/* TABLA */}
          <div className="mt-5 overflow-hidden rounded-[8px] border border-talentia-border">
            <div className="max-h-[390px] overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-[12px]">
                <thead className="sticky top-0 z-10 bg-talentia-surface">
                  <tr>
                    <th className="w-[70px] border-r border-talentia-border px-4 py-3 text-center font-semibold text-talentia-primary">
                      #
                    </th>

                    <th className="w-[210px] border-r border-talentia-border px-5 py-3 text-left font-semibold text-talentia-primary">
                      Criterio
                    </th>

                    <th className="border-r border-talentia-border px-5 py-3 text-left font-semibold text-talentia-primary">
                      Descripción
                    </th>

                    <th className="w-[120px] px-5 py-3 text-center font-semibold text-talentia-primary">
                      Puntos
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rubrica.criterios.map(
                    (
                      criterio,
                      index
                    ) => (
                      <tr
                        key={criterio.id}
                        className="border-t border-talentia-border bg-talentia-surface"
                      >
                        <td className="border-r border-talentia-border px-4 py-4 text-center font-medium text-talentia-primary">
                          {index + 1}
                        </td>

                        <td className="border-r border-talentia-border px-5 py-4 font-bold text-talentia-primary">
                          {criterio.nombre}
                        </td>

                        <td className="border-r border-talentia-border px-5 py-4 leading-[1.5] text-talentia-muted">
                          {criterio.descripcion ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-[48px] justify-center rounded-[6px] bg-talentia-surface px-3 py-2 font-bold text-talentia-primary">
                            {Number(
                              criterio.puntaje_maximo
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* TOTAL */}
          <div className="mt-4 flex items-center gap-3 rounded-[8px] border border-talentia-border bg-talentia-selected px-5 py-4">
            <span className="text-[20px] text-talentia-blue">
              ★
            </span>

            <p className="text-[16px] font-bold text-talentia-primary">
              Puntuación total:{" "}
              <span>
                {total || maxGrade} puntos
              </span>
            </p>
          </div>
        </div>


        {/* FOOTER */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-talentia-border bg-talentia-surface px-7 py-4">
          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="min-h-10 rounded-[6px] border border-talentia-border bg-talentia-surface px-6 py-2 text-[13px] font-medium text-talentia-primary transition hover:bg-talentia-hover"
          >
            Imprimir
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-[6px] bg-talentia-action px-7 py-2 text-[13px] font-semibold text-white transition hover:bg-talentia-primary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}