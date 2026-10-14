"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  API_URL,
} from "@/lib/api";


type ResumenItem = {
  cantidad: number;
  porcentaje: number;
};


type DashboardAdministrador = {
  resumenAcademico: {
    total: number;

    aprobados:
      ResumenItem;

    desaprobados:
      ResumenItem;

    enRiesgo:
      ResumenItem;
  };

  matriculasUltimosMeses:
    Array<{
      mes: string;
      cantidad: number;
    }>;

  alumnosDestacados:
    Array<{
      estudianteId:
        number;

      nombre:
        string;

      promedio:
        number;
    }>;

  cursosBajaContinuidad:
    Array<{
      cursoId:
        number;

      codigo:
        string;

      nombre:
        string;

      totalMatriculas:
        number;

      continuan:
        number;

      porcentaje:
        number;
    }>;

  distribucionAcademica: {
    total:
      number;

    enProgreso:
      number;

    aprobados:
      number;

    desaprobados:
      number;

    enRiesgo:
      number;

    pendientes:
      number;
  };
};


const DASHBOARD_VACIO:
  DashboardAdministrador =
{
  resumenAcademico: {
    total: 0,

    aprobados: {
      cantidad: 0,
      porcentaje: 0,
    },

    desaprobados: {
      cantidad: 0,
      porcentaje: 0,
    },

    enRiesgo: {
      cantidad: 0,
      porcentaje: 0,
    },
  },

  matriculasUltimosMeses:
    [],

  alumnosDestacados:
    [],

  cursosBajaContinuidad:
    [],

  distribucionAcademica: {
    total: 0,
    enProgreso: 0,
    aprobados: 0,
    desaprobados: 0,
    enRiesgo: 0,
    pendientes: 0,
  },
};


function calcularPorcentaje(
  cantidad: number,
  total: number
) {
  if (
    total <= 0
  ) {
    return 0;
  }

  return Math.round(
    (
      cantidad *
      100
    ) /
      total
  );
}


