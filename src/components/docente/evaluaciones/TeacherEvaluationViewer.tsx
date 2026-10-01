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
      <div className="rounded-xl bg-white p-8">
        <h2 className="text-xl font-semibold">
          Evaluación no encontrada
        </h2>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;

  return (
    <div className="rounded-xl border border-gray-300 bg-white px-7 py-6">

      {/* CABECERA */}
      <div className="mb-5 flex flex-col gap-3 border-b border-gray-300 pb-4 md:flex-row md:items-start md:justify-between">

        <div>
          <h1 className="text-[24px] font-bold text-[#1554a0]">
            {quiz.title}
          </h1>

          <p className="mt-1 text-[12px] text-gray-700">
            Vista previa de la evaluación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={editHref}
            className="rounded-md bg-[#3186d8] px-4 py-2 text-[11px] font-medium text-white transition hover:bg-[#2777c1]"
          >
            ✎ Editar evaluación
          </Link>

          <Link
            href={exitHref}
            className="rounded-md border border-gray-400 bg-white px-4 py-2 text-[11px] font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Salir
          </Link>
        </div>
      </div>

      {/* INFORMACIÓN */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-[#e9f3fb] px-4 py-3">

        <div>
          <p className="text-[10px] font-medium uppercase text-[#3186d8]">
            Evaluación
          </p>

          <p className="text-[18px] font-bold text-[#1554a0]">
            {totalQuestions} preguntas
          </p>
        </div>

        <div className="rounded-md bg-white px-5 py-2 text-right">
          <p className="text-[9px] text-gray-500">
            Tiempo límite
          </p>

          <p className="text-[14px] font-bold text-gray-800">
            Sin límite
          </p>
        </div>
      </div>

      {/* TODAS LAS PREGUNTAS */}
      <div className="space-y-8">

        {quiz.questions.map((question, index) => (
          <section
            key={question.id}
            className="border-b border-gray-200 pb-7 last:border-b-0"
          >

            <div className="mb-4">
              <span className="inline-flex rounded-lg bg-[#3186d8] px-4 py-2 text-[14px] font-semibold text-white">
                Pregunta {index + 1}
              </span>
            </div>

            <h2 className="mb-5 text-[16px] font-semibold text-gray-800">
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
                          ? "border-[#58b8e8] bg-[#e8f7ff]"
                          : "border-gray-200 bg-[#dfdfdf]"
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
                            ? "border-[#3186d8]"
                            : "border-gray-500 bg-white"
                        }
                      `}
                    >
                      {isCorrect && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#3186d8]" />
                      )}
                    </span>

                    <span className="text-[13px] text-gray-800">
                      {option.id}) {option.text}
                    </span>

                    {isCorrect && (
                      <span className="ml-auto shrink-0 rounded-full bg-[#c9efca] px-2.5 py-1 text-[9px] font-semibold text-[#23963a]">
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
      <div className="mt-8 flex items-center justify-between border-t border-gray-300 pt-5">

        {previousSectionHref ? (
          <Link
            href={previousSectionHref}
            className="
              rounded
              border border-gray-400
              bg-white
              px-5 py-2
              text-sm
              text-gray-800
              transition
              hover:bg-gray-100
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
              bg-[#3186d8]
              px-5 py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-[#2777c1]
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