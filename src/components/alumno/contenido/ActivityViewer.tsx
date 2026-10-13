"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { API_URL } from "@/lib/api";
import { activities, type ActivityDefinition } from "@/data/activities";
import { markContentViewed } from "@/lib/progress";

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
};

const ACCEPTED_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.rar";
const FALLBACK_MAX_FILE_SIZE_MB = 20;

function formatDate(value?: string | null) {
  if (!value) return "Por definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

function dueDateParts(value?: string | null, fallback?: string) {
  if (!value) {
    return { date: fallback || "Por definir", time: "" };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: value, time: "" };
  }
  return {
    date: date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Lima",
    }).replace(" de 20", " del 20"),
    time: `${date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Lima",
    })} (UTC-5)`,
  };
}

function formatSize(bytes?: number | null) {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Icon({
  type,
  size = 20,
  className = "",
}: {
  type: "calendar" | "check" | "star" | "book" | "info" | "file" | "download" | "chat" | "trophy" | "arrow" | "back" | "circle-check";
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (type) {
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
    case "check":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="4" /><path d="m7 12 3 3 7-7" /></svg>;
    case "star":
      return <svg {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 6v15M8 7h8M8 11h8" /></svg>;
    case "info":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7h.01" /></svg>;
    case "file":
      return <svg {...common}><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" /><path d="M13 3v7h7M12 17V12m-3 3 3-3 3 3" /></svg>;
    case "download":
      return <svg {...common}><path d="M12 3v11m-4-4 4 4 4-4" /><path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg>;
    case "chat":
      return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></svg>;
    case "trophy":
      return <svg {...common}><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8m-7-4h6" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
    case "back":
      return <svg {...common}><path d="M19 12H5m7 7-7-7 7-7" /></svg>;
    case "circle-check":
      return <svg {...common}><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><path d="m7 12 3.2 3.2L17.5 8" stroke="#ffffff" strokeWidth="2.2" /></svg>;
  }
}

function PageHeader({ title, href }: { title?: string; href: string }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <Link href={href} className="activity-primary inline-flex h-[24px] shrink-0 items-center gap-1 rounded-[4px] px-2 text-[10px] font-medium">
        <Icon type="back" size={16} />
        Volver
      </Link>
      <p className="truncate text-[11px] text-[#252b33]">
        Módulo 1: Introducción a las TIC &gt; {title || "1.4 Práctica"}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: "calendar" | "check" | "star" | "book";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="activity-side-item">
      <span className="activity-icon-circle"><Icon type={icon} size={19} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[#1e66c5]">{label}</p>
        <div className="text-[10px] leading-[1.35] text-[#252b33]">{children}</div>
      </div>
    </div>
  );
}

export default function ActivityViewer({
  activityId,
  courseId,
  title,
  previousHref,
  nextHref,
  exitHref,
  activityDefinition,
  trackLocalProgress = true,
}: Props) {
  // La definición estática queda solo como respaldo visual; los datos de entrega
  // siempre se consultan y guardan a través de la API existente.
  const activity = activityDefinition ?? activities.find((item) => item.id === activityId) ?? activities[0];

  const [activityInfo, setActivityInfo] = useState<ActivityApi | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(activity?.maxAttempts ?? 3);
  const [maxGrade, setMaxGrade] = useState(activity?.maxGrade ?? 20);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(FALLBACK_MAX_FILE_SIZE_MB);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  const loadSubmission = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/actividades/${courseId}/${activityId}/mi-entrega`,
        { credentials: "include", cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo cargar la actividad.");

      const apiActivity = data.actividad as ActivityApi;
      setActivityInfo(apiActivity);
      setSubmissions((data.entregas ?? []) as Submission[]);
      setMaxAttempts(Number(apiActivity.intentos_permitidos ?? activity?.maxAttempts ?? 3));
      setMaxGrade(Number(apiActivity.puntaje_maximo ?? activity?.maxGrade ?? 20));
      setMaxFileSizeMB(Number(apiActivity.tamano_maximo_mb ?? FALLBACK_MAX_FILE_SIZE_MB));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando la entrega.");
    } finally {
      setLoading(false);
    }
  }, [activity, activityId, courseId]);

  useEffect(() => {
    void loadSubmission();
  }, [loadSubmission]);

  const latest = submissions[0] ?? null;
  const displayedSubmission = selectedSubmissionId == null
    ? latest
    : submissions.find((submission) => submission.id === selectedSubmissionId) ?? latest;
  const remaining = Math.max(maxAttempts - submissions.length, 0);
  const displayTitle = activityInfo?.titulo || title || activity?.title || "Actividad";
  const displayDescription = activityInfo?.descripcion || activityInfo?.instrucciones || activity?.description || "";
  const due = dueDateParts(activityInfo?.fecha_limite, activity?.dueDate);
  const showDeliveryDetail = showSubmitted && displayedSubmission !== null;

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    if (selected && selected.size > maxFileSizeMB * 1024 * 1024) {
      setError(`El archivo no puede superar ${maxFileSizeMB} MB.`);
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (!dropped) return;
    if (dropped.size > maxFileSizeMB * 1024 * 1024) {
      setError(`El archivo no puede superar ${maxFileSizeMB} MB.`);
      return;
    }
    setError("");
    setFile(dropped);
    setFileInputKey((current) => current + 1);
  }

  async function submit() {
    if (remaining <= 0) {
      setError("Ya alcanzaste el máximo de intentos permitidos.");
      return;
    }
    if (!file && !comment.trim()) {
      setError("Adjunta un documento o escribe un comentario.");
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      const form = new FormData();
      if (file) form.append("archivo", file);
      if (comment.trim()) form.append("comentario", comment.trim());

      const response = await fetch(`${API_URL}/actividades/${courseId}/${activityId}/entregar`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo enviar la entrega.");

      setMessage("¡Tu entrega se guardó correctamente!");
      setComment("");
      setFile(null);
      setFileInputKey((current) => current + 1);
      setSelectedSubmissionId(null);
      if (trackLocalProgress) markContentViewed(courseId, activityId);
      await loadSubmission();
      setShowSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la entrega.");
    } finally {
      setSending(false);
    }
  }

  const pageHeader = <PageHeader title="1.4 Práctica" href={exitHref} />;

  if (loading) {
    return (
      <div className="activity-page-root">
        {pageHeader}
        <div className="activity-card mt-[18px] flex min-h-[250px] items-center justify-center p-8 text-sm text-slate-600">
          Cargando actividad...
        </div>
      </div>
    );
  }

  if (error && !activityInfo && submissions.length === 0) {
    return (
      <div className="activity-page-root">
        {pageHeader}
        <div role="alert" className="mt-[18px] rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="activity-page-root activity-student-root">
      {pageHeader}

      <div className="mt-[18px] grid grid-cols-1 items-start gap-[10px] md:grid-cols-[minmax(0,1fr)_244px]">
        <section className={`activity-card min-h-[564px] min-w-0 px-6 pb-6 ${showDeliveryDetail ? "pt-[33px]" : "pt-6"}`}>
          {showDeliveryDetail && displayedSubmission ? (
            <>
              <div className="activity-success-callout flex min-h-[51px] items-center gap-3 px-4 py-2">
                <Icon type="circle-check" size={26} />
                <div>
                  <h1 className="text-[17px] font-bold leading-tight text-[#08b72a]">¡Entrega realizada!</h1>
                  <p className="mt-1 text-[10px] leading-tight text-[#08b72a]">Tu actividad ha sido enviada correctamente.</p>
                </div>
              </div>

              <div className="mt-[14px] rounded-lg bg-[#eeeeee] p-[14px]">
                <h2 className="mb-3 text-[12px] font-bold text-[#1c70ce]">Archivo enviado</h2>
                {displayedSubmission.comentario && (
                  <p className="min-h-[54px] whitespace-pre-wrap rounded-sm border border-[#c8c8c8] bg-white px-[11px] py-[10px] text-[10px] leading-[1.35] text-[#171717]">
                    {displayedSubmission.comentario}
                  </p>
                )}

                {displayedSubmission.nombre_archivo && displayedSubmission.archivo_id ? (
                  <div className="mt-3 flex min-w-0 items-center gap-3 rounded-md bg-white px-3 py-2">
                    <span className="flex h-[38px] w-[28px] shrink-0 items-center justify-center rounded bg-[#ef5350] text-white">
                      <Icon type="file" size={23} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-[#333333]">{displayedSubmission.nombre_archivo}</p>
                      <p className="mt-1 text-[9px] text-[#898989]">{formatSize(displayedSubmission.tamano_bytes)}</p>
                    </div>
                    <a
                      href={`${API_URL}/actividades/archivo/${displayedSubmission.archivo_id}`}
                      className="activity-link inline-flex h-[27px] shrink-0 items-center gap-1 rounded-md border border-[#2788f2] px-2 text-[10px]"
                    >
                      <Icon type="download" size={14} /> Descargar
                    </a>
                  </div>
                ) : !displayedSubmission.comentario ? (
                  <p className="rounded bg-white p-3 text-[10px] text-gray-500">No se adjuntó un documento ni un comentario.</p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h1 className="max-w-[440px] text-[23px] font-bold leading-[1.15] text-[#1551ad]">{displayTitle.startsWith("Actividad:") ? displayTitle : `Actividad: ${displayTitle}`}</h1>
              {displayDescription && <p className="mt-[10px] max-w-[438px] text-[11px] leading-[1.25] text-[#242424]">{displayDescription}</p>}
              <div className="my-[7px] border-b border-[#555555]" />

              <h2 className="mb-[5px] text-[16px] font-bold leading-tight text-[#1551ad]">Tu entrega</h2>

              {message && <p role="status" className="mb-2 rounded-md bg-green-100 p-2 text-[11px] text-green-800">{message}</p>}
              {error && <p role="alert" className="mb-2 rounded-md bg-red-50 p-2 text-[11px] text-red-700">{error}</p>}

              {remaining > 0 ? (
                <>
                  <label htmlFor="comentario-entrega" className="sr-only">Comentario para el docente</label>
                  <textarea
                    id="comentario-entrega"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                    maxLength={5000}
                    placeholder="Haga clic si desea agregar texto"
                    className="activity-input h-[70px] resize-y rounded-none border-[#c9c9c9] px-[10px] py-[9px] text-[10px] placeholder:text-[#858585]"
                  />

                  <label
                    htmlFor="archivo-entrega"
                    onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`mt-[10px] flex min-h-[139px] cursor-pointer flex-col items-center justify-center rounded-[8px] px-4 py-4 text-center transition ${isDragging ? "border-2 border-[#1888ef] bg-blue-50" : "border-2 border-transparent bg-[#eeeeee]"}`}
                  >
                    <span className="text-[#121212]"><Icon type="file" size={25} /></span>
                    <span className="mt-[4px] text-[11px] text-[#161616]">{file ? file.name : "Arrastra y suelta tu archivo aquí"}</span>
                    <span className="mt-[2px] text-[10px] text-[#858585]">Tamaño máximo {maxFileSizeMB}MB</span>
                    <span className="my-[5px] text-[10px] text-[#222222]">o</span>
                    <span className="inline-flex h-[21px] items-center rounded-[7px] border border-[#105bd0] px-2 text-[11px] text-[#105bd0]">Seleccionar archivo</span>
                    {file && <span className="mt-1 text-[10px] text-[#277b42]">Seleccionado · {formatSize(file.size)}</span>}
                  </label>
                  <input
                    key={fileInputKey}
                    id="archivo-entrega"
                    type="file"
                    accept={ACCEPTED_FILES}
                    onChange={chooseFile}
                    className="sr-only"
                  />

                  <div className="activity-info-callout mt-[13px] flex min-h-[44px] items-center gap-3 px-4 py-2">
                    <Icon type="info" size={20} />
                    <p className="text-[9px] leading-[1.3] text-[#1766a4]">Formatos permitidos: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG, RAR, ZIP...</p>
                  </div>
                </>
              ) : (
                <p className="rounded-md bg-amber-50 p-3 text-[11px] text-amber-800">Ya alcanzaste el máximo de intentos permitidos.</p>
              )}
            </>
          )}

        </section>

        <aside className={`min-w-0 ${showDeliveryDetail ? "space-y-[7px]" : "space-y-[10px]"}`}>
          <section className={`activity-card p-4 ${showDeliveryDetail ? "min-h-[172px]" : "min-h-[272px]"}`}>
            <h2 className="activity-card-title">{showDeliveryDetail ? "Detalles de la entrega" : "Detalles de la actividad"}</h2>
            <div className="mt-[14px] space-y-[10px]">
              <DetailRow icon="calendar" label="Fecha de entrega">
                <span className="block">{due.date}</span>
                <span className="block">{due.time || "23:59 (UTC-5)"}</span>
              </DetailRow>
              <DetailRow icon="check" label="Intentos">
                {showDeliveryDetail && displayedSubmission
                  ? `${displayedSubmission.numero_intento} de ${maxAttempts} intentos`
                  : `${remaining} intentos restantes`}
              </DetailRow>
              <DetailRow icon="star" label="Puntuación máxima">{maxGrade} puntos</DetailRow>
              {!showDeliveryDetail && (
                <DetailRow icon="book" label="Rúbrica de evaluación">
                  <span className="activity-link">Ver rúbrica ↗</span>
                </DetailRow>
              )}
            </div>
            {!showDeliveryDetail && (
              <div className="activity-info-callout mt-[12px] flex gap-2 px-2 py-[9px]">
                <Icon type="info" size={20} />
                <div>
                  <p className="text-[10px] font-bold text-[#1766a4]">Importante</p>
                  <p className="mt-[2px] text-[9px] leading-[1.2]">Las entregas realizadas después de la fecha límite se marcarán como atrasadas.</p>
                </div>
              </div>
            )}
          </section>

          {showDeliveryDetail && displayedSubmission ? (
            <section className="activity-card min-h-[271px] p-3">
              <h2 className="activity-card-title">Calificación</h2>
              {displayedSubmission.nota !== null && displayedSubmission.nota !== undefined ? (
                <>
                  <div className="mt-2 flex min-h-[29px] items-center justify-center gap-2 rounded-md bg-[#c8e8ca] px-2 text-[14px] font-bold text-[#269d36]">
                    <Icon type="trophy" size={17} />
                    {displayedSubmission.nota} / {maxGrade} puntos
                  </div>
                  <p className="mt-2 text-[10px] leading-[1.3] text-[#aaaaaa]">
                    {displayedSubmission.calificado_en ? `Calificado el ${formatDate(displayedSubmission.calificado_en)}` : "La calificación ya está disponible."}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[12px] font-bold text-[#287ee0]">
                    <Icon type="chat" size={16} /> Comentarios del docente
                  </div>
                  <p className="mt-2 min-h-[118px] whitespace-pre-wrap rounded-lg border border-[#287ee0] bg-white p-2 text-[10px] leading-[1.3] text-[#174363]">
                    {displayedSubmission.retroalimentacion || "El docente todavía no ha añadido comentarios."}
                  </p>
                </>
              ) : (
                <p className="mt-3 rounded-md bg-[#f1f5fa] p-3 text-[11px] text-slate-600">Tu actividad está pendiente de calificación.</p>
              )}
            </section>
          ) : (
            <section className="activity-card min-h-[272px] p-4">
              <h2 className="activity-card-title">Entregas realizadas</h2>
              {submissions.length === 0 ? (
                <p className="mt-3 text-[10px] text-[#818181]">Todavía no has realizado entregas.</p>
              ) : (
                <div className="mt-[10px] space-y-[7px]">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center gap-1 text-[10px] leading-[1.35]">
                      <span className="shrink-0 text-[#333333]">Intento {submission.numero_intento}:</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedSubmissionId(submission.id); setShowSubmitted(true); setError(""); }}
                        className="activity-link inline-flex items-center gap-1 text-left"
                      >
                        Ver entrega <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </aside>
      </div>

      {!showDeliveryDetail && (
        <div className="mt-[32px] flex flex-wrap items-center justify-between gap-3">
          <span />
          <button
            type="button"
            onClick={submit}
            disabled={sending || remaining <= 0}
            className="activity-primary inline-flex h-[35px] items-center justify-center gap-4 rounded-[7px] px-[17px] text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar entrega"}
            <Icon type="arrow" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
