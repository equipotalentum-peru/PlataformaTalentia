"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/data/courses";
import { API_URL } from "@/lib/api";
import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";

type EvaluationQuestionType = "single" | "multiple" | "boolean" | "text" | "relational";
type EvaluationDbType = "seleccion_unica" | "seleccion_multiple" | "verdadero_falso" | "respuesta_abierta" | "relacional";
type EvaluationKind = "Cuestionario" | "Practica" | "Examen" | "Evaluacion";
type EvaluationStatus = "Borrador" | "Publicado";

type EvaluationOption = {
  id: string;
  text: string;
  correct: boolean;
};

type RelationPair = {
  id: string;
  left: string;
  right: string;
};

type EvaluationQuestion = {
  id: number;
  type: EvaluationQuestionType;
  prompt: string;
  points: number;
  options: EvaluationOption[];
  allowFiles: boolean;
  pairs: RelationPair[];
};

type GradeComponent = {
  id: string;
  nombre: string;
  tipo: string;
  porcentaje: number | null;
  periodo: string;
};

type CreateEvaluationProps = {
  course: Course;
  moduleId?: string;
  contentId?: string;
};

type SavedEvaluation = {
  contenido: { titulo: string; descripcion: string; estado: string; moduloId: string };
  evaluacion: {
    tipo: EvaluationKind; instrucciones: string; intentosPermitidos: number;
    tiempoLimiteMinutos: number | null; puntajeTotal: number | null;
    fechaInicio: string | null; fechaFin: string | null; calificada: boolean;
    componenteCalificacionId: string | null;
  };
  preguntas: Array<{
    id: string; tipo: EvaluationDbType; enunciado: string; puntaje: number; permiteArchivos: boolean;
    opciones: Array<{ id: string; texto: string; esCorrecta: boolean }>;
    relaciones: Array<{ id: string; elementoIzquierda: string; elementoDerecha: string }>;
  }>;
};

const questionTypes: Record<EvaluationDbType, EvaluationQuestionType> = {
  seleccion_unica: "single", seleccion_multiple: "multiple", verdadero_falso: "boolean",
  respuesta_abierta: "text", relacional: "relational",
};

