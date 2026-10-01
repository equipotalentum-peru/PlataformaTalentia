"use client";

import Link from "next/link";
import { useState } from "react";

import { activities } from "@/data/activities";
import { teacherActivityStudents } from "@/data/teacher-activities";

type Props = {
  courseId: number;
  activityId: number;
  studentId: number;
};

export default function TeacherSubmissionReview({
  courseId,
  activityId,
  studentId,
}: Props) {
  const activity = activities.find(
    (item) => item.id === activityId
  );

  const student = teacherActivityStudents.find(
    (item) => item.id === studentId
  );

  const [grade, setGrade] = useState(
    student?.grade ?? 0
  );

  const [comment, setComment] = useState("");
  const [published, setPublished] = useState(
    student?.grade !== null
  );

  if (!activity || !student) {
    return (
      <div className="p-8">
        Entrega no encontrada.
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 lg:px-5">
      <div className="mx-auto max-w-[1080px]">

        {/* CABECERA */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            href={`/docente/cursos/${courseId}/actividades/${activityId}`}
            className="flex h-8 items-center gap-1 rounded-md bg-[#3186d8] px-3 text-[10px] font-medium text-white"
          >
            ← Volver
          </Link>

          <span className="truncate text-[11px] text-gray-700">
            Módulo 1: Introducción a las TIC &gt; 1.4
            Práctica
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_265px]">

          {/* ENTREGA */}
          <section className="rounded-xl bg-white p-6 shadow-sm">

            {published && (
              <div className="mb-5 rounded-lg bg-[#c9efca] px-4 py-3">
                <p className="text-[16px] font-bold text-[#159b22]">
                  ✓ Calificación publicada
                </p>

                <p className="text-[10px] text-[#48a452]">
                  El alumno podrá visualizar su nota
                </p>
              </div>
            )}

            <div className="rounded-xl bg-[#eeeeee] p-4">

              <p className="text-[11px] font-semibold text-[#3186d8]">
                Archivo enviado
              </p>

              {student.submissionText && (
                <div className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-3 text-[11px] text-gray-700">
                  {student.submissionText}
                </div>
              )}

              {student.fileName && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ef5350] text-white">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 2h9l3 3v17H6z" />
                        <path d="M14 2v4h4" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-gray-800">
                        {student.fileName}
                      </p>

                      <p className="text-[9px] text-gray-400">
                        {student.fileSize}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-md border border-[#3186d8] px-3 py-1 text-[10px] text-[#3186d8]"
                  >
                    Descargar
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-3">

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-bold text-[#3186d8]">
                Detalles de la entrega
              </h2>

              <div className="mt-4 space-y-4 text-[10px]">

                <div>
                  <p className="text-[#3186d8]">
                    Fecha de entrega
                  </p>

                  <p className="text-gray-700">
                    {activity.dueDate}
                  </p>

                  <p className="text-gray-500">
                    {activity.dueTime} ({activity.timezone})
                  </p>
                </div>

                <div>
                  <p className="text-[#3186d8]">
                    Intentos
                  </p>

                  <p className="text-gray-700">
                    {student.attemptsUsed} de{" "}
                    {activity.maxAttempts}
                  </p>
                </div>

                <div>
                  <p className="text-[#3186d8]">
                    Puntuación máxima
                  </p>

                  <p className="text-gray-700">
                    {activity.maxGrade} puntos
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-bold text-[#3186d8]">
                Calificación
              </h2>

              <div className="mt-3 flex items-center gap-2">

                <input
                  type="number"
                  min={0}
                  max={activity.maxGrade}
                  step="0.1"
                  value={grade}
                  onChange={(event) =>
                    setGrade(
                      Number(event.target.value)
                    )
                  }
                  className="h-8 w-[60px] rounded bg-[#eeeeee] px-2 text-center text-[11px] outline-none"
                />

                <span className="rounded bg-[#eeeeee] px-3 py-2 text-[10px]">
                  Pts
                </span>
              </div>

              <label className="mt-4 block text-[10px] font-semibold text-[#3186d8]">
                Comentarios del docente (opcional)
              </label>

              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Insertar comentario"
                className="mt-2 h-[110px] w-full resize-none rounded-lg border border-[#8db7dd] p-3 text-[10px] outline-none focus:border-[#3186d8]"
              />

              <button
                type="button"
                onClick={() => setPublished(true)}
                className="mt-3 w-full rounded-md bg-[#3186d8] py-2 text-[10px] font-semibold text-white"
              >
                Publicar
              </button>

              <button
                type="button"
                className="mt-2 w-full rounded-md bg-[#f0eafa] py-2 text-[10px] font-semibold text-[#24528a]"
              >
                Cancelar
              </button>
            </section>

          </aside>
        </div>
      </div>
    </div>
  );
}