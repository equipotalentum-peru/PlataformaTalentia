"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { API_URL } from "@/lib/api";


type Student = {
  alumno_id: number;
  matricula_id: number;
  alumno: string;
  entrega_id: number | null;
  numero_intento: number | null;
  estado: string | null;
  entregada_en: string | null;
  nota: number | null;
  retroalimentacion?: string | null;
  archivo_id: number | null;
  nombre_archivo: string | null;
  tamano_bytes?: number | null;
  intentos_realizados?: number | string | null;
};

type StudentAttempt = {
  entrega_id: number;
  numero_intento: number;
  estado: string | null;
  entregada_en: string | null;
  nota: number | null;
  retroalimentacion?: string | null;
  archivo_id: number | null;
  nombre_archivo: string | null;
  tamano_bytes?: number | null;
};


type ActivityInfo = {
  actividad_id?: number;
  titulo?: string;
  descripcion?: string;
  puntaje_maximo?: number | string | null;
  intentos_permitidos?: number | string | null;
  fecha_limite?: string | null;
};


/* =========================================================
   RÚBRICA
========================================================= */

type RubricCriterion = {
  id: number;
  nombre: string;
  descripcion: string | null;
  puntaje_maximo: number | string;
  orden?: number;
};


type RubricInfo = {
  id?: number;
  tipo?: "pdf" | "criterios" | string;
  ruta_archivo?: string | null;
  nombre_archivo?: string | null;
  criterios: RubricCriterion[];
};


type Props = {
  courseId: number;
  activityId: number;
  previousSectionHref?: string;
  nextSectionHref?: string;
};


const AVATAR_COLORS = [
  "bg-talentia-selected text-talentia-blue",
  "bg-talentia-purple-soft text-talentia-purple",
  "bg-talentia-warning-bg text-talentia-warning",
  "bg-talentia-success-bg text-talentia-success",
  "bg-talentia-danger-bg text-talentia-danger",
  "bg-talentia-selected text-talentia-blue",
  "bg-talentia-purple-soft text-talentia-purple",
  "bg-talentia-warning-bg text-talentia-warning",
  "bg-talentia-success-bg text-talentia-success",
];


function initials(
  name: string
) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toLocaleUpperCase(
          "es-PE"
        ) ?? ""
    )
    .join("");
}


function formattedDate(
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

  return date
    .toLocaleDateString(
      "es-PE",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone:
          "America/Lima",
      }
    )
    .replace(
      " de 20",
      " del 20"
    );
}


/* =========================================================
   NUEVO:
   hora real de fecha_limite
========================================================= */

function formattedTime(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return `${date.toLocaleTimeString(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone:
        "America/Lima",
    }
  )} (UTC-5)`;
}


function formattedDateTime(
  value?: string | null
) {
  if (!value) {
    return "—";
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
        "short",

      timeStyle:
        "short",

      timeZone:
        "America/Lima",
    }
  );
}


