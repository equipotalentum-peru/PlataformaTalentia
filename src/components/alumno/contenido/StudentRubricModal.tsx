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


export default function StudentRubricModal({
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
      aria-labelledby="student-rubric-title"
      onCancel={(
        event
      ) => {
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
        {/* =========================
            CABECERA
        ========================= */}

        <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-6 sm:px-7">
          <h2
            id="student-rubric-title"
            className="text-[24px] font-bold text-talentia-primary"
          >
            Rúbrica de evaluación
          </h2>

          <button
            type="button"
            aria-label="Cerrar rúbrica"
            onClick={
              onClose
            }
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-md
              text-[26px]
              font-light
              text-talentia-primary
              transition
              hover:bg-talentia-hover
            "
          >
            ×
          </button>
        </div>


        {/* =========================
            CONTENIDO
        ========================= */}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 sm:px-7">
          {/* INFORMACIÓN */}

          <div className="flex items-center gap-3 rounded-[8px] bg-talentia-selected px-4 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-talentia-blue text-[13px] font-bold text-talentia-blue">
              i
            </span>

            <p className="text-[12px] leading-[1.4] text-talentia-primary">
              Esta actividad será
              evaluada con los
              siguientes criterios.
              La puntuación total es
              de{" "}
              <strong>
                {maxGrade} puntos.
              </strong>
            </p>
          </div>


          {/* =========================
              TABLA
          ========================= */}

          <div className="mt-5 overflow-hidden rounded-[8px] border border-talentia-border">
            <div className="max-h-[390px] overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-[12px]">
                <thead className="sticky top-0 z-10 bg-talentia-surface">
                  <tr>
                    <th className="w-[70px] border-r border-talentia-border px-4 py-3 text-center font-semibold text-talentia-primary">
                      #
                    </th>

                    <th className="w-[205px] border-r border-talentia-border px-5 py-3 text-left font-semibold text-talentia-primary">
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
                  {rubrica.criterios.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={
                          4
                        }
                        className="px-6 py-10 text-center text-[13px] text-talentia-muted"
                      >
                        Esta rúbrica
                        todavía no tiene
                        criterios.
                      </td>
                    </tr>
                  ) : (
                    rubrica.criterios.map(
                      (
                        criterio,
                        index
                      ) => (
                        <tr
                          key={
                            criterio.id
                          }
                          className="border-t border-talentia-border bg-talentia-surface"
                        >
                          <td className="border-r border-talentia-border px-4 py-4 text-center font-medium text-talentia-primary">
                            {index +
                              1}
                          </td>

                          <td className="border-r border-talentia-border px-5 py-4 font-bold text-talentia-primary">
                            {
                              criterio.nombre
                            }
                          </td>

                          <td className="border-r border-talentia-border px-5 py-4 leading-[1.5] text-talentia-muted">
                            {criterio.descripcion ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-center font-bold text-talentia-primary">
                            {Number(
                              criterio.puntaje_maximo
                            )}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* TOTAL */}

          <div className="mt-2 flex items-center justify-between rounded-[7px] bg-talentia-selected px-5 py-3">
            <span className="text-[15px] font-bold text-talentia-primary">
              Puntuación total
            </span>

            <span className="text-[18px] font-bold text-talentia-primary">
              {total ||
                maxGrade}{" "}
              puntos
            </span>
          </div>


          {/* IMPORTANTE */}

          <div className="mt-2 flex gap-4 rounded-[8px] bg-talentia-selected px-5 py-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-talentia-blue text-[13px] font-bold text-talentia-blue">
              i
            </span>

            <div>
              <p className="text-[14px] font-bold text-talentia-blue">
                Importante
              </p>

              <p className="mt-1 text-[12px] leading-[1.45] text-talentia-primary">
                Estos criterios serán
                utilizados por el
                docente para calificar
                tu entrega. Asegúrate
                de cumplir con todos
                los aspectos indicados.
              </p>
            </div>
          </div>
        </div>


        {/* =========================
            FOOTER
        ========================= */}

        <div className="flex shrink-0 justify-end border-t border-talentia-border bg-talentia-surface px-6 py-4 sm:px-7">
          <button
            type="button"
            onClick={
              onClose
            }
            className="
              min-h-10
              rounded-[6px]
              bg-talentia-selected
              px-7
              py-2
              text-[13px]
              font-medium
              text-talentia-blue
              transition
              hover:bg-talentia-hover
            "
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}