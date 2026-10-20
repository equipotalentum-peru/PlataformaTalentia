"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { quizzes, type QuizOption } from "@/data/quizzes";
import { clearQuizStarted, markContentViewed, markQuizStarted } from "@/lib/progress";

type QuestionType =
  | "single"
  | "multiple"
  | "boolean"
  | "text"
  | "relational";

type PlayerOption = {
  id: string;
  text: string;
  correct?: boolean;
};

type PlayerRelation = {
  id: string;
  left: string;
  right?: string;
};

type PlayerQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  options: PlayerOption[];
  allowFiles: boolean;
  relations: PlayerRelation[];
  relationOptions: string[];
};

type PlayerQuiz = {
  id: number;
  title: string;
  durationMinutes: number | null;
  instructions: string;
  questions: PlayerQuestion[];
};

type ApiQuestion = {
  id: string | number;
  numero: number;
  enunciado: string;
  tipo: string;
  puntaje: number;
  permiteArchivos: boolean;
  opciones?: Array<{
    id: string | number;
    texto: string;
    esCorrecta?: boolean;
  }>;
  relaciones?: Array<{
    id: string | number;
    elementoIzquierda: string;
    elementoDerecha?: string;
  }>;
  opcionesRelacion?: string[];
};

type EvaluationResponse = {
  contenido?: {
    id: string | number;
    titulo: string;
    descripcion?: string;
  };
  evaluacion?: {
    id: string | number;
    instrucciones?: string;
    tiempoLimiteMinutos: number | null;
  };
  preguntas?: ApiQuestion[];
  message?: string;
};

type QuizViewerProps = {
  quizId?: number;
  courseId: number;
  previousHref?: string;
  nextHref?: string;
  exitHref: string;
  preview?: boolean;
  databaseContentId?: number;
};

type QuizPhase = "intro" | "question" | "finished";

function staticQuizToPlayer(quizId: number | undefined): PlayerQuiz | null {
  if (!quizId) return null;
  const quiz = quizzes.find((item) => item.id === quizId);
  if (!quiz) return null;

  return {
    id: quiz.id,
    title: quiz.title,
    durationMinutes: quiz.durationMinutes,
    instructions: "",
    questions: quiz.questions.map((question) => ({
      id: String(question.id),
      text: question.text,
      type: "single",
      points: 0,
      options: question.options.map((option: QuizOption) => ({
        id: String(option.id),
        text: option.text,
        correct: option.id === question.correctOptionId,
      })),
      allowFiles: false,
      relations: [],
      relationOptions: [],
    })),
  };
}