function Icon({
  type,
  size = 18,
}: {
  type:
    | "calendar"
    | "check"
    | "star"
    | "book"
    | "info"
    | "chat"
    | "arrow";

  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox:
      "0 0 24 24",
    fill: "none",
    stroke:
      "currentColor",
    strokeWidth: 1.8,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
    "aria-hidden":
      true as const,
  };


  switch (type) {
    case "calendar":
      return (
        <svg {...props}>
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
        <svg {...props}>
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
        <svg {...props}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      );


    case "book":
      return (
        <svg {...props}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />

          <path d="M4 6v15M8 7h8M8 11h8" />
        </svg>
      );


    case "info":
      return (
        <svg {...props}>
          <circle
            cx="12"
            cy="12"
            r="9"
          />

          <path d="M12 11v5M12 7h.01" />
        </svg>
      );


    case "chat":
      return (
        <svg {...props}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        </svg>
      );


    case "arrow":
      return (
        <svg {...props}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
  }
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

  label: string;

  children:
    React.ReactNode;
}) {
  return (
    <div className="activity-side-item">
      <span className="activity-icon-circle">
        <Icon
          type={icon}
          size={19}
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
   NUEVO:
   MODAL DE RÚBRICA PARA DOCENTE

   Se abre únicamente para una rúbrica creada con criterios.
   Si la rúbrica es PDF, NO se usa este modal.
========================================================= */

function TeacherRubricModal({
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
      ref={dialogRef}
      aria-labelledby="teacher-rubric-title"
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

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-4">
          {/* INFORMACIÓN */}

          <div className="rounded-[8px] border border-talentia-border bg-talentia-selected px-5 py-4">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-talentia-blue text-[13px] font-bold text-talentia-blue">
                i
              </span>

              <div>
                <p className="text-[14px] font-semibold text-talentia-primary">
                  Estos son los
                  criterios que se
                  utilizan para
                  evaluar esta
                  actividad.
                </p>

                <p className="mt-1 text-[14px] leading-[1.4] text-talentia-primary">
                  Cada criterio
                  tiene un puntaje
                  específico y la
                  suma total
                  equivale a la
                  puntuación máxima
                  de la actividad.
                </p>
              </div>
            </div>
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
                  {rubrica
                    .criterios
                    .length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={4}
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
                            criterio.id ??
                            index
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

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[48px] justify-center rounded-[6px] bg-talentia-surface px-3 py-2 font-bold text-talentia-primary">
                              {Number(
                                criterio.puntaje_maximo
                              )}
                            </span>
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

          <div className="mt-4 flex items-center gap-3 rounded-[8px] border border-talentia-border bg-talentia-selected px-5 py-4">
            <span className="text-[20px] text-talentia-blue">
              ★
            </span>

            <p className="text-[16px] font-bold text-talentia-primary">
              Puntuación total:{" "}
              <span>
                {total ||
                  maxGrade}{" "}
                puntos
              </span>
            </p>
          </div>
        </div>


        {/* FOOTER */}

        <div className="flex shrink-0 justify-end border-t border-talentia-border bg-talentia-surface px-7 py-4">
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


export default function TeacherActivityDetail({
  courseId,
  activityId,
}: Props) {
  const [
    students,
    setStudents,
  ] =
    useState<
      Student[]
    >([]);

    const [
  selectedAttempts,
  setSelectedAttempts,
] =
  useState<
    StudentAttempt[]
  >([]);

const [
  loadingAttempts,
  setLoadingAttempts,
] =
  useState(false);

const [
  attemptsError,
  setAttemptsError,
] =
  useState("");


  const [
    activity,
    setActivity,
  ] =
    useState<
      ActivityInfo
    >({});


  const [
    selectedStudentId,
    setSelectedStudentId,
  ] =
    useState<
      number | null
    >(null);


  const [
    teacherComment,
    setTeacherComment,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    savingComment,
    setSavingComment,
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


  /* =========================================================
     NUEVO:
     ESTADO DE RÚBRICA
  ========================================================= */

  const [
    rubrica,
    setRubrica,
  ] =
    useState<
      RubricInfo | null
    >(null);


  const [
    showRubric,
    setShowRubric,
  ] =
    useState(false);


  const [
    downloadingRubric,
    setDownloadingRubric,
  ] =
    useState(false);


  async function load() {
    setLoading(true);

    setError("");


    try {
      const response =
        await fetch(
          `${API_URL}/actividades/docente/${courseId}/${activityId}`,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudieron cargar las entregas."
        );
      }


      const items =
        (
          data.alumnos ??
          []
        ) as Student[];


      setStudents(
        items
      );


      setActivity(
        data.actividad ??
          {}
      );


      /* =========================
         NUEVO:
         GUARDAR RÚBRICA REAL
      ========================= */

      setRubrica(
        data.rubrica
          ? (
              data.rubrica as
                RubricInfo
            )
          : null
      );


      setSelectedStudentId(
        (
          previous
        ) => {
          if (
            previous != null &&
            items.some(
              (
                student
              ) =>
                student.alumno_id ===
                previous
            )
          ) {
            return previous;
          }


          return (
            items.find(
              (
                student
              ) =>
                student.entrega_id !=
                null
            )?.alumno_id ??
            items[0]
              ?.alumno_id ??
            null
          );
        }
      );


      const firstSelected =
        items.find(
          (
            student
          ) =>
            student.alumno_id ===
            selectedStudentId
        ) ??
        items.find(
          (
            student
          ) =>
            student.entrega_id !=
            null
        ) ??
        items[0];


      setTeacherComment(
        firstSelected
          ?.retroalimentacion ??
          ""
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error al cargar las entregas."
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  useEffect(() => {
  void load();
}, [
  courseId,
  activityId,
]);



  // Al seleccionar a un alumno, consulta su historial completo (no solo
  // el último intento que aparece resumido en la tabla principal).
  useEffect(() => {
    if (selectedStudentId == null) {
      setSelectedAttempts([]);
      setAttemptsError("");
      setLoadingAttempts(false);
      return;
    }

    const controller = new AbortController();
    async function loadStudentAttempts() {
      setLoadingAttempts(true);
      setAttemptsError("");
      try {
        const response = await fetch(
          `${API_URL}/actividades/docente/${courseId}/${activityId}/alumno/${selectedStudentId}`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "No se pudo cargar el historial de intentos.");
        }

        const attempts = (Array.isArray(data.entregas) ? data.entregas : data.entrega ? [data.entrega] : [])
          .filter((item: StudentAttempt) => item.entrega_id != null)
          .sort((a: StudentAttempt, b: StudentAttempt) => a.numero_intento - b.numero_intento);
        setSelectedAttempts(attempts);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setAttemptsError(e instanceof Error ? e.message : "No se pudo cargar el historial de intentos.");
        setSelectedAttempts([]);
      } finally {
        if (!controller.signal.aborted) setLoadingAttempts(false);
      }
    }

    void loadStudentAttempts();
    return () => controller.abort();
  }, [courseId, activityId, selectedStudentId]);

  const submitted = students.filter((student) => Boolean(student.entrega_id)).length;
  const maxGrade = Number(activity.puntaje_maximo ?? 20);
  const maxAttempts = Number(activity.intentos_permitidos ?? 3);
 const selectedStudent =
  students.find(
    (student) =>
      student.alumno_id ===
      selectedStudentId
  ) ??
  students.find(
    (student) =>
      student.entrega_id != null
  ) ??
  students[0] ??
  null;


function selectStudent(
  student: Student
) {
  setSelectedStudentId(
    student.alumno_id
  );

  setTeacherComment(
    student.retroalimentacion ??
      ""
  );

  setError("");

  setMessage("");
}


  /* =========================================================
     NUEVO:
     VER RÚBRICA

     criterios → modal
     PDF       → descarga
  ========================================================= */

  async function handleRubricClick() {
    if (!rubrica) {
      return;
    }


    /*
     * PDF
     */
    if (
      rubrica.ruta_archivo
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


        if (!response.ok) {
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
          rubrica.nombre_archivo ||
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
      rubrica.criterios.length >
      0
    ) {
      setShowRubric(
        true
      );
    }
  }


  async function addComment() {
    if (
      !selectedStudent
        ?.entrega_id ||
      selectedStudent
        .nota == null
    ) {
      setError(
        "Para guardar un comentario desde esta vista, primero debe existir una calificación."
      );

      return;
    }


    setSavingComment(
      true
    );

    setError("");

    setMessage("");


    try {
      const response =
        await fetch(
          `${API_URL}/actividades/docente/${courseId}/${activityId}/entregas/${selectedStudent.entrega_id}/calificacion`,
          {
            method:
              "PUT",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nota:
                  Number(
                    selectedStudent.nota
                  ),

                retroalimentacion:
                  teacherComment,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudo guardar el comentario."
        );
      }


      setMessage(
        "Comentario guardado."
      );


      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar el comentario."
      );
    } finally {
      setSavingComment(
        false
      );
    }
  }


  if (loading) {
    return (
      <div className="activity-page-root">
        <div className="activity-card flex min-h-[280px] items-center justify-center p-8 text-sm text-talentia-primary">
          Cargando
          entregas...
        </div>
      </div>
    );
  }


  const due =
    formattedDate(
      activity.fecha_limite
    );


  /* NUEVO */
  const dueTime =
    formattedTime(
      activity.fecha_limite
    );


  return (
    <div className="activity-page-root activity-teacher-list-root">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 [font-family:Poppins,Arial,Helvetica,sans-serif]">
        <Link
          href={`/docente/cursos/${courseId}`}
          className="app-back-link"
        >
          <span aria-hidden="true">{"<"}</span>


          Volver
        </Link>


        <p className="min-w-0 text-[14px] text-talentia-primary">
          Módulo 1:
          Introducción a las
          TIC &gt; 1.4
          Práctica
        </p>
      </div>


      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div className="activity-visual-content mt-[18px] items-start">
        {/* ===================================================
            LADO IZQUIERDO
        =================================================== */}

        <section className="min-w-0 pt-[26px]">
          <div>
            <h1 className="text-[24px] font-bold leading-[1.35] text-talentia-primary">
              Actividad:{" "}
              {activity.titulo ||
                "Actividad"}
            </h1>


            {activity.descripcion && (
              <p className="mt-[10px] text-[14px] leading-[1.5] text-talentia-primary">
                {
                  activity.descripcion
                }
              </p>
            )}


            <div className="my-[8px] border-b border-talentia-border" />


            <h2 className="activity-deliveries-title mb-[23px] text-[16px] font-bold text-talentia-primary">
              Entregas
            </h2>
          </div>


          {error && (
            <p
              role="alert"
              className="mx-[2px] mb-2 rounded-md bg-talentia-danger-bg p-2 text-[13px] text-talentia-danger"
            >
              {error}
            </p>
          )}


          {message && (
            <p
              role="status"
              className="mx-[2px] mb-2 rounded-md bg-talentia-success-bg p-2 text-[13px] text-talentia-success"
            >
              {message}
            </p>
          )}


          {/* TABLA */}

          <div className="overflow-x-auto rounded-[7px] border border-talentia-border">
            <table className="w-full min-w-[410px] table-fixed border-collapse text-left text-[14px]">
              <colgroup>
                <col className="w-[39%]" />
                <col className="w-[37%]" />
                <col className="w-[24%]" />
              </colgroup>


              <thead>
                <tr className="h-[44px] bg-talentia-table-header text-talentia-primary">
                  <th className="px-[12px] font-bold">
                    Alumno
                  </th>

                  <th className="px-[8px] font-bold">
                    Actividad
                  </th>

                  <th className="px-[8px] font-bold">
                    Nota
                  </th>
                </tr>
              </thead>


              <tbody>
                {students.map(
                  (
                    student,
                    index
                  ) => {
                    const isSubmitted =
                      Boolean(
                        student.entrega_id
                      );


                    const isSelected =
                      selectedStudent
                        ?.alumno_id ===
                      student.alumno_id;


                    return (
                      <tr
                        key={
                          student.matricula_id
                        }
                        tabIndex={
                          0
                        }
                        aria-selected={
                          isSelected
                        }
                        onClick={() =>
                          selectStudent(
                            student
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            event.preventDefault();

                            selectStudent(
                              student
                            );
                          }
                        }}
                        className={`activity-table-row h-[48px] cursor-pointer border-t border-talentia-border ${
                          isSelected
                            ? "is-selected"
                            : ""
                        }`}
                      >
                        {/* ALUMNO */}

                        <td className="px-[12px] py-[4px]">
                          <div className="flex min-w-0 items-center gap-[8px]">
                            <span
                              className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                                AVATAR_COLORS[
                                  index %
                                    AVATAR_COLORS.length
                                ]
                              }`}
                            >
                              {initials(
                                student.alumno
                              )}
                            </span>

                            <span className="truncate font-semibold text-talentia-primary">
                              {
                                student.alumno
                              }
                            </span>
                          </div>
                        </td>


                        {/* ACTIVIDAD */}

                        <td className="px-[8px] py-[4px]">
                          <span
                            className={`inline-flex rounded-[5px] px-[8px] py-[4px] text-[12px] font-semibold ${
                              isSubmitted
                                ? "bg-talentia-success-bg text-talentia-success"
                                : "bg-talentia-warning-bg text-talentia-warning"
                            }`}
                          >
                            {isSubmitted
                              ? "Entregada"
                              : "Pendiente"}
                          </span>
                        </td>


                        {/* NOTA */}

                        <td className="px-[8px] py-[4px]">
                          <div className="flex items-center gap-[2px]">
                            <span className="flex min-w-[36px] items-center justify-center rounded-l-[4px] bg-talentia-surface px-[5px] py-[4px] text-[14px] text-talentia-primary">
                              {student.nota ==
                              null
                                ? "-"
                                : student.nota}
                            </span>

                            <span className="flex min-w-[36px] items-center justify-center rounded-r-[4px] bg-talentia-surface px-[5px] py-[4px] text-[14px] text-talentia-primary">
                              Pts
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}


                {students.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="bg-talentia-surface p-5 text-center text-[13px] text-talentia-muted"
                    >
                      No hay
                      estudiantes
                      matriculados
                      para esta
                      actividad.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>


        {/* ===================================================
            LADO DERECHO
        =================================================== */}

        <aside className="min-w-0 space-y-4">
          {/* DETALLES ACTIVIDAD */}

          <section className="min-w-0 px-4">
            <h2 className="activity-card-title">
              Detalles de la
              actividad
            </h2>


            <div className="mt-3 space-y-3 rounded-lg border border-talentia-border bg-talentia-surface p-4 text-sm">
              {/* FECHA */}

              <DetailRow
                icon="calendar"
                label="Fecha de entrega"
              >
                <span className="block">
                  {due}
                </span>

                {dueTime && (
                  <span className="block">
                    {dueTime}
                  </span>
                )}
              </DetailRow>


              {/* INTENTOS */}

              <DetailRow
                icon="check"
                label="Intentos"
              >
                {maxAttempts}{" "}
                intentos
                permitidos
              </DetailRow>


              {/* PUNTUACIÓN */}

              <DetailRow
                icon="star"
                label="Puntuación máxima"
              >
                {maxGrade}{" "}
                puntos
              </DetailRow>


              {/* =================================================
                  RÚBRICA FUNCIONAL
              ================================================= */}

              <DetailRow
                icon="book"
                label="Rúbrica de evaluación"
              >
                {rubrica ? (
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
            </div>


            <div className="activity-info-callout mt-[12px] flex gap-2 px-2 py-[9px]">
              <Icon
                type="info"
                size={20}
              />

              <div>
                <p className="text-[13px] font-semibold text-talentia-primary">
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
          </section>


          {/* ===================================================
              TAREA SELECCIONADA
          =================================================== */}

          <section className="activity-card p-4">
            <h2 className="activity-card-title">
              Tarea
              Seleccionada:
            </h2>


            {selectedStudent ? (
              <>
                <div className="mt-[9px] space-y-[6px] text-[13px] leading-[1.35] text-talentia-primary">
                  <p><span className="font-medium">Alumno:</span> {selectedStudent.alumno}</p>
                  <p><span className="font-medium">Última entrega:</span> {formattedDateTime(selectedStudent.entregada_en)}</p>
                  <p><span className="font-medium">Intentos usados:</span> {selectedAttempts.length || Number(selectedStudent.intentos_realizados ?? selectedStudent.numero_intento ?? 0)} de {maxAttempts}</p>
                </div>

                <div className="mt-[13px]">
                  <div className="mb-[7px] flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-bold text-talentia-primary">Historial de intentos</h3>
                    <span className="text-[12px] text-talentia-muted">Del 1 al último</span>
                  </div>

                  {loadingAttempts ? (
                    <p className="rounded-md border border-talentia-border bg-talentia-surface p-2 text-[13px] text-talentia-blue">Cargando intentos...</p>
                  ) : attemptsError ? (
                    <p role="alert" className="rounded-md border border-talentia-danger/20 bg-talentia-danger-bg p-2 text-[13px] text-talentia-danger">{attemptsError}</p>
                  ) : selectedAttempts.length > 0 ? (
                    <div className="space-y-[7px]">
                      {selectedAttempts.map((attempt) => (
                        <div key={attempt.entrega_id} className="rounded-md border border-talentia-border bg-talentia-surface p-[9px]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-talentia-primary">Intento {attempt.numero_intento}</span>
                            <span className={`rounded-[5px] px-[7px] py-[3px] text-[12px] font-semibold ${attempt.nota == null ? "bg-talentia-warning-bg text-talentia-warning" : "bg-talentia-success-bg text-talentia-success"}`}>
                              {attempt.nota == null ? "Pendiente de nota" : "Calificado"}
                            </span>
                          </div>
                          <p className="mt-[5px] text-[12px] text-talentia-muted">Entrega: {formattedDateTime(attempt.entregada_en)}</p>
                          <div className="mt-[5px] flex items-center justify-between gap-2">
                            <span className="text-[13px] text-talentia-primary">Nota: <strong>{attempt.nota == null ? "—" : `${attempt.nota}/${maxGrade}`}</strong></span>
                            <Link
                              href={`/docente/cursos/${courseId}/actividades/${activityId}/alumno/${selectedStudent.alumno_id}?entregaId=${attempt.entrega_id}`}
                              className="activity-primary inline-flex h-[25px] shrink-0 items-center justify-center rounded-[5px] px-[9px] text-[12px] font-medium"
                            >
                              {attempt.nota == null ? "Calificar" : "Ver / editar"}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-md border border-talentia-border bg-talentia-surface p-2 text-[13px] text-talentia-blue">Este estudiante todavía no ha enviado ningún intento.</p>
                  )}
                </div>

                <div className="mt-[13px] flex items-center gap-2 text-[15px] font-semibold text-talentia-primary"><Icon type="chat" size={16}/> Comentarios del docente (opcional)</div>
                <label className="sr-only" htmlFor="comentario-docente">Comentario del docente</label>
                <textarea id="comentario-docente" rows={5} maxLength={5000} value={teacherComment} onChange={(event) => setTeacherComment(event.target.value)} placeholder="Insertar comentario" className="activity-input mt-[8px] h-[119px] resize-none p-[10px] text-[13px] placeholder:text-talentia-placeholder" />
                <button type="button" onClick={addComment} disabled={savingComment || !selectedStudent.entrega_id || selectedStudent.nota == null} className="activity-primary mt-[12px] flex h-[29px] w-full items-center justify-center rounded-[6px] text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50">{savingComment ? "Guardando..." : "Agregar Comentario"}</button>
                {selectedStudent.nota == null && <p className="mt-1 text-[12px] text-talentia-muted">Para guardar un comentario desde aquí, primero debe existir una calificación.</p>}
              </>
            ) : (
              <p className="mt-3 text-[13px] text-talentia-muted">
                Selecciona un
                estudiante de la
                tabla.
              </p>
            )}
          </section>
        </aside>
      </div>


      {/* =====================================================
          MODAL DE RÚBRICA POR CRITERIOS

          Si es PDF nunca llega aquí.
      ===================================================== */}

      {showRubric &&
        rubrica &&
        !rubrica.ruta_archivo && (
          <TeacherRubricModal
            rubrica={
              rubrica
            }
            maxGrade={
              maxGrade
            }
            onClose={() =>
              setShowRubric(
                false
              )
            }
          />
        )}
    </div>
  );
}
