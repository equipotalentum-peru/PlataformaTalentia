"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, } from "react";
import { quizzes, type QuizOption, } from "@/data/quizzes";
import { clearQuizStarted, markContentViewed, markQuizStarted, } from "@/lib/progress";

type QuizViewerProps = {
  quizId: number;
  courseId: number;
  previousHref?: string;
  nextHref?: string;
  exitHref: string;
  preview?: boolean;
};

type QuizPhase =
  | "intro"
  | "question"
  | "finished";

export default function QuizViewer({
  quizId,
  courseId,
  previousHref,
  nextHref,
  exitHref,
  preview = false,
}: QuizViewerProps) {
  const quiz = useMemo(
    () =>
      quizzes.find(
        (item) => item.id === quizId
      ),
    [quizId]
  );

  const [phase, setPhase] =
    useState<QuizPhase>("intro");

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState<
      Record<number, QuizOption["id"]>
    >({});

  const [timeRemaining, setTimeRemaining] =
    useState(
      (quiz?.durationMinutes ?? 40) * 60
    );

  /*
   * CONTADOR
   *
   * El tiempo empieza únicamente después
   * de presionar "Empezar".
   */
  useEffect(() => {
    if (phase !== "question") {
      return;
    }

    const interval =
      window.setInterval(() => {
        setTimeRemaining((current) => {
          if (current <= 1) {
            window.clearInterval(interval);

            markContentViewed(
              courseId,
              quizId
            );

            clearQuizStarted(
              courseId,
              quizId
            );

            setPhase("finished");

            return 0;
          }

          return current - 1;
        });
      }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [phase]);

  if (!quiz) {
    return (
      <div className="rounded-xl bg-white p-8">
        <h2 className="text-xl font-semibold">
          Evaluación no encontrada
        </h2>
      </div>
    );
  }

  const question =
    quiz.questions[currentQuestion];

  const totalQuestions =
    quiz.questions.length;

  const selectedAnswer =
    answers[question?.id];

  const formatTime = (
    seconds: number
  ) => {
    const hours = Math.floor(
      seconds / 3600
    );

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    return [
      hours,
      minutes,
      secs,
    ]
      .map((value) =>
        String(value).padStart(
          2,
          "0"
        )
      )
      .join(":");
  };

  const startQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});

    setTimeRemaining(
      quiz.durationMinutes * 60
    );

    if (!preview) {
      markQuizStarted(courseId, quizId);
    }

    setPhase("question");
  };

  const selectAnswer = (
    optionId: QuizOption["id"]
  ) => {
    setAnswers((current) => ({
      ...current,
      [question.id]: optionId,
    }));
  };

  const finishQuiz = () => {
    if (!preview) {
      markContentViewed(courseId, quizId);
      clearQuizStarted(courseId, quizId);
    }

    setPhase("finished");
  };

  const goNextQuestion = () => {
    if (
      currentQuestion <
      totalQuestions - 1
    ) {
      setCurrentQuestion(
        (current) => current + 1
      );

      return;
    }

    finishQuiz();
  };

  /*
   * ========================================================
   * CABECERA COMÚN
   * ========================================================
   */

  const renderHeader = (
    activeQuestion = false
  ) => {
    return (
      <div className="mb-5 flex items-center justify-between border-b border-gray-300 pb-3">

        <div>
          <h1 className="text-[24px] font-bold text-[#1554a0]">
            Practica: TICs
          </h1>

          <p className="mt-1 text-[12px] text-gray-700">
            {activeQuestion
              ? "Responde las preguntas seleccionando la alternativa correcta."
              : "Antes de empezar esta evaluación ten en cuenta lo siguiente:"}
          </p>
        </div>

        <div className="flex items-center rounded-md bg-[#78f0ef]">

          {/* TIEMPO */}
          <div className="flex items-center gap-3 px-4 py-2">

            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <circle
                cx="12"
                cy="12"
                r="8"
              />

              <path d="M12 8v4l2.5 2" />
            </svg>

            <div>
              <p className="text-[10px]">
                {activeQuestion
                  ? "Tiempo restante"
                  : "Tiempo"}
              </p>

              <p className="text-[20px] font-bold leading-none">
                {activeQuestion
                  ? formatTime(
                      timeRemaining
                    )
                  : formatTime(
                      quiz.durationMinutes *
                        60
                    )}
              </p>
            </div>

          </div>

          <div className="h-10 w-px bg-black/40" />

          {/* PREGUNTAS */}
          <div className="flex items-center gap-3 px-4 py-2">

            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M6 3h9l3 3v15H6z" />
              <path d="M15 3v4h4" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
            </svg>

            <div>
              <p className="text-[10px]">
                Preguntas
              </p>

              <p className="text-[18px] font-bold leading-none">
                {activeQuestion
                  ? `${currentQuestion + 1} de ${totalQuestions}`
                  : totalQuestions}
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  };

  /*
   * ========================================================
   * INTRODUCCIÓN
   * ========================================================
   */

  if (phase === "intro") {
    return (
      <div className="rounded-xl border border-gray-300 bg-white px-7 py-6">

        {renderHeader(false)}

        <div className="space-y-5 px-1 pt-5">

          <p className="text-[15px] font-semibold">
            1. Una vez iniciado el examen solo
            cuentas con 40 minutos para resolverlo
          </p>

          <p className="text-[15px] font-semibold">
            2. La evaluación consta de 10 preguntas
          </p>

          <p className="text-[15px] font-semibold">
            3. Una vez pases a la siguiente
            pregunta no puedes regresar a la anterior
          </p>

          <p className="text-[15px] font-semibold">
            4. Una vez iniciado la evaluación no
            podras seguir navegando hasta terminarla
          </p>

          <p className="text-[15px] font-semibold">
            5. Si cierras la plataforma en pleno
            examen se evaluará solo las preguntas
            que hayas contestado hasta ese momento
          </p>

        </div>

        <div className="flex justify-center pt-12">

          <button
            type="button"
            onClick={startQuiz}
            className="
              rounded-md
              bg-[#3186d8]
              px-12 py-3
              text-[17px]
              font-medium
              text-white
              shadow-sm
              transition
              hover:bg-[#2777c1]
            "
          >
            Empezar
          </button>

        </div>

        {/* NAVEGACIÓN EXTERNA */}
        <div className="mt-16 flex items-center justify-between">

          {previousHref ? (
            <Link
              href={previousHref}
              className="rounded border border-gray-400 bg-white px-5 py-2 text-sm transition hover:bg-gray-100"
            >
              ← Anterior
            </Link>
          ) : (
            <div />
          )}

          {nextHref ? (
            <Link
              href={nextHref}
              className="rounded bg-[#3186d8] px-7 py-2.5 text-sm font-medium text-white transition hover:bg-[#2777c1]"
            >
              Siguiente →
            </Link>
          ) : (
            <div />
          )}

        </div>
      </div>
    );
  }

  /*
   * ========================================================
   * PREGUNTA
   * ========================================================
   */

  if (phase === "question") {
    return (
      <div className="rounded-xl border border-gray-300 bg-white px-7 py-6">

        {renderHeader(true)}

        <div className="pt-2">

          <div className="mb-5">
            <span
              className="
                inline-flex
                rounded-lg
                bg-[#3186d8]
                px-4 py-2
                text-[14px]
                font-semibold
                text-white
              "
            >
              Pregunta{" "}
              {currentQuestion + 1}
            </span>
          </div>

          <h2 className="mb-5 text-[16px] font-semibold text-gray-800">
            {question.text}
          </h2>

          <div className="space-y-3">

            {question.options.map(
              (option) => {
                const checked =
                  selectedAnswer ===
                  option.id;

                return (
                  <label
                    key={option.id}
                    className="
                      flex
                      cursor-pointer
                      items-center
                      gap-4
                      rounded-lg
                      bg-[#dfdfdf]
                      px-4 py-3
                      transition
                      hover:bg-[#d5d5d5]
                    "
                  >

                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={checked}
                      onChange={() =>
                        selectAnswer(
                          option.id
                        )
                      }
                      className="
                        h-5 w-5
                        accent-[#3186d8]
                      "
                    />

                    <span className="text-[13px] text-gray-800">
                      {option.id}){" "}
                      {option.text}
                    </span>

                  </label>
                );
              }
            )}

          </div>

          <div className="mt-12 flex justify-end">

            <button
              type="button"
              onClick={goNextQuestion}
              className="
                rounded-md
                bg-[#3186d8]
                px-7 py-2.5
                text-[16px]
                font-medium
                text-white
                transition
                hover:bg-[#2777c1]
              "
            >
              {currentQuestion ===
              totalQuestions - 1
                ? "Terminar"
                : "Siguiente"}
            </button>

          </div>

        </div>
      </div>
    );
  }

  /*
   * ========================================================
   * EVALUACIÓN TERMINADA
   * ========================================================
   */

  return (
    <div className="rounded-xl border border-gray-300 bg-white px-7 py-6">

      {renderHeader(false)}

      <div className="pt-8">

        <h2 className="text-[16px] font-bold text-gray-900">
          Evaluación Terminada.
        </h2>

        <p className="mt-1 max-w-[700px] text-[15px] font-semibold text-gray-900">
          Felicidades por terminar esta
          evaluación. Tu docente revisará tus
          respuestas y te informará cuando la nota
          esté lista.
        </p>

      </div>

      <div className="flex justify-center pt-48">

        <Link
          href={exitHref}
          className="
            rounded-md
            bg-[#3186d8]
            px-14 py-3
            text-[17px]
            font-medium
            text-white
            transition
            hover:bg-[#2777c1]
          "
        >
          Salir
        </Link>

      </div>

      {/* NAVEGACIÓN EXTERNA */}
      <div className="mt-28 flex items-center justify-between">

        {previousHref ? (
          <Link
            href={previousHref}
            className="rounded border border-gray-400 bg-white px-5 py-2 text-sm transition hover:bg-gray-100"
          >
            ← Anterior
          </Link>
        ) : (
          <div />
        )}

        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded bg-[#3186d8] px-7 py-2.5 text-sm font-medium text-white transition hover:bg-[#2777c1]"
          >
            Siguiente →
          </Link>
        ) : (
          <div />
        )}

      </div>

    </div>
  );
}