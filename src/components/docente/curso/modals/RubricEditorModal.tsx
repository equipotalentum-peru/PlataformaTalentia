"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";


export type RubricCriterion = {
  nombre: string;
  descripcion: string;
  puntaje_maximo: number;
};


export type RubricDraft =
  | {
      tipo: "pdf";
      archivo: File;
    }
  | {
      tipo: "criterios";
      criterios: RubricCriterion[];
    };


type CriterionRow = {
  id: string;
  nombre: string;
  descripcion: string;
  puntos: string;
};


type CriterionForm = {
  nombre: string;
  descripcion: string;
  puntos: string;
};


type Props = {
  type: RubricDraft["tipo"];
  draft: RubricDraft | null;
  maxGrade: number;
  onClose: () => void;
  onConfirm: (
    draft: RubricDraft
  ) => void;
};


const MAX_PDF_BYTES =
  200 * 1024 * 1024;


const EMPTY_FORM:
  CriterionForm = {
    nombre: "",
    descripcion: "",
    puntos: "",
  };


const inputClass =
  "w-full rounded-md border border-talentia-border bg-talentia-surface px-3 py-2.5 text-sm text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15";


function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}


function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}


function puntosACentimos(
  value: string | number
) {
  const numero =
    Number(value);

  if (
    !Number.isFinite(numero)
  ) {
    return 0;
  }

  return Math.round(
    numero * 100
  );
}


