import Link from "next/link";
import type { Course } from "@/data/courses";

type CourseCardProps = {
  course: Course;
  variant?: "student" | "teacher";
};

export default function CourseCard({
  course,
  variant = "teacher",
}: CourseCardProps) {
  const isTeacher = variant === "teacher";

  return (
    <Link
      href={
        isTeacher
          ? `/docente/cursos/${course.id}`
          : `/alumno/cursos/${course.id}`
      }
      className="group block overflow-hidden rounded-[12px] bg-white shadow-[0_2px_5px_rgba(0,0,0,0.22)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* IMAGEN */}
      <div className="relative h-[110px] overflow-hidden">
        <img
          src={course.imagen}
          alt={course.nombre}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute left-[10px] bottom-[12px]">
          <h2 className="text-[14px] font-bold leading-tight text-white drop-shadow-md">
            {course.nombre}
          </h2>

          <p className="text-[12px] font-medium text-white">
            {course.codigo}
          </p>
        </div>
      </div>

      {/* FRANJA */}
      <div
        className="h-[5px]"
        style={{
          backgroundColor: course.accent,
        }}
      />

      {isTeacher ? (
        <div className="px-[10px] py-[9px]">
          {/* ESTADÍSTICAS */}
          <div className="space-y-[3px]">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-800">
              <svg
                className="h-3.5 w-3.5 text-[#3186d8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="9" cy="8" r="3" />
                <circle cx="17" cy="9" r="2.5" />
                <path d="M3 20c.7-4 2.7-6 6-6s5.3 2 6 6" />
                <path d="M14.5 15c2.5.3 4.1 1.9 4.8 5" />
              </svg>

              <span>Alumnos: {course.alumnos}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-gray-800">
              <svg
                className="h-3.5 w-3.5 text-[#3186d8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M8 7h8M8 11h5M8 15h6" />
              </svg>

              <span>Actividades: {course.actividades}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-gray-800">
              <svg
                className="h-3.5 w-3.5 text-[#3186d8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 19V9" />
                <path d="M10 19V5" />
                <path d="M16 19v-7" />
                <path d="M22 19V3" />
              </svg>

              <span>Evaluaciones: {course.evaluaciones}</span>
            </div>
          </div>

          {/* PROGRESO */}
          <div className="mt-[7px]">
            <div className="relative h-[12px] overflow-hidden rounded-full bg-[#ececec]">
              <div
                className="h-full rounded-full bg-[#3186d8]"
                style={{
                  width: `${course.progreso}%`,
                }}
              />

              <span className="absolute inset-y-0 right-[7px] flex items-center text-[8px] font-medium text-[#3186d8]">
                {course.progreso}%
              </span>
            </div>
          </div>

          {/* BOTÓN */}
          <div className="flex justify-center pt-[6px]">
            <span className="rounded-full bg-[#3186d8] px-[18px] py-[6px] text-[11px] font-semibold text-white shadow-sm transition group-hover:bg-[#2777c1]">
              Gestionar Curso →
            </span>
          </div>
        </div>
      ) : (
        <div className="px-[10px] py-[9px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-700">
              Progreso
            </span>

            <span className="text-[10px] text-[#3186d8]">
              {course.progreso}%
            </span>
          </div>

          <div className="mt-1 h-[10px] overflow-hidden rounded-full bg-[#ececec]">
            <div
              className="h-full rounded-full bg-[#3186d8]"
              style={{
                width: `${course.progreso}%`,
              }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}