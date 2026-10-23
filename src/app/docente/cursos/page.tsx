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
  actividades: number;
  evaluaciones: number;
  periodoId: string | null;
  periodoNombre: string | null;
};

type PeriodoAcademicoApi = {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

const COLORES = ["var(--talentia-teal)", "var(--talentia-purple)", "var(--talentia-blue)", "var(--talentia-teal)", "var(--talentia-blue)"];

export default function TeacherCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Todos");
  const [periods, setPeriods] = useState<PeriodoAcademicoApi[]>([]);
  const [periodsError, setPeriodsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarPeriodos() {
      try {
        setPeriodsError("");
        const response = await fetch(
          `${API_URL}/cursos/docente/periodos-academicos`,
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
              : "No se pudieron cargar los periodos académicos."
          );
        }

        setPeriods(Array.isArray(data.periodos) ? data.periodos : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setPeriodsError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los periodos académicos."
        );
      }
    }

    void cargarPeriodos();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCursos() {
      try {
        setLoading(true);
        setError("");

        const query = period === "Todos"
          ? ""
          : `?periodoId=${encodeURIComponent(period)}`;
        const response = await fetch(
          `${API_URL}/cursos/docente/mis-cursos${query}`,
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
            actividades: Number(curso.actividades) || 0,
            evaluaciones: Number(curso.evaluaciones) || 0,
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
  }, [router, period]);

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

          <h1 className="teacher-page-title text-[29px] font-semibold tracking-[-0.7px] text-talentia-primary">
            Mis cursos
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* BUSCADOR */}
            <div className="flex h-[38px] w-full min-w-[230px] items-center rounded-full bg-talentia-surface ring-1 ring-talentia-border px-3 sm:w-[300px]">
              <svg
                className="mr-2 h-5 w-5 text-talentia-muted"
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
                className="w-full bg-transparent text-[12px] text-talentia-primary outline-none placeholder:text-talentia-placeholder"
              />
            </div>

            {/* PERIODO */}
            <div className="flex h-[38px] items-center rounded-full bg-talentia-surface ring-1 ring-talentia-border px-3">

              <svg
                className="mr-2 h-5 w-5 text-talentia-primary"
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

              <span className="mr-2 text-[12px] font-semibold text-talentia-primary">
                Periodo
              </span>

              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                aria-label="Filtrar cursos por periodo académico"
                className="max-w-[190px] bg-transparent text-[11px] font-medium text-talentia-primary outline-none"
              >
                <option value="Todos">Todos</option>
                {periods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

          </div>
          {periodsError && (
            <p role="status" className="text-[11px] text-talentia-danger xl:text-right">
              {periodsError}
            </p>
          )}
        </header>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-[12px] text-talentia-danger"
          >
            {error}
          </div>
        )}

        {/* CURSOS */}
        {loading ? (
          <div className="rounded-xl bg-talentia-surface px-6 py-12 text-center text-[13px] text-talentia-muted shadow-sm">
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
            <div className="rounded-xl bg-talentia-surface px-6 py-12 text-center shadow-sm">
              <p className="text-[13px] text-talentia-muted">
                {period !== "Todos"
                  ? "No tienes cursos asignados a este periodo académico."
                  : search.trim()
                    ? "No se encontraron cursos con esa búsqueda."
                    : "No tienes cursos asignados todavía."}
              </p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
