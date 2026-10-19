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
    return "var(--talentia-danger)";
  }

  if (
    porcentaje < 75
  ) {
    return "var(--talentia-warning)";
  }

  return "var(--talentia-blue)";
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
            "conic-gradient(var(--talentia-border) 0 100%)"
          );
        }


        return `
          conic-gradient(
            var(--talentia-blue) 0 ${aprobados}%,
            var(--talentia-purple) ${aprobados}% ${finDesaprobados}%,
            var(--talentia-danger) ${finDesaprobados}% 100%
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
        "var(--talentia-blue)",
    },

    {
      nombre:
        "Aprobados",

      cantidad:
        distribucion
          .aprobados,

      color:
        "var(--talentia-success)",
    },

    {
      nombre:
        "Desaprobados",

      cantidad:
        distribucion
          .desaprobados,

      color:
        "var(--talentia-purple)",
    },

    {
      nombre:
        "En riesgo",

      cantidad:
        distribucion
          .enRiesgo,

      color:
        "var(--talentia-danger)",
    },

    {
      nombre:
        "Pendientes",

      cantidad:
        distribucion
          .pendientes,

      color:
        "var(--talentia-border)",
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
    <div className="flex min-h-screen bg-talentia-surface">

      {/* ==========================================
          ÁREA PRINCIPAL DEL DASHBOARD
      ========================================== */}

      <main className="flex-1 overflow-y-auto p-8">

        <h1 className="mb-8 text-3xl font-extrabold text-talentia-primary">
          Dashboard administrativo
        </h1>


        {/* ESTADO DE CARGA */}

        {cargando && (
          <div className="mb-6 rounded-xl border border-talentia-border bg-talentia-selected px-4 py-3 text-sm text-talentia-blue">
            Cargando información
            administrativa...
          </div>
        )}


        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-sm text-talentia-danger"
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

          <div className="rounded-3xl border border-talentia-border bg-talentia-surface p-6 shadow-sm xl:col-span-5">

            <h2 className="text-sm font-bold text-talentia-primary">
              Aprobados vs
              desaprobados
            </h2>

            <p className="mb-6 text-[13px] text-talentia-muted">
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
                <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-talentia-surface">

                  <div className="text-center">

                    <span className="block text-xl font-extrabold text-talentia-primary">
                      {dashboard
                        .resumenAcademico
                        .total
                        .toLocaleString(
                          "es-PE"
                        )}
                    </span>

                    <span className="text-[13px] text-talentia-muted">
                      alumnos
                    </span>

                  </div>

                </div>
              </div>


              {/* LEYENDA */}

              <div className="space-y-3 text-[13px]">

                {/* APROBADOS */}

                <div className="flex items-center gap-2">

                  <span className="h-3 w-3 shrink-0 rounded-full bg-talentia-blue" />

                  <div>

                    <span className="font-bold text-talentia-primary">
                      Aprobados{" "}
                    </span>

                    <span className="font-extrabold text-talentia-primary">
                      {dashboard
                        .resumenAcademico
                        .aprobados
                        .porcentaje}
                      %
                    </span>

                    <p className="text-[13px] text-talentia-muted">
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

                  <span className="h-3 w-3 shrink-0 rounded-full bg-talentia-purple-soft" />

                  <div>

                    <span className="font-bold text-talentia-primary">
                      Desaprobados{" "}
                    </span>

                    <span className="font-extrabold text-talentia-primary">
                      {dashboard
                        .resumenAcademico
                        .desaprobados
                        .porcentaje}
                      %
                    </span>

                    <p className="text-[13px] text-talentia-muted">
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

                  <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--talentia-danger)]" />

                  <div>

                    <span className="font-bold text-talentia-primary">
                      En riesgo{" "}
                    </span>

                    <span className="font-extrabold text-talentia-primary">
                      {dashboard
                        .resumenAcademico
                        .enRiesgo
                        .porcentaje}
                      %
                    </span>

                    <p className="text-[13px] text-talentia-muted">
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

          <div className="rounded-3xl border border-talentia-border bg-talentia-surface p-6 shadow-sm xl:col-span-7">

            <div className="mb-1 flex items-start justify-between">

              <div>

                <h2 className="text-sm font-bold text-talentia-primary">
                  Actividad de
                  matrículas
                </h2>

                <p className="text-[13px] text-talentia-muted">
                  Nuevas matrículas
                  por mes y tendencia.
                </p>

              </div>


              <span className="text-[13px] font-semibold text-talentia-blue">
                Últimos 6 meses
              </span>

            </div>


            <div className="mt-6 flex h-44 items-end justify-between border-b border-talentia-border px-4 pb-2 text-[13px] text-talentia-muted">

              {matriculasMes.length ===
              0 ? (

                <div className="flex h-full w-full items-center justify-center text-[13px] text-talentia-muted">
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

                        <span className="text-[13px] font-bold text-talentia-blue">
                          {
                            item.cantidad
                          }
                        </span>


                        <div
                          className="w-8 rounded-t-lg bg-talentia-blue transition-all"
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


            <div className="mt-3 flex flex-wrap justify-center gap-6 text-[13px]">

              <span className="flex items-center gap-1.5 text-talentia-blue">
                ● Nuevas matrículas
              </span>


              <span
                className={
                  diferenciaMatriculas >=
                  0
                    ? "flex items-center gap-1.5 text-talentia-purple"
                    : "flex items-center gap-1.5 text-[var(--talentia-danger)]"
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

          <div className="rounded-3xl border border-talentia-border bg-talentia-surface p-6 shadow-sm xl:col-span-6">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="text-sm font-bold text-talentia-primary">
                  Alumnos destacados
                </h2>

                <p className="text-[13px] text-talentia-muted">
                  Mejores promedios
                  del período.
                </p>

              </div>


              <button
                type="button"
                className="text-[13px] font-semibold text-talentia-blue hover:underline"
              >
                Ver todos
              </button>

            </div>


            {destacados.length ===
            0 ? (

              <div className="flex min-h-[170px] items-center justify-center text-[13px] text-talentia-muted">
                Aún no existen
                calificaciones
                suficientes para
                generar el ranking.
              </div>

            ) : (

              <div className="mt-6 flex min-h-[170px] items-end justify-center gap-3">

                {/* TOP 2 */}

                <div className="flex flex-col items-center">

                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-talentia-selected text-[13px] font-bold text-talentia-blue">
                    2
                  </div>

                  <div className="w-28 rounded-2xl bg-talentia-selected p-3 text-center">

                    <p
                      className="truncate text-[13px] font-bold text-talentia-primary"
                      title={
                        top2?.nombre ??
                        ""
                      }
                    >
                      {top2?.nombre ??
                        "—"}
                    </p>

                    <p className="mt-1 text-[13px] font-extrabold text-talentia-primary">
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

                  <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFB800] text-[13px] font-bold text-white">
                    1
                  </div>

                  <div className="w-32 rounded-2xl bg-talentia-warning-bg p-4 text-center">

                    <p
                      className="truncate text-[13px] font-bold text-talentia-primary"
                      title={
                        top1?.nombre ??
                        ""
                      }
                    >
                      {top1?.nombre ??
                        "—"}
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-talentia-primary">
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

                  <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF7D00] text-[13px] font-bold text-white">
                    3
                  </div>

                  <div className="w-28 rounded-2xl bg-talentia-purple-soft p-3 text-center">

                    <p
                      className="truncate text-[13px] font-bold text-talentia-primary"
                      title={
                        top3?.nombre ??
                        ""
                      }
                    >
                      {top3?.nombre ??
                        "—"}
                    </p>

                    <p className="mt-1 text-[13px] font-extrabold text-talentia-primary">
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

          <div className="rounded-3xl border border-talentia-border bg-talentia-surface p-6 shadow-sm xl:col-span-6">

            <h2 className="text-sm font-bold text-talentia-primary">
              Cursos con baja
              continuidad
            </h2>

            <p className="mb-6 text-[13px] text-talentia-muted">
              Alumnos que siguen
              activos por curso.
            </p>


            <div className="space-y-4 text-[13px]">

              {dashboard
                .cursosBajaContinuidad
                .length ===
              0 ? (

                <p className="py-8 text-center text-[13px] text-talentia-muted">
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

                        <span className="w-4 shrink-0 font-bold text-talentia-primary">
                          {index + 1}
                        </span>


                        <span
                          className="ml-2 flex-1 truncate font-bold text-talentia-primary"
                          title={`${curso.codigo} - ${curso.nombre}`}
                        >
                          {
                            curso.nombre
                          }
                        </span>


                        <div className="mr-3 h-2.5 w-32 shrink-0 overflow-hidden rounded-full bg-talentia-border">

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


                        <span className="w-10 shrink-0 text-right font-extrabold text-talentia-primary">
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

        <div className="rounded-3xl border border-talentia-border bg-talentia-surface p-6 shadow-sm">

          <h2 className="text-sm font-bold text-talentia-primary">
            Distribución académica
          </h2>

          <p className="mb-4 text-[13px] text-talentia-muted">
            Estado general de los
            alumnos.
          </p>


          {/* BARRA */}

          {distribucion.total >
          0 ? (

            <div className="mb-4 flex h-6 w-full overflow-hidden rounded-xl text-center text-[13px] font-bold leading-6">

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
                        ? "overflow-hidden whitespace-nowrap text-talentia-primary transition-all"
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

            <div className="mb-4 flex h-6 w-full items-center justify-center rounded-xl bg-talentia-border text-[13px] text-talentia-muted">
              Sin datos académicos
            </div>

          )}


          {/* LEYENDA */}

          <div className="grid grid-cols-2 gap-4 text-[13px] md:grid-cols-5">

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

                    <p className="font-bold text-talentia-primary">
                      {
                        item.nombre
                      }
                    </p>

                    <p className="text-[13px] text-talentia-muted">
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
