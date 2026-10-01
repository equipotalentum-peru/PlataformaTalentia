import Link from "next/link";

import { courses } from "@/data/courses";

const pendingReviews = [
  {
    tipo: "Actividad",
    titulo: "Práctica 2: Herramientas colaborativas",
    curso: "Herramientas TIC",
    detalle: "12 entregas pendientes",
  },
  {
    tipo: "Examen",
    titulo: "Examen Parcial: Algoritmos de ordenación",
    curso: "Algoritmos",
    detalle: "5 entregas pendientes",
  },
  {
    tipo: "Actividad",
    titulo: "Informe de investigación",
    curso: "Psicología",
    detalle: "8 entregas pendientes",
  },
  {
    tipo: "Actividad",
    titulo: "Cuestionario 1: Introducción",
    curso: "Matemáticas",
    detalle: "3 entregas pendientes",
  },
];

const upcomingEvaluations = [
  {
    title: "Examen Unidad 2",
    course: "Herramientas TIC",
    date: "7 de sep. de 2026",
    time: "11:00",
  },
  {
    title: "Examen Parcial",
    course: "Psicología",
    date: "10 de sep. de 2026",
    time: "14:00",
  },
  {
    title: "Cuestionario 2",
    course: "Matemáticas",
    date: "15 de sep. de 2026",
    time: "10:00",
  },
];

const recentActivity = [
  {
    text: "Se publicaron las calificaciones de Practica 1",
    date: "Hoy, 09:12",
  },
  {
    text: "5 nuevos alumnos se matricularon en Algoritmos",
    date: "Hoy, 08:45",
  },
  {
    text: "Se creó un nuevo contenido en Programación",
    date: "Hoy, 20:30",
  },
];

const courseStudents = [
  {
    nombre: "Herramientas TIC",
    codigo: "HT001",
    alumnos: 126,
  },
  {
    nombre: "Psicología",
    codigo: "PSI001",
    alumnos: 82,
  },
  {
    nombre: "Matemáticas",
    codigo: "MAT001",
    alumnos: 64,
  },
  {
    nombre: "Programación",
    codigo: "P001",
    alumnos: 91,
  },
];

function KpiIcon({
  type,
}: {
  type: "courses" | "students" | "activities" | "evaluations";
}) {
  if (type === "courses") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
      </svg>
    );
  }

  if (type === "students") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20c.8-4 2.8-6 6-6s5.2 2 6 6" />
        <path d="M14.5 15c2.5.3 4.1 1.9 4.8 5" />
      </svg>
    );
  }

  if (type === "activities") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </svg>
  );
}

