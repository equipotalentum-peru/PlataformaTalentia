"use client";

import { useMemo, useState } from "react";
import CourseCard from "@/components/common/curso/CourseCard";
import { courses } from "@/data/courses";

export default function TeacherCoursesPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Todos");

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        course.nombre.toLowerCase().includes(normalizedSearch) ||
        course.codigo.toLowerCase().includes(normalizedSearch);

      return matchesSearch;
    });
  }, [search]);

  return (
    <main className="min-h-screen px-[28px] py-[24px] lg:px-[42px]">
      <div className="w-full">

        {/* CABECERA */}
        <header className="mb-[30px] flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <h1 className="text-[29px] font-semibold tracking-[-0.7px] text-[#18407c]">
            Mis cursos
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* BUSCADOR */}
            <div className="flex h-[38px] w-full min-w-[230px] items-center rounded-full bg-[#ececec] px-3 sm:w-[300px]">
              <svg
                className="mr-2 h-5 w-5 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar Curso..."
                className="w-full bg-transparent text-[12px] text-gray-800 outline-none placeholder:text-gray-500"
              />
            </div>

            {/* PERIODO */}
            <div className="flex h-[38px] items-center rounded-full bg-[#ececec] px-3">

              <svg
                className="mr-2 h-5 w-5 text-gray-800"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="17"
                  rx="2"
                />
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <path d="M3 9h18" />
              </svg>

              <span className="mr-2 text-[12px] font-semibold text-gray-800">
                Periodo
              </span>

              <select
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value)
                }
                className="bg-transparent text-[11px] font-medium text-gray-800 outline-none"
              >
                <option value="Todos">Todos</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

          </div>
        </header>

        {/* CURSOS */}
        {filteredCourses.length > 0 ? (
          <section className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                variant="teacher"
              />
            ))}
          </section>
        ) : (
          <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-[13px] text-gray-500">
              No se encontraron cursos.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}