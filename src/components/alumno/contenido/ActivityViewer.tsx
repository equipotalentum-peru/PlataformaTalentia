"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { API_URL } from "@/lib/api";
import FileTypeIcon from "@/components/common/contenido/FileTypeIcon";
import { activities, type ActivityDefinition } from "@/data/activities";
import { markContentViewed } from "@/lib/progress";

import type {
  RubricInfo,
} from "@/components/common/curso/RubricDetails";


type Submission = {
  id: number;
  numero_intento: number;
  comentario: string | null;
  estado: string;
  entregada_en: string | null;
  nota: number | null;
  retroalimentacion: string | null;
  calificado_en?: string | null;
  archivo_id: number | null;
  nombre_archivo: string | null;
  tamano_bytes: number | null;
};


type ActivityApi = {
  actividad_id: number;
  titulo?: string;
  descripcion?: string;
  instrucciones?: string | null;
  fecha_limite?: string | null;
  intentos_permitidos?: number | string;
  puntaje_maximo?: number | string | null;
  tamano_maximo_mb?: number | string | null;
  matricula_id?: number;
  calificada?: boolean;
};


type Props = {
  activityId: number;
  courseId: number;
  title?: string;
  previousHref?: string;
  nextHref?: string;
  exitHref: string;
  activityDefinition?: ActivityDefinition;
  trackLocalProgress?: boolean;
  backLink?: React.ReactNode;
};


const ACCEPTED_FILES =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.rar";

const FALLBACK_MAX_FILE_SIZE_MB =
  20;


function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Por definir";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "es-PE",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",

      timeZone:
        "America/Lima",
    }
  );
}


function dueDateParts(
  value?: string | null,
  fallback?: string
) {
  if (!value) {
    return {
      date:
        fallback ||
        "Por definir",

      time: "",
    };
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      date: value,
      time: "",
    };
  }

  return {
    date:
      date
        .toLocaleDateString(
          "es-PE",
          {
            day:
              "numeric",

            month:
              "long",

            year:
              "numeric",

            timeZone:
              "America/Lima",
          }
        )
        .replace(
          " de 20",
          " del 20"
        ),

    time:
      `${date.toLocaleTimeString(
        "es-PE",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",

          hour12:
            false,

          timeZone:
            "America/Lima",
        }
      )} (UTC-5)`,
  };
}


function formatSize(
  bytes?: number | null
) {
  if (
    bytes == null ||
    !Number.isFinite(
      bytes
    )
  ) {
    return "";
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.max(
      1,
      Math.round(
        bytes / 1024
      )
    )} KB`;
  }

  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(1)} MB`;
}


function Icon({
  type,
  size = 20,
  className = "",
}: {
  type:
    | "calendar"
    | "check"
    | "star"
    | "book"
    | "info"
    | "file"
    | "download"
    | "chat"
    | "trophy"
    | "arrow"
    | "back"
    | "eye"
    | "circle-check";

  size?: number;
  className?: string;
}) {
  const common = {
    width:
      size,

    height:
      size,

    viewBox:
      "0 0 24 24",

    fill:
      "none",

    stroke:
      "currentColor",

    strokeWidth:
      1.8,

    strokeLinecap:
      "round" as const,

    strokeLinejoin:
      "round" as const,

    className,

    "aria-hidden":
      true as const,
  };


  switch (type) {
    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
          />

          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );


    case "check":
      return (
        <svg {...common}>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="4"
          />

          <path d="m7 12 3 3 7-7" />
        </svg>
      );


    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      );


    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />

          <path d="M4 6v15M8 7h8M8 11h8" />
        </svg>
      );


    case "info":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="9"
          />

          <path d="M12 11v5M12 7h.01" />
        </svg>
      );


    case "file":
      return (
        <svg {...common}>
          <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" />

          <path d="M13 3v7h7M12 17V12m-3 3 3-3 3 3" />
        </svg>
      );


    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v11m-4-4 4 4 4-4" />

          <path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
        </svg>
      );


    case "chat":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        </svg>
      );


    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />

          <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8m-7-4h6" />
        </svg>
      );


    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );


    case "back":
      return (
        <svg {...common}>
          <path d="M19 12H5m7 7-7-7 7-7" />
        </svg>
      );


    case "circle-check":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="currentColor"
            stroke="none"
          />

          <path
            d="m7 12 3.2 3.2L17.5 8"
            stroke="#ffffff"
            strokeWidth="2.2"
          />
        </svg>
      );
  }
}


