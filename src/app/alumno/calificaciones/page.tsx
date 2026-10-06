"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  API_URL,
} from "@/lib/api";

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

  return Number(nota) >= 11
    ? "Aprobado"
    : "Desaprobado";
}

function claseEstado(
  estado: string
) {
  if (
    estado === "Aprobado"
  ) {
    return "bg-[#dcfce7] text-[#15803d]";
  }

  if (
    estado ===
    "Desaprobado"
  ) {
    return "bg-[#fee2e2] text-[#b91c1c]";
  }

  return "bg-[#fff7bf] text-[#8a6d00]";
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

        <h1 className="text-[34px] font-semibold text-gray-900">
          Mis calificaciones
        </h1>

        <p className="mt-8 text-[14px] text-gray-500">
          Cargando calificaciones...
        </p>

      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-[30px] py-[32px] lg:px-[45px]">

        <h1 className="text-[34px] font-semibold text-gray-900">
          Mis calificaciones
        </h1>

        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-700">
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
        <h1 className="text-[34px] font-semibold tracking-[-0.8px] text-gray-900">
          Mis calificaciones
        </h1>
      </header>

      <section className="mb-[20px] grid w-full grid-cols-1 overflow-hidden rounded-[16px] bg-[#dfe4eb] md:grid-cols-3">

        <div className="flex min-h-[112px] items-center gap-5 px-7 py-5">

          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[17px] bg-[#e7f2ff] text-[#2c8ee8] shadow-sm">
            <span className="text-[25px] font-bold">
              ∑
            </span>
          </div>

          <div>
            <p className="text-[16px] font-medium text-gray-700">
              Promedio general
            </p>

            <p className="mt-1 text-[27px] font-bold text-gray-950">
              {resumen.promedioGeneral ===
              null
                ? "--"
                : `${resumen.promedioGeneral.toFixed(
                    1
                  )}/20`}
            </p>
          </div>

        </div>

        <div className="flex min-h-[112px] items-center gap-5 border-y border-white/80 px-7 py-5 md:border-x md:border-y-0">

          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[17px] bg-[#dff8f7] text-[#08aeb2] shadow-sm">
            <span className="text-[26px]">
              ▤
            </span>
          </div>

          <div>
            <p className="text-[16px] font-medium text-gray-700">
              Cursos matriculados
            </p>

            <p className="mt-1 text-[27px] font-bold text-gray-950">
              {
                resumen.cursosMatriculados
              }
            </p>
          </div>

        </div>

        <div className="flex min-h-[112px] items-center gap-5 px-7 py-5">

          <div className="relative flex h-[66px] w-[66px] items-center justify-center">

            <svg
              viewBox="0 0 64 64"
              className="absolute inset-0 h-full w-full -rotate-90"
            >
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="#e4e8ee"
                strokeWidth="6"
              />

              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="#2c8ee8"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="169.65"
                strokeDashoffset={
                  169.65 -
                  (
                    169.65 *
                    resumen.porcentajeAprobados
                  ) /
                    100
                }
              />
            </svg>

            <span className="text-[14px] font-bold text-gray-800">
              {
                resumen.porcentajeAprobados
              }
              %
            </span>

          </div>

          <div>
            <p className="text-[16px] font-medium text-gray-700">
              Progreso global
            </p>

            <p className="mt-1 text-[13px] text-gray-500">
              {
                resumen.cursosAprobados
              }{" "}
              de{" "}
              {
                resumen.cursosMatriculados
              }{" "}
              cursos aprobados
            </p>
          </div>

        </div>

      </section>

      {cursos.length === 0 ? (

        <div className="rounded-[14px] border border-dashed border-gray-300 bg-white px-6 py-14 text-center">

          <p className="text-[16px] font-medium text-gray-700">
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
                  className="overflow-hidden rounded-[14px] border border-[#d8dee7] bg-white shadow-sm"
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
                      src={
                        curso.imagen ||
                        IMAGEN_POR_DEFECTO
                      }
                      alt={
                        curso.nombre
                      }
                      className="h-[72px] w-[105px] shrink-0 rounded-[10px] object-cover"
                    />

                    <div className="min-w-0 flex-1">

                      <h2 className="text-[18px] font-semibold text-gray-900">
                        {
                          curso.nombre
                        }
                      </h2>

                      <p className="mt-1 text-[13px] text-gray-500">
                        {
                          curso.codigo
                        }
                      </p>

                    </div>

                    <div className="hidden text-right sm:block">

                      <p className="text-[12px] text-gray-400">
                        Promedio
                      </p>

                      <p className="mt-1 text-[18px] font-bold text-gray-900">
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

                    <span className="text-[22px] text-gray-500">
                      {abierto
                        ? "⌃"
                        : "⌄"}
                    </span>

                  </button>

                  {abierto && (

                    <div className="border-t border-gray-200 px-5 py-5">

                      {curso.componentes
                        .length === 0 ? (

                        <div className="rounded-[10px] bg-[#f7f9fc] px-5 py-8 text-center">

                          <p className="text-[14px] font-medium text-gray-700">
                            No hay calificaciones registradas para este curso.
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Cuando existan actividades o evaluaciones calificadas, aparecerán aquí automáticamente.
                          </p>

                        </div>

                      ) : (

                        <div className="overflow-x-auto rounded-[10px] border border-gray-200">

                          <table className="w-full min-w-[760px] border-collapse">

                            <thead className="bg-[#eef1f5]">
                              <tr>

                                <th className="px-5 py-3 text-left text-[12px] font-semibold text-gray-700">
                                  Tipo
                                </th>

                                <th className="px-5 py-3 text-left text-[12px] font-semibold text-gray-700">
                                  Descripción
                                </th>

                                <th className="px-5 py-3 text-center text-[12px] font-semibold text-gray-700">
                                  Peso
                                </th>

                                <th className="px-5 py-3 text-center text-[12px] font-semibold text-gray-700">
                                  Nota
                                </th>

                                <th className="px-5 py-3 text-center text-[12px] font-semibold text-gray-700">
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
                                      className="border-t border-gray-100"
                                    >

                                      <td className="px-5 py-3 text-[13px] capitalize text-gray-700">
                                        {
                                          componente.tipo
                                        }
                                      </td>

                                      <td className="px-5 py-3 text-[13px] text-gray-700">
                                        {
                                          componente.nombre
                                        }
                                      </td>

                                      <td className="px-5 py-3 text-center text-[13px] text-gray-700">
                                        {componente.porcentaje ===
                                        null
                                          ? "--"
                                          : `${Number(
                                              componente.porcentaje
                                            )}%`}
                                      </td>

                                      <td className="px-5 py-3 text-center text-[13px] font-semibold text-gray-800">
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