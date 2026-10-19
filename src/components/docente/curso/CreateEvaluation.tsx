"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Course } from "@/data/courses";


import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
type EvaluationQuestionType = "single" | "multiple" | "boolean";

type EvaluationOption = {
  id: string;
  text: string;
};

type EvaluationQuestion = {
  id: number;
  type: EvaluationQuestionType;
  prompt: string;
  points: number;
  options: EvaluationOption[];
};

type CreateEvaluationProps = {
  course: Course;
  moduleId?: string;
};

const DEFAULT_OPTIONS = [
  { id: "A", text: "" },
  { id: "B", text: "" },
  { id: "C", text: "" },
  { id: "D", text: "" },
];

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m7 10 5 5 5-5" />
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
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

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12h14" />
    </svg>
  );
}



function QuestionTypeLabel({ type }: { type: EvaluationQuestionType }) {
  if (type === "multiple") return "Selección múltiple";
  if (type === "boolean") return "Verdadero / Falso";
  return "Selección única";
}

function optionDefaults(type: EvaluationQuestionType): EvaluationOption[] {
  if (type === "boolean") {
    return [
      { id: "A", text: "Verdadero" },
      { id: "B", text: "Falso" },
    ];
  }
  return DEFAULT_OPTIONS.map((option) => ({ ...option }));
}