function PageHeader({
  title,
  backLink,
}: {
  title?: string;
  backLink?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-4">
      {backLink}
      <p className="min-w-0 text-[14px] text-talentia-primary">
        Módulo 1:
        Introducción a las
        TIC &gt;{" "}
        {title ||
          "1.4 Práctica"}
      </p>
    </div>
  );
}


function DetailRow({
  icon,
  label,
  children,
}: {
  icon:
    | "calendar"
    | "check"
    | "star"
    | "book";

  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <div className="activity-side-item">
      <span className="activity-icon-circle">
        <Icon
          type={
            icon
          }
          size={
            19
          }
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-talentia-blue">
          {label}
        </p>

        <div className="text-[14px] leading-[1.35] text-talentia-primary">
          {children}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   MODAL DE RÚBRICA PARA EL ALUMNO
   Solo se usa cuando la rúbrica fue creada por criterios.
========================================================= */

function StudentRubricModal({
  rubrica,
  maxGrade,
  onClose,
}: {
  rubrica:
    RubricInfo;

  maxGrade:
    number;

  onClose:
    () => void;
}) {
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
      ref={
        dialogRef
      }
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
        {/* CABECERA */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-6 sm:px-7">
          <h2
            id="student-rubric-title"
            className="text-[24px] font-bold text-talentia-primary"
          >
            Rúbrica de
            evaluación
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


        {/* CONTENIDO */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 sm:px-7">
          {/* MENSAJE SUPERIOR */}
          <div className="flex items-center gap-3 rounded-[8px] bg-talentia-selected px-4 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-talentia-blue text-[13px] font-bold text-talentia-blue">
              i
            </span>

            <p className="text-[14px] leading-[1.4] text-talentia-primary">
              Esta actividad
              será evaluada con
              los siguientes
              criterios. La
              puntuación total
              es de{" "}
              <strong>
                {maxGrade}{" "}
                puntos.
              </strong>
            </p>
          </div>


          {/* TABLA */}
          <div className="mt-5 overflow-hidden rounded-[8px] border border-talentia-border">
            <div className="max-h-[390px] overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-[14px]">
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
                  {rubrica
                    .criterios
                    .length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={
                          4
                        }
                        className="px-6 py-10 text-center text-[13px] text-talentia-muted"
                      >
                        Esta rúbrica
                        todavía no
                        tiene
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

              <p className="mt-1 text-[14px] leading-[1.45] text-talentia-primary">
                Estos criterios
                serán utilizados
                por el docente
                para calificar tu
                entrega.
                Asegúrate de
                cumplir con
                todos los
                aspectos
                indicados.
              </p>
            </div>
          </div>
        </div>


        {/* FOOTER */}
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


export default function ActivityViewer({
  activityId,
  courseId,
  title,
  previousHref,
  nextHref,
  activityDefinition,
  trackLocalProgress = true,
  backLink,
}: Props) {
  // La definición estática queda solo como respaldo visual; los datos de entrega
  // siempre se consultan y guardan a través de la API existente.

  const activity =
    activityDefinition ??
    activities.find(
      (item) =>
        item.id ===
        activityId
    ) ??
    activities[0];


  const [
    activityInfo,
    setActivityInfo,
  ] =
    useState<
      ActivityApi | null
    >(null);

  const [
    submissions,
    setSubmissions,
  ] =
    useState<
      Submission[]
    >([]);

  const [
    comment,
    setComment,
  ] =
    useState("");

  const [
    file,
    setFile,
  ] =
    useState<
      File | null
    >(null);

  const [
    fileInputKey,
    setFileInputKey,
  ] =
    useState(0);

  const [
    maxAttempts,
    setMaxAttempts,
  ] =
    useState(
      activity?.maxAttempts ??
        3
    );

  const [
    maxGrade,
    setMaxGrade,
  ] =
    useState(
      activity?.maxGrade ??
        20
    );

  const [
    maxFileSizeMB,
    setMaxFileSizeMB,
  ] =
    useState(
      FALLBACK_MAX_FILE_SIZE_MB
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    isDragging,
    setIsDragging,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    showSubmitted,
    setShowSubmitted,
  ] =
    useState(false);

  const [
    selectedSubmissionId,
    setSelectedSubmissionId,
  ] =
    useState<
      number | null
    >(null);


  /* =========================================================
     RÚBRICA
  ========================================================= */

  const [
    rubric,
    setRubric,
  ] =
    useState<
      RubricInfo | null
    >(null);

  const [
    showRubricModal,
    setShowRubricModal,
  ] =
    useState(false);

  const [
    downloadingRubric,
    setDownloadingRubric,
  ] =
    useState(false);


  const loadSubmission =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await fetch(
              `${API_URL}/actividades/${courseId}/${activityId}/mi-entrega`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                "No se pudo cargar la actividad."
            );
          }


          const apiActivity =
            data.actividad as ActivityApi;

          setActivityInfo(
            apiActivity
          );

          setSubmissions(
            (
              data.entregas ??
              []
            ) as Submission[]
          );


          /*
           * RÚBRICA REAL
           * QUE YA DEVUELVE EL BACKEND
           */
          setRubric(
            data.rubrica
              ? (
                  data.rubrica as
                    RubricInfo
                )
              : null
          );


          setMaxAttempts(
            Number(
              apiActivity
                .intentos_permitidos ??
                activity
                  ?.maxAttempts ??
                3
            )
          );

          setMaxGrade(
            Number(
              apiActivity
                .puntaje_maximo ??
                activity
                  ?.maxGrade ??
                20
            )
          );

          setMaxFileSizeMB(
            Number(
              apiActivity
                .tamano_maximo_mb ??
                FALLBACK_MAX_FILE_SIZE_MB
            )
          );
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Error cargando la entrega."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        activity,
        activityId,
        courseId,
      ]
    );


  useEffect(() => {
    void loadSubmission();
  }, [
    loadSubmission,
  ]);

const latest =
  submissions[
    submissions.length - 1
  ] ?? null;

const displayedSubmission =
  selectedSubmissionId == null
    ? latest
    : submissions.find(
        (submission) =>
          submission.id ===
          selectedSubmissionId
      ) ?? latest;

const remaining =
  Math.max(
    maxAttempts -
      submissions.length,
    0
  );

const displayTitle =
  activityInfo?.titulo ||
  title ||
  activity?.title ||
  "Actividad";

const displayDescription =
  activityInfo?.descripcion ||
  activityInfo?.instrucciones ||
  activity?.description ||
  "";

const due =
  dueDateParts(
    activityInfo?.fecha_limite,
    activity?.dueDate
  );

const showDeliveryDetail =
  showSubmitted &&
  displayedSubmission !== null;

// false únicamente cuando el docente marcó la actividad como NO calificable
const isGraded =
  activityInfo?.calificada !== false;


  function chooseFile(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      event.target
        .files?.[0] ??
      null;

    setError("");

    if (
      selected &&
      selected.size >
        maxFileSizeMB *
          1024 *
          1024
    ) {
      setError(
        `El archivo no puede superar ${maxFileSizeMB} MB.`
      );

      event.target.value =
        "";

      setFile(
        null
      );

      return;
    }

    setFile(
      selected
    );
  }


  function handleDrop(
    event:
      DragEvent<HTMLLabelElement>
  ) {
    event.preventDefault();

    setIsDragging(
      false
    );

    const dropped =
      event.dataTransfer
        .files?.[0] ??
      null;

    if (!dropped) {
      return;
    }

    if (
      dropped.size >
      maxFileSizeMB *
        1024 *
        1024
    ) {
      setError(
        `El archivo no puede superar ${maxFileSizeMB} MB.`
      );

      return;
    }

    setError("");

    setFile(
      dropped
    );

    setFileInputKey(
      (
        current
      ) =>
        current +
        1
    );
  }


  /* =========================================================
     VER RÚBRICA

     PDF       → descarga directa
     CRITERIOS → abre modal
  ========================================================= */

  async function handleRubricClick() {
    if (!rubric) {
      return;
    }


    /*
     * PDF
     */
    if (
      rubric.ruta_archivo
    ) {
      try {
        setDownloadingRubric(
          true
        );

        setError("");


        const response =
          await fetch(
            `${API_URL}/actividades/${courseId}/${activityId}/rubrica`,
            {
              method:
                "GET",

              credentials:
                "include",
            }
          );


        if (
          !response.ok
        ) {
          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          throw new Error(
            typeof data.message ===
              "string"
              ? data.message
              : "No se pudo descargar la rúbrica."
          );
        }


        const blob =
          await response.blob();


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;

        link.download =
          rubric.nombre_archivo ||
          "rubrica.pdf";


        document.body.appendChild(
          link
        );


        link.click();


        link.remove();


        window.setTimeout(
          () => {
            URL.revokeObjectURL(
              url
            );
          },
          1000
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo descargar la rúbrica."
        );
      } finally {
        setDownloadingRubric(
          false
        );
      }

      return;
    }


    /*
     * CRITERIOS MANUALES
     */
    if (
      rubric.criterios
        .length >
      0
    ) {
      setShowRubricModal(
        true
      );
    }
  }


  async function submit() {
    if (
      remaining <=
      0
    ) {
      setError(
        "Ya alcanzaste el máximo de intentos permitidos."
      );

      return;
    }

    if (
      !file &&
      !comment.trim()
    ) {
      setError(
        "Adjunta un documento o escribe un comentario."
      );

      return;
    }


    setSending(
      true
    );

    setError("");

    setMessage("");


    try {
      const form =
        new FormData();

      if (file) {
        form.append(
          "archivo",
          file
        );
      }

      if (
        comment.trim()
      ) {
        form.append(
          "comentario",
          comment.trim()
        );
      }


      const response =
        await fetch(
          `${API_URL}/actividades/${courseId}/${activityId}/entregar`,
          {
            method:
              "POST",

            credentials:
              "include",

            body:
              form,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            "No se pudo enviar la entrega."
        );
      }


      setMessage(
        "¡Tu entrega se guardó correctamente!"
      );

      setComment("");

      setFile(null);

      setFileInputKey(
        (
          current
        ) =>
          current +
          1
      );

      setSelectedSubmissionId(
        null
      );

      if (
        trackLocalProgress
      ) {
        markContentViewed(
          courseId,
          activityId
        );
      }

      await loadSubmission();

      setShowSubmitted(
        true
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo enviar la entrega."
      );
    } finally {
      setSending(
        false
      );
    }
  }


  const pageHeader = (
    <PageHeader
      title="1.4 Práctica"
      backLink={backLink}
    />
  );


  if (loading) {
    return (
      <div className="activity-page-root">
        {pageHeader}

        <div className="activity-card mt-[18px] flex min-h-[250px] items-center justify-center p-8 text-sm text-talentia-primary">
          Cargando
          actividad...
        </div>
      </div>
    );
  }


  if (
    error &&
    !activityInfo &&
    submissions.length ===
      0
  ) {
    return (
      <div className="activity-page-root">
        {pageHeader}

        <div
          role="alert"
          className="mt-[18px] rounded-lg bg-talentia-danger-bg p-4 text-sm text-talentia-danger"
        >
          {error}
        </div>
      </div>
    );
  }


  return (
    <div className="activity-page-root activity-student-root">
      {pageHeader}


      <div className="activity-content-grid activity-visual-content mt-[18px] items-start">
        <section
          className={`activity-card min-w-0 pb-6 ${showDeliveryDetail ? "min-h-[280px] px-4 sm:px-6 lg:min-h-[480px]" : "min-h-[564px]"} ${
            showDeliveryDetail
              ? "pt-[33px]"
              : "pt-6"
          }`}
        >
          {showDeliveryDetail &&
          displayedSubmission ? (
            <>
              <div className="activity-success-callout flex min-h-[51px] items-center gap-3 px-4 py-2">
                <Icon
                  type="circle-check"
                  size={
                    26
                  }
                />

                <div>
                  <h1 className="text-[17px] font-bold leading-tight text-talentia-success">
                    ¡Entrega
                    realizada!
                  </h1>

                  <p className="mt-1 text-[13px] leading-tight text-talentia-success">
                    Tu actividad ha
                    sido enviada
                    correctamente.
                  </p>
                </div>
              </div>


              <div className="mt-6 bg-talentia-surface">
                <h2 className="mb-3 text-[15px] font-semibold text-talentia-primary">
                  Archivo enviado
                </h2>


                {displayedSubmission.comentario && (
                  <p className="min-h-[54px] whitespace-pre-wrap rounded-sm border border-talentia-border bg-talentia-surface px-[11px] py-[10px] text-[13px] leading-[1.35] text-talentia-primary">
                    {
                      displayedSubmission.comentario
                    }
                  </p>
                )}


                {displayedSubmission.nombre_archivo &&
                displayedSubmission.archivo_id ? (
                  <div className="activity-file-row mt-3 flex min-w-0 items-center gap-3 rounded-md bg-talentia-surface px-3 py-2">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-talentia-surface">
                      <FileTypeIcon
                        filename={displayedSubmission.nombre_archivo}
                        className="h-7 w-7"
                      />
                    </span>

                    <div className="activity-file-name min-w-0 flex-1">
                      <p className="truncate text-[13px] text-talentia-primary">
                        {
                          displayedSubmission.nombre_archivo
                        }
                      </p>

                      <p className="mt-1 text-[12px] text-talentia-muted">
                        {formatSize(
                          displayedSubmission.tamano_bytes
                        )}
                      </p>
                    </div>

                    <a
                      href={`${API_URL}/actividades/archivo/${displayedSubmission.archivo_id}`}
                      aria-label={`Descargar ${displayedSubmission.nombre_archivo}`}
                      title="Descargar archivo"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-talentia-blue transition hover:bg-talentia-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-talentia-blue"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
                    </a>
                  </div>
                ) : !displayedSubmission.comentario ? (
                  <p className="rounded bg-talentia-surface p-3 text-[13px] text-talentia-muted">
                    No se adjuntó
                    un documento
                    ni un
                    comentario.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[24px] font-bold leading-[1.35] text-talentia-primary">
                {displayTitle.startsWith(
                  "Actividad:"
                )
                  ? displayTitle
                  : `Actividad: ${displayTitle}`}
              </h1>


              {displayDescription && (
                <p className="mt-[10px] text-[14px] leading-[1.5] text-talentia-primary">
                  {
                    displayDescription
                  }
                </p>
              )}


              <div className="my-[7px] border-b border-talentia-border" />


              <h2 className="activity-deliveries-title mb-[5px] text-[16px] font-bold leading-tight text-talentia-primary">
                Tu entrega
              </h2>


              {message && (
                <p
                  role="status"
                  className="mb-2 rounded-md bg-talentia-success-bg p-2 text-[14px] text-talentia-success"
                >
                  {
                    message
                  }
                </p>
              )}


              {error && (
                <p
                  role="alert"
                  className="mb-2 rounded-md bg-talentia-danger-bg p-2 text-[14px] text-talentia-danger"
                >
                  {
                    error
                  }
                </p>
              )}


              {remaining >
              0 ? (
                <>
                  <label
                    htmlFor="comentario-entrega"
                    className="sr-only"
                  >
                    Comentario para
                    el docente
                  </label>

                  <textarea
                    id="comentario-entrega"
                    value={
                      comment
                    }
                    onChange={(
                      event
                    ) =>
                      setComment(
                        event
                          .target
                          .value
                      )
                    }
                    rows={
                      3
                    }
                    maxLength={
                      5000
                    }
                    placeholder="Haga clic si desea agregar texto"
                    className="activity-input h-[70px] resize-y rounded-none border-talentia-border px-[10px] py-[9px] text-[14px] placeholder:text-talentia-placeholder"
                  />


                  <label
                    htmlFor="archivo-entrega"
                    onDragOver={(
                      event
                    ) => {
                      event.preventDefault();

                      setIsDragging(
                        true
                      );
                    }}
                    onDragLeave={() =>
                      setIsDragging(
                        false
                      )
                    }
                    onDrop={
                      handleDrop
                    }
                    className={`mt-[10px] flex min-h-[139px] cursor-pointer flex-col items-center justify-center rounded-[8px] px-4 py-4 text-center transition ${
                      isDragging
                        ? "border-2 border-talentia-blue bg-talentia-selected"
                        : "border-2 border-transparent bg-talentia-surface"
                    }`}
                  >
                    <span className="text-talentia-primary">
                      {file ? (
                        <FileTypeIcon
                          filename={file.name}
                          className="h-9 w-9"
                        />
                      ) : (
                        <Icon type="file" size={25} />
                      )}
                    </span>

                    <span className="mt-[4px] text-[14px] text-talentia-primary">
                      {file
                        ? file.name
                        : "Arrastra y suelta tu archivo aquí"}
                    </span>

                    <span className="mt-[2px] text-[14px] text-talentia-muted">
                      Tamaño máximo{" "}
                      {
                        maxFileSizeMB
                      }
                      MB
                    </span>

                    <span className="my-[5px] text-[14px] text-talentia-primary">
                      o
                    </span>

                    <span className="inline-flex min-h-[28px] items-center rounded-[7px] border border-talentia-blue px-2 text-[14px] text-talentia-blue">
                      Seleccionar
                      archivo
                    </span>

                    {file && (
                      <span className="mt-1 text-[14px] text-talentia-success">
                        Seleccionado ·{" "}
                        {formatSize(
                          file.size
                        )}
                      </span>
                    )}
                  </label>


                  <input
                    key={
                      fileInputKey
                    }
                    id="archivo-entrega"
                    type="file"
                    accept={
                      ACCEPTED_FILES
                    }
                    onChange={
                      chooseFile
                    }
                    className="sr-only"
                  />


                  <div className="activity-info-callout mt-[13px] flex min-h-[44px] items-center gap-3 px-4 py-2">
                    <Icon
                      type="info"
                      size={
                        20
                      }
                    />

                    <p className="text-[12px] leading-[1.3] text-talentia-blue">
                      Formatos
                      permitidos:
                      PDF, DOC,
                      DOCX, PPT,
                      PPTX, XLS,
                      XLSX, PNG,
                      JPG, JPEG,
                      RAR, ZIP...
                    </p>
                  </div>
                </>
              ) : (
                <p className="rounded-md bg-talentia-warning-bg p-3 text-[14px] text-talentia-warning">
                  Ya alcanzaste el
                  máximo de
                  intentos
                  permitidos.
                </p>
              )}
            </>
          )}
        </section>


        <aside
          className={`min-w-0 ${
            showDeliveryDetail
              ? "space-y-4"
              : "space-y-[10px]"
          }`}
        >
          <section className="min-w-0 px-4">
            <h2 className="activity-card-title">
              {showDeliveryDetail
                ? "Detalles de la entrega"
                : "Detalles de la actividad"}
            </h2>


            <div className="mt-3 space-y-3 rounded-lg border border-talentia-border bg-talentia-surface p-4 text-sm">
              <DetailRow
                icon="calendar"
                label="Fecha de entrega"
              >
                <span className="block">
                  {
                    due.date
                  }
                </span>

                <span className="block">
                  {due.time ||
                    "23:59 (UTC-5)"}
                </span>
              </DetailRow>


              <DetailRow
                icon="check"
                label="Intentos"
              >
                {showDeliveryDetail &&
                displayedSubmission
                  ? `${displayedSubmission.numero_intento} de ${maxAttempts} intentos`
                  : `${remaining} intentos restantes`}
              </DetailRow>


              {isGraded && (
              <DetailRow
                icon="star"
                label="Puntuación máxima"
              >
                {maxGrade}{" "}
                puntos
              </DetailRow>
              )}


              {isGraded && !showDeliveryDetail && (
                <DetailRow
                  icon="book"
                  label="Rúbrica de evaluación"
                >
                  {rubric ? (
                    <button
                      type="button"
                      onClick={
                        handleRubricClick
                      }
                      disabled={
                        downloadingRubric
                      }
                      className="
                        activity-link
                        inline-flex
                        items-center
                        gap-1
                        border-0
                        bg-transparent
                        p-0
                        text-left
                        disabled:cursor-wait
                        disabled:opacity-60
                      "
                    >
                      {downloadingRubric
                        ? "Descargando..."
                        : "Ver rúbrica ↗"}
                    </button>
                  ) : (
                    <span className="text-talentia-muted">
                      Sin rúbrica
                    </span>
                  )}
                </DetailRow>
              )}
            </div>


            {!showDeliveryDetail && (
              <div className="activity-info-callout mt-[12px] flex gap-2 px-2 py-[9px]">
                <Icon
                  type="info"
                  size={
                    20
                  }
                />

                <div>
                  <p className="text-[14px] font-bold text-talentia-blue">
                    Importante
                  </p>

                  <p className="mt-[2px] text-[12px] leading-[1.5]">
                    Las entregas
                    realizadas
                    después de la
                    fecha límite se
                    marcarán como
                    atrasadas.
                  </p>
                </div>
              </div>
            )}
          </section>

          {showDeliveryDetail &&
displayedSubmission && (
  <section className="activity-card p-4">
    <h2 className="activity-card-title">
      {isGraded ? "Calificación · Intento" : "Intento"}{" "}
      {
        displayedSubmission.numero_intento
      }
    </h2>

    {!isGraded ? (
      displayedSubmission.retroalimentacion ||
      displayedSubmission.calificado_en ? (
        <>
          <div className="mt-4 flex items-center gap-2 text-[14px] font-bold text-talentia-blue">
            <Icon
              type="chat"
              size={16}
            />

            Comentarios del docente
          </div>

          <p className="mt-2 min-h-[118px] whitespace-pre-wrap rounded-lg border border-talentia-blue bg-talentia-surface p-2 text-[14px] leading-[1.3] text-talentia-primary">
            {displayedSubmission.retroalimentacion ||
              "El docente todavía no ha añadido comentarios."}
          </p>
        </>
      ) : (
        <p className="mt-3 rounded-md bg-talentia-surface p-3 text-[14px] text-talentia-primary">
          Tu docente aún no ha
          visualizado este intento.
        </p>
      )
    ) : displayedSubmission.nota !==
      null &&
    displayedSubmission.nota !==
      undefined ? (
      <>
        <div className="mt-2 flex min-h-[29px] items-center justify-center gap-2 rounded-md bg-talentia-success-bg px-2 text-[14px] font-bold text-talentia-success">
          <Icon
            type="trophy"
            size={17}
          />

          {
            displayedSubmission.nota
          }{" "}
          / {maxGrade} puntos
        </div>

        <p className="mt-2 text-[12px] leading-[1.5] text-talentia-muted">
          {displayedSubmission.calificado_en
            ? `Calificado el ${formatDate(
                displayedSubmission.calificado_en
              )}`
            : "La calificación ya está disponible."}
        </p>

        <div className="mt-4 flex items-center gap-2 text-[15px] font-semibold text-talentia-primary">
          <Icon
            type="chat"
            size={16}
          />

          Comentarios del docente
        </div>

        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-talentia-border bg-talentia-surface p-3 text-[13px] leading-[1.5] text-talentia-primary">
          {displayedSubmission.retroalimentacion ||
            "El docente todavía no ha añadido comentarios."}
        </p>
      </>
    ) : (
      <p className="mt-3 rounded-md bg-talentia-warning-bg p-3 text-[13px] text-talentia-warning">
        Este intento está
        pendiente de calificación.
      </p>
    )}
  </section>
)}

          <section className={`activity-card p-4 ${showDeliveryDetail ? "" : "min-h-[272px]"}`}>
            <h2 className="activity-card-title">
              {showDeliveryDetail ? "Historial de intentos" : "Entregas realizadas"}
            </h2>
            {submissions.length === 0 ? (
              <p className="mt-3 text-[14px] text-talentia-muted">Todavía no has realizado entregas.</p>
            ) : (
              <div className="mt-[10px] space-y-[7px]">
                {submissions.map((submission) => {
                  const isSelected = displayedSubmission?.id === submission.id;
                  const isLatest = latest?.id === submission.id;
                  return (
                    <div key={submission.id} className={`min-w-0 rounded-md border p-3 text-[13px] leading-[1.5] ${isSelected ? "border-talentia-blue bg-talentia-selected" : "border-talentia-border"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-talentia-primary">Intento {submission.numero_intento}</span>
                      {isLatest && <span className="rounded bg-talentia-selected px-2 py-1 text-[12px] text-talentia-primary">Último</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubmissionId(submission.id);
                          setShowSubmitted(true);
                          setError("");
                        }}
                        aria-current={isSelected ? "true" : undefined}
                        className={`activity-link inline-flex min-h-9 items-center gap-2 text-left ${isSelected ? "font-semibold" : ""}`}
                      >
                        <Icon type="eye" size={16} className="shrink-0" />
                        Ver entrega
                      </button>
                      {isGraded && (
                        <span className={`rounded px-2 py-1 text-[12px] font-medium ${submission.nota != null ? "bg-talentia-success-bg text-talentia-success" : "bg-talentia-warning-bg text-talentia-warning"}`}>
                          {submission.nota != null ? `${submission.nota}/${maxGrade}` : "Pendiente"}
                        </span>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {showDeliveryDetail && remaining > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubmissionId(null);
                  setShowSubmitted(false);
                  setError("");
                  setMessage("");
                }}
                className="activity-primary mt-[14px] flex min-h-9 w-full items-center justify-center rounded-[6px] px-3 py-2 text-[13px] font-medium"
              >
                Realizar otro intento ({remaining} disponible{remaining === 1 ? "" : "s"})
              </button>
            )}
          </section>
        </aside>
      </div>


      {!showDeliveryDetail && (
        <div className="mt-[32px] flex flex-wrap items-center justify-between gap-3">
          <span />

          <button
            type="button"
            onClick={
              submit
            }
            disabled={
              sending ||
              remaining <=
                0
            }
            className="activity-primary inline-flex h-[35px] items-center justify-center gap-4 rounded-[7px] px-[17px] text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? "Enviando..."
              : "Enviar entrega"}

            <Icon
              type="arrow"
              size={
                20
              }
            />
          </button>
        </div>
      )}


      {/* =====================================================
          MODAL DE RÚBRICA MANUAL
          PDF NO ABRE ESTE MODAL.
      ===================================================== */}

      {showRubricModal &&
        rubric &&
        !rubric.ruta_archivo && (
          <StudentRubricModal
            rubrica={
              rubric
            }
            maxGrade={
              maxGrade
            }
            onClose={() =>
              setShowRubricModal(
                false
              )
            }
          />
        )}
    </div>
  );
}
