"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import type { Course } from "@/data/courses";


import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
import RubricTypeModal from "./modals/RubricTypeModal";
import RubricEditorModal, { type RubricDraft } from "./modals/RubricEditorModal";
import type { RubricInfo } from "@/components/common/curso/RubricDetails";
type CreateActivityProps = {
  course: Course;
  moduleId?: string;
  contentId?: string;
};

type ActivityConfiguration = {
  modulo_id: number | string;
  titulo: string;
  descripcion: string;
  fecha_limite: string | null;
  intentos_permitidos: number;
  calificada: boolean;
  puntaje_maximo: number | string | null;
  tamano_maximo_mb: number | string | null;
  permitir_archivo: boolean;
  permitir_enlace: boolean;
  permitir_imagen: boolean;
  permitir_video: boolean;
  formatos_permitidos: string | null;
  estado_contenido: "Borrador" | "Publicado";
};

const deliveryTypes = [
  { label: "Archivo", key: "archivo", formats: ["PDF", "DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX", "ZIP", "RAR"] },
  { label: "Enlace", key: "enlace", formats: [] },
  { label: "Imagen", key: "imagen", formats: ["PNG", "JPG", "JPEG"] },
  { label: "Video", key: "video", formats: ["MP4"] },
] as const;



function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function CreateActivity({ course, moduleId, contentId }: CreateActivityProps) {
  const router = useRouter();
  const editing = contentId !== undefined;
  const [activityModuleId, setActivityModuleId] = useState(moduleId);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState("");
  const loadedDeadline = useRef({ date: "", time: "", iso: null as string | null });
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [delivery, setDelivery] = useState({ archivo: true, enlace: true, imagen: true, video: true });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [attempts, setAttempts] = useState(1);
  const [graded, setGraded] = useState(true);
  const [maxGrade, setMaxGrade] = useState(20);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [rubricEditorType, setRubricEditorType] = useState<"pdf" | "criterios" | null>(null);
  const [rubricDraft, setRubricDraft] = useState<RubricDraft | null>(null);
  const [storedRubric, setStoredRubric] = useState<RubricInfo | null>(null);
  const [rubricChanged, setRubricChanged] = useState(false);
  // Estado original de la actividad (solo al editar). Ya no se elige en el formulario:
  // para ocultar o publicar se usa el menú del curso ("Volver a borrador" / "Publicar").
  const [loadedStatus, setLoadedStatus] = useState<"Borrador" | "Publicado">("Borrador");
  const [formats, setFormats] = useState(["PDF", "DOC", "DOCX", "PPT", "PPTX", "PNG", "JPG", "RAR", "MP4"]);
  const [maxFileSize, setMaxFileSize] = useState(200);
  const [notice, setNotice] = useState("");
  const formatOptions: string[] = deliveryTypes.flatMap(type => delivery[type.key] ? [...type.formats] : []);
  const storedPDF = !rubricChanged && storedRubric?.ruta_archivo ? storedRubric : null;
  const busy = saving || loading || Boolean(loadError);
  const hasDeadline = Boolean(dueDate) && Boolean(dueTime);
  const saveMode: "Borrador" | "Publicado" = editing ? loadedStatus : "Publicado";
  const needsDeadline = saveMode === "Publicado" && !hasDeadline;

  const backHref = activityModuleId
    ? `/docente/cursos/${course.id}?moduleId=${encodeURIComponent(activityModuleId)}`
    : `/docente/cursos/${course.id}`;

  useEffect(() => {
    if (!editing) return;
    const controller = new AbortController();
    async function load() {
      try {
        if (!Number.isSafeInteger(Number(contentId)) || Number(contentId) <= 0) throw new Error("El identificador de la actividad no es válido.");
        const response = await fetch(`${API_URL}/actividades/docente/${course.id}/${contentId}/configuracion`, {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "No se pudo cargar la actividad.");
        if (controller.signal.aborted) return;
        const activity = result.actividad as ActivityConfiguration;
        const rubric = result.rubrica as RubricInfo | null;
        let date = "", time = "";
        if (activity.fecha_limite) {
          const deadline = new Date(activity.fecha_limite);
          const pad = (value: number) => String(value).padStart(2, "0");
          date = `${deadline.getFullYear()}-${pad(deadline.getMonth() + 1)}-${pad(deadline.getDate())}`;
          time = `${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;
        }
        loadedDeadline.current = { date, time, iso: activity.fecha_limite };
        setActivityModuleId(String(activity.modulo_id));
        setTitle(activity.titulo);
        setDescription(activity.descripcion);
        setDueDate(date);
        setDueTime(time);
        setAttempts(Number(activity.intentos_permitidos));
        setGraded(activity.calificada);
        setMaxGrade(Number(activity.puntaje_maximo ?? 20));
        setMaxFileSize(Number(activity.tamano_maximo_mb ?? 200));
        setDelivery({ archivo: activity.permitir_archivo, enlace: activity.permitir_enlace, imagen: activity.permitir_imagen, video: activity.permitir_video });
        setFormats((activity.formatos_permitidos ?? "").split(",").map(format => format.trim().toUpperCase()).filter(Boolean));
        setLoadedStatus(activity.estado_contenido === "Publicado" ? "Publicado" : "Borrador");
        setStoredRubric(rubric);
        setRubricDraft(rubric && !rubric.ruta_archivo ? {
          tipo: "criterios", criterios: rubric.criterios.map(criterion => ({
            nombre: criterion.nombre, descripcion: criterion.descripcion ?? "", puntaje_maximo: Number(criterion.puntaje_maximo),
          })),
        } : null);
        setRubricChanged(false);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "No se pudo cargar la actividad.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [contentId, course.id, editing]);

  const toggleFormat = (format: string) => {
    setFormats((current) => current.includes(format) ? current.filter((item) => item !== format) : [...current, format]);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const submit = async (mode: "Borrador" | "Publicado") => {
    if (savingRef.current || loading || loadError) return;
    if (!activityModuleId || !Number.isSafeInteger(Number(activityModuleId)) || Number(activityModuleId) <= 0) {
      showNotice("Selecciona un módulo antes de crear la actividad.");
      return;
    }
    if (!title.trim()) {
      showNotice("Escribe un título para la actividad.");
      return;
    }
    if (mode === "Publicado" && !hasDeadline) { showNotice("Para publicar la actividad debes indicar la fecha y la hora de entrega."); return; }
    if (Boolean(dueDate) !== Boolean(dueTime)) { showNotice("Completa la fecha y la hora de entrega."); return; }
    if (!Object.values(delivery).some(Boolean)) { showNotice("Selecciona al menos un tipo de entrega."); return; }
    if (maxFileSize < 1 || maxFileSize > 200) { showNotice("El tamaño máximo debe estar entre 1 y 200 MB."); return; }
    if (deliveryTypes.some(type => delivery[type.key] && type.formats.length > 0 && !type.formats.some(format => formats.includes(format)))) {
      showNotice("Selecciona un formato para cada tipo de archivo habilitado.");
      return;
    }

    if (graded && rubricDraft?.tipo === "criterios" &&
        rubricDraft.criterios.reduce((total, criterion) => total + Math.round(criterion.puntaje_maximo * 100), 0) !== Math.round(maxGrade * 100)) {
      showNotice("Ajusta la rúbrica para que coincida con la puntuación máxima.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const fechaLimite = editing && dueDate === loadedDeadline.current.date && dueTime === loadedDeadline.current.time
        ? loadedDeadline.current.iso : dueDate ? new Date(`${dueDate}T${dueTime}`).toISOString() : null;
      const data = {
        titulo: title.trim(), descripcion: description, estado: mode,
        fecha_limite: fechaLimite, intentos_permitidos: attempts,
        calificada: graded, puntaje_maximo: maxGrade, tamano_maximo_mb: maxFileSize,
        permitir_archivo: delivery.archivo, permitir_enlace: delivery.enlace,
        permitir_imagen: delivery.imagen, permitir_video: delivery.video,
        formatos_permitidos: formats.filter(format => formatOptions.includes(format)).map(format => format.toLowerCase()),
        rubrica: !graded ? null : editing && !rubricChanged ? { tipo: "conservar" } : rubricDraft?.tipo === "pdf" ? { tipo: "pdf" } : rubricDraft,
      };
      let body: string | FormData = JSON.stringify(data);
      if (graded && rubricDraft?.tipo === "pdf") {
        const form = new FormData();
        form.append("datos", body);
        form.append("rubrica", rubricDraft.archivo);
        body = form;
      }
      const endpoint = editing ? `${contentId}/configuracion` : `modulos/${activityModuleId}`;
      const response = await fetch(`${API_URL}/actividades/docente/${course.id}/${endpoint}`, {
        method: editing ? "PUT" : "POST", credentials: "include", body,
        ...(typeof body === "string" ? { headers: { "Content-Type": "application/json" } } : {}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "No se pudo guardar la actividad.");
      if (result.aviso) window.alert(result.aviso);
      router.push(backHref);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo guardar la actividad.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-3 py-3 lg:px-5">
      <div className="mx-auto max-w-[1000px]">
        <Link href={backHref} className="app-back-link mb-3">
          <span aria-hidden="true">{"<"}</span>

          Volver a cursos
        </Link>

        <CourseHeader courseId={course.id} nombre={course.nombre} imagen={course.imagen} fetchIfMissing={false} />

        <CourseTabs role="docente" courseId={course.id} active="contenido" interactive={false} />

        <h1 className="mb-3 mt-5 text-2xl font-semibold text-talentia-primary">{editing ? "Editar actividad" : "Crear actividad"}</h1>
        {loading && <p role="status" className="mb-3 text-sm text-talentia-primary">Cargando configuración...</p>}
        {loadError && <p role="alert" className="mb-3 text-sm text-talentia-danger">{loadError}</p>}

        <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-5 border-t border-talentia-border bg-talentia-surface p-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.95fr)]">
          <section className="min-w-0">
            <h2 className="mb-4 text-base font-semibold text-talentia-primary">Información de la actividad</h2>
            <label htmlFor="activity-title" className="block text-sm font-medium text-talentia-primary">Título:</label>
            <input
              id="activity-title"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-talentia-border bg-talentia-surface px-3 text-sm text-talentia-primary outline-none focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
            />

            <label htmlFor="activity-description" className="mt-4 block text-sm font-medium text-talentia-primary">Descripción e Instrucciones:</label>
            <textarea
              id="activity-description"
              maxLength={20000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1.5 h-40 w-full resize-y rounded-md border border-talentia-border bg-talentia-surface p-3 text-sm text-talentia-primary outline-none focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
            />

            <div className="mt-5 border-t border-talentia-border pt-4">
              <h2 className="text-base font-semibold text-talentia-primary">Entregas permitidas</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {deliveryTypes.map(({ label, key }) => {
                  const enabled = delivery[key];
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setDelivery(current => ({ ...current, [key]: !current[key] }))}
                      aria-pressed={enabled}
                      className={`flex h-11 min-w-0 items-center gap-2 rounded-md border px-2 text-left text-xs font-medium text-talentia-primary transition focus-visible:outline-2 focus-visible:outline-talentia-blue ${enabled ? "border-talentia-border bg-talentia-selected hover:bg-talentia-hover" : "border-talentia-border bg-talentia-surface hover:bg-talentia-hover"}`}
                    >
                      <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-xs ${enabled ? "border-talentia-blue bg-talentia-action text-white" : "border-talentia-border bg-talentia-surface"}`}>{enabled ? "✓" : ""}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {formatOptions.length > 0 && <div className="mt-4">
              <div className="text-sm font-medium text-talentia-primary">Formatos permitidos:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formatOptions.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleFormat(format)}
                    aria-pressed={formats.includes(format)}
                    className={`flex h-9 items-center gap-1.5 rounded-md border px-2 text-xs transition focus-visible:outline-2 focus-visible:outline-talentia-blue ${formats.includes(format) ? "border-talentia-border bg-talentia-surface text-talentia-primary hover:border-talentia-blue" : "border-talentia-border bg-talentia-surface text-talentia-muted hover:bg-talentia-hover"}`}
                  >
                    <span aria-hidden="true" className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border text-[10px] ${formats.includes(format) ? "border-talentia-blue bg-talentia-action text-white" : "border-talentia-border bg-talentia-surface"}`}>{formats.includes(format) ? "✓" : ""}</span>
                    {format}
                  </button>
                ))}
              </div>
            </div>}

            {formatOptions.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-talentia-primary">
              <label htmlFor="activity-max-file-size">Tamaño máximo por archivo:</label>
              <div className="flex h-10 items-center overflow-hidden rounded-md border border-talentia-border bg-talentia-surface focus-within:border-talentia-blue">
                <input
                  id="activity-max-file-size"
                  type="number"
                  min={1}
                  max={200}
                  value={maxFileSize}
                  onChange={(event) => setMaxFileSize(Math.max(1, Number(event.target.value) || 1))}
                  className="h-full w-16 bg-transparent px-2 text-center text-sm outline-none"
                />
                <span className="flex h-full items-center border-l border-talentia-border bg-talentia-surface px-3 text-xs">MB</span>
              </div>
            </div>}
          </section>

          <aside className="min-w-0 space-y-4 lg:border-l lg:border-talentia-border lg:pl-5">
            <div className="border-b border-talentia-border pb-4">
              <h2 className="text-base font-semibold text-talentia-primary">Fecha y condiciones de entrega</h2>

              <div className="mt-4 space-y-4 text-sm text-talentia-primary">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label htmlFor="activity-due-date" className="mb-1.5 block text-xs font-medium">Fecha de Entrega:</label>
                    <div className="flex h-10 w-full min-w-0 items-center rounded-md border border-talentia-border bg-talentia-surface px-2 focus-within:border-talentia-blue">
                      <input id="activity-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="min-w-0 w-full bg-transparent text-xs outline-none" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="activity-due-time" className="mb-1.5 block text-xs font-medium">Hora de Entrega:</label>
                    <input id="activity-due-time" type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} className="h-10 w-full min-w-0 rounded-md border border-talentia-border bg-talentia-surface px-2 text-xs outline-none focus:border-talentia-blue" />
                  </div>
                </div>

                <div>
                  <label htmlFor="activity-attempts" className="mb-1.5 block text-xs font-medium">Intentos Permitidos:</label>
                  <select id="activity-attempts" value={attempts} onChange={(event) => setAttempts(Number(event.target.value))} className="h-10 w-full rounded-md border border-talentia-border bg-talentia-surface px-3 text-sm outline-none focus:border-talentia-blue">
                    {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} {value === 1 ? "Intento" : "Intentos"}</option>)}
                  </select>
                </div>

                <h2 className="border-t border-talentia-border pt-4 text-base font-semibold text-talentia-primary">Calificación</h2>
                <div className="flex items-center justify-between gap-3">
                  <span>Es una actividad calificada?</span>
                  <button type="button" onClick={() => setGraded((value) => !value)} className="flex shrink-0 items-center gap-1.5 rounded focus-visible:outline-2 focus-visible:outline-talentia-blue" aria-label="Actividad calificada" aria-pressed={graded}>
                    <span className="text-xs text-talentia-primary">No</span>
                    <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${graded ? "justify-end bg-talentia-blue" : "justify-start bg-talentia-selected"}`}>
                      <span className="h-5 w-5 rounded-full bg-talentia-surface shadow-sm" />
                    </span>
                    <span className="text-xs text-talentia-primary">Sí</span>
                  </button>
                </div>

                {graded && (
                  <div className="flex items-center justify-between gap-2">
                    <span>Puntuación Máxima:</span>
                    <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-md border border-talentia-border bg-talentia-surface">
                      <button type="button" aria-label="Disminuir puntuación máxima" onClick={() => setMaxGrade((value) => Math.max(0, value - 1))} className="h-full w-9 text-talentia-primary hover:bg-talentia-hover">−</button>
                      <span className="flex h-full w-10 items-center justify-center border-x border-talentia-border bg-talentia-surface text-sm">{maxGrade}</span>
                      <button type="button" aria-label="Aumentar puntuación máxima" onClick={() => setMaxGrade((value) => Math.min(100, value + 1))} className="h-full w-9 text-talentia-primary hover:bg-talentia-hover">+</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {graded && (
              <div className="border-b border-talentia-border pb-4">
                <h2 className="text-base font-semibold text-talentia-primary">Rúbrica de evaluación (opcional)</h2>
                <button type="button" onClick={() => setRubricModalOpen(true)} className="mt-3 flex min-h-10 w-fit max-w-full items-center justify-center gap-2 rounded-md border border-talentia-blue bg-talentia-surface px-4 py-2 text-sm font-medium text-talentia-blue hover:bg-talentia-hover">
                  <PlusIcon />
                  {rubricDraft || storedPDF ? "Cambiar tipo de rúbrica" : "Añadir rúbrica"}
                </button>
                {(rubricDraft || storedPDF) && (
                  <div className="mt-3 min-w-0 text-sm">
                    <p className="break-words text-talentia-primary">
                      {storedPDF ? `PDF guardado: ${storedPDF.nombre_archivo}` : rubricDraft?.tipo === "pdf" ? `PDF preparado: ${rubricDraft.archivo.name}` : `${rubricDraft?.tipo === "criterios" ? rubricDraft.criterios.length : 0} criterios ${editing && !rubricChanged ? "guardados" : "preparados"}`}
                    </p>
                    {(!editing || rubricChanged) && <p className="mt-1 text-xs text-talentia-muted">Pendiente de guardar con la actividad</p>}
                    <div className="mt-2 flex flex-wrap gap-3">
                      {storedPDF && <a href={`${API_URL}/actividades/${course.id}/${contentId}/rubrica`} target="_blank" rel="noreferrer" className="font-medium text-talentia-blue hover:underline">Descargar PDF</a>}
                      <button type="button" onClick={() => setRubricEditorType(storedPDF ? "pdf" : rubricDraft?.tipo ?? "pdf")} className="font-medium text-talentia-blue hover:underline">
                        {storedPDF || rubricDraft?.tipo === "pdf" ? "Reemplazar PDF" : "Editar criterios"}
                      </button>
                      <button type="button" onClick={() => { setRubricDraft(null); setRubricChanged(true); }} className="font-medium text-talentia-danger hover:underline">Quitar rúbrica</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-talentia-border bg-talentia-surface p-4">
          <Link href={backHref} aria-disabled={saving} onClick={event => { if (saving) event.preventDefault(); }} className="flex h-10 items-center justify-center rounded-md bg-talentia-surface px-4 text-sm font-semibold text-talentia-primary hover:bg-talentia-border">Cancelar</Link>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {needsDeadline && !loading && <p role="status" className="text-xs text-talentia-muted">{editing ? "Para guardar una actividad publicada debes indicar fecha y hora de entrega." : "Indica la fecha y la hora de entrega para poder publicar."}</p>}
            {editing ? (
              <button type="button" disabled={busy || needsDeadline} title={needsDeadline ? "Indica la fecha y la hora de entrega" : undefined} onClick={() => submit(saveMode)} className="min-h-10 rounded-md bg-talentia-action px-5 py-2 text-sm font-semibold text-white hover:bg-talentia-primary disabled:opacity-50">{saving ? "Guardando..." : "Guardar cambios"}</button>
            ) : <>
              <button type="button" disabled={busy} onClick={() => submit("Borrador")} className="min-h-10 rounded-md border border-talentia-border bg-talentia-surface px-4 py-2 text-sm font-medium text-talentia-primary hover:bg-talentia-hover disabled:opacity-50">{saving ? "Guardando…" : "Guardar como borrador"}</button>
              <button type="button" disabled={busy || needsDeadline} title={needsDeadline ? "Indica la fecha y la hora de entrega para publicar" : undefined} onClick={() => submit("Publicado")} className="min-h-10 rounded-md bg-talentia-action px-5 py-2 text-sm font-semibold text-white hover:bg-talentia-primary disabled:opacity-50">Publicar</button>
            </>}
          </div>
        </div>
      </div>

      <RubricTypeModal
        open={rubricModalOpen}
        onClose={() => setRubricModalOpen(false)}
        onSkip={() => {
          setRubricDraft(null);
          setRubricChanged(true);
          setRubricModalOpen(false);
        }}
        onSelect={(type) => {
          setRubricEditorType(type);
          setRubricModalOpen(false);
        }}
      />

      {rubricEditorType && (
        <RubricEditorModal
          type={rubricEditorType}
          draft={rubricDraft?.tipo === rubricEditorType ? rubricDraft : null}
          maxGrade={maxGrade}
          onClose={() => setRubricEditorType(null)}
          onConfirm={(draft) => {
            setRubricDraft(draft);
            setRubricChanged(true);
            setRubricEditorType(null);
          }}
        />
      )}

      {notice && (
        <div className="fixed bottom-5 right-5 z-[140] rounded-lg bg-talentia-action px-4 py-2.5 text-[11px] font-medium text-white shadow-xl">
          {notice}
        </div>
      )}
    </div>
  );
}

