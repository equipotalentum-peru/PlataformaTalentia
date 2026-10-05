"use client";

import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  useMemo,
  useState,
} from "react";

import {
  activities,
  type ActivitySubmission,
  type ActivityDefinition,
} from "@/data/activities";

import { markContentViewed } from "@/lib/progress";

type ActivityViewerProps = {
  activityId: number;
  courseId: number;

  previousHref?: string;
  nextHref?: string;
  exitHref: string;
  activityDefinition?: ActivityDefinition;
  trackLocalProgress?: boolean;
};

export default function ActivityViewer({
  activityId,
  courseId,
  previousHref,
  nextHref,
  exitHref,
  activityDefinition,
  trackLocalProgress = true,
}: ActivityViewerProps) {
  const activity = useMemo(
    () =>
      activityDefinition ?? activities.find(
        (item) => item.id === activityId
      ),
    [activityId, activityDefinition]
  );

  const [text, setText] = useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [submissions, setSubmissions] =
    useState<ActivitySubmission[]>(
      () => activity?.submissions ?? []
    );

  const [showSubmitted, setShowSubmitted] =
    useState(false);

  /*
   * MODAL DE CONFIRMACIÓN
   */
  const [showConfirmModal, setShowConfirmModal] =
    useState(false);

  if (!activity) {
    return (
      <div className="rounded-xl bg-white p-8">
        <h2 className="text-xl font-semibold">
          Actividad no encontrada
        </h2>
      </div>
    );
  }

  const attemptsUsed =
    submissions.length;

  const attemptsRemaining = Math.max(
    activity.maxAttempts - attemptsUsed,
    0
  );

  const latestSubmission =
    submissions.length > 0
      ? submissions[
          submissions.length - 1
        ]
      : null;

  /*
   * ======================================================
   * CONTENIDO PARA LA ENTREGA
   * ======================================================
   *
   * El alumno debe escribir algo o seleccionar
   * al menos un archivo.
   */
  const hasSubmissionContent =
    text.trim().length > 0 ||
    selectedFile !== null;

  /*
   * El botón solamente está habilitado cuando:
   *
   * 1. Aún existen intentos.
   * 2. Existe texto o archivo.
   */
  const canSubmit =
    attemptsRemaining > 0 &&
    hasSubmissionContent;

  /*
   * ======================================================
   * ARCHIVO
   * ======================================================
   */

  const handleFile = (
    file: File | null
  ) => {
    if (!file) {
      return;
    }

    const maxBytes =
      activity.maxFileSizeMB *
      1024 *
      1024;

    if (file.size > maxBytes) {
      alert(
        `El archivo supera el tamaño máximo de ${activity.maxFileSizeMB} MB.`
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    handleFile(file);
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0] ??
      null;

    handleFile(file);
  };

  /*
   * ======================================================
   * ABRIR MODAL
   * ======================================================
   */

  const handleSubmitClick = () => {
    /*
     * El botón ya debería estar deshabilitado,
     * pero mantenemos esta protección.
     */
    if (!canSubmit) {
      return;
    }

    setShowConfirmModal(true);
  };

  /*
   * ======================================================
   * CONFIRMAR ENTREGA
   * ======================================================
   */

  const confirmSubmission = () => {
    if (!canSubmit) {
      setShowConfirmModal(false);
      return;
    }

    const newSubmission: ActivitySubmission =
      {
        id: Date.now(),

        attempt:
          attemptsUsed + 1,

        submittedAt:
          new Date().toLocaleString(
            "es-PE"
          ),

        text:
          text.trim(),

        fileName:
          selectedFile?.name,

        /*
         * Todavía no evaluamos realmente.
         * La calificación vendrá del docente.
         */
        maxGrade:
          activity.maxGrade,
      };

    const updated = [
      ...submissions,
      newSubmission,
    ];

    setSubmissions(updated);

    setText("");
    setSelectedFile(null);

    setShowConfirmModal(false);

    setShowSubmitted(true);

    /*
     * Para el prototipo:
     * entregar la actividad = completarla.
     */
    if (trackLocalProgress) {
      markContentViewed(courseId, activityId);
    }
  };

  /*
   * ======================================================
   * ENTREGA REALIZADA
   * ======================================================
   */

  if (
    showSubmitted &&
    latestSubmission
  ) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_265px]">

        {/* CONTENIDO PRINCIPAL */}

        <section className="rounded-xl bg-white p-7">

          {/* MENSAJE DE ÉXITO */}

          <div className="mb-5 rounded-lg bg-[#c9efca] px-5 py-3 text-[#159b22]">

            <div className="flex items-center gap-3">

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18b52b] text-white">
                ✓
              </span>

              <div>
                <p className="text-[18px] font-bold">
                  ¡Entrega realizada!
                </p>

                <p className="text-[12px]">
                  Tu actividad ha sido enviada correctamente.
                </p>
              </div>

            </div>

          </div>

          {/* ARCHIVO / TEXTO ENVIADO */}

          <div className="rounded-lg bg-[#eeeeee] p-4">

            <h3 className="mb-2 text-[14px] font-semibold text-[#3186d8]">
              Archivo enviado
            </h3>

            <div className="rounded-lg bg-white p-4">

              <p className="mb-4 text-[13px] text-gray-700">
                {latestSubmission.text ||
                  "Sin comentario adicional."}
              </p>

              {latestSubmission.fileName && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ef5350] text-white">
                      PDF
                    </div>

                    <div>
                      <p className="text-[13px] font-medium">
                        {latestSubmission.fileName}
                      </p>

                      <p className="text-[11px] text-gray-500">
                        Archivo enviado
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    className="rounded-lg border border-[#3186d8] px-4 py-2 text-[12px] text-[#3186d8]"
                  >
                    ↓ Descargar
                  </button>

                </div>
              )}

            </div>

          </div>

          {/* OTRA ENTREGA */}

          {attemptsRemaining > 0 && (
            <button
              type="button"
              onClick={() =>
                setShowSubmitted(false)
              }
              className="mt-5 rounded-lg bg-[#3186d8] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2777c1]"
            >
              Realizar otro intento
            </button>
          )}

        </section>

        {/* DETALLES */}

        <aside className="space-y-3">

          <div className="rounded-xl bg-white p-5">

            <h3 className="mb-5 text-[15px] font-bold text-[#3186d8]">
              Detalles de la entrega
            </h3>

            <DetailRow
              label="Fecha de entrega"
              value={`${activity.dueDate} ${activity.dueTime} (${activity.timezone})`}
            />

            <DetailRow
              label="Intentos"
              value={`${attemptsUsed} de ${activity.maxAttempts} intentos`}
            />

            <DetailRow
              label="Puntuación máxima"
              value={`${activity.maxGrade} puntos`}
            />

          </div>

          {latestSubmission.grade !==
            undefined && (
            <div className="rounded-xl bg-white p-5">

              <h3 className="mb-4 text-[15px] font-bold text-[#3186d8]">
                Calificación
              </h3>

              <div className="rounded-lg bg-[#c9efca] px-4 py-3 text-center text-[#159b22]">
                <span className="text-[18px] font-bold">
                  {latestSubmission.grade}
                  {" / "}
                  {activity.maxGrade}
                  {" puntos"}
                </span>
              </div>

              {latestSubmission.feedback && (
                <p className="mt-3 rounded-lg bg-[#8dc8f3] p-3 text-[12px] text-gray-700">
                  {latestSubmission.feedback}
                </p>
              )}

            </div>
          )}

        </aside>

      </div>
    );
  }

  /*
   * ======================================================
   * FORMULARIO DE ENTREGA
   * ======================================================
   */

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_265px]">

      {/* CONTENIDO PRINCIPAL */}

      <section className="rounded-xl bg-white p-7">

        <h1 className="text-[27px] font-bold leading-tight text-[#3186d8]">
          {activity.title}
        </h1>

        <p className="mt-2 max-w-[750px] text-[13px] leading-[1.35] text-gray-700">
          {activity.description}
        </p>

        <div className="my-4 border-b border-gray-400" />

        <h2 className="mb-2 text-[18px] font-bold text-[#3186d8]">
          Tu entrega
        </h2>

        {/* TEXTO */}

        <textarea
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="Haga clic si desea agregar texto"
          className="
            h-[78px]
            w-full
            resize-none
            rounded-none
            border
            border-gray-300
            px-3 py-2
            text-[12px]
            outline-none
            focus:border-[#3186d8]
          "
        />

        {/* ARCHIVOS */}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            mt-3
            rounded-xl
            border-2
            border-dashed
            px-5 py-6
            text-center
            transition
            ${
              isDragging
                ? "border-[#3186d8] bg-[#eef7ff]"
                : "border-transparent bg-[#eeeeee]"
            }
          `}
        >

          <div className="mb-2 flex justify-center">

            <svg
              className="h-9 w-9 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M5 20h14" />
            </svg>

          </div>

          <p className="text-[13px] font-medium text-gray-800">
            Arrastra y suelta tu archivo aquí
          </p>

          <p className="mt-1 text-[11px] text-gray-500">
            Tamaño máximo{" "}
            {activity.maxFileSizeMB}MB
          </p>

          <label className="mt-4 inline-flex cursor-pointer rounded-lg border border-[#3186d8] bg-white px-4 py-1.5 text-[12px] font-medium text-[#3186d8]">
            Seleccionar archivo

            <input
              type="file"
              className="hidden"
              onChange={
                handleInputChange
              }
            />
          </label>

          {selectedFile && (
            <div className="mx-auto mt-4 max-w-[500px] rounded-lg bg-white px-4 py-3 text-left">

              <p className="text-[12px] font-medium text-gray-800">
                Archivo seleccionado
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                {selectedFile.name}
              </p>

            </div>
          )}

        </div>

        {/* FORMATOS */}

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#8dc8f3] px-4 py-3 text-[11px] text-[#1967a3]">

          <span className="text-lg leading-none">
            ⓘ
          </span>

          <span>
            Formatos permitidos:{" "}
            {activity.allowedFormats.join(
              ", "
            )}
            ...
          </span>

        </div>

      </section>

      {/* DETALLES */}

      <aside>

        <div className="rounded-xl bg-white p-5">

          <h3 className="mb-5 text-[15px] font-bold text-[#3186d8]">
            Detalles de la actividad
          </h3>

          <DetailRow
            label="Fecha de entrega"
            value={`${activity.dueDate} ${activity.dueTime} (${activity.timezone})`}
          />

          <DetailRow
            label="Intentos"
            value={`${attemptsRemaining} ${
              attemptsRemaining === 1
                ? "intento"
                : "intentos"
            } restante${
              attemptsRemaining === 1
                ? ""
                : "s"
            }`}
          />

          <DetailRow
            label="Puntuación máxima"
            value={`${activity.maxGrade} puntos`}
          />

          {activity.rubricAvailable && (
            <div className="mb-4 border-t border-gray-200 pt-4">

              <p className="text-[11px] text-gray-500">
                Rúbrica de evaluación
              </p>

              <a
                href="#"
                className="text-[12px] font-medium text-[#3186d8]"
              >
                Ver rúbrica
              </a>

            </div>
          )}

          <div className="rounded-lg bg-[#8dc8f3] p-3">

            <p className="mb-1 text-[12px] font-semibold text-[#2670ae]">
              ⓘ Importante
            </p>

            <p className="text-[11px] text-gray-700">
              Las entregas realizadas después
              de la fecha límite se marcarán como
              atrasadas.
            </p>

          </div>

        </div>

        {/* ENTREGAS REALIZADAS */}

        {submissions.length > 0 && (
          <div className="mt-3 rounded-xl bg-white p-5">

            <h3 className="mb-4 text-[15px] font-bold text-[#3186d8]">
              Entregas realizadas
            </h3>

            <div className="space-y-2">

              {submissions.map(
                (submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span>
                      Intento{" "}
                      {submission.attempt}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setShowSubmitted(true)
                      }
                      className="text-[#3186d8] hover:underline"
                    >
                      Ver entrega ↗
                    </button>
                  </div>
                )
              )}

            </div>

          </div>
        )}

      </aside>

      {/* BOTÓN ENVIAR */}

      <div className="lg:col-span-2 flex justify-end">

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmitClick}
          className={`
            rounded-lg
            px-7 py-3
            text-[16px]
            font-medium
            shadow-sm
            transition
            ${
              canSubmit
                ? "bg-[#2196e8] text-black hover:bg-[#178bd8]"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }
          `}
        >
          Enviar entrega →
        </button>

      </div>

      {/* ==================================================
          MODAL DE CONFIRMACIÓN
         ================================================== */}

      {showConfirmModal && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center
            justify-center
            bg-black/50
            px-4
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >

          <div
            className="
              w-full max-w-[440px]
              rounded-xl
              bg-white
              p-6
              shadow-2xl
            "
          >

            <div className="mb-4 flex items-start gap-4">

              <div
                className="
                  flex h-11 w-11
                  shrink-0
                  items-center justify-center
                  rounded-full
                  bg-[#e8f3ff]
                  text-[#3186d8]
                "
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                </svg>
              </div>

              <div>

                <h2
                  id="confirm-title"
                  className="
                    text-[18px]
                    font-bold
                    text-gray-800
                  "
                >
                  ¿Estás seguro de enviar el entregable?
                </h2>

                <p className="mt-2 text-[13px] leading-5 text-gray-600">
                  Estás a punto de enviar el
                  intento{" "}
                  <strong>
                    {attemptsUsed + 1}
                  </strong>{" "}
                  de{" "}
                  <strong>
                    {activity.maxAttempts}
                  </strong>
                  .
                </p>

                <p className="mt-1 text-[13px] leading-5 text-gray-600">
                  Una vez enviado, la entrega
                  quedará registrada.
                </p>

              </div>

            </div>

            {/* RESUMEN */}

            <div className="mb-5 rounded-lg bg-[#f4f6f8] p-4">

              <p className="text-[12px] font-semibold text-gray-700">
                Contenido de la entrega
              </p>

              <div className="mt-2 space-y-1 text-[12px] text-gray-600">

                {text.trim() && (
                  <p>
                    ✓ Has agregado texto.
                  </p>
                )}

                {selectedFile && (
                  <p className="truncate">
                    ✓ Archivo:{" "}
                    {selectedFile.name}
                  </p>
                )}

              </div>

            </div>

            {/* BOTONES */}

            <div className="flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowConfirmModal(false)
                }
                className="
                  rounded-lg
                  border border-gray-300
                  bg-white
                  px-5 py-2.5
                  text-[13px]
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-100
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmSubmission
                }
                className="
                  rounded-lg
                  bg-[#2196e8]
                  px-5 py-2.5
                  text-[13px]
                  font-semibold
                  text-black
                  transition
                  hover:bg-[#178bd8]
                "
              >
                Sí, enviar
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-4 flex gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f3ff] text-[#3186d8]">

        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
          />

          <path d="M12 8v4l2.5 2" />
        </svg>

      </div>

      <div>

        <p className="text-[10px] text-gray-500">
          {label}
        </p>

        <p className="text-[12px] font-medium text-[#3186d8]">
          {value}
        </p>

      </div>

    </div>
  );
}
