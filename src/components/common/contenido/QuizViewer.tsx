"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    intentosPermitidos: number;
    tiempoLimiteMinutos: number | null;
  };
  preguntas?: ApiQuestion[];
  message?: string;
};


type AttemptSummary = {
  id: string;
  numeroIntento: number;
  iniciadoEn: string;
  enviadoEn: string | null;
  estado: string;
  puntosObtenidos: number | null;
  puntajeTotal: number | null;
  nota: number | null;
  tiempoUsadoSegundos: number | null;
  tiempoRestanteSegundos: number | null;
};

type AttemptStatusResponse = {
  intentosPermitidos: number;
  intentosUsados: number;
  intentosRestantes: number;
  puedeIniciarNuevo: boolean;
  intentoEnCurso: AttemptSummary | null;
  intentos: AttemptSummary[];
  message?: string;
};

type StartAttemptResponse = {
  intento?: {
    id: string;
    numeroIntento: number;
    iniciadoEn: string;
    tiempoRestanteSegundos: number | null;
  };
  reanudado?: boolean;
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
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatusResponse | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [activeAttemptNumber, setActiveAttemptNumber] = useState<number | null>(null);
  const [attemptError, setAttemptError] = useState("");
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const finalizandoRef = useRef(false);
  const ultimoIntento = attemptStatus?.intentos[attemptStatus.intentos.length - 1] ?? null;

  const cargarEstadoIntentos = useCallback(
    async (signal?: AbortSignal): Promise<AttemptStatusResponse | null> => {
      if (!databaseContentId || preview) return null;

      const response = await fetch(
        `${API_URL}/cursos/${encodeURIComponent(String(courseId))}/contenidos/${encodeURIComponent(String(databaseContentId))}/evaluacion/intentos`,
        {
          credentials: "include",
          cache: "no-store",
          signal,
        }
      );

      const data = (await response.json().catch(() => ({}))) as AttemptStatusResponse;

      if (response.status === 401) {
        router.push("/login");
        return null;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudieron cargar tus intentos.");
      }

      return data;
    },
    [courseId, databaseContentId, preview, router]
  );

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

        if (!preview) {
          const estadoIntentos = await cargarEstadoIntentos(controller.signal);

          if (estadoIntentos) {
            setAttemptStatus(estadoIntentos);
            setAttemptError("");

            if (estadoIntentos.intentoEnCurso) {
              setActiveAttemptId(estadoIntentos.intentoEnCurso.id);
              setActiveAttemptNumber(estadoIntentos.intentoEnCurso.numeroIntento);
              setTimeRemaining(estadoIntentos.intentoEnCurso.tiempoRestanteSegundos ?? 0);
              setPhase("intro");
            } else if (estadoIntentos.intentos.length > 0) {
              const ultimoIntento = estadoIntentos.intentos[estadoIntentos.intentos.length - 1];
              setActiveAttemptId(null);
              setActiveAttemptNumber(null);
              setTimeRemaining(ultimoIntento.tiempoRestanteSegundos ?? 0);
              setPhase("finished");
            } else {
              setPhase("intro");
            }
          }
        }
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
  }, [courseId, databaseContentId, router, preview, cargarEstadoIntentos]);

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
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, durationMinutes]);

  useEffect(() => {
    if (
      phase === "question" &&
      durationMinutes !== null &&
      timeRemaining === 0 &&
      databaseContentId &&
      !preview &&
      activeAttemptId
    ) {
      void finishQuiz();
    }
  }, [
    phase,
    durationMinutes,
    timeRemaining,
    databaseContentId,
    preview,
    activeAttemptId,
  ]);

  useEffect(() => {
    if (phase !== "finished" || preview || trackingId <= 0) return;
    markContentViewed(courseId, trackingId);
    clearQuizStarted(courseId, trackingId);
  }, [phase, preview, courseId, trackingId]);

  async function startQuiz() {
    if (startingAttempt || submittingAttempt) return;

    setAttemptError("");
    setCurrentQuestion(0);
    setSelectedOptions({});
    setTextAnswers({});
    setRelationAnswers({});
    setSelectedFiles({});

    if (databaseContentId && !preview) {
      try {
        setStartingAttempt(true);

        const response = await fetch(
          `${API_URL}/cursos/${encodeURIComponent(String(courseId))}/contenidos/${encodeURIComponent(String(databaseContentId))}/evaluacion/intentos/iniciar`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const data = (await response.json().catch(() => ({}))) as StartAttemptResponse;

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok || !data.intento) {
          throw new Error(data.message ?? "No se pudo iniciar el intento.");
        }

        setActiveAttemptId(String(data.intento.id));
        setActiveAttemptNumber(Number(data.intento.numeroIntento));
        setTimeRemaining(data.intento.tiempoRestanteSegundos ?? 0);

        if (!preview && trackingId > 0) {
          markQuizStarted(courseId, trackingId);
        }

        setPhase("question");
      } catch (error) {
        setAttemptError(
          error instanceof Error ? error.message : "No se pudo iniciar el intento."
        );
      } finally {
        setStartingAttempt(false);
      }

      return;
    }

    setTimeRemaining(durationMinutes === null ? 0 : durationMinutes * 60);

    if (!preview && trackingId > 0) {
      markQuizStarted(courseId, trackingId);
    }

    setPhase("question");
  }

  async function finishQuiz() {
    if (finalizandoRef.current) return;

    if (!databaseContentId || preview) {
      setPhase("finished");
      return;
    }

    if (!activeAttemptId) {
      setAttemptError("No se encontró el intento activo de esta evaluación.");
      return;
    }

    finalizandoRef.current = true;
    setSubmittingAttempt(true);
    setAttemptError("");

    try {
      const respuestas = questions.map((item) => ({
        preguntaId: item.id,
        opcionesSeleccionadas: selectedOptions[item.id] ?? [],
        textoRespuesta: textAnswers[item.id] ?? "",
        relaciones: relationAnswers[item.id] ?? {},
      }));
      const formData = new FormData();
      formData.append("respuestas", JSON.stringify(respuestas));
      for (const item of questions) {
        if (!item.allowFiles) continue;
        for (const file of selectedFiles[item.id] ?? []) {
          formData.append(`archivo_${item.id}`, file, file.name);
        }
      }

      const response = await fetch(
        `${API_URL}/cursos/${encodeURIComponent(String(courseId))}/contenidos/${encodeURIComponent(String(databaseContentId))}/evaluacion/intentos/${encodeURIComponent(activeAttemptId)}/enviar`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo enviar la evaluación.");
      }

      const estadoActualizado = await cargarEstadoIntentos();
      if (estadoActualizado) {
        setAttemptStatus(estadoActualizado);
      }

      setActiveAttemptId(null);
      setActiveAttemptNumber(null);
      setPhase("finished");
    } catch (error) {
      setAttemptError(
        error instanceof Error ? error.message : "No se pudo enviar la evaluación."
      );
    } finally {
      setSubmittingAttempt(false);
      finalizandoRef.current = false;
    }
  }

  function goNextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((current) => current + 1);
    } else {
      void finishQuiz();
    }
  }

  function goPreviousQuestion() {
    setCurrentQuestion((current) => Math.max(0, current - 1));
  }

  function toggleOption(questionId: string, optionId: string, multiple: boolean) {
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
  }


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
            <p className="text-xs">
              {activeQuestion || phase === "finished" || attemptStatus?.intentoEnCurso
                ? "Tiempo restante"
                : "Tiempo"}
            </p>
            <p className="text-base font-bold leading-none sm:text-lg">
              {durationMinutes === null
                ? "Sin límite"
                : formatTime(
                    activeQuestion || phase === "finished" || attemptStatus?.intentoEnCurso
                      ? timeRemaining
                      : durationMinutes * 60
                  )}
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
          <p>5. Al terminar, tus respuestas se guardarán y el intento quedará registrado.</p>
        </div>

        {databaseContentId && !preview && attemptStatus && (
          <div className="mt-5 rounded-lg border border-talentia-border bg-talentia-selected/30 px-4 py-3 text-sm text-talentia-primary">
            {attemptStatus.intentoEnCurso ? (
              <p>
                Tienes el intento {attemptStatus.intentoEnCurso.numeroIntento} en curso.
                Puedes continuarlo con el tiempo que aún queda.
              </p>
            ) : (
              <p>
                Intentos disponibles: {attemptStatus.intentosRestantes} de {attemptStatus.intentosPermitidos}.
              </p>
            )}
          </div>
        )}

        {databaseContentId && !preview && ultimoIntento && ultimoIntento.estado !== "En curso" && (
          <div className="mt-3 rounded-lg border border-talentia-border bg-talentia-selected/30 px-4 py-3 text-sm text-talentia-primary">
            {ultimoIntento.estado === "Calificado" ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Última nota publicada</span>
                <span className="font-bold">
                  {ultimoIntento.nota !== null ? `${ultimoIntento.nota.toFixed(2)} / 20` : "Calificado"}
                  {ultimoIntento.puntosObtenidos !== null && ultimoIntento.puntajeTotal !== null
                    ? ` · ${ultimoIntento.puntosObtenidos.toFixed(2)} / ${ultimoIntento.puntajeTotal.toFixed(2)} pts`
                    : ""}
                </span>
              </div>
            ) : (
              <p>
                Tu último intento está pendiente de calificación. La nota aparecerá aquí y en Calificaciones cuando todas las preguntas tengan puntaje.
              </p>
            )}
          </div>
        )}

        {attemptError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {attemptError}
          </p>
        )}

        <div className="flex justify-center pt-8 sm:pt-10">
          <button
            type="button"
            onClick={() => void startQuiz()}
            disabled={startingAttempt || submittingAttempt}
            className="rounded-md bg-talentia-action px-10 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {startingAttempt
              ? "Iniciando..."
              : attemptStatus?.intentoEnCurso
                ? "Continuar intento"
                : "Empezar"}
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
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.zip,.rar"
                    onChange={(event) =>
                      setSelectedFiles((current) => ({
                        ...current,
                        [question.id]: Array.from(event.target.files ?? []),
                      }))
                    }
                    className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-talentia-selected file:px-3 file:py-2 file:text-sm file:font-semibold file:text-talentia-primary"
                  />
                  {(selectedFiles[question.id] ?? []).length > 0 && (
                    <p className="mt-2 text-xs text-talentia-muted">
                      Seleccionados: {(selectedFiles[question.id] ?? []).map((file) => file.name).join(", ")}
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

          {attemptError && (
            <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {attemptError}
            </p>
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
              disabled={submittingAttempt}
              className="rounded-md bg-talentia-action px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingAttempt
                ? "Guardando..."
                : currentQuestion === totalQuestions - 1
                  ? "Terminar"
                  : "Siguiente →"}
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
        <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-talentia-primary">
          {databaseContentId && !preview
            ? attemptStatus?.intentos[attemptStatus.intentos.length - 1]?.estado === "Calificado"
              ? "Tu evaluación ya fue calificada. Puedes consultar la nota en este resumen y en Calificaciones."
              : "Tus respuestas fueron enviadas y quedaron guardadas. La nota estará disponible cuando todas las preguntas estén calificadas."
            : "Has llegado al final de esta evaluación."}
        </p>

        {attemptError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {attemptError}
          </p>
        )}

        {databaseContentId && !preview && attemptStatus && (
          <section className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-talentia-primary">Historial de intentos</h3>
              <span className="text-xs text-talentia-muted">
                {attemptStatus.intentosUsados} de {attemptStatus.intentosPermitidos} utilizados
              </span>
            </div>

            <div className="space-y-2">
              {attemptStatus.intentos.map((intento) => (
                <div
                  key={intento.id}
                  className="flex flex-col gap-2 rounded-lg border border-talentia-border bg-talentia-selected/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-talentia-primary">
                      Intento {intento.numeroIntento}
                    </p>
                    <p className="mt-1 text-xs text-talentia-muted">
                      {intento.enviadoEn
                        ? `Enviado: ${new Date(intento.enviadoEn).toLocaleString("es-PE")}`
                        : "En curso"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {intento.tiempoUsadoSegundos !== null && (
                      <span className="rounded-full bg-white px-3 py-1.5 text-talentia-primary">
                        Tiempo usado: {formatTime(intento.tiempoUsadoSegundos)}
                      </span>
                    )}
                    <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-talentia-primary">
                      {intento.estado}
                    </span>
                    {intento.estado === "Calificado" && intento.puntajeTotal !== null && (
                      <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-talentia-primary">
                        {intento.nota !== null ? `Nota: ${intento.nota.toFixed(2)} / 20` : "Calificado"}
                        {intento.puntosObtenidos !== null
                          ? ` · ${intento.puntosObtenidos.toFixed(2)} / ${intento.puntajeTotal.toFixed(2)} pts`
                          : ""}
                      </span>
                    )}
                    {["Enviado", "Calificado"].includes(intento.estado) && (
                      <Link
                        href={`/alumno/cursos/${courseId}/contenido/${databaseContentId}/intentos/${intento.id}`}
                        className="rounded-md bg-talentia-action px-3 py-1.5 font-semibold text-white transition hover:bg-talentia-primary"
                      >
                        Ver intento
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 py-12 sm:py-16">
        {databaseContentId && !preview && attemptStatus?.puedeIniciarNuevo && (
          <button
            type="button"
            onClick={() => void startQuiz()}
            disabled={startingAttempt || submittingAttempt}
            className="rounded-md border border-talentia-action bg-white px-8 py-3 text-sm font-semibold text-talentia-action transition hover:bg-talentia-selected disabled:cursor-not-allowed disabled:opacity-60"
          >
            {startingAttempt
              ? "Iniciando..."
              : `Realizar otro intento (${attemptStatus.intentosRestantes} disponible${attemptStatus.intentosRestantes === 1 ? "" : "s"})`}
          </button>
        )}

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
