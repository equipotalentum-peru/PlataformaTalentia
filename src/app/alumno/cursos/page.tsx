"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { resolverImagenPortadaCurso } from "@/lib/curso-imagen";

type CursoAlumno = {
  id: number;
  nombre: string;
  codigo: string;
  imagen: string | null;
  progreso: number;
};

type PeriodoAcademicoAlumno = {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

export default function MisCursosPage() {
  const router = useRouter();

  const [cursos, setCursos] = useState<CursoAlumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [periodos, setPeriodos] = useState<PeriodoAcademicoAlumno[]>([]);
  const [periodo, setPeriodo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargandoPeriodos, setCargandoPeriodos] = useState(true);
  const [errorPeriodos, setErrorPeriodos] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarPeriodos() {
      try {
        setCargandoPeriodos(true);
        setErrorPeriodos("");

        const response = await fetch(
          `${API_URL}/cursos/periodos-academicos`,
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

        setPeriodos(Array.isArray(data.periodos) ? data.periodos : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setErrorPeriodos(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los periodos académicos."
        );
      } finally {
        if (!controller.signal.aborted) setCargandoPeriodos(false);
      }
    }

    void cargarPeriodos();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCursos() {
      try {
        setCargando(true);
        setError("");

        const query = periodo === "Todos"
          ? ""
          : `?periodoId=${encodeURIComponent(periodo)}`;

        const response = await fetch(
          `${API_URL}/cursos/mis-cursos${query}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudieron cargar tus cursos."
          );
        }

        setCursos(
          Array.isArray(data.cursos)
            ? data.cursos
            : []
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar tus cursos."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarCursos();

    return () => controller.abort();
  }, [router, periodo]);

  // La búsqueda se combina con el periodo seleccionado y solo filtra
  // los cursos que ya devolvió el backend para ese periodo.
  const cursosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");

    if (!termino) return cursos;

    return cursos.filter((curso) =>
      curso.nombre.toLocaleLowerCase("es").includes(termino) ||
      curso.codigo.toLocaleLowerCase("es").includes(termino)
    );
  }, [cursos, busqueda]);

  return (
    <div className="min-h-screen px-[52px] py-[33px]">
      <header className="mb-[31px] flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="student-page-title text-[29px] font-semibold tracking-[-0.7px] text-talentia-primary">
          Mis cursos
        </h1>

        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* BUSCADOR: mismo estilo y comportamiento que en la vista docente */}
            <div className="flex h-[38px] w-full min-w-[230px] items-center rounded-full bg-talentia-surface ring-1 ring-talentia-border px-3 sm:w-[300px]">
              <svg
                className="mr-2 h-5 w-5 text-talentia-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar Curso..."
                aria-label="Buscar cursos por nombre o código"
                className="w-full bg-transparent text-[12px] text-talentia-primary outline-none placeholder:text-talentia-placeholder"
              />
            </div>

            {/* FILTRO DE PERIODO ACADÉMICO */}
            <div className="flex h-[38px] shrink-0 items-center rounded-full bg-talentia-surface ring-1 ring-talentia-border px-3">
              <svg
                className="mr-2 h-5 w-5 text-talentia-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <path d="M3 9h18" />
              </svg>

              <span className="mr-2 text-[12px] font-semibold text-talentia-primary">
                Periodo
              </span>

              <select
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value)}
                aria-label="Filtrar mis cursos por periodo académico"
                disabled={cargandoPeriodos}
                className="max-w-[190px] bg-transparent text-[11px] font-medium text-talentia-primary outline-none disabled:opacity-60"
              >
                <option value="Todos">Todos</option>
                {periodos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorPeriodos ? (
            <p className="max-w-[280px] text-[11px] text-talentia-danger">
              {errorPeriodos}
            </p>
          ) : null}
        </div>
      </header>

      {cargando ? (
        <section className="flex min-h-[180px] max-w-[980px] items-center justify-center">
          <p className="text-[14px] text-talentia-muted">
            Cargando tus cursos...
          </p>
        </section>
      ) : error ? (
        <section className="max-w-[980px] rounded-lg border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-[13px] text-talentia-danger">
          {error}
        </section>
      ) : cursos.length === 0 ? (
        <section className="flex min-h-[180px] max-w-[980px] items-center justify-center rounded-lg bg-talentia-surface shadow-sm">
          <p className="text-[14px] text-talentia-muted">
            {periodo === "Todos"
              ? "No tienes cursos matriculados actualmente."
              : "No tienes cursos matriculados en este periodo académico."}
          </p>
        </section>
      ) : cursosFiltrados.length === 0 ? (
        <section className="flex min-h-[180px] max-w-[980px] items-center justify-center rounded-lg bg-talentia-surface shadow-sm">
          <p className="text-[14px] text-talentia-muted">
            No se encontraron cursos con esa búsqueda.
          </p>
        </section>
      ) : (
        <section className="grid w-full grid-cols-1 gap-[18px] md:grid-cols-2">
          {cursosFiltrados.map((curso) => {
            const imagen = resolverImagenPortadaCurso(curso.imagen, curso.id, IMAGEN_POR_DEFECTO);

            const progreso = Math.min(
              100,
              Math.max(
                0,
                Number(curso.progreso) || 0
              )
            );

            return (
              <button
                key={curso.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/alumno/cursos/${curso.id}`
                  )
                }
                className="group relative block h-[164px] overflow-hidden rounded-[13px] bg-talentia-surface text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={imagen}
                  alt={curso.nombre}
                  onError={(event) => {
                    const elemento = event.currentTarget;

                    if (elemento.src !== IMAGEN_POR_DEFECTO) {
                      elemento.src = IMAGEN_POR_DEFECTO;
                    }
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-[16px]">
                  <div className="mb-[9px] flex items-center justify-between gap-4">
                    <h2 className="line-clamp-2 text-[16px] font-semibold leading-tight text-white">
                      {curso.nombre}
                    </h2>

                    <span className="shrink-0 text-[14px] font-medium text-white">
                      {progreso}% completado
                    </span>
                  </div>

                  <div className="h-[17px] overflow-hidden rounded-full bg-talentia-surface">
                    <div
                      className="h-full rounded-full bg-talentia-teal"
                      style={{
                        width: `${progreso}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