export default function RubricEditorModal({
  type,
  draft,
  maxGrade,
  onClose,
  onConfirm,
}: Props) {
  const dialogRef =
    useRef<HTMLDialogElement>(
      null
    );


  /* ================================
     PDF
  ================================= */

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      draft?.tipo === "pdf"
        ? draft.archivo
        : null
    );

  const [
    checking,
    setChecking,
  ] =
    useState(false);


  /* ================================
     GENERAL
  ================================= */

  const [
    error,
    setError,
  ] =
    useState("");


  /* ================================
     CRITERIOS YA AGREGADOS
  ================================= */

  const [
    rows,
    setRows,
  ] =
    useState<
      CriterionRow[]
    >(() =>
      draft?.tipo ===
      "criterios"
        ? draft.criterios.map(
            (
              item,
              index
            ) => ({
              id:
                `criterio-${index}-${crypto.randomUUID()}`,

              nombre:
                item.nombre,

              descripcion:
                item.descripcion,

              puntos:
                String(
                  item.puntaje_maximo
                ),
            })
          )
        : []
    );


  /* ================================
     FORMULARIO DE NUEVO CRITERIO
  ================================= */

  const [
    criterionForm,
    setCriterionForm,
  ] =
    useState<
      CriterionForm
    >(
      EMPTY_FORM
    );


  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string | null
    >(null);


  /* ================================
     TOTALES
  ================================= */

  const total =
    rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        puntosACentimos(
          row.puntos
        ),
      0
    );


  const maximum =
    Math.round(
      maxGrade * 100
    );


  /* ================================
     ABRIR DIALOG
  ================================= */

  useEffect(() => {
    const dialog =
      dialogRef.current;

    dialog?.showModal();

    return () =>
      dialog?.close();
  }, []);


  /* ================================
     PDF
  ================================= */

  async function chooseFile(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    if (checking) {
      return;
    }

    const selected =
      event.target
        .files?.[0] ??
      null;

    setFile(null);
    setError("");

    if (!selected) {
      return;
    }

    if (
      !selected.name
        .toLowerCase()
        .endsWith(
          ".pdf"
        ) ||
      selected.size === 0 ||
      selected.size >
        MAX_PDF_BYTES
    ) {
      event.target.value =
        "";

      setError(
        "Selecciona un PDF válido de hasta 200 MB."
      );

      return;
    }

    setChecking(true);

    try {
      const header =
        await selected
          .slice(0, 5)
          .text();

      if (
        header !== "%PDF-"
      ) {
        throw new Error(
          "El contenido del archivo no corresponde a un PDF."
        );
      }

      setFile(
        selected
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo leer el PDF seleccionado."
      );
    } finally {
      setChecking(false);
    }
  }


  /* ================================
     FORMULARIO DE CRITERIOS
  ================================= */

  function updateCriterionForm(
    field:
      | "nombre"
      | "descripcion"
      | "puntos",
    value: string
  ) {
    setCriterionForm(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );

    setError("");
  }


  function clearCriterionForm() {
    setCriterionForm({
      ...EMPTY_FORM,
    });

    setEditingId(
      null
    );

    setError("");
  }


  /* ================================
     AÑADIR / GUARDAR CRITERIO
  ================================= */

  function addCriterion() {
    const nombre =
      criterionForm.nombre
        .trim();

    const descripcion =
      criterionForm.descripcion
        .trim();

    const puntos =
      Number(
        criterionForm.puntos
      );


    if (!nombre) {
      setError(
        "Ingresa el nombre del criterio."
      );

      return;
    }


    if (
      !Number.isFinite(
        puntos
      ) ||
      puntos <= 0
    ) {
      setError(
        "Los puntos deben ser mayores a 0."
      );

      return;
    }


    /*
     * Si estamos editando,
     * quitamos temporalmente
     * el puntaje del criterio
     * anterior para validar
     * correctamente el total.
     */
    const editingRow =
      editingId
        ? rows.find(
            (row) =>
              row.id ===
              editingId
          )
        : null;


    const totalSinEditado =
      total -
      (
        editingRow
          ? puntosACentimos(
              editingRow.puntos
            )
          : 0
      );


    const nuevoTotal =
      totalSinEditado +
      puntosACentimos(
        puntos
      );


    if (
      nuevoTotal >
      maximum
    ) {
      setError(
        `El total de criterios no puede superar ${maxGrade} puntos.`
      );

      return;
    }


    /*
     * EDITAR EXISTENTE
     */
    if (editingId) {
      setRows(
        (
          current
        ) =>
          current.map(
            (row) =>
              row.id ===
              editingId
                ? {
                    ...row,

                    nombre,

                    descripcion,

                    puntos:
                      String(
                        puntos
                      ),
                  }
                : row
          )
      );

      clearCriterionForm();

      return;
    }


    /*
     * NUEVA FILA
     */
    setRows(
      (
        current
      ) => [
        ...current,
        {
          id:
            crypto.randomUUID(),

          nombre,

          descripcion,

          puntos:
            String(
              puntos
            ),
        },
      ]
    );


    clearCriterionForm();
  }


  /* ================================
     EDITAR FILA
  ================================= */

  function editCriterion(
    row: CriterionRow
  ) {
    setEditingId(
      row.id
    );

    setCriterionForm({
      nombre:
        row.nombre,

      descripcion:
        row.descripcion,

      puntos:
        row.puntos,
    });

    setError("");
  }


  /* ================================
     ELIMINAR FILA
  ================================= */

  function removeCriterion(
    id: string
  ) {
    setRows(
      (
        current
      ) =>
        current.filter(
          (row) =>
            row.id !== id
        )
    );

    if (
      editingId === id
    ) {
      clearCriterionForm();
    }

    setError("");
  }


  /* ================================
     CONFIRMAR RÚBRICA
  ================================= */

  function confirm(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (checking) {
      return;
    }


    /* ---------- PDF ---------- */

    if (
      type === "pdf"
    ) {
      if (!file) {
        setError(
          "Selecciona un PDF antes de adjuntarlo."
        );

        return;
      }

      onConfirm({
        tipo: "pdf",
        archivo: file,
      });

      return;
    }


    /* ---------- CRITERIOS ---------- */

    if (
      rows.length === 0
    ) {
      setError(
        "Añade al menos un criterio."
      );

      return;
    }


    if (
      rows.some(
        (row) =>
          !row.nombre.trim()
      )
    ) {
      setError(
        "Todos los criterios deben tener un nombre."
      );

      return;
    }


    if (
      rows.some(
        (row) => {
          const puntos =
            Number(
              row.puntos
            );

          return (
            !Number.isFinite(
              puntos
            ) ||
            puntos <= 0
          );
        }
      )
    ) {
      setError(
        "Todos los criterios deben tener un puntaje válido."
      );

      return;
    }


    if (
      total !==
      maximum
    ) {
      setError(
        `Los criterios deben sumar ${maxGrade} puntos. Actualmente suman ${total / 100}.`
      );

      return;
    }


    onConfirm({
      tipo:
        "criterios",

      criterios:
        rows.map(
          (row) => ({
            nombre:
              row.nombre.trim(),

            descripcion:
              row.descripcion.trim(),

            puntaje_maximo:
              Number(
                row.puntos
              ),
          })
        ),
    });
  }


  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rubric-editor-title"
      onCancel={(
        event
      ) => {
        event.preventDefault();
        onClose();
      }}
      className={`
        m-auto
        max-h-[90dvh]
        w-[94vw]
        overflow-hidden
        rounded-[14px]
        border-0
        bg-talentia-surface
        p-0
        text-talentia-primary
        shadow-2xl
        backdrop:bg-black/50

        ${
          type ===
          "criterios"
            ? "max-w-[1050px]"
            : "max-w-2xl"
        }
      `}
    >
      <form
        onSubmit={
          confirm
        }
        className="flex max-h-[90dvh] flex-col"
      >
        {/* =================================================
            CABECERA
        ================================================= */}

        <div className="flex shrink-0 items-center justify-between gap-4 px-7 pb-3 pt-6 sm:px-8">
          <h2
            id="rubric-editor-title"
            className={`font-bold ${
              type ===
              "criterios"
                ? "text-[24px] text-talentia-primary"
                : "text-lg text-talentia-primary"
            }`}
          >
            {type ===
            "pdf"
              ? "Adjuntar rúbrica PDF"
              : "Configurar criterios"}
          </h2>


          <button
            type="button"
            aria-label="Cerrar editor de rúbrica"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-2xl text-talentia-muted transition hover:bg-talentia-hover"
          >
            ×
          </button>
        </div>


        {/* =================================================
            CONTENIDO
        ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-5 sm:px-8">
          {/* =================================================
              PDF
          ================================================= */}

          {type ===
          "pdf" ? (
            <div className="mt-2">
              <label
                htmlFor="rubric-pdf"
                className="block text-sm font-medium"
              >
                Documento PDF
              </label>


              <input
                id="rubric-pdf"
                type="file"
                accept=".pdf,application/pdf"
                disabled={
                  checking
                }
                onChange={
                  chooseFile
                }
                className={`
                  mt-1.5
                  ${inputClass}

                  file:mr-3
                  file:rounded-md
                  file:border-0
                  file:bg-talentia-selected
                  file:px-3
                  file:py-2
                  file:text-talentia-blue
                `}
              />


              <p className="mt-2 text-xs text-talentia-muted">
                Máximo 200 MB
              </p>


              {checking && (
                <p
                  role="status"
                  className="mt-3 text-sm text-talentia-primary"
                >
                  Validando PDF…
                </p>
              )}


              {file && (
                <p className="mt-3 break-all text-sm text-talentia-primary">
                  Seleccionado:{" "}
                  {file.name}{" "}
                  (
                  {(
                    file.size /
                    (
                      1024 *
                      1024
                    )
                  ).toFixed(
                    2
                  )}{" "}
                  MB)
                </p>
              )}
            </div>
          ) : (
            /* =================================================
                CRITERIOS
            ================================================= */

            <div className="mt-2">
              {/* =============================================
                  AGREGAR NUEVO CRITERIO
              ============================================= */}

              <section className="rounded-[10px] border border-talentia-border bg-talentia-surface p-4">
                <h3 className="mb-4 text-[17px] font-bold text-talentia-primary">
                  {editingId
                    ? "Editar criterio"
                    : "Agregar nuevo criterio"}
                </h3>


                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_105px_190px] lg:items-end">
                  {/* NOMBRE */}

                  <div className="min-w-0">
                    <label
                      htmlFor="criterion-name"
                      className="mb-1.5 block text-[13px] text-talentia-primary"
                    >
                      Nombre
                    </label>

                    <input
                      id="criterion-name"
                      type="text"
                      maxLength={
                        200
                      }
                      value={
                        criterionForm.nombre
                      }
                      onChange={(
                        event
                      ) =>
                        updateCriterionForm(
                          "nombre",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Ej. Participación"
                      className={inputClass}
                    />
                  </div>


                  {/* DESCRIPCIÓN */}

                  <div className="min-w-0">
                    <label
                      htmlFor="criterion-description"
                      className="mb-1.5 block text-[13px] text-talentia-primary"
                    >
                      Descripción
                    </label>

                    <input
                      id="criterion-description"
                      type="text"
                      maxLength={
                        2000
                      }
                      value={
                        criterionForm.descripcion
                      }
                      onChange={(
                        event
                      ) =>
                        updateCriterionForm(
                          "descripcion",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Ej. Interviene y responde correctamente"
                      className={inputClass}
                    />
                  </div>


                  {/* PUNTOS */}

                  <div>
                    <label
                      htmlFor="criterion-points"
                      className="mb-1.5 block text-[13px] text-talentia-primary"
                    >
                      Puntos
                    </label>

                    <input
                      id="criterion-points"
                      type="number"
                      min={
                        0.01
                      }
                      max={
                        maxGrade
                      }
                      step="0.01"
                      value={
                        criterionForm.puntos
                      }
                      onChange={(
                        event
                      ) =>
                        updateCriterionForm(
                          "puntos",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Ej. 5"
                      className={inputClass}
                    />
                  </div>


                  {/* AÑADIR */}

                  <button
                    type="button"
                    onClick={
                      addCriterion
                    }
                    disabled={
                      !editingId &&
                      rows.length >=
                        20
                    }
                    className="
                      flex
                      h-[42px]
                      items-center
                      justify-center
                      gap-2
                      rounded-md
                      bg-talentia-action
                      px-4
                      text-[13px]
                      font-semibold
                      text-white
                      transition
                      hover:bg-talentia-primary
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <span className="text-[19px] leading-none">
                      {editingId
                        ? "✓"
                        : "+"}
                    </span>

                    {editingId
                      ? "Guardar cambios"
                      : "Añadir criterio"}
                  </button>
                </div>


                {/* CANCELAR EDICIÓN */}

                {editingId && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={
                        clearCriterionForm
                      }
                      className="text-[12px] font-medium text-talentia-muted transition hover:text-talentia-primary"
                    >
                      Cancelar edición
                    </button>
                  </div>
                )}


                {/* AYUDA */}

                <div className="mt-4 flex items-center gap-2 rounded-[7px] bg-talentia-selected px-4 py-3 text-[12px] text-talentia-blue">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-talentia-blue text-[12px] font-bold">
                    i
                  </span>

                  <span>
                    Al hacer clic
                    en{" "}
                    <strong>
                      + Añadir
                      criterio
                    </strong>
                    , el criterio
                    se agregará
                    como una nueva
                    fila en la tabla
                    de abajo.
                  </span>
                </div>
              </section>


              {/* =============================================
                  ERROR
              ============================================= */}

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-sm text-talentia-danger"
                >
                  {error}
                </p>
              )}


              {/* =============================================
                  CABECERA TABLA
              ============================================= */}

              <div className="mb-3 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-[19px] font-bold text-talentia-primary">
                  Criterios
                  agregados
                </h3>


                <output
                  aria-live="polite"
                  className={`text-[16px] font-bold ${
                    total ===
                    maximum
                      ? "text-talentia-success"
                      : "text-talentia-primary"
                  }`}
                >
                  Total:{" "}
                  {total /
                    100}{" "}
                  /{" "}
                  {maxGrade}{" "}
                  puntos
                </output>
              </div>


              {/* =============================================
                  TABLA
              ============================================= */}

              <div className="max-h-[310px] overflow-auto rounded-[9px] border border-talentia-border">
                <table className="w-full min-w-[760px] border-collapse text-[13px]">
                  <thead className="sticky top-0 z-10 bg-talentia-surface">
                    <tr>
                      <th className="w-[65px] border-r border-talentia-border px-4 py-3 text-center font-semibold text-talentia-primary">
                        #
                      </th>

                      <th className="w-[230px] border-r border-talentia-border px-5 py-3 text-left font-semibold text-talentia-primary">
                        Nombre
                      </th>

                      <th className="border-r border-talentia-border px-5 py-3 text-left font-semibold text-talentia-primary">
                        Descripción
                      </th>

                      <th className="w-[120px] border-r border-talentia-border px-5 py-3 text-center font-semibold text-talentia-primary">
                        Puntos
                      </th>

                      <th className="w-[145px] px-5 py-3 text-center font-semibold text-talentia-primary">
                        Acciones
                      </th>
                    </tr>
                  </thead>


                  <tbody>
                    {rows.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={
                            5
                          }
                          className="px-5 py-10 text-center text-[13px] text-talentia-muted"
                        >
                          Todavía no
                          agregaste
                          criterios.
                        </td>
                      </tr>
                    ) : (
                      rows.map(
                        (
                          row,
                          index
                        ) => (
                          <tr
                            key={
                              row.id
                            }
                            className="border-t border-talentia-border bg-talentia-surface"
                          >
                            {/* # */}

                            <td className="border-r border-talentia-border px-4 py-4 text-center font-medium text-talentia-primary">
                              {index +
                                1}
                            </td>


                            {/* NOMBRE */}

                            <td className="border-r border-talentia-border px-5 py-4 font-semibold text-talentia-primary">
                              {
                                row.nombre
                              }
                            </td>


                            {/* DESCRIPCIÓN */}

                            <td className="border-r border-talentia-border px-5 py-4 text-talentia-muted">
                              {row.descripcion ||
                                "—"}
                            </td>


                            {/* PUNTOS */}

                            <td className="border-r border-talentia-border px-5 py-4 text-center font-semibold text-talentia-primary">
                              {
                                row.puntos
                              }
                            </td>


                            {/* ACCIONES */}

                            <td className="px-5 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  aria-label={`Editar criterio ${index + 1}`}
                                  onClick={() =>
                                    editCriterion(
                                      row
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-talentia-selected text-talentia-blue transition hover:bg-talentia-hover"
                                >
                                  <PencilIcon />
                                </button>


                                <button
                                  type="button"
                                  aria-label={`Quitar criterio ${index + 1}`}
                                  onClick={() =>
                                    removeCriterion(
                                      row.id
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-talentia-danger-bg text-talentia-danger transition hover:bg-talentia-danger-bg"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>


              {/* ERROR DE TOTAL / INFO */}

              {!error &&
                rows.length >
                  0 &&
                total !==
                  maximum && (
                  <p className="mt-3 text-[12px] text-talentia-muted">
                    Faltan{" "}
                    {(
                      (
                        maximum -
                        total
                      ) /
                      100
                    ).toFixed(
                      2
                    )}{" "}
                    puntos para
                    completar la
                    rúbrica.
                  </p>
                )}
            </div>
          )}


          {/* =================================================
              ERROR PARA PDF
          ================================================= */}

          {type ===
            "pdf" &&
            error && (
              <p
                role="alert"
                className="mt-4 text-sm text-talentia-danger"
              >
                {error}
              </p>
            )}
        </div>


        {/* =================================================
            BOTONES INFERIORES
        ================================================= */}

        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-talentia-border bg-talentia-surface px-7 py-4 sm:px-8">
          <button
            type="button"
            onClick={
              onClose
            }
            className="min-h-10 rounded-md bg-talentia-surface px-5 py-2 text-sm font-medium text-talentia-primary transition hover:bg-talentia-border"
          >
            Cancelar
          </button>


          <button
            type="submit"
            disabled={
              checking ||
              (
                type ===
                  "criterios" &&
                (
                  rows.length ===
                    0 ||
                  total !==
                    maximum
                )
              )
            }
            className="min-h-10 rounded-md bg-talentia-action px-5 py-2 text-sm font-semibold text-white transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:bg-talentia-border disabled:opacity-70"
          >
            {type ===
            "pdf"
              ? checking
                ? "Validando..."
                : "Adjuntar rúbrica"
              : "Aplicar criterios"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
