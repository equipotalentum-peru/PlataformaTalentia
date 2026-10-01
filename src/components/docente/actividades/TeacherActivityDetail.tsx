"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { activities } from "@/data/activities";
import { teacherActivityStudents } from "@/data/teacher-activities";

type TeacherActivityDetailProps = {
  courseId: number;
  activityId: number;
  previousSectionHref?: string;
  nextSectionHref?: string;
};

export default function TeacherActivityDetail({
  courseId,
  activityId,
  previousSectionHref,
  nextSectionHref,
}: TeacherActivityDetailProps) {
  const router = useRouter();

  const activity = activities.find(
    (item) => item.id === activityId
  );

  if (!activity) {
    return (
      <div className="rounded-xl bg-white p-8">
        Actividad no encontrada.
      </div>
    );
  }

  const submitted = teacherActivityStudents.filter(
    (student) => student.status === "Entregada"
  ).length;

  const pending = teacherActivityStudents.filter(
    (student) => student.status === "Pendiente"
  ).length;

  return (
    <div className="min-h-screen px-3 py-4 lg:px-5">
      <div className="mx-auto max-w-[1080px]">

        {/* CABECERA */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            href={`/docente/cursos/${courseId}`}
            className="flex h-8 items-center gap-1 rounded-md bg-[#3186d8] px-3 text-[10px] font-medium text-white"
          >
            ← Volver
          </Link>

          <span className="truncate text-[11px] text-gray-700">
            Módulo 1: Introducción a las TIC &gt; 1.4 Practica
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">

          {/* CONTENIDO PRINCIPAL */}
          <section className="rounded-xl bg-white p-5 shadow-sm">

            <h1 className="text-[25px] font-bold leading-tight text-[#3186d8]">
              {activity.title}
            </h1>

            <p className="mt-2 max-w-[750px] text-[12px] leading-relaxed text-gray-700">
              {activity.description}
            </p>

            <div className="my-4 border-b border-gray-300" />

            <h2 className="mb-4 text-[18px] font-bold text-[#3186d8]">
              Entregas
            </h2>

            <div className="mb-3 flex gap-2 text-[10px]">
              <span className="rounded-full bg-[#c9efca] px-3 py-1 text-[#259d36]">
                {submitted} entregadas
              </span>

              <span className="rounded-full bg-[#ffe6ad] px-3 py-1 text-[#b57a00]">
                {pending} pendientes
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[600px] border-collapse text-left text-[10px]">
                <thead>
                  <tr className="bg-[#e9edf2]">
                    <th className="px-3 py-2.5 font-semibold">
                      Alumno
                    </th>

                    <th className="px-3 py-2.5 font-semibold">
                      Actividad
                    </th>

                    <th className="px-3 py-2.5 font-semibold">
                      Nota
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {teacherActivityStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() =>
                        router.push(
                          `/docente/cursos/${courseId}/actividades/${activityId}/alumno/${student.id}`
                        )
                      }
                      className="cursor-pointer border-t border-gray-200 transition hover:bg-[#f6faff]"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3186d8] text-[8px] font-semibold text-white">
                            {student.initials}
                          </span>

                          <span className="font-medium text-gray-800">
                            {student.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-2 py-1 ${
                            student.status === "Entregada"
                              ? "bg-[#c9efca] text-[#2c9d3c]"
                              : "bg-[#ffe6ad] text-[#b57a00]"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td className="px-3 py-2">
                        {student.grade !== null ? (
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-[#eeeeee] px-2 py-1">
                              {student.grade}
                            </span>

                            <span className="rounded bg-[#eeeeee] px-2 py-1">
                              Pts
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="rounded bg-[#eeeeee] px-3 py-1">
                              -
                            </span>

                            <span className="rounded bg-[#eeeeee] px-2 py-1">
                              Pts
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="mt-4 rounded-md bg-[#3186d8] px-5 py-2 text-[10px] font-medium text-white"
            >
              Guardar notas
            </button>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-3">

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-bold text-[#3186d8]">
                Detalles de la actividad
              </h2>

              <div className="mt-4 space-y-3 text-[10px]">
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
                    {activity.maxAttempts} intentos
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

                <div>
                  <p className="text-[#3186d8]">
                    Rúbrica de evaluación
                  </p>

                  <button
                    type="button"
                    className="text-[#3186d8] hover:underline"
                  >
                    Ver rúbrica ↗
                  </button>
                </div>

                <div className="rounded-lg bg-[#8dc8f3] p-3 text-gray-700">
                  <p className="font-semibold text-[#2670ae]">
                    ⓘ Importante
                  </p>

                  <p className="mt-1 leading-relaxed">
                    Las entregas realizadas después de
                    la fecha límite se marcarán como
                    atrasadas.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="text-[11px] font-bold text-[#3186d8]">
                Tarea seleccionada
              </h2>

              <p className="mt-3 text-[10px] text-gray-700">
                Selecciona un alumno de la tabla para
                revisar su entrega.
              </p>
            </section>

          </aside>
        </div>
        {/* NAVEGACIÓN DE SECCIÓN */}
        <div className="mt-5 flex items-center justify-between">
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
    </div>
  );
}