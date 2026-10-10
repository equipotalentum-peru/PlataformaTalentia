"use client";

import Link from "next/link";
import { useState } from "react";
import type { Course } from "@/data/courses";


import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
type CreateActivityProps = {
  course: Course;
  moduleId?: string;
};

const formatOptions = ["PDF", "DOC", "DOCX", "PPT", "PPTX", "XLS", "PNG", "RAR"];

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [attempts, setAttempts] = useState(1);
  const [graded, setGraded] = useState(true);
  const [maxGrade, setMaxGrade] = useState(20);
  const [rubric, setRubric] = useState(false);
  const [status, setStatus] = useState<"Oculto" | "Publicado">("Oculto");
  const [formats, setFormats] = useState(["PDF", "DOC", "DOCX", "PPT", "PPTX", "PNG", "JPG", "RAR"]);
  const [maxFileSize, setMaxFileSize] = useState(200);
  const [notice, setNotice] = useState("");

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

  const submit = (mode: "Borrador" | "Publicado") => {
    if (!title.trim()) {
      showNotice("Escribe un título para la actividad.");
      return;
    }

    showNotice(mode === "Publicado" ? "Actividad publicada (vista previa)." : "Actividad guardada como borrador (vista previa).");
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

        <div className="grid grid-cols-1 gap-3 py-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.95fr)]">
          <section className="rounded-md bg-white p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
            <label htmlFor="activity-title" className="block text-[10px] font-medium text-[#3186d8]">Título:</label>
            <input
              id="activity-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-[#e7eaee] bg-[#f1f1f1] px-2 text-[11px] outline-none focus:border-[#3186d8]"
            />

            <label htmlFor="activity-description" className="mt-2 block text-[10px] font-medium text-[#3186d8]">Descripción e Instrucciones:</label>
            <textarea
              id="activity-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 h-[143px] w-full resize-none rounded-md border border-[#e7eaee] bg-[#f1f1f1] p-2 text-[10px] outline-none focus:border-[#3186d8]"
            />

            <div className="mt-3">
              <h2 className="text-[10px] font-medium text-[#3186d8]">Configuración:</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["Archivo", "Enlace", "Imagen", "Video"].map((label) => {
                  const enabled = label !== "Video" || true;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => showNotice(`${label}: ${enabled ? "habilitado" : "deshabilitado"}.`)}
                      className="flex h-8 items-center gap-1.5 rounded-md bg-[#f1f1f1] px-2 text-left text-[9px] text-gray-700 ring-1 ring-[#e0e4e9] hover:bg-[#e9edf1]"
                    >
                      <span className="flex h-3 w-3 items-center justify-center rounded-[2px] border border-gray-500 bg-white text-[8px]">✓</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-md bg-[#f1f1f1] p-2 ring-1 ring-[#e1e5e9]">
              <div className="text-[9px] font-medium text-gray-600">Formato de Archivos permitidos:</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {formatOptions.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleFormat(format)}
                    className={`rounded px-1.5 py-1 text-[8px] transition ${formats.includes(format) ? "bg-white text-gray-700 shadow-sm" : "bg-[#e3e5e7] text-gray-400 line-through"}`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] text-gray-700">
              <span className="text-[#3186d8]">Tamaño máximo por archivo:</span>
              <div className="flex h-7 items-center overflow-hidden rounded-md border border-[#e1e4e9] bg-[#f1f1f1]">
                <input
                  type="number"
                  min={1}
                  value={maxFileSize}
                  onChange={(event) => setMaxFileSize(Math.max(1, Number(event.target.value) || 1))}
                  className="h-full w-12 bg-transparent px-1.5 text-center text-[9px] outline-none"
                />
                <span className="flex h-full items-center border-l border-[#d9dde2] px-2 text-[8px]">MB</span>
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <div className="rounded-md bg-white p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
              <h2 className="text-[10px] font-medium text-[#3186d8]">Detalles de la Actividad:</h2>

              <div className="mt-3 space-y-2.5 text-[9px]">
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-[#3186d8]">Fecha de Entrega:</span>
                  <label className="flex h-7 w-[126px] items-center gap-1 rounded bg-[#f1f1f1] px-2 text-gray-500">
                    <CalendarIcon />
                    <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="min-w-0 bg-transparent text-[8px] outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-[#3186d8]">Hora de Entrega:</span>
                  <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} className="h-7 w-[126px] rounded bg-[#f1f1f1] px-2 text-[8px] outline-none" />
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-[#3186d8]">Intentos Permitidos:</span>
                  <select value={attempts} onChange={(event) => setAttempts(Number(event.target.value))} className="h-7 w-[126px] rounded bg-[#f1f1f1] px-2 text-[8px] outline-none">
                    {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} {value === 1 ? "Intento" : "Intentos"}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#3186d8]">Es una actividad calificada?</span>
                  <button type="button" onClick={() => setGraded((value) => !value)} className="flex items-center gap-1" aria-pressed={graded}>
                    <span className="text-[8px] text-gray-600">No</span>
                    <span className={`flex h-4 w-8 items-center rounded-full p-0.5 transition ${graded ? "justify-end bg-[#d8eaf7]" : "justify-start bg-[#dddddd]"}`}>
                      <span className={`h-3 w-3 rounded-full ${graded ? "bg-[#3186d8]" : "bg-white"}`} />
                    </span>
                    <span className="text-[8px] text-gray-600">Sí</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#3186d8]">Puntuación Máxima:</span>
                  <div className="flex h-7 items-center overflow-hidden rounded bg-[#f1f1f1]">
                    <button type="button" onClick={() => setMaxGrade((value) => Math.max(0, value - 1))} className="h-full w-7 text-gray-600 hover:bg-[#e7eaed]">−</button>
                    <span className="flex h-full w-8 items-center justify-center border-x border-[#d9dde2] text-[8px]">{maxGrade}</span>
                    <button type="button" onClick={() => setMaxGrade((value) => Math.min(100, value + 1))} className="h-full w-7 text-gray-600 hover:bg-[#e7eaed]">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-white p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
              <h2 className="text-[10px] font-medium text-[#3186d8]">Rúbrica de Evaluación:</h2>
              <button type="button" onClick={() => { setRubric((value) => !value); showNotice(!rubric ? "Rúbrica añadida." : "Rúbrica quitada."); }} className={`mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-[10px] font-semibold ${rubric ? "bg-[#b7e9c0] text-[#398b4e]" : "bg-[#aeddf7] text-[#3186d8]"}`}>
                <PlusIcon />
                {rubric ? "Rúbrica añadida" : "Añadir Rúbrica"}
              </button>
            </div>

            <div className="rounded-md bg-white p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
              <h2 className="text-[10px] font-medium text-[#3186d8]">Estado de la Actividad:</h2>
              <div className="mt-3 space-y-2 text-[9px] text-gray-700">
                {(["Oculto", "Publicado"] as const).map((value) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="activity-status" value={value} checked={status === value} onChange={() => setStatus(value)} className="h-3.5 w-3.5 accent-[#3186d8]" />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pb-3 pt-1">
          <Link href={backHref} className="flex h-8 items-center justify-center rounded-md bg-[#efe6fa] px-4 text-[10px] font-semibold text-[#4b5fa7] hover:bg-[#e7dcf4]">Cancelar</Link>
          <button type="button" onClick={() => submit("Borrador")} className="h-8 rounded-md bg-white px-4 text-[10px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50">Guardar como borrador</button>
          <button type="button" onClick={() => submit("Publicado")} className="h-8 rounded-md bg-[#3186d8] px-4 text-[10px] font-semibold text-white shadow-sm hover:bg-[#2777c1]">Publicar</button>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-5 right-5 z-[140] rounded-lg bg-[#163f66] px-4 py-2.5 text-[11px] font-medium text-white shadow-xl">
          {notice}
        </div>
      )}
    </div>
  );
}
