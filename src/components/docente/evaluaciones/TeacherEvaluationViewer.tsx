"use client";

import Link from "next/link";
import { useMemo } from "react";

import { quizzes } from "@/data/quizzes";

type TeacherEvaluationViewerProps = {
  quizId: number;
  courseId: number;
  editHref: string;
  exitHref: string;
  previousSectionHref?: string;
  nextSectionHref?: string;
};

export default function TeacherEvaluationViewer({
  quizId,
  courseId,
  editHref,
  exitHref,
  previousSectionHref,
  nextSectionHref,
}: TeacherEvaluationViewerProps) {
  const quiz = useMemo(
    () => quizzes.find((item) => item.id === quizId),
    [quizId]
  );

  if (!quiz) {
    return (
      <div className="rounded-xl bg-talentia-surface p-8">
        <h2 className="text-xl font-semibold">
          Evaluación no encontrada
        </h2>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;

  return (
    <div className="rounded-xl border border-talentia-border bg-talentia-surface px-7 py-6">

      {/* CABECERA */}
      <div className="mb-5 flex flex-col gap-3 border-b border-talentia-border pb-4 md:flex-row md:items-start md:justify-between">

        <div>
          <h1 className="text-[24px] font-bold text-talentia-primary">
            {quiz.title}
          </h1>

          <p className="mt-1 text-[12px] text-talentia-primary">
            Vista previa de la evaluación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={editHref}
            className="rounded-md bg-talentia-action px-4 py-2 text-[11px] font-medium text-white transition hover:bg-talentia-primary"
          >
            ✎ Editar evaluación
          </Link>

          <Link
            href={exitHref}
            className="rounded-md border border-talentia-border bg-talentia-surface px-4 py-2 text-[11px] font-medium text-talentia-primary transition hover:bg-talentia-hover"
          >
            Salir
          </Link>
        </div>
      </div>

      {/* INFORMACIÓN */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-talentia-selected px-4 py-3">

        <div>
          <p className="text-[10px] font-medium uppercase text-talentia-blue">
            Evaluación
          </p>

          <p className="text-[18px] font-bold text-talentia-primary">
            {totalQuestions} preguntas
          </p>
        </div>

        <div className="rounded-md bg-talentia-surface px-5 py-2 text-right">
          <p className="text-[9px] text-talentia-muted">
            Tiempo límite
          </p>

          <p className="text-[14px] font-bold text-talentia-primary">
            Sin límite
          </p>
        </div>
      </div>

      {/* TODAS LAS PREGUNTAS */}
      <div className="space-y-8">

        {quiz.questions.map((question, index) => (
          <section
            key={question.id}
            className="border-b border-talentia-border pb-7 last:border-b-0"
          >

            <div className="mb-4">
              <span className="inline-flex rounded-lg bg-talentia-action px-4 py-2 text-[14px] font-semibold text-white">
                Pregunta {index + 1}
              </span>
            </div>

            <h2 className="mb-5 text-[16px] font-semibold text-talentia-primary">
              {question.text}
            </h2>

            <div className="space-y-3">

              {question.options.map((option) => {
                const isCorrect =
                  option.id === question.correctOptionId;

                return (
                  <div
                    key={option.id}
                    className={`
                      flex items-center gap-4
                      rounded-lg border
                      px-4 py-3
                      ${
                        isCorrect
                          ? "border-talentia-border bg-talentia-selected"
                          : "border-talentia-border bg-talentia-surface"
                      }
                    `}
                  >

                    {/* RADIO SOLO VISUAL */}
                    <span
                      className={`
                        flex h-5 w-5 shrink-0
                        items-center justify-center
                        rounded-full border-2
                        ${
                          isCorrect
                            ? "border-talentia-blue"
                            : "border-talentia-border bg-talentia-surface"
                        }
                      `}
                    >
                      {isCorrect && (
                        <span className="h-2.5 w-2.5 rounded-full bg-talentia-teal" />
                      )}
                    </span>

                    <span className="text-[13px] text-talentia-primary">
                      {option.id}) {option.text}
                    </span>

                    {isCorrect && (
                      <span className="ml-auto shrink-0 rounded-full bg-talentia-success-bg px-2.5 py-1 text-[9px] font-semibold text-talentia-success">
                        Correcta
                      </span>
                    )}

                  </div>
                );
              })}

            </div>
          </section>
        ))}

      </div>

      {/* NAVEGACIÓN DEL CURSO */}
      <div className="mt-8 flex items-center justify-between border-t border-talentia-border pt-5">

        {previousSectionHref ? (
          <Link
            href={previousSectionHref}
            className="
              rounded
              border border-talentia-border
              bg-talentia-surface
              px-5 py-2
              text-sm
              text-talentia-primary
              transition
              hover:bg-talentia-hover
            "
          >
            ← Anterior
          </Link>
        ) : (
          <div />
        )}

        {nextSectionHref ? (
          <Link
            href={nextSectionHref}
            className="
              rounded
              bg-talentia-action
              px-5 py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-talentia-primary
            "
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