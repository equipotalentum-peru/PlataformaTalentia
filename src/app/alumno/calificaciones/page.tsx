"use client";

import { useEffect, useState, } from "react";
import { useRouter, } from "next/navigation";
import { API_URL, } from "@/lib/api";
import { resolverImagenPortadaCurso } from "@/lib/curso-imagen";

type ComponenteCalificacion = {
  id: number;
  nombre: string;
  tipo: string;

  porcentaje:
    | string
    | number
    | null;

  puntaje_maximo:
    | string
    | number
    | null;

  nota:
    | string
    | number
    | null;

  retroalimentacion:
    | string
    | null;

  calificado_en:
    | string
    | null;
};

type CursoCalificacion = {
  id: number;

  matriculaId: number;

  nombre: string;

  codigo: string;

  imagen:
    | string
    | null;

  estadoMatricula: string;

  promedio:
    | number
    | null;

  estadoAcademico:
    | "Aprobado"
    | "Desaprobado"
    | "En curso";

  componentes:
    ComponenteCalificacion[];
};

type ResumenCalificaciones = {
  promedioGeneral:
    | number
    | null;

  cursosMatriculados:
    number;

  cursosAprobados:
    number;

  porcentajeAprobados:
    number;
};

type RespuestaCalificaciones = {
  resumen:
    ResumenCalificaciones;

  cursos:
    CursoCalificacion[];
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

function estadoComponente(
  nota:
    | string
    | number
    | null
) {
  if (nota === null) {
    return "Pendiente";
  }

  return Number(nota) >= 14
    ? "Aprobado"
    : "Desaprobado";
}

function claseEstado(
  estado: string
) {
  if (
    estado === "Aprobado"
  ) {
    return "bg-talentia-success-bg text-talentia-success";
  }

  if (
    estado ===
    "Desaprobado"
  ) {
    return "bg-talentia-danger-bg text-talentia-danger";
  }

  return "bg-talentia-warning-bg text-talentia-warning";
}

export default function CalificacionesPage() {
  const router =
    useRouter();

  const [
    datos,
    setDatos,
  ] =
    useState<
      RespuestaCalificaciones
      | null
    >(null);

  const [
    cursoAbierto,
    setCursoAbierto,
  ] =
    useState<
      number | null
    >(null);

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function cargarCalificaciones() {
      try {
        setCargando(true);

        setError("");

        const response =
          await fetch(
            `${API_URL}/calificaciones/mis-calificaciones`,
            {
              method: "GET",

              credentials:
                "include",

              signal:
                controller.signal,
            }
          );

        const data =
          await response.json();

        if (
          response.status === 401
        ) {
          router.push(
            "/login"
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudieron cargar las calificaciones."
          );
        }

        setDatos(data);

        if (
          Array.isArray(
            data.cursos
          ) &&
          data.cursos.length > 0
        ) {
          setCursoAbierto(
            data.cursos[0].id
          );
        }
      } catch (error) {
        if (
          controller.signal
            .aborted
        ) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las calificaciones."
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setCargando(false);
        }
      }
    }

    void cargarCalificaciones();

    return () =>
      controller.abort();

  }, [router]);

  const toggleCurso = (
    id: number
  ) => {
    setCursoAbierto(
      (actual) =>
        actual === id
          ? null
          : id
    );
  };

  if (cargando) {
    return (
      <div className="min-h-screen px-[30px] py-[32px] lg:px-[45px]">

        <h1 className="student-page-title text-[34px] font-semibold text-talentia-primary">
          Mis calificaciones
        </h1>

        <p className="mt-8 text-[14px] text-talentia-muted">
          Cargando calificaciones...
        </p>

      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-[30px] py-[32px] lg:px-[45px]">

        <h1 className="student-page-title text-[34px] font-semibold text-talentia-primary">
          Mis calificaciones
        </h1>

        <div className="mt-8 rounded-xl border border-talentia-danger/20 bg-talentia-danger-bg px-5 py-4 text-[14px] text-talentia-danger">
          {error}
        </div>

      </div>
    );
  }

  const resumen =
    datos?.resumen ?? {
      promedioGeneral: null,
      cursosMatriculados: 0,
      cursosAprobados: 0,
      porcentajeAprobados: 0,
    };

  const cursos =
    datos?.cursos ?? [];

  return (
    <div className="min-h-screen w-full px-[30px] py-[32px] lg:px-[45px]">

      <header className="mb-[32px]">
        <h1 className="student-page-title text-[34px] font-semibold tracking-[-0.8px] text-talentia-primary">
          Mis calificaciones
        </h1>
      </header>

      <section className="mb-[20px] grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <article className="relative min-h-[118px] min-w-0 overflow-hidden rounded-[18px] border border-[#ffe5c2] bg-talentia-surface px-6 py-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div aria-hidden="true" className="absolute left-0 top-0 h-[5px] w-full bg-talentia-warning" />
          <div className="flex h-full items-center gap-5">
            <div aria-hidden="true" className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[18px] bg-talentia-warning-bg text-talentia-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                <path d="m3 9 9-5 9 5-9 5-9-5Z" />
                <path d="M7 12v5l5 3 5-3v-5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="flex h-9 items-baseline gap-1 whitespace-nowrap text-[36px] font-bold leading-none tabular-nums text-talentia-warning">
                {resumen.promedioGeneral === null ? "--" : <>{resumen.promedioGeneral.toFixed(1)}<span className="text-[14px] font-medium text-talentia-muted">/20</span></>}
              </p>
              <p className="mt-2 min-h-10 break-words text-[14px] font-semibold leading-5 text-talentia-primary">Promedio general</p>
            </div>
          </div>
        </article>

        <article className="relative min-h-[118px] min-w-0 overflow-hidden rounded-[18px] border border-talentia-border bg-talentia-surface px-6 py-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div aria-hidden="true" className="absolute left-0 top-0 h-[5px] w-full bg-talentia-blue" />
          <div className="flex h-full items-center gap-5">
            <div aria-hidden="true" className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[18px] bg-talentia-selected text-talentia-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="h-9 text-[36px] font-bold leading-none tabular-nums text-talentia-blue">{resumen.cursosMatriculados}</p>
              <p className="mt-2 min-h-10 break-words text-[14px] font-semibold leading-5 text-talentia-primary">Cursos matriculados</p>
            </div>
          </div>
        </article>

        <article className="relative min-h-[118px] min-w-0 overflow-hidden rounded-[18px] border border-talentia-border bg-talentia-surface px-6 py-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div aria-hidden="true" className="absolute left-0 top-0 h-[5px] w-full bg-talentia-success" />
          <div className="flex h-full items-center gap-5">
            <div aria-hidden="true" className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[18px] bg-talentia-success/15 text-talentia-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 3 3 5-6" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="h-9 text-[36px] font-bold leading-none tabular-nums text-talentia-success">{resumen.porcentajeAprobados}%</p>
              <p className="mt-2 min-h-10 break-words text-[14px] font-semibold leading-5 text-talentia-primary">
                Progreso global
                <span className="block text-[12px] font-normal text-talentia-muted">{resumen.cursosAprobados} de {resumen.cursosMatriculados} cursos aprobados</span>
              </p>
            </div>
          </div>
        </article>
      </section>

      {cursos.length === 0 ? (

        <div className="rounded-[14px] border border-dashed border-talentia-border bg-talentia-surface px-6 py-14 text-center">

          <p className="text-[16px] font-medium text-talentia-primary">
            No tienes cursos matriculados.
          </p>

        </div>

      ) : (

        <section className="space-y-4">

          {cursos.map(
            (curso) => {
              const abierto =
                cursoAbierto ===
                curso.id;

              const promedio =
                curso.promedio ===
                null
                  ? "--"
                  : `${curso.promedio.toFixed(
                      1
                    )}/20`;

              return (
                <article
                  key={curso.id}
                  className="overflow-hidden rounded-[14px] border border-talentia-border bg-talentia-surface shadow-sm"
                >

                  <button
                    type="button"
                    onClick={() =>
                      toggleCurso(
                        curso.id
                      )
                    }
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
          
                    <img
                      src={resolverImagenPortadaCurso(
                        curso.imagen,
                        curso.id,
                        IMAGEN_POR_DEFECTO
                      )}
                      alt={curso.nombre}
                      onError={(event) => {
                        const elemento = event.currentTarget;

                        if (elemento.dataset.fallbackApplied === "true") {
                          return;
                        }

                        elemento.dataset.fallbackApplied = "true";
                        elemento.src = IMAGEN_POR_DEFECTO;
                      }}
                      className="h-[72px] w-[105px] shrink-0 rounded-[10px] object-cover"
                    />

                    <div className="min-w-0 flex-1">

                      <h2 className="text-[18px] font-semibold text-talentia-primary">
                        {
                          curso.nombre
                        }
                      </h2>

                      <p className="mt-1 text-[13px] text-talentia-muted">
                        {
                          curso.codigo
                        }
                      </p>

                    </div>

                    <div className="hidden text-right sm:block">

                      <p className="text-[12px] text-talentia-muted">
                        Promedio
                      </p>

                      <p className="mt-1 text-[18px] font-bold text-talentia-primary">
                        {promedio}
                      </p>

                    </div>

                    <span
                      className={`hidden min-w-[95px] rounded-full px-3 py-2 text-center text-[11px] font-semibold md:inline-block ${claseEstado(
                        curso.estadoAcademico
                      )}`}
                    >
                      {
                        curso.estadoAcademico
                      }
                    </span>

                    <span className="text-[22px] text-talentia-muted">
                      {abierto
                        ? "⌃"
                        : "⌄"}
                    </span>

                  </button>

                  {abierto && (

                    <div className="border-t border-talentia-border px-5 py-5">

                      {curso.componentes
                        .length === 0 ? (

                        <div className="rounded-[10px] bg-talentia-surface px-5 py-8 text-center">

                          <p className="text-[14px] font-medium text-talentia-primary">
                            No hay calificaciones registradas para este curso.
                          </p>

                          <p className="mt-2 text-[12px] text-talentia-muted">
                            Cuando existan actividades o evaluaciones calificadas, aparecerán aquí automáticamente.
                          </p>

                        </div>

                      ) : (

                        <div className="overflow-x-auto rounded-[10px] border border-talentia-border">

                          <table className="w-full min-w-[760px] border-collapse">

                            <thead className="bg-talentia-surface">
                              <tr>

                                <th className="px-5 py-3 text-left text-[12px] font-semibold text-talentia-primary">
                                  Tipo
                                </th>

                                <th className="px-5 py-3 text-left text-[12px] font-semibold text-talentia-primary">
                                  Descripción
                                </th>

                                <th className="px-5 py-3 text-center text-[12px] font-semibold text-talentia-primary">
                                  Peso
                                </th>

                                <th className="px-5 py-3 text-center text-[12px] font-semibold text-talentia-primary">
                                  Nota
                                </th>

                                <th className="px-5 py-3 text-center text-[12px] font-semibold text-talentia-primary">
                                  Estado
                                </th>

                              </tr>
                            </thead>

                            <tbody>

                              {curso.componentes.map(
                                (
                                  componente
                                ) => {
                                  const estado =
                                    estadoComponente(
                                      componente.nota
                                    );

                                  return (
                                    <tr
                                      key={
                                        componente.id
                                      }
                                      className="border-t border-talentia-border"
                                    >

                                      <td className="px-5 py-3 text-[13px] capitalize text-talentia-primary">
                                        {
                                          componente.tipo
                                        }
                                      </td>

                                      <td className="px-5 py-3 text-[13px] text-talentia-primary">
                                        {
                                          componente.nombre
                                        }
                                      </td>

                                      <td className="px-5 py-3 text-center text-[13px] text-talentia-primary">
                                        {componente.porcentaje ===
                                        null
                                          ? "--"
                                          : `${Number(
                                              componente.porcentaje
                                            )}%`}
                                      </td>

                                      <td className="px-5 py-3 text-center text-[13px] font-semibold text-talentia-primary">
                                        {componente.nota ===
                                        null
                                          ? "--"
                                          : Number(
                                              componente.nota
                                            ).toFixed(
                                              1
                                            )}
                                      </td>

                                      <td className="px-5 py-3 text-center">

                                        <span
                                          className={`inline-block min-w-[90px] rounded-full px-3 py-[5px] text-[11px] font-semibold ${claseEstado(
                                            estado
                                          )}`}
                                        >
                                          {
                                            estado
                                          }
                                        </span>

                                      </td>

                                    </tr>
                                  );
                                }
                              )}

                            </tbody>

                          </table>

                        </div>

                      )}

                    </div>

                  )}

                </article>
              );
            }
          )}

        </section>

      )}

    </div>
  );
}
