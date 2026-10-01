"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Course } from "@/data/courses";


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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="m15 18-6-6 6-6" />
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
        <Link href={backHref} className="mb-2 flex w-fit items-center gap-1.5 text-[11px] font-medium text-gray-700 hover:text-[#3186d8]">
          <BackIcon />
          Volver a cursos
        </Link>

        <div className="relative h-[150px] overflow-hidden rounded-t-xl">
          <img src={course.imagen} alt={course.nombre} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/25" />
          <h1 className="absolute bottom-7 left-4 text-[29px] font-bold tracking-[-0.8px] text-white sm:text-[31px]">
            {course.nombre} - Crear Evaluación
          </h1>
        </div>

        <div className="flex flex-wrap border-b border-[#a7adb7] bg-[#eef2f8]">
          {['Contenido de curso', 'Clases', 'Foro', 'Anuncios', 'Asistencia'].map((tab, index) => (
            <span
              key={tab}
              className={index === 0 ? "border-b-[3px] border-black px-3 py-2 text-[10px] font-medium text-gray-900" : "px-3 py-2 text-[10px] text-gray-700"}
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 py-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(290px,1fr)]">
          <section className="rounded-md bg-white p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
              <div>
                <label htmlFor="evaluation-title" className="mb-1 block text-[10px] font-medium text-[#3186d8]">Título:</label>
                <input
                  id="evaluation-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-8 w-full rounded-md border border-[#e7eaee] bg-[#f1f1f1] px-2 text-[11px] outline-none focus:border-[#3186d8]"
                />

                <label htmlFor="evaluation-description" className="mb-1 mt-2 block text-[10px] font-medium text-[#3186d8]">Descripción e Instrucciones:</label>
                <textarea
                  id="evaluation-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-[74px] w-full resize-none rounded-md border border-[#e7eaee] bg-[#f1f1f1] p-2 text-[10px] outline-none focus:border-[#3186d8]"
                />
              </div>

              <div>
                <label htmlFor="evaluation-type" className="mb-1 block text-[10px] font-medium text-[#3186d8]">Tipo de Evaluación:</label>
                <div className="relative">
                  <select
                    id="evaluation-type"
                    value={evaluationType}
                    onChange={(event) => setEvaluationType(event.target.value as EvaluationQuestionType)}
                    className="h-10 w-full appearance-none rounded-md border border-[#dfe4ea] bg-[#f1f1f1] px-3 text-[10px] outline-none focus:border-[#3186d8]"
                  >
                    <option value="single">Práctica</option>
                    <option value="multiple">Selección múltiple</option>
                    <option value="boolean">Verdadero / Falso</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-3 text-gray-500"><ChevronDownIcon /></span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <h2 className="text-[10px] font-semibold text-[#3186d8]">Preguntas:</h2>
              <span className="text-[8px] text-gray-500">{questions.length} preguntas · {totalQuestionPoints} pts</span>
            </div>

            <div className="mt-2 space-y-2.5">
              {questions.map((question) => (
                <div key={question.id} className="rounded-md border border-[#d7e2ee] bg-white">
                  <div className="flex items-center gap-1.5 rounded-t-md bg-[#a9dcf8] px-2 py-1">
                    <span className="flex-1 text-[9px] font-semibold text-[#3186d8]">Pregunta {question.id}</span>
                    <select
                      value={question.type}
                      onChange={(event) => updateQuestionType(question.id, event.target.value as EvaluationQuestionType)}
                      className="h-5 rounded border border-white/80 bg-white/80 px-1 text-[8px] text-gray-700 outline-none"
                      aria-label={`Tipo de pregunta ${question.id}`}
                    >
                      <option value="single">Selección única</option>
                      <option value="multiple">Selección múltiple</option>
                      <option value="boolean">Verdadero / Falso</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-500 hover:bg-red-200 disabled:opacity-40"
                      disabled={questions.length === 1}
                      aria-label={`Eliminar pregunta ${question.id}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <div className="p-2">
                    <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
                      <div>
                        <label htmlFor={`question-${question.id}`} className="block text-[8px] font-medium text-[#3186d8]">Enunciado:</label>
                        <input
                          id={`question-${question.id}`}
                          value={question.prompt}
                          onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
                          className="mt-1 h-7 w-full rounded border border-[#e4e9ee] bg-[#f3f3f3] px-2 text-[9px] outline-none focus:border-[#3186d8]"
                        />
                      </div>
                      <div>
                        <label htmlFor={`points-${question.id}`} className="block text-[8px] font-medium text-[#3186d8]">Pts</label>
                        <input
                          id={`points-${question.id}`}
                          type="number"
                          min={0}
                          max={100}
                          value={question.points}
                          onChange={(event) => updateQuestion(question.id, { points: Math.max(0, Number(event.target.value) || 0) })}
                          className="mt-1 h-7 w-full rounded border border-[#e4e9ee] bg-[#f3f3f3] px-1 text-center text-[9px] outline-none focus:border-[#3186d8]"
                        />
                      </div>
                    </div>

                    <div className="mt-1.5 text-[8px] text-[#3186d8]">Opciones de Respuesta:</div>
                    <div className="mt-1 space-y-1">
                      {question.options.map((option) => (
                        <div key={option.id} className="grid grid-cols-[16px_18px_minmax(0,1fr)_16px] items-center gap-1">
                          <span className="h-3 w-3 rounded-full border border-gray-500" />
                          <span className="text-[8px] text-gray-600">{option.id}</span>
                          <input
                            aria-label={`Opción ${option.id} de pregunta ${question.id}`}
                            value={option.text}
                            onChange={(event) => updateOption(question.id, option.id, event.target.value)}
                            className="h-5 rounded border border-[#e3e7ec] bg-[#f4f4f4] px-1.5 text-[8px] outline-none focus:border-[#3186d8]"
                            disabled={question.type === "boolean"}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            disabled={question.type === "boolean" || question.options.length <= 2}
                            className="flex h-4 w-4 items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-30"
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
                        className="mt-2 flex h-6 items-center gap-1 rounded bg-[#a9dcf8] px-2.5 text-[8px] font-semibold text-[#3186d8] hover:bg-[#99d2f2] disabled:opacity-40"
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
              className="mt-2.5 flex h-7 w-full items-center justify-center gap-1 rounded-md bg-[#a9dcf8] text-[8px] font-semibold text-[#3186d8] hover:bg-[#99d2f2]"
            >
              <PlusIcon />
              Agregar Pregunta
            </button>
          </section>

          <aside className="rounded-md bg-white p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
            <h2 className="text-[10px] font-medium text-[#3186d8]">Configuración de Evaluación:</h2>

            <div className="mt-3 space-y-3 text-[9px] text-gray-700">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-[#3186d8]">Tiempo Límite:</span>
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(event) => setDuration(Math.max(0, Number(event.target.value) || 0))}
                  className="h-6 w-10 rounded border border-[#e2e6ea] bg-[#f1f1f1] text-center text-[8px] outline-none"
                />
                <span>Min</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-[#3186d8]">Intentos:</span>
                <button type="button" onClick={() => setAttempts((value) => Math.max(1, value - 1))} className="flex h-6 w-6 items-center justify-center rounded bg-[#f1f1f1] border border-[#e2e6ea] text-gray-600"><MinusIcon /></button>
                <button type="button" onClick={() => setAttempts((value) => Math.min(10, value + 1))} className="flex h-6 min-w-[36px] items-center justify-center rounded bg-[#f1f1f1] border border-[#e2e6ea] px-1 text-[8px] text-gray-700">{attempts}<span className="ml-1">+</span></button>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-[#3186d8]">Puntaje:</span>
                <input
                  type="number"
                  min={0}
                  value={totalPoints}
                  onChange={(event) => setTotalPoints(Math.max(0, Number(event.target.value) || 0))}
                  className="h-6 w-12 rounded border border-[#e2e6ea] bg-[#f1f1f1] text-center text-[8px] outline-none"
                />
                <span>Pts</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="text-[#3186d8]">Preguntas:</span>
                <span className="flex h-6 w-12 items-center justify-center rounded bg-[#f1f1f1] px-1 text-[8px]">{questions.length}</span>
                <span> </span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="text-[#3186d8]">Fecha de Inicio:</span>
                <label className="flex h-7 w-[106px] items-center gap-1 rounded bg-[#f1f1f1] px-2 text-gray-500">
                  <CalendarIcon />
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="min-w-0 bg-transparent text-[8px] outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="text-[#3186d8]">Fecha Final:</span>
                <label className="flex h-7 w-[106px] items-center gap-1 rounded bg-[#f1f1f1] px-2 text-gray-500">
                  <CalendarIcon />
                  <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="min-w-0 bg-transparent text-[8px] outline-none" />
                </label>
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[#3186d8]">Es una actividad calificada?</span>
                <button
                  type="button"
                  onClick={() => setGraded((value) => !value)}
                  className="flex items-center gap-1"
                  aria-pressed={graded}
                >
                  <span className="text-[8px] text-gray-600">No</span>
                  <span className={`flex h-4 w-8 items-center rounded-full p-0.5 transition ${graded ? "bg-[#d8eaf7] justify-end" : "bg-[#dddddd] justify-start"}`}>
                    <span className={`h-3 w-3 rounded-full transition ${graded ? "bg-[#3186d8]" : "bg-white"}`} />
                  </span>
                  <span className="text-[8px] text-gray-600">Sí</span>
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-md bg-[#f5f8fb] px-2.5 py-2 text-[8px] text-gray-500">
              Puntos distribuidos en preguntas: <span className="font-semibold text-[#3186d8]">{totalQuestionPoints}</span> / {totalPoints}
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
