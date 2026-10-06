"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import CourseCard from "@/components/common/curso/CourseCard";
import type { Course } from "@/data/courses";
import { API_URL } from "@/lib/api";

type CursoDocenteApi = {
  id: number;
  nombre: string;
  codigo: string;
  imagen: string | null;
  alumnos: number;
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

const COLORES = ["#54d6d8", "#b765d9", "#ee9acb", "#55d3d3", "#3186d8"];

export default function TeacherCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Todos");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCursos() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/cursos/docente/mis-cursos`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof data.message === "string"
              ? data.message
              : "No se pudieron cargar tus cursos."
          );
        }

        const lista: CursoDocenteApi[] = Array.isArray(data.cursos)
          ? data.cursos
          : [];

        setCourses(
          lista.map((curso, index) => ({
            id: Number(curso.id),
            nombre: curso.nombre,
            codigo: curso.codigo,
            imagen: curso.imagen || IMAGEN_POR_DEFECTO,
            alumnos: Number(curso.alumnos) || 0,
            // Aún no existen endpoints para estos datos.
            actividades: 0,
            evaluaciones: 0,
            progreso: 0,
            accent: COLORES[index % COLORES.length],
          }))
        );
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar tus cursos."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void cargarCursos();

    return () => controller.abort();
  }, [router]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return courses.filter((course) =>
      course.nombre.toLowerCase().includes(normalizedSearch) ||
      course.codigo.toLowerCase().includes(normalizedSearch)
    );
  }, [courses, search]);

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

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700"
          >
            {error}
          </div>
        )}

        {/* CURSOS */}
        {loading ? (
          <div className="rounded-xl bg-white px-6 py-12 text-center text-[13px] text-gray-500 shadow-sm">
            Cargando cursos...
          </div>
        ) : filteredCourses.length > 0 ? (
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
          !error && (
            <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-[13px] text-gray-500">
                No tienes cursos asignados todavía.
              </p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
