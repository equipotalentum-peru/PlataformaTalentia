"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import type { Course } from "@/data/courses";


import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
import RubricTypeModal from "./modals/RubricTypeModal";
import RubricEditorModal, { type RubricDraft } from "./modals/RubricEditorModal";
type CreateActivityProps = {
  course: Course;
  moduleId?: string;
};

const deliveryTypes = [
  { label: "Archivo", key: "archivo", formats: ["PDF", "DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX", "ZIP", "RAR"] },
  { label: "Enlace", key: "enlace", formats: [] },
  { label: "Imagen", key: "imagen", formats: ["PNG", "JPG", "JPEG"] },
  { label: "Video", key: "video", formats: ["MP4"] },
] as const;

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function CreateActivity({ course, moduleId }: CreateActivityProps) {
  const router = useRouter();
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
  const [status, setStatus] = useState<"Oculto" | "Publicado">("Publicado");
  const [formats, setFormats] = useState(["PDF", "DOC", "DOCX", "PPT", "PPTX", "PNG", "JPG", "RAR", "MP4"]);
  const [maxFileSize, setMaxFileSize] = useState(200);
  const [notice, setNotice] = useState("");
  const formatOptions: string[] = deliveryTypes.flatMap(type => delivery[type.key] ? [...type.formats] : []);

  const backHref = moduleId
    ? `/docente/cursos/${course.id}?moduleId=${encodeURIComponent(moduleId)}`
    : `/docente/cursos/${course.id}`;

  const toggleFormat = (format: string) => {
    setFormats((current) => current.includes(format) ? current.filter((item) => item !== format) : [...current, format]);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const submit = async (mode: "Borrador" | "Publicado") => {
    if (savingRef.current) return;
    if (!moduleId || !Number.isSafeInteger(Number(moduleId)) || Number(moduleId) <= 0) {
      showNotice("Selecciona un módulo antes de crear la actividad.");
      return;
    }
    if (!title.trim()) {
      showNotice("Escribe un título para la actividad.");
      return;
    }
    if (Boolean(dueDate) !== Boolean(dueTime)) { showNotice("Completa la fecha y la hora de entrega."); return; }
    if (!Object.values(delivery).some(Boolean)) { showNotice("Selecciona al menos un tipo de entrega."); return; }
    if (maxFileSize < 1 || maxFileSize > 200) { showNotice("El tamaño máximo debe estar entre 1 y 200 MB."); return; }
    if (deliveryTypes.some(type => delivery[type.key] && type.formats.length > 0 && !type.formats.some(format => formats.includes(format)))) {
      showNotice("Selecciona un formato para cada tipo de archivo habilitado.");
      return;
    }

    if (rubricDraft?.tipo === "criterios" &&
        rubricDraft.criterios.reduce((total, criterion) => total + Math.round(criterion.puntaje_maximo * 100), 0) !== Math.round(maxGrade * 100)) {
      showNotice("Ajusta la rúbrica para que coincida con la puntuación máxima.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const fechaLimite = dueDate ? new Date(`${dueDate}T${dueTime}`).toISOString() : null;
      const data = {
        titulo: title.trim(), descripcion: description, estado: mode,
        fecha_limite: fechaLimite, intentos_permitidos: attempts,
        calificada: graded, puntaje_maximo: maxGrade, tamano_maximo_mb: maxFileSize,
        permitir_archivo: delivery.archivo, permitir_enlace: delivery.enlace,
        permitir_imagen: delivery.imagen, permitir_video: delivery.video,
        formatos_permitidos: formats.filter(format => formatOptions.includes(format)).map(format => format.toLowerCase()),
        rubrica: rubricDraft?.tipo === "pdf" ? { tipo: "pdf" } : rubricDraft,
      };
      let body: string | FormData = JSON.stringify(data);
      if (rubricDraft?.tipo === "pdf") {
        const form = new FormData();
        form.append("datos", body);
        form.append("rubrica", rubricDraft.archivo);
        body = form;
      }
      const response = await fetch(`${API_URL}/actividades/docente/${course.id}/modulos/${moduleId}`, {
        method: "POST", credentials: "include", body,
        ...(typeof body === "string" ? { headers: { "Content-Type": "application/json" } } : {}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "No se pudo guardar la actividad.");
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
        <Link href={backHref} className="mb-2 flex w-fit items-center gap-1.5 text-[11px] font-medium text-gray-700 hover:text-[#3186d8]">
          <BackIcon />
          Volver a cursos
        </Link>

        <CourseHeader courseId={course.id} nombre={course.nombre} imagen={course.imagen} fetchIfMissing={false} />

        <CourseTabs role="docente" courseId={course.id} active="contenido" interactive={false} />

        <h1 className="mb-3 mt-5 text-2xl font-semibold text-gray-800">Crear actividad</h1>

        <fieldset disabled={saving} className="grid min-w-0 grid-cols-1 gap-5 border-t border-[#d9e2ec] bg-white p-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.95fr)]">
          <section className="min-w-0">
            <h2 className="mb-4 text-base font-semibold text-[#3186d8]">Información de la actividad</h2>
            <label htmlFor="activity-title" className="block text-sm font-medium text-gray-700">Título:</label>
            <input
              id="activity-title"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-[#cfd9e6] bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#3186d8] focus:ring-2 focus:ring-[#3186d8]/15"
            />

            <label htmlFor="activity-description" className="mt-4 block text-sm font-medium text-gray-700">Descripción e Instrucciones:</label>
            <textarea
              id="activity-description"
              maxLength={20000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1.5 h-40 w-full resize-y rounded-md border border-[#cfd9e6] bg-white p-3 text-sm text-gray-800 outline-none focus:border-[#3186d8] focus:ring-2 focus:ring-[#3186d8]/15"
            />

            <div className="mt-5 border-t border-[#d9e2ec] pt-4">
              <h2 className="text-base font-semibold text-[#3186d8]">Entregas permitidas</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {deliveryTypes.map(({ label, key }) => {
                  const enabled = delivery[key];
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setDelivery(current => ({ ...current, [key]: !current[key] }))}
                      aria-pressed={enabled}
                      className={`flex h-11 min-w-0 items-center gap-2 rounded-md border px-2 text-left text-xs font-medium text-gray-800 transition focus-visible:outline-2 focus-visible:outline-[#0fb4b7] ${enabled ? "border-[#bce9ed] bg-[#e7f7f8] hover:bg-[#d5f0f2]" : "border-[#cfd9e6] bg-white hover:bg-gray-50"}`}
                    >
                      <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-xs ${enabled ? "border-[#0fb4b7] bg-[#0fb4b7] text-white" : "border-[#aebbc9] bg-white"}`}>{enabled ? "✓" : ""}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {formatOptions.length > 0 && <div className="mt-4">
              <div className="text-sm font-medium text-gray-700">Formatos permitidos:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formatOptions.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleFormat(format)}
                    aria-pressed={formats.includes(format)}
                    className={`flex h-9 items-center gap-1.5 rounded-md border px-2 text-xs transition focus-visible:outline-2 focus-visible:outline-[#3186d8] ${formats.includes(format) ? "border-[#cfd9e6] bg-[#f8fafc] text-gray-800 hover:border-[#3186d8]" : "border-[#e1e5e9] bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    <span aria-hidden="true" className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border text-[10px] ${formats.includes(format) ? "border-[#3186d8] bg-[#3186d8] text-white" : "border-[#aebbc9] bg-white"}`}>{formats.includes(format) ? "✓" : ""}</span>
                    {format}
                  </button>
                ))}
              </div>
            </div>}

            {formatOptions.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <label htmlFor="activity-max-file-size">Tamaño máximo por archivo:</label>
              <div className="flex h-10 items-center overflow-hidden rounded-md border border-[#cfd9e6] bg-white focus-within:border-[#3186d8]">
                <input
                  id="activity-max-file-size"
                  type="number"
                  min={1}
                  max={200}
                  value={maxFileSize}
                  onChange={(event) => setMaxFileSize(Math.max(1, Number(event.target.value) || 1))}
                  className="h-full w-16 bg-transparent px-2 text-center text-sm outline-none"
                />
                <span className="flex h-full items-center border-l border-[#cfd9e6] bg-[#f8fafc] px-3 text-xs">MB</span>
              </div>
            </div>}
          </section>

          <aside className="min-w-0 space-y-4 lg:border-l lg:border-[#d9e2ec] lg:pl-5">
            <div className="border-b border-[#d9e2ec] pb-4">
              <h2 className="text-base font-semibold text-[#3186d8]">Fecha y condiciones de entrega</h2>

              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label htmlFor="activity-due-date" className="mb-1.5 block text-xs font-medium">Fecha de Entrega:</label>
                    <div className="flex h-10 w-full min-w-0 items-center rounded-md border border-[#cfd9e6] bg-white px-2 focus-within:border-[#3186d8]">
                      <input id="activity-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="min-w-0 w-full bg-transparent text-xs outline-none" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="activity-due-time" className="mb-1.5 block text-xs font-medium">Hora de Entrega:</label>
                    <input id="activity-due-time" type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} className="h-10 w-full min-w-0 rounded-md border border-[#cfd9e6] bg-white px-2 text-xs outline-none focus:border-[#3186d8]" />
                  </div>
                </div>

                <div>
                  <label htmlFor="activity-attempts" className="mb-1.5 block text-xs font-medium">Intentos Permitidos:</label>
                  <select id="activity-attempts" value={attempts} onChange={(event) => setAttempts(Number(event.target.value))} className="h-10 w-full rounded-md border border-[#cfd9e6] bg-white px-3 text-sm outline-none focus:border-[#3186d8]">
                    {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} {value === 1 ? "Intento" : "Intentos"}</option>)}
                  </select>
                </div>

                <h2 className="border-t border-[#d9e2ec] pt-4 text-base font-semibold text-[#3186d8]">Calificación</h2>
                <div className="flex items-center justify-between gap-3">
                  <span>Es una actividad calificada?</span>
                  <button type="button" onClick={() => setGraded((value) => !value)} className="flex shrink-0 items-center gap-1.5 rounded focus-visible:outline-2 focus-visible:outline-[#0fb4b7]" aria-label="Actividad calificada" aria-pressed={graded}>
                    <span className="text-xs text-gray-600">No</span>
                    <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${graded ? "justify-end bg-[#0fb4b7]" : "justify-start bg-[#cfd9e6]"}`}>
                      <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                    </span>
                    <span className="text-xs text-gray-600">Sí</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span>Puntuación Máxima:</span>
                  <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-md border border-[#cfd9e6] bg-[#f8fafc]">
                    <button type="button" aria-label="Disminuir puntuación máxima" onClick={() => setMaxGrade((value) => Math.max(0, value - 1))} className="h-full w-9 text-gray-600 hover:bg-[#e7eaed]">−</button>
                    <span className="flex h-full w-10 items-center justify-center border-x border-[#cfd9e6] bg-white text-sm">{maxGrade}</span>
                    <button type="button" aria-label="Aumentar puntuación máxima" onClick={() => setMaxGrade((value) => Math.min(100, value + 1))} className="h-full w-9 text-gray-600 hover:bg-[#e7eaed]">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-[#d9e2ec] pb-4">
              <h2 className="text-base font-semibold text-[#3186d8]">Rúbrica de evaluación (opcional)</h2>
              <button type="button" onClick={() => setRubricModalOpen(true)} className="mt-3 flex min-h-10 w-fit max-w-full items-center justify-center gap-2 rounded-md border border-[#3186d8] bg-white px-4 py-2 text-sm font-medium text-[#3186d8] hover:bg-[#eff7ff]">
                <PlusIcon />
                {rubricDraft ? "Cambiar tipo de rúbrica" : "Añadir rúbrica"}
              </button>
              {rubricDraft && (
                <div className="mt-3 min-w-0 text-sm">
                  <p className="break-words text-gray-700">
                    {rubricDraft.tipo === "pdf" ? `PDF preparado: ${rubricDraft.archivo.name}` : `${rubricDraft.criterios.length} criterios preparados`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Pendiente de guardar con la actividad</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button type="button" onClick={() => setRubricEditorType(rubricDraft.tipo)} className="font-medium text-[#3186d8] hover:underline">
                      {rubricDraft.tipo === "pdf" ? "Reemplazar PDF" : "Editar criterios"}
                    </button>
                    <button type="button" onClick={() => setRubricDraft(null)} className="font-medium text-red-600 hover:underline">Quitar rúbrica</button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#3186d8]">Visibilidad</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-700">
                {(["Oculto", "Publicado"] as const).map((value) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="activity-status" value={value} checked={status === value} onChange={() => setStatus(value)} className="h-4 w-4 accent-[#3186d8]" />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#d9e2ec] bg-white p-4">
          <Link href={backHref} aria-disabled={saving} onClick={event => { if (saving) event.preventDefault(); }} className="flex h-10 items-center justify-center rounded-md bg-[#efe6fa] px-4 text-sm font-semibold text-[#4b5fa7] hover:bg-[#e7dcf4]">Cancelar</Link>
          <div className="ml-auto flex flex-wrap gap-3">
            <button type="button" disabled={saving} onClick={() => submit("Borrador")} className="min-h-10 rounded-md border border-[#cfd9e6] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">{saving ? "Guardando…" : "Guardar como borrador"}</button>
            <button type="button" disabled={saving || status !== "Publicado"} title={status === "Oculto" ? "Selecciona Publicado para publicar" : undefined} onClick={() => submit("Publicado")} className="min-h-10 rounded-md bg-[#3186d8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2777c1] disabled:opacity-50">Publicar</button>
          </div>
        </div>
      </div>

      <RubricTypeModal
        open={rubricModalOpen}
        onClose={() => setRubricModalOpen(false)}
        onSkip={() => {
          setRubricDraft(null);
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
            setRubricEditorType(null);
          }}
        />
      )}

      {notice && (
        <div className="fixed bottom-5 right-5 z-[140] rounded-lg bg-[#163f66] px-4 py-2.5 text-[11px] font-medium text-white shadow-xl">
          {notice}
        </div>
      )}
    </div>
  );
}
