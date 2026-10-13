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
        bg-white
        p-0
        text-gray-800
        shadow-2xl
        backdrop:bg-black/55
      "
    >
      <div className="flex max-h-[88dvh] flex-col">
        {/* CABECERA */}
        <div className="flex shrink-0 items-center justify-between px-7 pb-3 pt-6">
          <h2
            id="teacher-rubric-title"
            className="text-[24px] font-bold text-[#103763]"
          >
            Rúbrica de evaluación
          </h2>

          <button
            type="button"
            aria-label="Cerrar rúbrica"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-[26px] font-light text-[#334155] transition hover:bg-gray-100"
          >
            ×
          </button>
        </div>


        {/* CONTENIDO */}
        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-4">
          {/* INFORMACIÓN */}
          <div className="rounded-[8px] border border-[#bcdcff] bg-[#e8f4ff] px-5 py-4">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#1479d1] text-[13px] font-bold text-[#1479d1]">
                i
              </span>

              <div>
                <p className="text-[12px] font-semibold text-[#1554a0]">
                  Estos son los criterios que se utilizan para evaluar esta actividad.
                </p>

                <p className="mt-1 text-[11px] leading-[1.4] text-[#315b7e]">
                  Cada criterio tiene un puntaje específico y la suma total equivale a la puntuación máxima de la actividad.
                </p>
              </div>
            </div>
          </div>


          {/* TABLA */}
          <div className="mt-5 overflow-hidden rounded-[8px] border border-[#dae3ed]">
            <div className="max-h-[390px] overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-[12px]">
                <thead className="sticky top-0 z-10 bg-[#f0f4f8]">
                  <tr>
                    <th className="w-[70px] border-r border-[#dce3eb] px-4 py-3 text-center font-semibold text-[#34445a]">
                      #
                    </th>

                    <th className="w-[210px] border-r border-[#dce3eb] px-5 py-3 text-left font-semibold text-[#34445a]">
                      Criterio
                    </th>

                    <th className="border-r border-[#dce3eb] px-5 py-3 text-left font-semibold text-[#34445a]">
                      Descripción
                    </th>

                    <th className="w-[120px] px-5 py-3 text-center font-semibold text-[#34445a]">
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
                        className="border-t border-[#dfe6ee] bg-white"
                      >
                        <td className="border-r border-[#dfe6ee] px-4 py-4 text-center font-medium text-[#24364b]">
                          {index + 1}
                        </td>

                        <td className="border-r border-[#dfe6ee] px-5 py-4 font-bold text-[#24364b]">
                          {criterio.nombre}
                        </td>

                        <td className="border-r border-[#dfe6ee] px-5 py-4 leading-[1.5] text-[#43546a]">
                          {criterio.descripcion ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-[48px] justify-center rounded-[6px] bg-[#f1f4f8] px-3 py-2 font-bold text-[#24364b]">
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
          <div className="mt-4 flex items-center gap-3 rounded-[8px] border border-[#bcdcff] bg-[#e8f4ff] px-5 py-4">
            <span className="text-[20px] text-[#2584dc]">
              ★
            </span>

            <p className="text-[16px] font-bold text-[#1554a0]">
              Puntuación total:{" "}
              <span>
                {total || maxGrade} puntos
              </span>
            </p>
          </div>
        </div>


        {/* FOOTER */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-[#e1e6ec] bg-white px-7 py-4">
          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="min-h-10 rounded-[6px] border border-[#d4dde8] bg-white px-6 py-2 text-[13px] font-medium text-[#334155] transition hover:bg-gray-50"
          >
            Imprimir
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-[6px] bg-[#2584dc] px-7 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1975c9]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}