function formatearMes(
  value: string
) {
  const date =
    new Date(
      `${value}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  const mes =
    new Intl.DateTimeFormat(
      "es-PE",
      {
        month:
          "short",

        timeZone:
          "America/Lima",
      }
    )
      .format(date)
      .replace(
        ".",
        ""
      );

  return (
    mes
      .charAt(0)
      .toUpperCase() +
    mes.slice(1)
  );
}


function colorContinuidad(
  porcentaje: number
) {
  if (
    porcentaje < 65
  ) {
    return "#FF6584";
  }

  if (
    porcentaje < 75
  ) {
    return "#FFB800";
  }

  return "#2D97E8";
}


function formatearPromedio(
  promedio: number
) {
  if (
    !Number.isFinite(
      promedio
    )
  ) {
    return "0";
  }

  return promedio
    .toFixed(2)
    .replace(
      /\.00$/,
      ""
    )
    .replace(
      /(\.\d)0$/,
      "$1"
    );
}


export default function AdministradorDashboardPage() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<
      DashboardAdministrador
    >(
      DASHBOARD_VACIO
    );


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


    async function cargarDashboard() {
      try {
        setCargando(
          true
        );

        setError("");


        const response =
          await fetch(
            `${API_URL}/dashboard/administrador`,
            {
              credentials:
                "include",

              cache:
                "no-store",

              signal:
                controller.signal,
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {
          throw new Error(
            data.message ??
              "No se pudo cargar el dashboard administrativo."
          );
        }


        setDashboard(
          data
        );

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
            : "No se pudo cargar el dashboard administrativo."
        );

      } finally {

        if (
          !controller.signal
            .aborted
        ) {
          setCargando(
            false
          );
        }
      }
    }


    void cargarDashboard();


    return () =>
      controller.abort();

  }, []);


  /*
   * ==========================================
   * DATOS DERIVADOS
   * ==========================================
   */

  const maxMatriculas =
    Math.max(
      1,
      ...dashboard
        .matriculasUltimosMeses
        .map(
          (
            item
          ) =>
            item.cantidad
        )
    );


  const donutBackground =
    useMemo(
      () => {

        const aprobados =
          dashboard
            .resumenAcademico
            .aprobados
            .porcentaje;

        const desaprobados =
          dashboard
            .resumenAcademico
            .desaprobados
            .porcentaje;

        const finDesaprobados =
          aprobados +
          desaprobados;


        if (
          dashboard
            .resumenAcademico
            .total <= 0
        ) {
          return (
            "conic-gradient(#E5E7EB 0 100%)"
          );
        }


        return `
          conic-gradient(
            #2D97E8 0 ${aprobados}%,
            #A259FF ${aprobados}% ${finDesaprobados}%,
            #FF6584 ${finDesaprobados}% 100%
          )
        `;

      },
      [
        dashboard
          .resumenAcademico,
      ]
    );


  const distribucion =
    dashboard
      .distribucionAcademica;


  const segmentos = [
    {
      nombre:
        "En progreso",

      cantidad:
        distribucion
          .enProgreso,

      color:
        "#2D97E8",
    },

    {
      nombre:
        "Aprobados",

      cantidad:
        distribucion
          .aprobados,

      color:
        "#34D399",
    },

    {
      nombre:
        "Desaprobados",

      cantidad:
        distribucion
          .desaprobados,

      color:
        "#A259FF",
    },

    {
      nombre:
        "En riesgo",

      cantidad:
        distribucion
          .enRiesgo,

      color:
        "#FF6584",
    },

    {
      nombre:
        "Pendientes",

      cantidad:
        distribucion
          .pendientes,

      color:
        "#D1D5DB",
    },
  ].map(
    (
      item
    ) => ({
      ...item,

      porcentaje:
        calcularPorcentaje(
          item.cantidad,
          distribucion.total
        ),
    })
  );


  /*
   * SOLO TOP 3
   */

  const destacados =
    dashboard
      .alumnosDestacados;


  const top1 =
    destacados[0] ??
    null;


  const top2 =
    destacados[1] ??
    null;


  const top3 =
    destacados[2] ??
    null;


  const matriculasMes =
    dashboard
      .matriculasUltimosMeses;


  const matriculasActuales =
    matriculasMes[
      matriculasMes.length -
        1
    ]?.cantidad ??
    0;


  const matriculasAnteriores =
    matriculasMes[
      matriculasMes.length -
        2
    ]?.cantidad ??
    0;


  const diferenciaMatriculas =
    matriculasActuales -
    matriculasAnteriores;


  return (
    <div className="flex min-h-screen bg-[#EEF2F8] font-sans">

      {/* ==========================================
          ÁREA PRINCIPAL DEL DASHBOARD
      ========================================== */}

      <main className="flex-1 overflow-y-auto p-8">

        <h1 className="mb-8 text-3xl font-extrabold text-[#0F2851]">
          Dashboard administrativo
        </h1>


        {/* ESTADO DE CARGA */}

        {cargando && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1E66C5]">
            Cargando información
            administrativa...
          </div>
        )}


        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}


        {/* ======================================
            FILA SUPERIOR
        ====================================== */}

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* ==============================
              APROBADOS VS DESAPROBADOS
          ============================== */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-5">

            <h2 className="text-base font-bold text-[#0F2851]">
              Aprobados vs
              desaprobados
            </h2>

            <p className="mb-6 text-xs text-[#6F83A5]">
              Resultado académico
              general de los alumnos.
            </p>


            <div className="flex items-center justify-between gap-4">

              {/* DONUT */}

              <div
                className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
                style={{
                  background:
                    donutBackground,
                }}
              >
                <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-white">

                  <div className="text-center">

                    <span className="block text-xl font-extrabold text-[#0F2851]">
                      {dashboard
                        .resumenAcademico
                        .total
                        .toLocaleString(
                          "es-PE"
                        )}
                    </span>

                    <span className="text-[10px] text-[#6F83A5]">
                      alumnos
                    </span>

                  </div>

                </div>
              </div>


              {/* LEYENDA */}

              <div className="space-y-3 text-xs">

                {/* APROBADOS */}

                <div className="flex items-center gap-2">

                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#2D97E8]" />

                  <div>

                    <span className="font-bold text-[#0F2851]">
                      Aprobados{" "}
                    </span>

                    <span className="font-extrabold text-[#0F2851]">
                      {dashboard
                        .resumenAcademico
                        .aprobados
                        .porcentaje}
                      %
                    </span>

                    <p className="text-[10px] text-[#6F83A5]">
                      {dashboard
                        .resumenAcademico
                        .aprobados
                        .cantidad
                        .toLocaleString(
                          "es-PE"
                        )}{" "}
                      alumnos
                    </p>

                  </div>

                </div>


                {/* DESAPROBADOS */}

                <div className="flex items-center gap-2">

                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#A259FF]" />

                  <div>

                    <span className="font-bold text-[#0F2851]">
                      Desaprobados{" "}
                    </span>

                    <span className="font-extrabold text-[#0F2851]">
                      {dashboard
                        .resumenAcademico
                        .desaprobados
                        .porcentaje}
                      %
                    </span>

                    <p className="text-[10px] text-[#6F83A5]">
                      {dashboard
                        .resumenAcademico
                        .desaprobados
                        .cantidad
                        .toLocaleString(
                          "es-PE"
                        )}{" "}
                      alumnos
                    </p>

                  </div>

                </div>


                {/* EN RIESGO */}

                <div className="flex items-center gap-2">

                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#FF6584]" />

                  <div>

                    <span className="font-bold text-[#0F2851]">
                      En riesgo{" "}
                    </span>

                    <span className="font-extrabold text-[#0F2851]">
                      {dashboard
                        .resumenAcademico
                        .enRiesgo
                        .porcentaje}
                      %
                    </span>

                    <p className="text-[10px] text-[#6F83A5]">
                      {dashboard
                        .resumenAcademico
                        .enRiesgo
                        .cantidad
                        .toLocaleString(
                          "es-PE"
                        )}{" "}
                      alumnos
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* ==============================
              ACTIVIDAD DE MATRÍCULAS
          ============================== */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-7">

            <div className="mb-1 flex items-start justify-between">

              <div>

                <h2 className="text-base font-bold text-[#0F2851]">
                  Actividad de
                  matrículas
                </h2>

                <p className="text-xs text-[#6F83A5]">
                  Nuevas matrículas
                  por mes y tendencia.
                </p>

              </div>


              <span className="text-xs font-semibold text-[#2D97E8]">
                Últimos 6 meses
              </span>

            </div>


            <div className="mt-6 flex h-44 items-end justify-between border-b border-gray-100 px-4 pb-2 text-xs text-[#6F83A5]">

              {matriculasMes.length ===
              0 ? (

                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  No hay matrículas
                  registradas.
                </div>

              ) : (

                matriculasMes.map(
                  (
                    item
                  ) => {

                    const altura =
                      item.cantidad ===
                      0
                        ? 4
                        : Math.max(
                            12,
                            Math.round(
                              (
                                item.cantidad /
                                maxMatriculas
                              ) *
                                112
                            )
                          );


                    return (
                      <div
                        key={
                          item.mes
                        }
                        className="flex flex-col items-center gap-2"
                      >

                        <span className="text-[10px] font-bold text-[#2D97E8]">
                          {
                            item.cantidad
                          }
                        </span>


                        <div
                          className="w-8 rounded-t-lg bg-[#80C3F8] transition-all"
                          style={{
                            height:
                              `${altura}px`,
                          }}
                        />


                        <span>
                          {formatearMes(
                            item.mes
                          )}
                        </span>

                      </div>
                    );
                  }
                )

              )}

            </div>


            <div className="mt-3 flex flex-wrap justify-center gap-6 text-xs">

              <span className="flex items-center gap-1.5 text-[#2D97E8]">
                ● Nuevas matrículas
              </span>


              <span
                className={
                  diferenciaMatriculas >=
                  0
                    ? "flex items-center gap-1.5 text-[#7F32D9]"
                    : "flex items-center gap-1.5 text-[#FF6584]"
                }
              >
                {diferenciaMatriculas >
                0
                  ? "▲"
                  : diferenciaMatriculas <
                      0
                    ? "▼"
                    : "●"}{" "}

                {Math.abs(
                  diferenciaMatriculas
                )}{" "}
                vs. mes anterior
              </span>

            </div>

          </div>

        </div>


        {/* ======================================
            FILA MEDIA
        ====================================== */}

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* ==============================
              ALUMNOS DESTACADOS
          ============================== */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-6">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-base font-bold text-[#0F2851]">
                  Alumnos destacados
                </h2>

                <p className="text-xs text-[#6F83A5]">
                  Mejores promedios
                  del período.
                </p>

              </div>


              <button
                type="button"
                className="text-xs font-semibold text-[#2D97E8] hover:underline"
              >
                Ver todos
              </button>

            </div>


            {destacados.length ===
            0 ? (

              <div className="flex min-h-[170px] items-center justify-center text-xs text-gray-400">
                Aún no existen
                calificaciones
                suficientes para
                generar el ranking.
              </div>

            ) : (

              <div className="mt-6 flex min-h-[170px] items-end justify-center gap-3">

                {/* TOP 2 */}

                <div className="flex flex-col items-center">

                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#B2DAFC] text-xs font-bold text-[#2D97E8]">
                    2
                  </div>

                  <div className="w-28 rounded-2xl bg-[#EBF4FE] p-3 text-center">

                    <p
                      className="truncate text-[10px] font-bold text-[#0F2851]"
                      title={
                        top2?.nombre ??
                        ""
                      }
                    >
                      {top2?.nombre ??
                        "—"}
                    </p>

                    <p className="mt-1 text-xs font-extrabold text-[#0F2851]">
                      {top2
                        ? formatearPromedio(
                            top2.promedio
                          )
                        : "—"}
                    </p>

                  </div>

                </div>


                {/* TOP 1 */}

                <div className="flex -translate-y-2 flex-col items-center">

                  <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFB800] text-xs font-bold text-white">
                    1
                  </div>

                  <div className="w-32 rounded-2xl bg-[#FFF9E6] p-4 text-center">

                    <p
                      className="truncate text-xs font-bold text-[#0F2851]"
                      title={
                        top1?.nombre ??
                        ""
                      }
                    >
                      {top1?.nombre ??
                        "—"}
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-[#0F2851]">
                      {top1
                        ? formatearPromedio(
                            top1.promedio
                          )
                        : "—"}
                    </p>

                  </div>

                </div>


                {/* TOP 3 */}

                <div className="flex flex-col items-center">

                  <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF7D00] text-xs font-bold text-white">
                    3
                  </div>

                  <div className="w-28 rounded-2xl bg-[#F6EBFD] p-3 text-center">

                    <p
                      className="truncate text-[10px] font-bold text-[#0F2851]"
                      title={
                        top3?.nombre ??
                        ""
                      }
                    >
                      {top3?.nombre ??
                        "—"}
                    </p>

                    <p className="mt-1 text-xs font-extrabold text-[#0F2851]">
                      {top3
                        ? formatearPromedio(
                            top3.promedio
                          )
                        : "—"}
                    </p>

                  </div>

                </div>

              </div>

            )}

          </div>


          {/* ==============================
              CURSOS CON BAJA CONTINUIDAD
          ============================== */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-6">

            <h2 className="text-base font-bold text-[#0F2851]">
              Cursos con baja
              continuidad
            </h2>

            <p className="mb-6 text-xs text-[#6F83A5]">
              Alumnos que siguen
              activos por curso.
            </p>


            <div className="space-y-4 text-xs">

              {dashboard
                .cursosBajaContinuidad
                .length ===
              0 ? (

                <p className="py-8 text-center text-xs text-gray-400">
                  No hay información
                  suficiente de
                  continuidad.
                </p>

              ) : (

                dashboard
                  .cursosBajaContinuidad
                  .map(
                    (
                      curso,
                      index
                    ) => (
                      <div
                        key={
                          curso.cursoId
                        }
                        className="flex items-center justify-between"
                      >

                        <span className="w-4 shrink-0 font-bold text-[#0F2851]">
                          {index + 1}
                        </span>


                        <span
                          className="ml-2 flex-1 truncate font-bold text-[#0F2851]"
                          title={`${curso.codigo} - ${curso.nombre}`}
                        >
                          {
                            curso.nombre
                          }
                        </span>


                        <div className="mr-3 h-2.5 w-32 shrink-0 overflow-hidden rounded-full bg-gray-100">

                          <div
                            className="h-full transition-all"
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    curso.porcentaje
                                  )
                                )}%`,

                              backgroundColor:
                                colorContinuidad(
                                  curso.porcentaje
                                ),
                            }}
                          />

                        </div>


                        <span className="w-10 shrink-0 text-right font-extrabold text-[#0F2851]">
                          {
                            curso.porcentaje
                          }
                          %
                        </span>

                      </div>
                    )
                  )

              )}

            </div>

          </div>

        </div>


        {/* ======================================
            DISTRIBUCIÓN ACADÉMICA
        ====================================== */}

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

          <h2 className="text-base font-bold text-[#0F2851]">
            Distribución académica
          </h2>

          <p className="mb-4 text-xs text-[#6F83A5]">
            Estado general de los
            alumnos.
          </p>


          {/* BARRA */}

          {distribucion.total >
          0 ? (

            <div className="mb-4 flex h-6 w-full overflow-hidden rounded-xl text-center text-[10px] font-bold leading-6">

              {segmentos.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.nombre
                    }
                    className={
                      item.nombre ===
                      "Pendientes"
                        ? "overflow-hidden whitespace-nowrap text-gray-700 transition-all"
                        : "overflow-hidden whitespace-nowrap text-white transition-all"
                    }
                    style={{
                      width:
                        `${item.porcentaje}%`,

                      backgroundColor:
                        item.color,
                    }}
                    title={`${item.nombre}: ${item.cantidad} alumnos (${item.porcentaje}%)`}
                  >
                    {item.porcentaje >=
                    5
                      ? `${item.porcentaje}%`
                      : ""}
                  </div>
                )
              )}

            </div>

          ) : (

            <div className="mb-4 flex h-6 w-full items-center justify-center rounded-xl bg-gray-200 text-[10px] text-gray-500">
              Sin datos académicos
            </div>

          )}


          {/* LEYENDA */}

          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-5">

            {segmentos.map(
              (
                item
              ) => (
                <div
                  key={
                    item.nombre
                  }
                  className="flex items-center gap-2"
                >

                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        item.color,
                    }}
                  />


                  <div>

                    <p className="font-bold text-[#0F2851]">
                      {
                        item.nombre
                      }
                    </p>

                    <p className="text-[10px] text-[#6F83A5]">
                      {item.cantidad.toLocaleString(
                        "es-PE"
                      )}{" "}
                      alumnos
                    </p>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </main>

    </div>
  );
}