function dateInputValue(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

const DEFAULT_OPTIONS: EvaluationOption[] = [
  { id: "option-A", text: "", correct: false },
  { id: "option-B", text: "", correct: false },
  { id: "option-C", text: "", correct: false },
  { id: "option-D", text: "", correct: false },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function optionDefaults(type: EvaluationQuestionType): EvaluationOption[] {
  if (type === "boolean") {
    return [
      { id: "option-true", text: "Verdadero", correct: false },
      { id: "option-false", text: "Falso", correct: false },
    ];
  }
  if (type === "text" || type === "relational") return [];
  return DEFAULT_OPTIONS.map((option) => ({ ...option }));
}

function relationDefaults(): RelationPair[] {
  return [1, 2, 3].map((number) => ({
    id: `pair-${number}-${Date.now()}`,
    left: "",
    right: "",
  }));
}

function mapQuestionType(type: EvaluationQuestionType): EvaluationDbType {
  switch (type) {
    case "single": return "seleccion_unica";
    case "multiple": return "seleccion_multiple";
    case "boolean": return "verdadero_falso";
    case "text": return "respuesta_abierta";
    case "relational": return "relacional";
  }
}

function questionTypeLabel(type: EvaluationQuestionType) {
  switch (type) {
    case "single": return "Selección única";
    case "multiple": return "Selección múltiple";
    case "boolean": return "Verdadero / Falso";
    case "text": return "Pregunta texto";
    case "relational": return "Pregunta relacional";
  }
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

export default function CreateEvaluation({ course, moduleId, contentId }: CreateEvaluationProps) {
  const router = useRouter();
  const editing = contentId !== undefined;
  const [loadingEvaluation, setLoadingEvaluation] = useState(editing);
  const [evaluationError, setEvaluationError] = useState("");
  const [savedStatus, setSavedStatus] = useState<EvaluationStatus>("Borrador");
  const [initialDates, setInitialDates] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(40);
  const [attempts, setAttempts] = useState(1);
  const [totalPoints, setTotalPoints] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [graded, setGraded] = useState(true);
  const [componentId, setComponentId] = useState("");
  const [ungradedKind, setUngradedKind] = useState<EvaluationKind>("Practica");
  const [components, setComponents] = useState<GradeComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [componentsError, setComponentsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([
    {
      id: 1,
      type: "single",
      prompt: "",
      points: 2,
      options: optionDefaults("single"),
      allowFiles: false,
      pairs: [],
    },
  ]);

  const totalQuestionPoints = useMemo(
    () => questions.reduce((sum, question) => sum + Number(question.points || 0), 0),
    [questions]
  );

  const backHref = moduleId
    ? `/docente/cursos/${course.id}?moduleId=${encodeURIComponent(moduleId)}`
    : `/docente/cursos/${course.id}`;

  useEffect(() => {
    const controller = new AbortController();

    async function loadGradeComponents() {
      if (!moduleId) {
        setComponents([]);
        setLoadingComponents(false);
        setComponentsError("");
        if (editing) {
          setEvaluationError("Falta el módulo de la evaluación. Vuelve al curso y selecciona Editar.");
          setLoadingEvaluation(false);
        }
        return;
      }

      try {
        setLoadingComponents(true);
        setComponentsError("");
        let saved: SavedEvaluation | null = null;
        if (editing) {
          const response = await fetch(
            `${API_URL}/cursos/${encodeURIComponent(String(course.id))}/contenidos/${encodeURIComponent(contentId!)}/evaluacion`,
            { credentials: "include", cache: "no-store", signal: controller.signal }
          );
          if (response.status === 401) { router.push("/login"); return; }
          const data = await response.json();
          if (!response.ok) throw new Error(data.message ?? "No se pudo cargar la evaluación.");
          saved = data as SavedEvaluation;
          if (String(saved.contenido.moduloId) !== moduleId) throw new Error("La evaluación no pertenece a este módulo.");
        }
        const response = await fetch(
          `${API_URL}/cursos/${encodeURIComponent(String(course.id))}/modulos/${encodeURIComponent(moduleId)}/evaluaciones/componentes-calificacion${editing ? `?contenidoId=${encodeURIComponent(contentId!)}` : ""}`,
          { credentials: "include", cache: "no-store", signal: controller.signal }
        );
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(data.message ?? "No se pudieron cargar los componentes de calificación.");
        }

        const rows: GradeComponent[] = Array.isArray(data.componentes)
          ? data.componentes.map((item: GradeComponent) => ({
              id: String(item.id),
              nombre: String(item.nombre ?? "Componente"),
              tipo: String(item.tipo ?? "evaluacion"),
              porcentaje: item.porcentaje == null ? null : Number(item.porcentaje),
              periodo: String(item.periodo ?? "Sin periodo"),
            }))
          : [];
        if (controller.signal.aborted) return;
        setComponents(rows);
        if (saved) {
          setTitle(saved.contenido.titulo);
          setDescription(saved.evaluacion.instrucciones || saved.contenido.descripcion);
          setDuration(saved.evaluacion.tiempoLimiteMinutos ?? 0);
          setAttempts(saved.evaluacion.intentosPermitidos);
          setTotalPoints(saved.evaluacion.puntajeTotal ?? 0);
          setStartDate(dateInputValue(saved.evaluacion.fechaInicio));
          setEndDate(dateInputValue(saved.evaluacion.fechaFin));
          setInitialDates({ start: saved.evaluacion.fechaInicio, end: saved.evaluacion.fechaFin });
          setGraded(saved.evaluacion.calificada);
          setComponentId(saved.evaluacion.componenteCalificacionId ?? "");
          setUngradedKind(saved.evaluacion.tipo);
          setSavedStatus(saved.contenido.estado === "Publicado" ? "Publicado" : "Borrador");
          setQuestions(saved.preguntas.map(question => ({
            id: Number(question.id), type: questionTypes[question.tipo], prompt: question.enunciado,
            points: question.puntaje, allowFiles: question.permiteArchivos,
            options: question.opciones.map(option => ({ id: option.id, text: option.texto, correct: option.esCorrecta })),
            pairs: question.relaciones.map(pair => ({ id: pair.id, left: pair.elementoIzquierda, right: pair.elementoDerecha })),
          })));
        } else {
          setComponentId((current) => rows.some((item) => item.id === current) ? current : "");
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setComponentsError(error instanceof Error ? error.message : "No se pudieron cargar los componentes de calificación.");
        if (editing) setEvaluationError(error instanceof Error ? error.message : "No se pudo cargar la evaluación.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingComponents(false);
          setLoadingEvaluation(false);
        }
      }
    }

    void loadGradeComponents();
    return () => controller.abort();
  }, [course.id, moduleId, contentId, editing, router]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  };

  const updateQuestion = (questionId: number, patch: Partial<EvaluationQuestion>) => {
    setQuestions((current) => current.map((question) =>
      question.id === questionId ? { ...question, ...patch } : question
    ));
  };

  const updateQuestionType = (questionId: number, type: EvaluationQuestionType) => {
    updateQuestion(questionId, {
      type,
      options: optionDefaults(type),
      allowFiles: false,
      pairs: type === "relational" ? relationDefaults() : [],
    });
  };

  const updateOption = (questionId: number, optionId: string, text: string) => {
    setQuestions((current) => current.map((question) => question.id !== questionId
      ? question
      : { ...question, options: question.options.map((option) => option.id === optionId ? { ...option, text } : option) }
    ));
  };

  const updateCorrectOption = (questionId: number, optionId: string, correct: boolean) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId) return question;
      return {
        ...question,
        options: question.options.map((option) => ({
          ...option,
          correct: option.id === optionId
            ? correct
            : (["single", "boolean"].includes(question.type) && correct ? false : option.correct),
        })),
      };
    }));
  };

  const addOption = (questionId: number) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId || !["single", "multiple"].includes(question.type) || question.options.length >= 6) return question;
      return { ...question, options: [...question.options, { id: makeId("option"), text: "", correct: false }] };
    }));
  };

  const removeOption = (questionId: number, optionId: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId || question.options.length <= 2 || question.type === "boolean") return question;
      return { ...question, options: question.options.filter((option) => option.id !== optionId) };
    }));
  };

  const updatePair = (questionId: number, pairId: string, patch: Partial<RelationPair>) => {
    setQuestions((current) => current.map((question) => question.id !== questionId
      ? question
      : { ...question, pairs: question.pairs.map((pair) => pair.id === pairId ? { ...pair, ...patch } : pair) }
    ));
  };

  const addPair = (questionId: number) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId || question.type !== "relational" || question.pairs.length >= 30) return question;
      return { ...question, pairs: [...question.pairs, { id: makeId("pair"), left: "", right: "" }] };
    }));
  };

  const removePair = (questionId: number, pairId: string) => {
    setQuestions((current) => current.map((question) => {
      if (question.id !== questionId || question.pairs.length <= 2) return question;
      return { ...question, pairs: question.pairs.filter((pair) => pair.id !== pairId) };
    }));
  };

  const addQuestion = () => {
    setQuestions((current) => {
      const nextType = current[current.length - 1]?.type ?? "single";
      return [...current, {
        id: Math.max(0, ...current.map((question) => question.id)) + 1,
        type: nextType,
        prompt: "",
        points: 2,
        options: optionDefaults(nextType),
        allowFiles: false,
        pairs: nextType === "relational" ? relationDefaults() : [],
      }];
    });
  };

  const removeQuestion = (questionId: number) => {
    if (questions.length <= 1) return;
    setQuestions((current) => current.filter((question) => question.id !== questionId));
  };

  const validateBeforeSubmit = (status: EvaluationStatus): boolean => {
    if (!moduleId) {
      showNotice("No hay un módulo seleccionado. Vuelve al curso y selecciona un módulo antes de crear la evaluación.");
      return false;
    }
    if (!title.trim()) {
      showNotice("Escribe un título para la evaluación.");
      return false;
    }
    if (graded && !componentId) {
      showNotice("Selecciona una evaluación configurada por el administrador.");
      return false;
    }
    if (questions.some((question) => !question.prompt.trim())) {
      showNotice("Completa el enunciado de todas las preguntas.");
      return false;
    }
    if (endDate && startDate && endDate < startDate) {
      showNotice("La fecha final no puede ser anterior a la fecha de inicio.");
      return false;
    }

    if (status === "Publicado") {
      if (totalPoints <= 0) {
        showNotice("El puntaje total debe ser mayor que cero para publicar.");
        return false;
      }
      if (Math.round(totalQuestionPoints * 100) !== Math.round(totalPoints * 100)) {
        showNotice("Los puntos de las preguntas deben sumar exactamente el puntaje total antes de publicar.");
        return false;
      }
      for (const question of questions) {
        if (["single", "multiple", "boolean"].includes(question.type)) {
          if (question.options.some((option) => !option.text.trim())) {
            showNotice(`Completa todas las opciones de la pregunta ${question.id}.`);
            return false;
          }
          const correctCount = question.options.filter((option) => option.correct).length;
          if (question.type === "multiple" ? correctCount < 1 : correctCount !== 1) {
            showNotice(question.type === "multiple"
              ? `Marca por lo menos una opción correcta en la pregunta ${question.id}.`
              : `Marca exactamente una opción correcta en la pregunta ${question.id}.`);
            return false;
          }
        }
        if (question.type === "relational" && (
          question.pairs.length < 2 || question.pairs.some((pair) => !pair.left.trim() || !pair.right.trim())
        )) {
          showNotice(`Completa todos los pares de la pregunta relacional ${question.id}.`);
          return false;
        }
      }
    }
    return true;
  };

  const submit = async (status: EvaluationStatus) => {
    if (saving || loadingEvaluation || evaluationError || !validateBeforeSubmit(status)) return;

    setSaving(true);
    setNotice("");

    const tipo: EvaluationKind = graded ? "Evaluacion" : ungradedKind;
    const payload = {
      titulo: title.trim(),
      descripcion: description.trim(),
      tipo,
      componenteCalificacionId: graded ? componentId : null,
      tiempoLimiteMinutos: duration > 0 ? duration : null,
      intentosPermitidos: attempts,
      puntajeTotal: totalPoints,
      fechaInicio: editing && startDate === dateInputValue(initialDates.start) ? initialDates.start : startDate ? `${startDate}T00:00:00-05:00` : null,
      fechaFin: editing && endDate === dateInputValue(initialDates.end) ? initialDates.end : endDate ? `${endDate}T23:59:59-05:00` : null,
      calificada: graded,
      estado: status,
      preguntas: questions.map((question) => ({
        enunciado: question.prompt.trim(),
        tipo: mapQuestionType(question.type),
        puntaje: Number(question.points || 0),
        permiteArchivos: question.type === "text" && question.allowFiles,
        opciones: question.options.map((option) => ({
          texto: option.text.trim(),
          esCorrecta: option.correct,
        })),
        relaciones: question.pairs.map((pair) => ({
          elementoIzquierda: pair.left.trim(),
          elementoDerecha: pair.right.trim(),
        })),
      })),
    };

    try {
      const response = await fetch(
        `${API_URL}/cursos/${encodeURIComponent(String(course.id))}/modulos/${encodeURIComponent(moduleId!)}/evaluaciones${editing ? `/${encodeURIComponent(contentId!)}` : ""}`,
        {
          method: editing ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const contentType = response.headers.get("content-type") ?? "";
      const data: { message?: string; contenidoId?: string; evaluacionId?: string } = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : {};

      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(data.message ?? `No se pudo guardar la evaluación (HTTP ${response.status}).`);
      }

      showNotice(data.message ?? "Evaluación guardada correctamente.");
      window.setTimeout(() => {
        router.push(backHref);
        router.refresh();
      }, 500);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo guardar la evaluación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-3 py-3 lg:px-5">
      <div className="mx-auto max-w-[1200px]">
        <Link href={backHref} className="app-back-link mb-3">
          <span aria-hidden="true">{"<"}</span> Volver a cursos
        </Link>

        <CourseHeader courseId={course.id} nombre={course.nombre} imagen={course.imagen} fetchIfMissing={false} />
        <CourseTabs role="docente" courseId={course.id} active="contenido" interactive={false} />

        {loadingEvaluation ? <p role="status" className="py-4 text-[13px] text-talentia-muted">Cargando evaluación...</p> : evaluationError ?
          <p role="alert" className="py-4 text-[13px] text-talentia-danger">{evaluationError}</p> : <>
        <div className="grid grid-cols-1 gap-3 py-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(290px,1fr)]">
          <section className="rounded-md bg-talentia-surface p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
            <h2 className="mb-4 text-2xl font-semibold text-talentia-primary">{editing ? "Editar evaluación" : "Crear evaluación"}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
              <div>
                <label htmlFor="evaluation-title" className="mb-1 block text-[13px] font-medium text-talentia-primary">Título:</label>
                <input id="evaluation-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className="h-8 w-full rounded-md border border-talentia-border bg-talentia-surface px-2 text-[13px] outline-none focus:border-talentia-blue" />

                <label htmlFor="evaluation-description" className="mb-1 mt-2 block text-[13px] font-medium text-talentia-primary">Descripción e instrucciones:</label>
                <textarea id="evaluation-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={20000} className="h-[74px] w-full resize-none rounded-md border border-talentia-border bg-talentia-surface p-2 text-[13px] outline-none focus:border-talentia-blue" />
              </div>

              <div>
                <label htmlFor="evaluation-component" className="mb-1 block text-[13px] font-medium text-talentia-primary">
                  Tipo de Evaluación:
                </label>
                <div className="relative">
                  {graded ? (
                    <select id="evaluation-component" value={componentId} onChange={(event) => setComponentId(event.target.value)} disabled={loadingComponents || components.length === 0} className="h-10 w-full appearance-none rounded-md border border-talentia-border bg-talentia-surface px-3 pr-7 text-[13px] outline-none focus:border-talentia-blue disabled:opacity-60">
                      <option value="">{loadingComponents ? "Cargando..." : "Selecciona una evaluación"}</option>
                      {components.map((component) => (
                        <option key={component.id} value={component.id}>
                          {component.nombre} · {component.porcentaje ?? "—"}% · {component.periodo}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select id="evaluation-component" value={ungradedKind} onChange={(event) => setUngradedKind(event.target.value as EvaluationKind)} className="h-10 w-full appearance-none rounded-md border border-talentia-border bg-talentia-surface px-3 pr-7 text-[13px] outline-none focus:border-talentia-blue">
                      <option value="Practica">Práctica no calificada</option>
                      <option value="Cuestionario">Cuestionario de repaso</option>
                      <option value="Evaluacion">Autoevaluación</option>
                    </select>
                  )}
                  <span className="pointer-events-none absolute right-2 top-3 text-talentia-muted"><ChevronDownIcon /></span>
                </div>
                {graded && !loadingComponents && components.length === 0 && (
                  <p className="mt-2 text-[13px] leading-relaxed text-talentia-danger">
                    No hay componentes de calificación disponibles. Comprueba que el administrador haya configurado evaluaciones para una oferta asignada a tu usuario.
                  </p>
                )}
                {componentsError && graded && <p role="alert" className="mt-2 text-[13px] text-talentia-danger">{componentsError}</p>}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-talentia-primary">Preguntas:</h2>
              <span className="text-[12px] text-talentia-muted">{questions.length} preguntas · {totalQuestionPoints} pts</span>
            </div>

            <div className="mt-2 space-y-2.5">
              {questions.map((question, questionIndex) => (
                <div key={question.id} className="rounded-md border border-talentia-border bg-talentia-surface">
                  <div className="flex flex-wrap items-center gap-1.5 rounded-t-md bg-talentia-selected px-2 py-1">
                    <span className="flex-1 text-[13px] font-semibold text-talentia-primary">Pregunta {questionIndex + 1}</span>
                    <select value={question.type} onChange={(event) => updateQuestionType(question.id, event.target.value as EvaluationQuestionType)} className="h-6 max-w-full rounded border border-talentia-border bg-talentia-surface/80 px-1 text-[13px] text-talentia-primary outline-none" aria-label={`Tipo de pregunta ${questionIndex + 1}`}>
                      <option value="single">Selección única</option>
                      <option value="multiple">Selección múltiple</option>
                      <option value="boolean">Verdadero / Falso</option>
                      <option value="text">Pregunta texto</option>
                      <option value="relational">Pregunta relacional</option>
                    </select>
                    <button type="button" onClick={() => removeQuestion(question.id)} className="flex h-5 w-5 items-center justify-center rounded bg-talentia-danger-bg text-talentia-danger hover:bg-talentia-danger-bg disabled:opacity-40" disabled={questions.length === 1} aria-label={`Eliminar pregunta ${questionIndex + 1}`}><TrashIcon /></button>
                  </div>

                  <div className="p-2">
                    <div className="grid grid-cols-[minmax(0,1fr)_48px] gap-2">
                      <div>
                        <label htmlFor={`question-${question.id}`} className="block text-[13px] font-medium text-talentia-primary">Enunciado:</label>
                        {question.type === "text" ? (
                          <textarea id={`question-${question.id}`} value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} maxLength={5000} className="mt-1 min-h-[58px] w-full resize-y rounded border border-talentia-border bg-talentia-surface px-2 py-1.5 text-[13px] outline-none focus:border-talentia-blue" />
                        ) : (
                          <input id={`question-${question.id}`} value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} maxLength={5000} className="mt-1 h-7 w-full rounded border border-talentia-border bg-talentia-surface px-2 text-[13px] outline-none focus:border-talentia-blue" />
                        )}
                      </div>
                      <div>
                        <label htmlFor={`points-${question.id}`} className="block text-[13px] font-medium text-talentia-primary">Pts</label>
                        <input id={`points-${question.id}`} type="number" min={0} max={100} step="0.25" value={question.points} onChange={(event) => updateQuestion(question.id, { points: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 h-7 w-full rounded border border-talentia-border bg-talentia-surface px-1 text-center text-[13px] outline-none focus:border-talentia-blue" />
                      </div>
                    </div>

                    {question.type === "text" && (
                      <div className="mt-2 space-y-2 rounded-md bg-talentia-hover p-2">
                        <label className="block text-[13px] font-medium text-talentia-primary">Respuesta que verá el alumno:</label>
                        <textarea disabled placeholder="El alumno escribirá su respuesta aquí..." className="h-14 w-full resize-none rounded border border-talentia-border bg-talentia-surface p-2 text-[12px] text-talentia-muted" />
                        <label className="flex items-center gap-2 text-[13px] text-talentia-primary">
                          <input type="checkbox" checked={question.allowFiles} onChange={(event) => updateQuestion(question.id, { allowFiles: event.target.checked })} className="h-3.5 w-3.5 accent-talentia-blue" />
                          Permitir que el alumno inserte archivos en su respuesta
                        </label>
                      </div>
                    )}

                    {question.type === "relational" && (
                      <div className="mt-2">
                        <p className="mb-1 text-[13px] font-medium text-talentia-primary">Pares correctos que el alumno deberá relacionar:</p>
                        <div className="space-y-1.5">
                          {question.pairs.map((pair, pairIndex) => (
                            <div key={pair.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_18px] items-center gap-1.5">
                              <input aria-label={`Elemento izquierdo ${pairIndex + 1}`} value={pair.left} onChange={(event) => updatePair(question.id, pair.id, { left: event.target.value })} placeholder={`Elemento ${pairIndex + 1}`} className="h-7 min-w-0 rounded border border-talentia-border px-2 text-[13px] outline-none focus:border-talentia-blue" />
                              <input aria-label={`Relación correcta ${pairIndex + 1}`} value={pair.right} onChange={(event) => updatePair(question.id, pair.id, { right: event.target.value })} placeholder="Se relaciona con..." className="h-7 min-w-0 rounded border border-talentia-border px-2 text-[13px] outline-none focus:border-talentia-blue" />
                              <button type="button" onClick={() => removePair(question.id, pair.id)} disabled={question.pairs.length <= 2} aria-label={`Eliminar relación ${pairIndex + 1}`} className="flex h-5 w-5 items-center justify-center text-talentia-danger disabled:opacity-30"><TrashIcon /></button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => addPair(question.id)} disabled={question.pairs.length >= 30} className="mt-2 flex h-6 items-center gap-1 rounded bg-talentia-selected px-2.5 text-[13px] font-semibold text-talentia-primary hover:bg-talentia-hover disabled:opacity-40"><PlusIcon /> Añadir relación</button>
                      </div>
                    )}

                    {["single", "multiple", "boolean"].includes(question.type) && (
                      <>
                        <div className="mt-1.5 text-[13px] text-talentia-primary">Opciones de respuesta: <span className="text-talentia-muted">marca las respuestas correctas</span></div>
                        <div className="mt-1 space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <div key={option.id} className="grid grid-cols-[16px_18px_minmax(0,1fr)_16px] items-center gap-1">
                              {question.type === "multiple" ? (
                                <input type="checkbox" aria-label={`Opción correcta ${optionIndex + 1}`} checked={option.correct} onChange={(event) => updateCorrectOption(question.id, option.id, event.target.checked)} className="h-3 w-3 accent-talentia-blue" />
                              ) : (
                                <input type="radio" name={`correct-${question.id}`} aria-label={`Opción correcta ${optionIndex + 1}`} checked={option.correct} onChange={() => updateCorrectOption(question.id, option.id, true)} className="h-3 w-3 accent-talentia-blue" />
                              )}
                              <span className="text-[13px] text-talentia-primary">{String.fromCharCode(65 + optionIndex)}</span>
                              <input aria-label={`Texto de opción ${optionIndex + 1} de pregunta ${questionIndex + 1}`} value={option.text} onChange={(event) => updateOption(question.id, option.id, event.target.value)} className="h-6 min-w-0 rounded border border-talentia-border bg-talentia-surface px-1.5 text-[13px] outline-none focus:border-talentia-blue" disabled={question.type === "boolean"} />
                              <button type="button" onClick={() => removeOption(question.id, option.id)} disabled={question.type === "boolean" || question.options.length <= 2} className="flex h-4 w-4 items-center justify-center text-talentia-danger disabled:opacity-30" aria-label={`Eliminar opción ${optionIndex + 1}`}><TrashIcon /></button>
                            </div>
                          ))}
                        </div>
                        {question.type !== "boolean" && (
                          <button type="button" onClick={() => addOption(question.id)} className="mt-2 flex h-6 items-center gap-1 rounded bg-talentia-selected px-2.5 text-[13px] font-semibold text-talentia-primary hover:bg-talentia-hover disabled:opacity-40" disabled={question.options.length >= 6}><PlusIcon /> Añadir opción</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addQuestion} className="mt-2.5 flex h-7 w-full items-center justify-center gap-1 rounded-md bg-talentia-selected text-[13px] font-semibold text-talentia-primary hover:bg-talentia-hover"><PlusIcon /> Agregar pregunta</button>
          </section>

          <aside className="h-fit rounded-xl border border-talentia-border bg-talentia-surface p-4 shadow-[0_1px_5px_rgba(15,36,61,0.08)] sm:p-5">
            <h2 className="text-[15px] font-semibold text-talentia-primary">
              Configuración de evaluación
            </h2>

            <div className="mt-5 space-y-4 text-[13px] text-talentia-primary">
              <div className="grid grid-cols-[minmax(0,1fr)_88px_auto] items-center gap-3">
                <label htmlFor="evaluation-duration" className="text-[13px] text-talentia-primary">
                  Tiempo límite
                </label>
                <input
                  id="evaluation-duration"
                  type="number"
                  min={0}
                  max={1440}
                  value={duration}
                  onChange={(event) =>
                    setDuration(Math.max(0, Math.min(1440, Number(event.target.value) || 0)))
                  }
                  className="h-9 w-full rounded-md border border-talentia-border bg-talentia-surface px-2 text-[13px] text-center outline-none focus:border-talentia-blue"
                />
                <span className="text-[12px] text-talentia-muted">min</span>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="text-[13px] text-talentia-primary">Intentos permitidos</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Reducir intentos"
                    onClick={() => setAttempts((value) => Math.max(1, value - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-talentia-border bg-talentia-surface text-talentia-primary hover:bg-talentia-hover"
                  >
                    <MinusIcon />
                  </button>
                  <span className="flex h-9 min-w-14 items-center justify-center rounded-md border border-talentia-border bg-talentia-surface px-3 text-[13px] font-semibold">
                    {attempts}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar intentos"
                    onClick={() => setAttempts((value) => Math.min(10, value + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-talentia-border bg-talentia-surface text-talentia-primary hover:bg-talentia-hover"
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_88px_auto] items-center gap-3">
                <label htmlFor="evaluation-total-points" className="text-[13px] text-talentia-primary">
                  Puntaje total
                </label>
                <input
                  id="evaluation-total-points"
                  type="number"
                  min={0}
                  max={1000}
                  step="0.25"
                  value={totalPoints}
                  onChange={(event) =>
                    setTotalPoints(Math.max(0, Number(event.target.value) || 0))
                  }
                  className="h-9 w-full rounded-md border border-talentia-border bg-talentia-surface px-2 text-[13px] text-center outline-none focus:border-talentia-blue"
                />
                <span className="text-[12px] text-talentia-muted">pts</span>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_88px_auto] items-center gap-3">
                <span className="text-[13px] text-talentia-primary">Preguntas</span>
                <span className="flex h-9 w-full items-center justify-center rounded-md border border-talentia-border bg-talentia-surface text-[13px] font-semibold">
                  {questions.length}
                </span>
                <span className="text-[12px] text-talentia-muted">total</span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,165px)] sm:items-center">
                <label htmlFor="evaluation-start-date" className="text-[13px] text-talentia-primary">
                  Fecha de inicio
                </label>
                <input
                  id="evaluation-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-9 min-w-0 w-full rounded-md border border-talentia-border bg-talentia-surface px-2 text-[13px] outline-none focus:border-talentia-blue"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,165px)] sm:items-center">
                <label htmlFor="evaluation-end-date" className="text-[13px] text-talentia-primary">
                  Fecha final
                </label>
                <input
                  id="evaluation-end-date"
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-9 min-w-0 w-full rounded-md border border-talentia-border bg-talentia-surface px-2 text-[13px] outline-none focus:border-talentia-blue"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-talentia-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[13px] font-medium text-talentia-primary">
                  ¿Es una actividad calificada?
                </span>
                <button
                  type="button"
                  onClick={() => setGraded((value) => !value)}
                  className="flex shrink-0 items-center gap-2 self-start sm:self-auto"
                  aria-pressed={graded}
                >
                  <span className="text-[13px] text-talentia-primary">No</span>
                  <span className={`flex h-5 w-10 items-center rounded-full p-0.5 transition ${graded ? "bg-talentia-selected justify-end" : "bg-talentia-border justify-start"}`}>
                    <span className={`h-4 w-4 rounded-full transition ${graded ? "bg-talentia-blue" : "bg-talentia-surface"}`} />
                  </span>
                  <span className="text-[13px] text-talentia-primary">Sí</span>
                </button>
              </div>

              {graded && (
                <p className="rounded-lg bg-talentia-selected/50 p-3 text-[12px] leading-relaxed text-talentia-muted">
                  Se vinculará al componente de calificación seleccionado. El cálculo de notas se implementará en otra etapa.
                </p>
              )}
            </div>

            <div className="mt-5 rounded-lg border border-talentia-border bg-talentia-selected/40 px-3 py-3 text-[13px] text-talentia-primary">
              <div className="flex items-center justify-between gap-3">
                <span>Puntos distribuidos</span>
                <span className={`font-semibold ${Math.round(totalQuestionPoints * 100) === Math.round(totalPoints * 100) ? "text-talentia-success" : "text-talentia-primary"}`}>
                  {totalQuestionPoints} / {totalPoints}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-talentia-border">
                <div
                  className={`h-full rounded-full transition-all ${Math.round(totalQuestionPoints * 100) === Math.round(totalPoints * 100) ? "bg-talentia-success" : "bg-talentia-blue"}`}
                  style={{
                    width: `${totalPoints > 0 ? Math.min(100, (totalQuestionPoints / totalPoints) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pb-3 pt-1">
          <Link href={backHref} className="flex h-8 items-center justify-center rounded-md bg-talentia-surface px-4 text-[13px] font-semibold text-talentia-primary hover:bg-talentia-border">Cancelar</Link>
          {editing ? <button type="button" disabled={saving} onClick={() => void submit(savedStatus)} className="h-8 rounded-md bg-talentia-action px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-talentia-primary disabled:opacity-50">{saving ? "Guardando..." : "Guardar cambios"}</button> : <>
            <button type="button" disabled={saving} onClick={() => void submit("Borrador")} className="h-8 rounded-md bg-talentia-surface px-4 text-[13px] font-semibold text-talentia-primary shadow-sm hover:bg-talentia-hover disabled:opacity-50">{saving ? "Guardando..." : "Guardar como borrador"}</button>
            <button type="button" disabled={saving} onClick={() => void submit("Publicado")} className="h-8 rounded-md bg-talentia-action px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-talentia-primary disabled:opacity-50">{saving ? "Guardando..." : "Publicar"}</button>
          </>}
        </div>
        </>}
      </div>

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[140] max-w-[min(90vw,420px)] rounded-lg bg-talentia-action px-4 py-2.5 text-[13px] font-medium text-white shadow-xl">{notice}</div>}
    </div>
  );
}
