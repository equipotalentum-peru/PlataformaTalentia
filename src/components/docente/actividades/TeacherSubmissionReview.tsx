"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import FileTypeIcon from "@/components/common/contenido/FileTypeIcon";

type Props = { courseId: number; activityId: number; studentId: number; initialSubmissionId?: number };

type Submission = {
  entrega_id: number;
  numero_intento: number;
  estado: string | null;
  entregada_en: string | null;
  comentario: string | null;
  nota: number | null;
  retroalimentacion: string | null;
  calificado_en: string | null;
  matricula_id: number;
  alumno_id: number;
  alumno: string;
  archivo_id: number | null;
  nombre_archivo: string | null;
  tamano_bytes: number | null;
};

type ActivityInfo = {
  puntaje_maximo?: number | string | null;
  intentos_permitidos?: number | string | null;
  fecha_limite?: string | null;
  calificada?: boolean;
};

function formattedDate(value?: string | null) {
  if (!value) return "Por definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  }).replace(" de 20", " del 20");
}

function formattedTime(value?: string | null) {
  if (!value) return "23:59 (UTC-5)";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "23:59 (UTC-5)";
  return `${date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Lima",
  })} (UTC-5)`;
}

function formatSize(bytes?: number | null) {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Icon({
  type,
  size = 20,
}: {
  type:
    | "back"
    | "calendar"
    | "check"
    | "star"
    | "file"
    | "download"
    | "trophy"
    | "chat"
    | "circle-check"
    | "info";

  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (type) {
    case "back":
      return (
        <svg {...props}>
          <path d="M19 12H5m7 7-7-7 7-7" />
        </svg>
      );

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

    case "file":
      return (
        <svg {...props}>
          <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" />
          <path d="M13 3v7h7M12 17V12m-3 3 3-3 3 3" />
        </svg>
      );

    case "download":
      return (
        <svg {...props}>
          <path d="M12 3v11m-4-4 4 4 4-4" />
          <path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
        </svg>
      );

    case "trophy":
      return (
        <svg {...props}>
          <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
          <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8m-7-4h6" />
        </svg>
      );

    case "chat":
      return (
        <svg {...props}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        </svg>
      );

    case "circle-check":
      return (
        <svg {...props}>
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
  }
}

function DetailRow({ icon, label, children }: { icon: "calendar" | "check" | "star"; label: string; children: React.ReactNode }) {
  return <div className="activity-side-item"><span className="activity-icon-circle"><Icon type={icon} size={19} /></span><div className="min-w-0 flex-1"><p className="text-talentia-blue">{label}</p><div className="text-[10px] leading-[1.35] text-talentia-primary">{children}</div></div></div>;
}

export default function TeacherSubmissionReview({ courseId, activityId, studentId, initialSubmissionId }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityInfo>({});
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(preferredSubmissionId: number | undefined = initialSubmissionId) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/actividades/docente/${courseId}/${activityId}/alumno/${studentId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo cargar la entrega.");

      const rawItems = Array.isArray(data.entregas)
        ? data.entregas
        : data.entrega
          ? [data.entrega]
          : [];
      const items = (rawItems as Submission[])
        .filter((item) => item.entrega_id != null)
        .sort((a, b) => a.numero_intento - b.numero_intento);

      setActivity(data.actividad ?? {});
      setSubmissions(items);

      // Al entrar, se selecciona el primer intento pendiente de nota; si todos
      // ya fueron calificados, se muestra el intento más reciente. Al guardar,
      // se conserva seleccionado el intento que se acaba de calificar.
      const graded = data.actividad?.calificada !== false;
      const selected = items.find((item) => Number(item.entrega_id) === Number(preferredSubmissionId))
        ?? items.find((item) => (graded ? item.nota == null : !item.calificado_en))
        ?? items[items.length - 1]
        ?? null;

      // Actividad NO calificable: al abrir la entrega queda marcada como visualizada.
      if (!graded && selected && !selected.calificado_en) {
        void fetch(`${API_URL}/actividades/docente/${courseId}/${activityId}/entregas/${selected.entrega_id}/calificacion`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soloVisualizar: true }),
        }).catch(() => undefined);
      }

      setSelectedSubmissionId(selected?.entrega_id ?? null);
      setGrade(selected?.nota == null ? "" : String(selected.nota));
      setFeedback(selected?.retroalimentacion ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la entrega.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [courseId, activityId, studentId, initialSubmissionId]);

  const submission = submissions.find((item) => item.entrega_id === selectedSubmissionId) ?? null;
  const maxGrade = Number(activity.puntaje_maximo ?? 20);
  const maxAttempts = Number(activity.intentos_permitidos ?? 3);
  const isGraded = activity.calificada !== false;

  const PASSING_GRADE = 14;

  // Solo lectura si ya se calificó un intento posterior
  const locked =
    isGraded &&
    !!submission &&
    submissions.some((s) => s.numero_intento > submission.numero_intento && s.nota != null);

  const gradeNumber = grade.trim() === "" ? null : Number(grade);
  const hasGrade = gradeNumber != null && Number.isFinite(gradeNumber);
  const gradeColor = !hasGrade
    ? "text-talentia-primary"
    : gradeNumber! >= PASSING_GRADE
      ? "text-talentia-success"
      : "text-talentia-danger";
  const gradeBorder = !hasGrade
    ? "border-talentia-border focus-within:border-talentia-blue"
    : gradeNumber! >= PASSING_GRADE
      ? "border-talentia-success"
      : "border-talentia-danger";


  async function save() {
    if (!submission?.entrega_id) return;
    if (locked) return;
    const numericGrade = Number(grade);
    if (isGraded && (grade.trim() === "" || !Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > maxGrade)) {
      setError(`Introduce una nota entre 0 y ${maxGrade}.`);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/actividades/docente/${courseId}/${activityId}/entregas/${submission.entrega_id}/calificacion`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isGraded ? { nota: numericGrade, retroalimentacion: feedback } : { retroalimentacion: feedback }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo guardar la calificación.");
      setMessage(isGraded
        ? `Calificación del intento ${submission.numero_intento} guardada correctamente.`
        : `Comentario del intento ${submission.numero_intento} publicado correctamente.`);
      await load(submission.entrega_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error guardando la nota.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="activity-page-root"><div className="activity-card flex min-h-[280px] items-center justify-center p-8 text-sm text-talentia-primary">Cargando entrega...</div></div>;
  if (!submission) return <div className="activity-page-root"><div className="activity-card p-8 text-sm text-talentia-primary">{error || "No se encontraron intentos para este alumno."}</div></div>;

  const published = isGraded && submission.nota != null;

  return (
    <div className="activity-page-root activity-review-root">
      <div className="flex min-w-0 items-center gap-4">
        <Link href={`/docente/cursos/${courseId}/actividades/${activityId}`} className="app-back-link">
          <span aria-hidden="true">{"<"}</span> Volver</Link>
        <p className="truncate text-[11px] text-talentia-primary">Módulo 1: Introducción a las TIC &gt; 1.4 Práctica</p>
      </div>

      <div className="activity-visual-content mt-[18px] items-start">
        <section className="activity-card min-h-[280px] min-w-0 px-4 pb-6 pt-[14px] sm:px-6 lg:min-h-[480px]">
          <div className="activity-success-callout flex min-h-[51px] items-center gap-3 px-4 py-2">
            <Icon type="circle-check" size={26} />
            <div>
              <h1 className="text-[17px] font-bold leading-tight text-talentia-success">{published ? "Calificación publicada" : "Entrega recibida"}</h1>
              <p className="mt-1 text-[13px] leading-tight text-talentia-success">{published ? `Nota del intento ${submission.numero_intento}: ${submission.nota}/${maxGrade}` : isGraded ? "Revisa este intento y publica su calificación" : "Revisa este intento y, si lo deseas, publica un comentario"}</p>
            </div>
          </div>


          {error && <p role="alert" className="mt-3 rounded-md bg-talentia-danger-bg p-2 text-[13px] text-talentia-danger">{error}</p>}
          {message && <p role="status" className="mt-3 rounded-md bg-talentia-success-bg p-2 text-[13px] text-talentia-success">{message}</p>}

          <div className="mt-6 bg-talentia-surface">
            <h2 className="mb-3 text-[15px] font-semibold text-talentia-primary">Archivo enviado · Intento {submission.numero_intento}</h2>
            {submission.comentario && <p className="min-h-[54px] whitespace-pre-wrap rounded-sm border border-talentia-border bg-talentia-surface px-[11px] py-[10px] text-[13px] leading-[1.35] text-talentia-primary">{submission.comentario}</p>}
            {submission.nombre_archivo && submission.archivo_id ? (
              <div className="activity-file-row mt-3 min-w-0 bg-talentia-surface">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-talentia-surface"><FileTypeIcon filename={submission.nombre_archivo} className="h-7 w-7" /></span>
                <div className="activity-file-name min-w-0 flex-1"><p className="text-[13px] text-talentia-primary">{submission.nombre_archivo}</p><p className="mt-1 text-[12px] text-talentia-muted">{formatSize(submission.tamano_bytes)}</p></div>
                <a href={`${API_URL}/actividades/archivo/${submission.archivo_id}`} className="activity-link activity-download inline-flex shrink-0 items-center gap-2 rounded-md border border-talentia-blue"><Icon type="download" size={14} /> Descargar</a>
              </div>
            ) : !submission.comentario ? (
              <p className="rounded bg-talentia-surface p-3 text-[13px] text-talentia-muted">El estudiante no adjuntó un documento ni un comentario.</p>
            ) : null}
          </div>
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="activity-card min-h-[172px] p-4">
            <h2 className="activity-card-title">Detalles del intento {submission.numero_intento}</h2>
            <div className="mt-[14px] space-y-[10px]">
              <DetailRow icon="calendar" label="Fecha de entrega"><span className="block">{formattedDate(submission.entregada_en)}</span><span className="block">{formattedTime(submission.entregada_en)}</span></DetailRow>
              <DetailRow icon="check" label="Intentos">{submission.numero_intento} de {maxAttempts} intentos</DetailRow>
              {isGraded && <DetailRow icon="star" label="Puntuación máxima">{maxGrade} puntos</DetailRow>}
            </div>
          </section>

          <section className="activity-card p-4">
            <h2 className="activity-card-title">{isGraded ? "Calificación · Intento" : "Intento"} {submission.numero_intento}</h2>
            {isGraded && (
              <label
                htmlFor="nota-entrega"
                className={`mt-4 flex min-h-11 items-center gap-2 rounded-md border bg-talentia-surface px-3 text-[13px] ${gradeColor} ${gradeBorder}`}
              >
                <Icon type="trophy" size={17} />
                <input
                  id="nota-entrega"
                  type="number"
                  aria-label="Calificación del intento"
                  min={0}
                  max={maxGrade}
                  step="0.1"
                  value={grade}
                  disabled={locked}
                  onChange={(event) => setGrade(event.target.value)}
                  placeholder="Insertar calificación"
                  className={`min-w-0 flex-1 border-0 bg-transparent text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-talentia-placeholder disabled:cursor-not-allowed ${gradeColor}`}
                />
              </label>
            )}
            <div className="mt-[13px] flex items-center gap-2 text-[15px] font-semibold text-talentia-primary"><Icon type="chat" size={16} /> Comentarios del docente (opcional)</div>
            <label htmlFor="retroalimentacion-entrega" className="sr-only">Comentarios del docente</label>
            <textarea id="retroalimentacion-entrega" rows={5} maxLength={5000} value={feedback} disabled={locked} onChange={(event) => setFeedback(event.target.value)} placeholder="Insertar comentario" className="activity-input mt-[8px] h-[119px] resize-none p-[10px] text-[13px] placeholder:text-talentia-placeholder" />
          </section>

          {locked ? (
            <p className="rounded-md bg-talentia-surface p-2 text-center text-[12px] text-talentia-primary">
              Solo lectura: ya se calificó un intento posterior.
            </p>
          ) : (
            <button type="button" disabled={saving || !submission.entrega_id} onClick={save} className="activity-primary flex h-[29px] w-full items-center justify-center rounded-[6px] text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Publicando..." : isGraded ? `Publicar nota del intento ${submission.numero_intento}` : "Publicar comentario"}
            </button>
          )}
          <Link href={`/docente/cursos/${courseId}/actividades/${activityId}`} className="flex h-[27px] w-full items-center justify-center rounded-[6px] bg-talentia-surface text-[12px] font-medium text-talentia-primary hover:bg-talentia-border">Cancelar</Link>
        </aside>
      </div>
    </div>
  );
}