export default function CreateEvaluation({ course, moduleId }: CreateEvaluationProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evaluationType, setEvaluationType] = useState<EvaluationQuestionType>("single");
  const [duration, setDuration] = useState(40);
  const [attempts, setAttempts] = useState(1);
  const [totalPoints, setTotalPoints] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [graded, setGraded] = useState(true);
  const [notice, setNotice] = useState("");
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([
    {
      id: 1,
      type: "single",
      prompt: "",
      points: 2,
      options: optionDefaults("single"),
    },
  ]);

  const totalQuestionPoints = useMemo(
    () => questions.reduce((sum, question) => sum + Number(question.points || 0), 0),
    [questions]
  );

  const backHref = moduleId
    ? `/docente/cursos/${course.id}?moduleId=${encodeURIComponent(moduleId)}`
    : `/docente/cursos/${course.id}`;

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const updateQuestion = (questionId: number, patch: Partial<EvaluationQuestion>) => {
    setQuestions((current) =>
      current.map((question) => (question.id === questionId ? { ...question, ...patch } : question))
    );
  };

  const updateQuestionType = (questionId: number, type: EvaluationQuestionType) => {
    updateQuestion(questionId, { type, options: optionDefaults(type) });
  };

  const updateOption = (questionId: number, optionId: string, text: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id !== questionId
          ? question
          : {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, text } : option
              ),
            }
      )
    );
  };

  const addOption = (questionId: number) => {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || question.type === "boolean") return question;
        if (question.options.length >= 6) return question;
        const nextLetter = String.fromCharCode(65 + question.options.length);
        return {
          ...question,
          options: [...question.options, { id: nextLetter, text: "" }],
        };
      })
    );
  };

  const removeOption = (questionId: number, optionId: string) => {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || question.options.length <= 2) return question;
        return {
          ...question,
          options: question.options.filter((option) => option.id !== optionId),
        };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((question) => question.id)) + 1,
        type: evaluationType,
        prompt: "",
        points: 2,
        options: optionDefaults(evaluationType),
      },
    ]);
  };

  const removeQuestion = (questionId: number) => {
    if (questions.length <= 1) return;
    setQuestions((current) => current.filter((question) => question.id !== questionId));
  };

  const submit = (status: "Borrador" | "Publicado") => {
    if (!title.trim()) {
      showNotice("Escribe un título para la evaluación.");
      return;
    }

    if (questions.some((question) => !question.prompt.trim())) {
      showNotice("Completa el enunciado de todas las preguntas.");
      return;
    }

    showNotice(status === "Publicado" ? "Evaluación publicada (vista previa)." : "Evaluación guardada como borrador (vista previa).");
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

        <div className="grid grid-cols-1 gap-3 py-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(290px,1fr)]">
          <section className="rounded-md bg-talentia-surface p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
              <div>
                <label htmlFor="evaluation-title" className="mb-1 block text-[10px] font-medium text-talentia-blue">Título:</label>
                <input
                  id="evaluation-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-8 w-full rounded-md border border-talentia-border bg-talentia-surface px-2 text-[11px] outline-none focus:border-talentia-blue"
                />

                <label htmlFor="evaluation-description" className="mb-1 mt-2 block text-[10px] font-medium text-talentia-blue">Descripción e Instrucciones:</label>
                <textarea
                  id="evaluation-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-[74px] w-full resize-none rounded-md border border-talentia-border bg-talentia-surface p-2 text-[10px] outline-none focus:border-talentia-blue"
                />
              </div>

              <div>
                <label htmlFor="evaluation-type" className="mb-1 block text-[10px] font-medium text-talentia-blue">Tipo de Evaluación:</label>
                <div className="relative">
                  <select
                    id="evaluation-type"
                    value={evaluationType}
                    onChange={(event) => setEvaluationType(event.target.value as EvaluationQuestionType)}
                    className="h-10 w-full appearance-none rounded-md border border-talentia-border bg-talentia-surface px-3 text-[10px] outline-none focus:border-talentia-blue"
                  >
                    <option value="single">Práctica</option>
                    <option value="multiple">Selección múltiple</option>
                    <option value="boolean">Verdadero / Falso</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-3 text-talentia-muted"><ChevronDownIcon /></span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <h2 className="text-[10px] font-semibold text-talentia-primary">Preguntas:</h2>
              <span className="text-[8px] text-talentia-muted">{questions.length} preguntas · {totalQuestionPoints} pts</span>
            </div>

            <div className="mt-2 space-y-2.5">
              {questions.map((question) => (
                <div key={question.id} className="rounded-md border border-talentia-border bg-talentia-surface">
                  <div className="flex items-center gap-1.5 rounded-t-md bg-talentia-selected px-2 py-1">
                    <span className="flex-1 text-[9px] font-semibold text-talentia-blue">Pregunta {question.id}</span>
                    <select
                      value={question.type}
                      onChange={(event) => updateQuestionType(question.id, event.target.value as EvaluationQuestionType)}
                      className="h-5 rounded border border-white/80 bg-talentia-surface/80 px-1 text-[8px] text-talentia-primary outline-none"
                      aria-label={`Tipo de pregunta ${question.id}`}
                    >
                      <option value="single">Selección única</option>
                      <option value="multiple">Selección múltiple</option>
                      <option value="boolean">Verdadero / Falso</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="flex h-5 w-5 items-center justify-center rounded bg-talentia-danger-bg text-talentia-danger hover:bg-talentia-danger-bg disabled:opacity-40"
                      disabled={questions.length === 1}
                      aria-label={`Eliminar pregunta ${question.id}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <div className="p-2">
                    <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
                      <div>
                        <label htmlFor={`question-${question.id}`} className="block text-[8px] font-medium text-talentia-blue">Enunciado:</label>
                        <input
                          id={`question-${question.id}`}
                          value={question.prompt}
                          onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
                          className="mt-1 h-7 w-full rounded border border-talentia-border bg-talentia-surface px-2 text-[9px] outline-none focus:border-talentia-blue"
                        />
                      </div>
                      <div>
                        <label htmlFor={`points-${question.id}`} className="block text-[8px] font-medium text-talentia-blue">Pts</label>
                        <input
                          id={`points-${question.id}`}
                          type="number"
                          min={0}
                          max={100}
                          value={question.points}
                          onChange={(event) => updateQuestion(question.id, { points: Math.max(0, Number(event.target.value) || 0) })}
                          className="mt-1 h-7 w-full rounded border border-talentia-border bg-talentia-surface px-1 text-center text-[9px] outline-none focus:border-talentia-blue"
                        />
                      </div>
                    </div>

                    <div className="mt-1.5 text-[8px] text-talentia-blue">Opciones de Respuesta:</div>
                    <div className="mt-1 space-y-1">
                      {question.options.map((option) => (
                        <div key={option.id} className="grid grid-cols-[16px_18px_minmax(0,1fr)_16px] items-center gap-1">
                          <span className="h-3 w-3 rounded-full border border-talentia-border" />
                          <span className="text-[8px] text-talentia-primary">{option.id}</span>
                          <input
                            aria-label={`Opción ${option.id} de pregunta ${question.id}`}
                            value={option.text}
                            onChange={(event) => updateOption(question.id, option.id, event.target.value)}
                            className="h-5 rounded border border-talentia-border bg-talentia-surface px-1.5 text-[8px] outline-none focus:border-talentia-blue"
                            disabled={question.type === "boolean"}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            disabled={question.type === "boolean" || question.options.length <= 2}
                            className="flex h-4 w-4 items-center justify-center text-talentia-danger hover:text-talentia-danger disabled:opacity-30"
                            aria-label={`Eliminar opción ${option.id}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    </div>

                    {question.type !== "boolean" && (
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="mt-2 flex h-6 items-center gap-1 rounded bg-talentia-selected px-2.5 text-[8px] font-semibold text-talentia-blue hover:bg-talentia-hover disabled:opacity-40"
                        disabled={question.options.length >= 6}
                      >
                        <PlusIcon />
                        Añadir Opción
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="mt-2.5 flex h-7 w-full items-center justify-center gap-1 rounded-md bg-talentia-selected text-[8px] font-semibold text-talentia-blue hover:bg-talentia-hover"
            >
              <PlusIcon />
              Agregar Pregunta
            </button>
          </section>

          <aside className="rounded-md bg-talentia-surface p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
            <h2 className="text-[10px] font-medium text-talentia-primary">Configuración de Evaluación:</h2>

            <div className="mt-3 space-y-3 text-[9px] text-talentia-primary">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-talentia-blue">Tiempo Límite:</span>
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(event) => setDuration(Math.max(0, Number(event.target.value) || 0))}
                  className="h-6 w-10 rounded border border-talentia-border bg-talentia-surface text-center text-[8px] outline-none"
                />
                <span>Min</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-talentia-blue">Intentos:</span>
                <button type="button" onClick={() => setAttempts((value) => Math.max(1, value - 1))} className="flex h-6 w-6 items-center justify-center rounded bg-talentia-surface border border-talentia-border text-talentia-primary"><MinusIcon /></button>
                <button type="button" onClick={() => setAttempts((value) => Math.min(10, value + 1))} className="flex h-6 min-w-[36px] items-center justify-center rounded bg-talentia-surface border border-talentia-border px-1 text-[8px] text-talentia-primary">{attempts}<span className="ml-1">+</span></button>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-talentia-blue">Puntaje:</span>
                <input
                  type="number"
                  min={0}
                  value={totalPoints}
                  onChange={(event) => setTotalPoints(Math.max(0, Number(event.target.value) || 0))}
                  className="h-6 w-12 rounded border border-talentia-border bg-talentia-surface text-center text-[8px] outline-none"
                />
                <span>Pts</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-talentia-blue">Preguntas:</span>
                <span className="flex h-6 w-12 items-center justify-center rounded bg-talentia-surface px-1 text-[8px]">{questions.length}</span>
                <span> </span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="text-talentia-blue">Fecha de Inicio:</span>
                <label className="flex h-7 w-[106px] items-center gap-1 rounded bg-talentia-surface px-2 text-talentia-muted">
                  <CalendarIcon />
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="min-w-0 bg-transparent text-[8px] outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="text-talentia-blue">Fecha Final:</span>
                <label className="flex h-7 w-[106px] items-center gap-1 rounded bg-talentia-surface px-2 text-talentia-muted">
                  <CalendarIcon />
                  <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="min-w-0 bg-transparent text-[8px] outline-none" />
                </label>
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-talentia-blue">Es una actividad calificada?</span>
                <button
                  type="button"
                  onClick={() => setGraded((value) => !value)}
                  className="flex items-center gap-1"
                  aria-pressed={graded}
                >
                  <span className="text-[8px] text-talentia-primary">No</span>
                  <span className={`flex h-4 w-8 items-center rounded-full p-0.5 transition ${graded ? "bg-talentia-selected justify-end" : "bg-talentia-surface justify-start"}`}>
                    <span className={`h-3 w-3 rounded-full transition ${graded ? "bg-talentia-blue" : "bg-talentia-surface"}`} />
                  </span>
                  <span className="text-[8px] text-talentia-primary">Sí</span>
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-md bg-talentia-surface px-2.5 py-2 text-[8px] text-talentia-muted">
              Puntos distribuidos en preguntas: <span className="font-semibold text-talentia-blue">{totalQuestionPoints}</span> / {totalPoints}
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pb-3 pt-1">
          <Link href={backHref} className="flex h-8 items-center justify-center rounded-md bg-talentia-surface px-4 text-[10px] font-semibold text-talentia-primary hover:bg-talentia-border">Cancelar</Link>
          <button type="button" onClick={() => submit("Borrador")} className="h-8 rounded-md bg-talentia-surface px-4 text-[10px] font-semibold text-talentia-primary shadow-sm hover:bg-talentia-hover">Guardar como borrador</button>
          <button type="button" onClick={() => submit("Publicado")} className="h-8 rounded-md bg-talentia-action px-4 text-[10px] font-semibold text-white shadow-sm hover:bg-talentia-primary">Publicar</button>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-5 right-5 z-[140] rounded-lg bg-talentia-action px-4 py-2.5 text-[11px] font-medium text-white shadow-xl">
          {notice}
        </div>
      )}
    </div>
  );
}
