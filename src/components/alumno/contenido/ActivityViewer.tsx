"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { API_URL } from "@/lib/api";
import { activities, type ActivityDefinition } from "@/data/activities";
import { markContentViewed } from "@/lib/progress";
import RubricDetails, { type RubricInfo } from "@/components/common/curso/RubricDetails";

type Submission = {
  id: number;
  numero_intento: number;
  comentario: string | null;
  estado: string;
  entregada_en: string | null;
  nota: number | null;
  retroalimentacion: string | null;
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
  permitir_archivo: boolean;
  permitir_enlace: boolean;
  permitir_imagen: boolean;
  permitir_video: boolean;
  formatos_permitidos: string;
  calificada: boolean;
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

const FALLBACK_MAX_FILE_SIZE_MB = 20;

function formatDate(value?: string | null) {
  if (!value) return "Por definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  // MaterialViewer ya recibe del backend la actividad real; se conserva como
  // respaldo la definición estática para no romper las rutas antiguas.
  const activity =
    activityDefinition ?? activities.find((item) => item.id === activityId) ?? activities[0];

  const [activityInfo, setActivityInfo] = useState<ActivityApi | null>(null);
  const [rubrica, setRubrica] = useState<RubricInfo | null>(null);
  const [link, setLink] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(activity?.maxAttempts ?? 3);
  const [maxGrade, setMaxGrade] = useState(activity?.maxGrade ?? 20);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(FALLBACK_MAX_FILE_SIZE_MB);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadSubmission() {
    try {
      const response = await fetch(
        `${API_URL}/actividades/${courseId}/${activityId}/mi-entrega`,
        { credentials: "include", cache: "no-store" },
      );
      const data = await response.json();
      if (!active) return;
      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar la actividad.");
      }

      const apiActivity = data.actividad as ActivityApi;
      setActivityInfo(apiActivity);
      setError("");
      setExpired(Boolean(apiActivity.fecha_limite && Date.parse(apiActivity.fecha_limite) <= Date.now()));
      setRubrica(data.rubrica ?? null);
      setSubmissions((data.entregas ?? []) as Submission[]);
      setMaxAttempts(Number(apiActivity.intentos_permitidos ?? activity?.maxAttempts ?? 3));
      setMaxGrade(Number(apiActivity.puntaje_maximo ?? activity?.maxGrade ?? 20));
      setMaxFileSizeMB(Number(apiActivity.tamano_maximo_mb ?? FALLBACK_MAX_FILE_SIZE_MB));
    } catch (e) {
      if (!active) return;
      setActivityInfo(null);
      setRubrica(null);
      setSubmissions([]);
      setError(e instanceof Error ? e.message : "Error cargando la entrega.");
    } finally {
      if (active) setLoading(false);
    }
    }
    void loadSubmission();
    return () => { active = false; };
  }, [activity, activityId, courseId, reload]);

  const remaining = Math.max(maxAttempts - submissions.length, 0);
  const allowedFormats = (activityInfo?.formatos_permitidos ?? "").toLowerCase().split(",").map(format => format.trim()).filter(format => {
    if (["png", "jpg", "jpeg"].includes(format)) return activityInfo?.permitir_imagen;
    if (format === "mp4") return activityInfo?.permitir_video;
    return ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "rar"].includes(format) && activityInfo?.permitir_archivo;
  });
  const displayTitle = activityInfo?.titulo || title || activity?.title || "Actividad";
  const displayDescription =
    activityInfo ? activityInfo.descripcion ?? activityInfo.instrucciones ?? "" : activity?.description || "";
  const displayDueDate = formatDate(activityInfo?.fecha_limite);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    if (selected && (!allowedFormats.includes(selected.name.split(".").pop()?.toLowerCase() ?? "") || selected.size === 0)) {
      setError("Selecciona un archivo válido en uno de los formatos permitidos.");
      event.target.value = "";
      setFile(null);
      return;
    }
    if (selected && selected.size > maxFileSizeMB * 1024 * 1024) {
      setError(`El archivo no puede superar ${maxFileSizeMB} MB.`);
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function submit() {
    if (sending || !activityInfo) return;
    if (activityInfo.fecha_limite && Date.parse(activityInfo.fecha_limite) <= Date.now()) {
      setExpired(true); setError("La fecha de entrega ya venció."); return;
    }
    if (remaining <= 0) {
      setError("Ya alcanzaste el máximo de intentos permitidos.");
      return;
    }
    if (!file && !link.trim()) {
      setError("Adjunta un archivo o un enlace permitido.");
      return;
    }
    if (link.trim()) {
      try {
        if (!["http:", "https:"].includes(new URL(link.trim()).protocol)) throw new Error();
      } catch { setError("Escribe un enlace válido que comience con https:// o http://."); return; }
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      const form = new FormData();
      if (file) form.append("archivo", file);
      if (comment.trim()) form.append("comentario", comment.trim());
      if (link.trim()) form.append("enlace", link.trim());

      const response = await fetch(
        `${API_URL}/actividades/${courseId}/${activityId}/entregar`,
        {
          method: "POST",
          credentials: "include",
          body: form,
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo enviar la entrega.");
      }

      setMessage("¡Tu entrega se guardó correctamente!");
      setComment("");
      setLink("");
      setFile(null);
      setFileInputKey((current) => current + 1);
      if (trackLocalProgress) markContentViewed(courseId, activityId);
      setReload(current => current + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la entrega.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl bg-white p-7 text-sm text-gray-700">Cargando actividad...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_265px]">
      <section className="rounded-xl bg-white p-6">
        <h1 className="text-2xl font-bold text-[#3186d8]">{displayTitle}</h1>
        {displayDescription && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">{displayDescription}</p>}
        <RubricDetails rubrica={rubrica} courseId={courseId} contentId={activityId} />
        <div className="my-5 border-b border-gray-200" />

        <h2 className="mb-3 text-lg font-bold text-[#3186d8]">Tu entrega</h2>
        {message && <p role="status" className="mb-3 rounded-lg bg-green-100 p-3 text-sm text-green-800">{message}</p>}
        {error && <p role="alert" className="mb-3 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>}

        {activityInfo && remaining > 0 && !expired ? (
          <fieldset disabled={sending} className="min-w-0">
            <label htmlFor="comentario-entrega" className="mb-2 block text-sm font-medium text-gray-700">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario-entrega"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Añade un comentario para el docente..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 outline-none focus:border-[#3186d8]"
            />

            {activityInfo.permitir_enlace && <div className="mt-4">
              <label htmlFor="enlace-entrega" className="block text-sm font-medium text-gray-700">Enlace</label>
              <input id="enlace-entrega" type="url" maxLength={2000} value={link} onChange={event => setLink(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800" />
            </div>}
            {allowedFormats.length > 0 && <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5">
              <label htmlFor="archivo-entrega" className="block text-sm font-semibold text-gray-800">
                Archivo adjunto{activityInfo.permitir_enlace ? " (o enlace)" : ""}
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Máximo {maxFileSizeMB} MB. {allowedFormats.join(", ").toUpperCase()}.
              </p>
              <input
                key={fileInputKey}
                id="archivo-entrega"
                type="file"
                accept={allowedFormats.map(format => `.${format}`).join(",")}
                onChange={chooseFile}
                className="mt-3 block w-full text-sm text-gray-700"
              />
              {file && <p className="mt-2 break-all text-sm text-gray-700">Seleccionado: {file.name}</p>}
            </div>}

            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="mt-4 rounded-lg bg-[#3186d8] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Enviar entrega"}
            </button>
          </fieldset>
        ) : activityInfo ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {expired ? "La fecha de entrega ya venció." : "Ya alcanzaste el máximo de intentos permitidos."}
          </p>
        ) : null}

        <h2 className="mb-3 mt-7 text-lg font-bold text-[#3186d8]">Historial de entregas</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no has enviado esta actividad.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    Intento {submission.numero_intento} · {submission.estado}
                  </p>
                  <p className="text-xs text-gray-500">
                    {submission.entregada_en ? formatDate(submission.entregada_en) : ""}
                  </p>
                </div>
                {submission.nombre_archivo && submission.archivo_id && (
                  <a
                    className="mt-2 inline-block break-all text-sm text-blue-700 underline"
                    href={`${API_URL}/actividades/archivo/${submission.archivo_id}`}
                  >
                    Descargar documento: {submission.nombre_archivo}
                  </a>
                )}
                {submission.comentario && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {submission.comentario}
                  </p>
                )}
                {activityInfo?.calificada && submission.nota !== null && submission.nota !== undefined && (
                  <p className="mt-3 font-semibold text-green-700">Nota: {submission.nota} / {maxGrade}</p>
                )}
                {submission.retroalimentacion && (
                  <p className="mt-2 whitespace-pre-wrap rounded bg-blue-50 p-3 text-sm text-gray-700">
                    {submission.retroalimentacion}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
          {previousHref ? <Link href={previousHref} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">← Anterior</Link> : <span />}
          {nextHref ? <Link href={nextHref} className="rounded bg-[#3186d8] px-4 py-2 text-sm text-white hover:bg-[#2777c1]">Siguiente →</Link> : <Link href={exitHref} className="rounded bg-[#3186d8] px-4 py-2 text-sm text-white hover:bg-[#2777c1]">Volver al curso</Link>}
        </div>
      </section>

      <aside className="rounded-xl bg-white p-5">
        <h2 className="mb-4 font-bold text-[#3186d8]">Detalles de la actividad</h2>
        <p className="mb-3 text-sm text-gray-600">Intentos restantes: <strong>{remaining}</strong></p>
        {activityInfo && <p className="mb-3 text-sm text-gray-600">{activityInfo.calificada ? <>Puntuación máxima: <strong>{maxGrade} puntos</strong></> : "Actividad sin calificación"}</p>}
        <p className="text-sm text-gray-600">Fecha límite: <strong>{displayDueDate}</strong></p>
      </aside>
    </div>
  );
}