function normalizeApiQuestion(question: ApiQuestion): PlayerQuestion {
  const tipos: Record<string, QuestionType> = {
    seleccion_unica: "single",
    seleccion_multiple: "multiple",
    verdadero_falso: "boolean",
    respuesta_abierta: "text",
    relacional: "relational",
  };

  return {
    id: String(question.id),
    text: question.enunciado,
    type: tipos[question.tipo] ?? "single",
    points: Number(question.puntaje ?? 0),
    options: (question.opciones ?? []).map((option) => ({
      id: String(option.id),
      text: option.texto,
    })),
    allowFiles: question.permiteArchivos === true,
    relations: (question.relaciones ?? []).map((relation) => ({
      id: String(relation.id),
      left: relation.elementoIzquierda,
    })),
    relationOptions: Array.isArray(question.opcionesRelacion)
      ? question.opcionesRelacion
      : [],
  };
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function QuizViewer({
  quizId,
  courseId,
  previousHref,
  nextHref,
  exitHref,
  preview = false,
  databaseContentId,
}: QuizViewerProps) {
  const router = useRouter();
  const staticQuiz = useMemo(
    () => staticQuizToPlayer(quizId),
    [quizId]
  );

  const [databaseQuiz, setDatabaseQuiz] = useState<PlayerQuiz | null>(null);
  const [loadingDatabaseQuiz, setLoadingDatabaseQuiz] = useState(
    Boolean(databaseContentId)
  );
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [relationAnswers, setRelationAnswers] = useState<Record<string, Record<string, string>>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!databaseContentId) return;

    const controller = new AbortController();

    async function loadFromDatabase() {
      try {
        setLoadingDatabaseQuiz(true);
        setLoadError("");
        setDatabaseQuiz(null);

        const response = await fetch(
          `${API_URL}/cursos/${encodeURIComponent(String(courseId))}/contenidos/${encodeURIComponent(String(databaseContentId))}/evaluacion`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = (await response.json().catch(() => ({}))) as EvaluationResponse;

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ??
              `No se pudo cargar la evaluación (HTTP ${response.status}).`
          );
        }

        if (!data.contenido || !data.evaluacion || !Array.isArray(data.preguntas)) {
          throw new Error("La información de la evaluación está incompleta.");
        }

        setDatabaseQuiz({
          id: Number(data.contenido.id),
          title: data.contenido.titulo,
          durationMinutes:
            data.evaluacion.tiempoLimiteMinutos == null
              ? null
              : Number(data.evaluacion.tiempoLimiteMinutos),
          instructions:
            data.evaluacion.instrucciones || data.contenido.descripcion || "",
          questions: data.preguntas.map(normalizeApiQuestion),
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la evaluación."
        );
      } finally {
        if (!controller.signal.aborted) setLoadingDatabaseQuiz(false);
      }
    }

    void loadFromDatabase();
    return () => controller.abort();
  }, [courseId, databaseContentId, router]);

  const quiz = databaseContentId ? databaseQuiz : staticQuiz;
  const trackingId = databaseContentId ?? quizId ?? 0;
  const durationMinutes = quiz?.durationMinutes ?? null;
  const questions = quiz?.questions ?? [];
  const question = questions[currentQuestion];

  useEffect(() => {
    if (phase !== "question" || durationMinutes === null) return;

    const interval = window.setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setPhase("finished");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, durationMinutes]);

  useEffect(() => {
    if (phase !== "finished" || preview || trackingId <= 0) return;
    markContentViewed(courseId, trackingId);
    clearQuizStarted(courseId, trackingId);
  }, [phase, preview, courseId, trackingId]);

  const startQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOptions({});
    setTextAnswers({});
    setRelationAnswers({});
    setSelectedFiles({});
    setTimeRemaining(durationMinutes === null ? 0 : durationMinutes * 60);

    if (!preview && trackingId > 0) {
      markQuizStarted(courseId, trackingId);
    }

    setPhase("question");
  };

  const finishQuiz = () => {
    setPhase("finished");
  };

  const goNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((current) => current + 1);
    } else {
      finishQuiz();
    }
  };

  const goPreviousQuestion = () => {
    setCurrentQuestion((current) => Math.max(0, current - 1));
  };

  const toggleOption = (questionId: string, optionId: string, multiple: boolean) => {
    setSelectedOptions((current) => {
      const previous = current[questionId] ?? [];
      if (!multiple) {
        return { ...current, [questionId]: [optionId] };
      }

      const selected = previous.includes(optionId)
        ? previous.filter((value) => value !== optionId)
        : [...previous, optionId];

      return { ...current, [questionId]: selected };
    });
  };

  if (loadingDatabaseQuiz) {
    return (
      <div role="status" className="rounded-xl border border-talentia-border bg-talentia-surface p-8 text-sm text-talentia-muted">
        Cargando evaluación...
      </div>
    );
  }

  if (loadError || !quiz) {
    return (
      <div className="rounded-xl border border-talentia-border bg-talentia-surface p-6">
        <p role="alert" className="text-sm text-talentia-danger">
          {loadError || "Evaluación no encontrada."}
        </p>
        <Link
          href={exitHref}
          className="mt-4 inline-flex rounded-md bg-talentia-action px-5 py-2 text-sm font-medium text-white"
        >
          Volver al curso
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-talentia-border bg-talentia-surface p-6">
        <h1 className="text-xl font-bold text-talentia-primary">{quiz.title}</h1>
        <p className="mt-3 text-sm text-talentia-muted">
          Esta evaluación todavía no contiene preguntas.
        </p>
        <Link href={exitHref} className="mt-5 inline-flex rounded-md bg-talentia-action px-5 py-2 text-sm font-medium text-white">
          Volver al curso
        </Link>
      </div>
    );
  }

  const totalQuestions = questions.length;

  const renderHeader = (activeQuestion = false) => (
    <div className="mb-5 flex flex-col gap-4 border-b border-talentia-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-bold text-talentia-primary sm:text-2xl">
          {quiz.title}
        </h1>
        <p className="mt-1 text-sm text-talentia-primary">
          {activeQuestion
            ? "Responde las preguntas de la evaluación."
            : phase === "finished"
              ? "Antes de terminar, revisa el resumen de la evaluación."
              : "Antes de empezar esta evaluación, ten en cuenta lo siguiente."}
        </p>
      </div>

      <div className="flex shrink-0 items-center self-start rounded-md bg-talentia-selected">
        <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 2" />
          </svg>
          <div>
            <p className="text-xs">{activeQuestion ? "Tiempo restante" : "Tiempo"}</p>
            <p className="text-base font-bold leading-none sm:text-lg">
              {durationMinutes === null
                ? "Sin límite"
                : formatTime(activeQuestion ? timeRemaining : durationMinutes * 60)}
            </p>
          </div>
        </div>

        <div className="h-9 w-px bg-black/20" />

        <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M15 3v4h4" />
            <path d="M9 12h6M9 16h6" />
          </svg>
          <div>
            <p className="text-xs">Preguntas</p>
            <p className="text-base font-bold leading-none sm:text-lg">
              {activeQuestion ? `${currentQuestion + 1} de ${totalQuestions}` : totalQuestions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (phase === "intro") {
    return (
      <div className="rounded-xl border border-talentia-border bg-talentia-surface px-4 py-5 sm:px-7 sm:py-6">
        {renderHeader(false)}

        {quiz.instructions && (
          <section className="mb-5 rounded-lg bg-talentia-selected/50 p-4">
            <h2 className="mb-2 text-sm font-bold text-talentia-primary">Instrucciones</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-talentia-primary">
              {quiz.instructions}
            </p>
          </section>
        )}

        <div className="space-y-4 px-1 pt-2 text-sm font-semibold leading-relaxed text-talentia-primary">
          <p>1. Una vez iniciado, {durationMinutes ? `cuentas con ${durationMinutes} minutos para resolverlo` : "puedes resolverlo sin límite de tiempo"}.</p>
          <p>2. La evaluación consta de {totalQuestions} {totalQuestions === 1 ? "pregunta" : "preguntas"}.</p>
          <p>3. Puedes utilizar Anterior y Siguiente para revisar las preguntas antes de terminar.</p>
          <p>4. Respeta las instrucciones y completa las respuestas que correspondan.</p>
          <p>5. Las respuestas de texto y los archivos adjuntos se muestran en la interfaz; el almacenamiento de respuestas se integrará en la siguiente etapa.</p>
        </div>

        <div className="flex justify-center pt-8 sm:pt-10">
          <button
            type="button"
            onClick={startQuiz}
            className="rounded-md bg-talentia-action px-10 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-talentia-primary"
          >
            Empezar
          </button>
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          {previousHref ? (
            <Link href={previousHref} className="rounded border border-talentia-border bg-talentia-surface px-4 py-2 text-sm hover:bg-talentia-hover">
              ← Anterior
            </Link>
          ) : <span />}
          {nextHref ? (
            <Link href={nextHref} className="rounded bg-talentia-action px-5 py-2.5 text-sm font-medium text-white hover:bg-talentia-primary">
              Siguiente →
            </Link>
          ) : <span />}
        </div>
      </div>
    );
  }

  if (phase === "question" && question) {
    const chosenOptions = selectedOptions[question.id] ?? [];
    const chosenRelations = relationAnswers[question.id] ?? {};

    return (
      <div className="rounded-xl border border-talentia-border bg-talentia-surface px-4 py-5 sm:px-7 sm:py-6">
        {renderHeader(true)}

        <div className="pt-2">
          <div className="mb-4">
            <span className="inline-flex rounded-lg bg-talentia-action px-4 py-2 text-sm font-semibold text-white">
              Pregunta {currentQuestion + 1}
            </span>
            {question.points > 0 && (
              <span className="ml-3 text-xs text-talentia-muted">{question.points} pts</span>
            )}
          </div>

          <h2 className="mb-5 whitespace-pre-wrap text-base font-semibold leading-relaxed text-talentia-primary sm:text-lg">
            {question.text}
          </h2>

          {question.type === "single" || question.type === "boolean" || question.type === "multiple" ? (
            <div className="space-y-2.5">
              {question.options.map((option, index) => {
                const selected = chosenOptions.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg bg-talentia-border/70 px-3 py-3 transition hover:bg-talentia-selected sm:px-4"
                  >
                    <input
                      type={question.type === "multiple" ? "checkbox" : "radio"}
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={selected}
                      onChange={() => toggleOption(question.id, option.id, question.type === "multiple")}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-talentia-blue"
                    />
                    <span className="text-sm leading-relaxed text-talentia-primary">
                      {question.type === "boolean"
                        ? option.text
                        : `${String.fromCharCode(65 + index)}) ${option.text}`}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : question.type === "text" ? (
            <div className="space-y-3">
              <label
                htmlFor={`respuesta-${question.id}`}
                className="block text-sm font-semibold text-talentia-primary"
              >
                Escribe tu respuesta
              </label>
              <textarea
                id={`respuesta-${question.id}`}
                value={textAnswers[question.id] ?? ""}
                onChange={(event) =>
                  setTextAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                rows={6}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full resize-y rounded-lg border border-talentia-border bg-talentia-surface p-3 text-sm leading-relaxed outline-none focus:border-talentia-blue"
              />
              {question.allowFiles && (
                <div className="rounded-lg border border-dashed border-talentia-border p-3">
                  <label htmlFor={`archivo-${question.id}`} className="mb-2 block text-sm font-semibold text-talentia-primary">
                    Adjuntar archivo(s)
                  </label>
                  <input
                    id={`archivo-${question.id}`}
                    type="file"
                    multiple
                    onChange={(event) =>
                      setSelectedFiles((current) => ({
                        ...current,
                        [question.id]: Array.from(event.target.files ?? []).map((file) => file.name),
                      }))
                    }
                    className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-talentia-selected file:px-3 file:py-2 file:text-sm file:font-semibold file:text-talentia-primary"
                  />
                  {(selectedFiles[question.id] ?? []).length > 0 && (
                    <p className="mt-2 text-xs text-talentia-muted">
                      Seleccionados: {(selectedFiles[question.id] ?? []).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-talentia-muted">
                Relaciona cada elemento de la izquierda con la opción que corresponda.
              </p>
              {question.relations.map((relation) => (
                <div
                  key={relation.id}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-talentia-border p-3 sm:grid-cols-2 sm:items-center"
                >
                  <span className="text-sm font-medium text-talentia-primary">
                    {relation.left}
                  </span>
                  <select
                    aria-label={`Relación para ${relation.left}`}
                    value={chosenRelations[relation.id] ?? ""}
                    onChange={(event) =>
                      setRelationAnswers((current) => ({
                        ...current,
                        [question.id]: {
                          ...(current[question.id] ?? {}),
                          [relation.id]: event.target.value,
                        },
                      }))
                    }
                    className="min-w-0 rounded-md border border-talentia-border bg-talentia-surface px-3 py-2 text-sm text-talentia-primary outline-none focus:border-talentia-blue"
                  >
                    <option value="">Selecciona una relación</option>
                    {question.relationOptions.map((option, index) => (
                      <option key={`${option}-${index}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPreviousQuestion}
              disabled={currentQuestion === 0}
              className="rounded-md border border-talentia-border bg-talentia-surface px-5 py-2.5 text-sm text-talentia-primary transition hover:bg-talentia-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={goNextQuestion}
              className="rounded-md bg-talentia-action px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-talentia-primary"
            >
              {currentQuestion === totalQuestions - 1 ? "Terminar" : "Siguiente →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-talentia-border bg-talentia-surface px-4 py-5 sm:px-7 sm:py-6">
      {renderHeader(false)}
      <div className="pt-6">
        <h2 className="text-base font-bold text-talentia-primary">
          Evaluación terminada.
        </h2>
        <p className="mt-2 max-w-[700px] text-sm leading-relaxed text-talentia-primary">
          Has llegado al final de esta evaluación. En esta etapa la interfaz muestra el cierre; el envío y almacenamiento de respuestas y la calificación se conectarán por separado.
        </p>
      </div>

      <div className="flex justify-center py-16 sm:py-24">
        <Link
          href={exitHref}
          className="rounded-md bg-talentia-action px-12 py-3 text-base font-semibold text-white transition hover:bg-talentia-primary"
        >
          Salir
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-talentia-border pt-4">
        {previousHref ? (
          <Link href={previousHref} className="rounded border border-talentia-border bg-talentia-surface px-4 py-2 text-sm hover:bg-talentia-hover">
            ← Anterior
          </Link>
        ) : <span />}
        {nextHref ? (
          <Link href={nextHref} className="rounded bg-talentia-action px-5 py-2.5 text-sm font-medium text-white hover:bg-talentia-primary">
            Siguiente →
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
