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
        bg-white
        p-0
        text-gray-800
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
            className="text-[24px] font-bold text-[#103763]"
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
              text-[#334155]
              transition
              hover:bg-gray-100
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

          <div className="flex items-center gap-3 rounded-[8px] bg-[#dff0ff] px-4 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#1479d1] text-[13px] font-bold text-[#1479d1]">
              i
            </span>

            <p className="text-[12px] leading-[1.4] text-[#174d7c]">
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

          <div className="mt-5 overflow-hidden rounded-[8px] border border-[#dae3ed]">
            <div className="max-h-[390px] overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-[12px]">
                <thead className="sticky top-0 z-10 bg-[#f0f4f8]">
                  <tr>
                    <th className="w-[70px] border-r border-[#dce3eb] px-4 py-3 text-center font-semibold text-[#34445a]">
                      #
                    </th>

                    <th className="w-[205px] border-r border-[#dce3eb] px-5 py-3 text-left font-semibold text-[#34445a]">
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
                  {rubrica.criterios.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={
                          4
                        }
                        className="px-6 py-10 text-center text-[13px] text-gray-400"
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
                          className="border-t border-[#dfe6ee] bg-white"
                        >
                          <td className="border-r border-[#dfe6ee] px-4 py-4 text-center font-medium text-[#24364b]">
                            {index +
                              1}
                          </td>

                          <td className="border-r border-[#dfe6ee] px-5 py-4 font-bold text-[#24364b]">
                            {
                              criterio.nombre
                            }
                          </td>

                          <td className="border-r border-[#dfe6ee] px-5 py-4 leading-[1.5] text-[#43546a]">
                            {criterio.descripcion ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-center font-bold text-[#24364b]">
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

          <div className="mt-2 flex items-center justify-between rounded-[7px] bg-[#e1f1ff] px-5 py-3">
            <span className="text-[15px] font-bold text-[#1554a0]">
              Puntuación total
            </span>

            <span className="text-[18px] font-bold text-[#1554a0]">
              {total ||
                maxGrade}{" "}
              puntos
            </span>
          </div>


          {/* IMPORTANTE */}

          <div className="mt-2 flex gap-4 rounded-[8px] bg-[#dff0ff] px-5 py-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#1479d1] text-[13px] font-bold text-[#1479d1]">
              i
            </span>

            <div>
              <p className="text-[14px] font-bold text-[#145da8]">
                Importante
              </p>

              <p className="mt-1 text-[12px] leading-[1.45] text-[#315b7e]">
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

        <div className="flex shrink-0 justify-end border-t border-[#e1e6ec] bg-white px-6 py-4 sm:px-7">
          <button
            type="button"
            onClick={
              onClose
            }
            className="
              min-h-10
              rounded-[6px]
              bg-[#eee9ff]
              px-7
              py-2
              text-[13px]
              font-medium
              text-[#5549b8]
              transition
              hover:bg-[#e3dcff]
            "
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}