export default function TeacherDashboardPage() {
  return (
    <main className="min-h-screen px-[24px] py-[22px] lg:px-[30px]">

      {/* ENCABEZADO */}
      <header className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.6px] text-[#3186d8]">
          Jueves, 4 de septiembre, 2026
        </p>

        <h1 className="mt-1 text-[38px] font-semibold tracking-[-0.7px] text-[#3186d8]">
          Bienvenida Gloria
        </h1>

        <p className="mt-1 text-[14px] text-[#3186d8]">
          Tienes 4 actividades pendientes de calificar esta semana
        </p>
      </header>

      {/* KPI */}
      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

        {[
          {
            label: "Cursos asignados",
            value: "5",
            type: "courses" as const,
            box: "bg-[#eec5ff]",
            icon: "bg-[#e1a8fa] text-[#7e43b1]",
            number: "text-[#7e43b1]",
          },
          {
            label: "Alumnos",
            value: "126",
            type: "students" as const,
            box: "bg-[#adffc9]",
            icon: "bg-[#80efac] text-[#16a349]",
            number: "text-[#16a349]",
          },
          {
            label: "Actividades por calificar",
            value: "18",
            type: "activities" as const,
            box: "bg-[#ffe3a5]",
            icon: "bg-[#ffd27c] text-[#d89200]",
            number: "text-[#d89200]",
          },
          {
            label: "Evaluaciones próximas",
            value: "3",
            type: "evaluations" as const,
            box: "bg-[#9fd9ff]",
            icon: "bg-[#71c3f6] text-[#2677bb]",
            number: "text-[#2677bb]",
          },
        ].map((item) => (
          <article
            key={item.label}
            className={`flex min-h-[78px] items-center gap-3 rounded-[14px] px-4 py-3 ${item.box}`}
          >
            <div
              className={`flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[15px] ${item.icon}`}
            >
              <KpiIcon type={item.type} />
            </div>

            <div>
              <p
                className={`text-[34px] font-bold leading-none ${item.number}`}
              >
                {item.value}
              </p>

              <p className="mt-1 text-[13px] font-medium text-gray-700">
                {item.label}
              </p>
            </div>
          </article>
        ))}

      </section>

      {/* CONTENIDO PRINCIPAL */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">

        {/* PENDIENTES */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">

          <h2 className="mb-3 text-[18px] font-semibold text-[#3186d8]">
            Pendientes de revisión
          </h2>

          <div className="divide-y divide-gray-200">
            {pendingReviews.map((item, index) => (
              <Link
                key={index}
                href="/docente/calificaciones"
                className="block py-2.5 transition hover:bg-gray-50"
              >
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[10px] font-medium ${
                    item.tipo === "Examen"
                      ? "bg-[#eadcff] text-[#8752bb]"
                      : "bg-[#f9cbd4] text-[#c84262]"
                  }`}
                >
                  {item.tipo}
                </span>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#3186d8]">
                      {item.titulo}
                    </p>

                    <p className="text-[11px] text-gray-500">
                      {item.curso} - {item.detalle}
                    </p>
                  </div>

                  <span className="text-xl text-gray-700">
                    ›
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </article>

        {/* MIS CURSOS */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">

          <h2 className="mb-3 text-[18px] font-semibold text-[#3186d8]">
            Mis cursos
          </h2>

          <div className="divide-y divide-gray-200">
            {courseStudents.map((course) => {
              const originalCourse = courses.find(
                (item) =>
                  item.codigo === course.codigo
              );

              return (
                <Link
                  key={course.codigo}
                  href={`/docente/cursos/${originalCourse?.id ?? 1}`}
                  className="flex items-center gap-3 py-2 transition hover:bg-gray-50"
                >
                  <img
                    src={originalCourse?.imagen}
                    alt={course.nombre}
                    className="h-10 w-14 rounded-md object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-[#3186d8]">
                      {course.nombre}
                    </p>

                    <p className="text-[11px] text-gray-500">
                      {course.codigo}
                    </p>

                    <p className="text-[11px] text-gray-500">
                      {course.alumnos} alumnos
                    </p>
                  </div>

                  <span className="text-xl text-gray-700">
                    ›
                  </span>
                </Link>
              );
            })}
          </div>

        </article>

      </section>

      {/* PARTE INFERIOR */}
      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* RESUMEN ALUMNOS */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">

          <h2 className="mb-3 text-center text-[20px] font-semibold text-[#3186d8]">
            Resumen de alumnos
          </h2>

          <div className="flex items-center justify-center gap-4">

            <div className="relative flex h-[130px] w-[130px] items-center justify-center">
              <svg
                viewBox="0 0 140 140"
                className="absolute inset-0 h-full w-full -rotate-90"
              >
                <circle
                  cx="70"
                  cy="70"
                  r="51"
                  fill="none"
                  stroke="#eeeeee"
                  strokeWidth="12"
                />

                <circle
                  cx="70"
                  cy="70"
                  r="51"
                  fill="none"
                  stroke="#c76dff"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="320.4"
                  strokeDashoffset="58"
                />
              </svg>

              <div className="text-center">
                <p className="text-[30px] font-bold text-[#3186d8]">
                  126
                </p>

                <p className="text-[11px] font-medium text-[#3186d8]">
                  Alumnos
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[11px] text-gray-600">
              <p>● Al día</p>
              <p>● Con pendientes</p>
              <p>● Bajo rendimiento</p>
            </div>

          </div>
        </article>

        {/* EVALUACIONES */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">

          <h2 className="mb-3 text-[20px] font-semibold text-[#3186d8]">
            Próximas evaluaciones
          </h2>

          <div className="divide-y divide-gray-200">
            {upcomingEvaluations.map(
              (evaluation) => (
                <div
                  key={evaluation.title}
                  className="py-2"
                >
                  <p className="text-[10px] font-semibold text-[#3186d8]">
                    {evaluation.title}
                  </p>

                  <div className="flex justify-between gap-2 text-[10px] text-gray-500">
                    <span>
                      {evaluation.course}
                    </span>

                    <span>
                      {evaluation.date}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-gray-500">
                    {evaluation.time}
                  </p>
                </div>
              )
            )}
          </div>

        </article>

        {/* ACTIVIDAD RECIENTE */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">

          <h2 className="mb-3 text-[20px] font-semibold text-[#3186d8]">
            Actividad reciente
          </h2>

          <div className="divide-y divide-gray-200">
            {recentActivity.map(
              (activity, index) => (
                <div
                  key={index}
                  className="py-2.5"
                >
                  <p className="text-[10px] text-gray-700">
                    {activity.text}
                  </p>

                  <p className="mt-1 text-right text-[10px] text-gray-400">
                    {activity.date}
                  </p>
                </div>
              )
            )}
          </div>

        </article>

      </section>

    </main>
  );
}