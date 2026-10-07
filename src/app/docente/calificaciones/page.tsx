"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";

type ComponenteCalificacion = {
  id: number;
  nombre: string;
  tipo: string;
  porcentaje: number | null;
  puntajeMaximo: number | null;
};

type CalificacionAlumno = {
  componenteId: number;
  nota: number | null;
  retroalimentacion: string | null;
  calificadoEn: string | null;
};

type TeacherGradeRow = {
  id: number;
  matriculaId: number;
  alumno: string;
  calificaciones: CalificacionAlumno[];
  promedio: number | null;
};

type CursoDocente = {
  id: number;
  nombre: string;
  codigo: string;
  ofertaId: number;
  alumnos: number;
};

type CalificacionesResponse = {
  cursos: CursoDocente[];

  curso: {
    id: number;
    nombre: string;
    codigo: string;
    ofertaId: number;
  } | null;

  componentes: ComponenteCalificacion[];

  alumnos: TeacherGradeRow[];

  resumen: {
    alumnos: number;
    conCalificacion: number;
    pendientes: number;
    promedioCurso: number | null;
    promedioMasAlto: number | null;
  };
};

const PAGE_SIZE = 8;

function getGradeClasses(
  value: number | null
) {
  if (value === null) {
    return "bg-[#ededed] text-gray-700";
  }

  if (value >= 14) {
    return "bg-[#c6f2cf] text-[#15933a]";
  }

  if (value >= 11) {
    return "bg-[#ffe5b2] text-[#ce8900]";
  }

  return "bg-[#f7c5cc] text-[#bd4051]";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) => word[0]
    )
    .join("")
    .toUpperCase();
}

function formatearFechaLarga() {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  )
    .format(new Date())
    .replace(
      /^./,
      (letra) =>
        letra.toUpperCase()
    );
}

function getGrade(
  row: TeacherGradeRow,
  componenteId: number
) {
  return (
    row.calificaciones.find(
      (calificacion) =>
        calificacion.componenteId ===
        componenteId
    )?.nota ?? null
  );
}

function parsearNota(
  value: string
) {
  const limpio =
    value.trim();

  if (limpio === "") {
    return null;
  }

  const numero =
    Number(limpio);

  if (
    !Number.isFinite(numero)
  ) {
    return undefined;
  }

  if (
    numero < 0 ||
    numero > 20
  ) {
    return undefined;
  }

  return numero;
}

function calcularPromedioFila(
  row: TeacherGradeRow,
  componentes: ComponenteCalificacion[]
) {
  const notas =
    row.calificaciones

      .map((calificacion) => {
        const componente =
          componentes.find(
            (item) =>
              item.id ===
              calificacion.componenteId
          );

        return {
          nota:
            calificacion.nota,

          porcentaje:
            componente?.porcentaje ??
            null,
        };
      })

      .filter(
        (item) =>
          item.nota !== null
      );

  if (
    notas.length === 0
  ) {
    return null;
  }

  const conPeso =
    notas.filter(
      (item) =>
        Number(
          item.porcentaje ?? 0
        ) > 0
    );

  if (
    conPeso.length > 0
  ) {
    const pesoTotal =
      conPeso.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.porcentaje ?? 0
          ),
        0
      );

    if (pesoTotal > 0) {
      const sumaPonderada =
        conPeso.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(item.nota) *
              Number(
                item.porcentaje ?? 0
              ),
          0
        );

      return Number(
        (
          sumaPonderada /
          pesoTotal
        ).toFixed(2)
      );
    }
  }

  const suma =
    notas.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(item.nota),
      0
    );

  return Number(
    (
      suma /
      notas.length
    ).toFixed(2)
  );
}

function nombreCortoComponente(
  componente: ComponenteCalificacion
) {
  if (
    componente.porcentaje !==
      null &&
    componente.porcentaje > 0
  ) {
    return `${componente.nombre} (${componente.porcentaje}%)`;
  }

  return componente.nombre;
}

function crearBorradores(
  alumnos: TeacherGradeRow[],
  componentes: ComponenteCalificacion[]
) {
  const borradores:
    Record<
      string,
      string
    > = {};

  for (
    const alumno
    of alumnos
  ) {
    for (
      const componente
      of componentes
    ) {
      const nota =
        getGrade(
          alumno,
          componente.id
        );

      borradores[
        `${alumno.matriculaId}-${componente.id}`
      ] =
        nota === null
          ? ""
          : String(nota);
    }
  }

  return borradores;
}

export default function TeacherGradesPage() {
  const router =
    useRouter();

  const [
    cursos,
    setCursos,
  ] = useState<
    CursoDocente[]
  >([]);

  const [
    selectedCourse,
    setSelectedCourse,
  ] = useState<
    number | null
  >(null);

  const [
    selectedCourseObject,
    setSelectedCourseObject,
  ] = useState<
    CalificacionesResponse["curso"]
  >(null);

  const [
    componentes,
    setComponentes,
  ] = useState<
    ComponenteCalificacion[]
  >([]);

  const [
    grades,
    setGrades,
  ] = useState<
    TeacherGradeRow[]
  >([]);

  const [
    borradores,
    setBorradores,
  ] = useState<
    Record<string, string>
  >({});

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  async function cargarCalificaciones(
    cursoId: number | null,
    signal?: AbortSignal
  ) {
    const query =
      cursoId === null
        ? ""
        : `?cursoId=${cursoId}`;

    const response =
      await fetch(
        `${API_URL}/calificaciones/docente/mis-calificaciones${query}`,
        {
          method: "GET",
          credentials:
            "include",
          signal,
        }
      );

    const data =
      (await response
        .json()
        .catch(
          () => ({})
        )) as Partial<
          CalificacionesResponse
        > & {
          message?: string;
        };

    if (
      response.status ===
      401
    ) {
      router.push(
        "/login"
      );

      return null;
    }

    if (!response.ok) {
      throw new Error(
        typeof data.message ===
          "string"
          ? data.message
          : "No se pudieron cargar las calificaciones."
      );
    }

    return data as
      CalificacionesResponse;
  }

  function aplicarRespuesta(
    data: CalificacionesResponse
  ) {
    const nuevosCursos =
      data.cursos ?? [];

    const nuevosComponentes =
      data.componentes ??
      [];

    const nuevosAlumnos =
      data.alumnos ?? [];

    setCursos(
      nuevosCursos
    );

    setSelectedCourse(
      data.curso?.id ??
        null
    );

    setSelectedCourseObject(
      data.curso ??
        null
    );

    setComponentes(
      nuevosComponentes
    );

    setGrades(
      nuevosAlumnos
    );

    setBorradores(
      crearBorradores(
        nuevosAlumnos,
        nuevosComponentes
      )
    );

    setPage(1);
  }

  useEffect(() => {
    const controller =
      new AbortController();

    async function cargarInicial() {
      try {
        setCargando(
          true
        );

        setError("");

        const data =
          await cargarCalificaciones(
            null,
            controller.signal
          );

        if (!data) {
          return;
        }

        aplicarRespuesta(
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
            : "No se pudieron cargar las calificaciones."
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

    void cargarInicial();

    return () =>
      controller.abort();
  }, [router]);

  const handleCourseChange =
    async (
      courseId: number
    ) => {
      try {
        setSelectedCourse(
          courseId
        );

        setPage(1);

        setSearch("");

        setMensaje("");

        setError("");

        setCargando(
          true
        );

        const data =
          await cargarCalificaciones(
            courseId
          );

        if (!data) {
          return;
        }

        aplicarRespuesta(
          data
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las calificaciones del curso."
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  const filteredRows =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return grades;
      }

      return grades.filter(
        (student) =>
          student.alumno
            .toLowerCase()
            .includes(term)
      );
    }, [
      grades,
      search,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRows.length /
          PAGE_SIZE
      )
    );

  const visibleRows =
    filteredRows.slice(
      (page - 1) *
        PAGE_SIZE,
      page *
        PAGE_SIZE
    );

  useEffect(() => {
    if (
      page > totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    page,
    totalPages,
  ]);

  const resumen =
    useMemo(() => {
      const promedios =
        grades

          .map(
            (row) =>
              row.promedio
          )

          .filter(
            (
              promedio
            ): promedio is number =>
              promedio !==
              null
          );

      const alumnosConCalificacion =
        promedios.length;

      const promedioCurso =
        promedios.length >
        0
          ? Number(
              (
                promedios.reduce(
                  (
                    total,
                    promedio
                  ) =>
                    total +
                    promedio,
                  0
                ) /
                promedios.length
              ).toFixed(2)
            )
          : null;

      const promedioMasAlto =
        promedios.length >
        0
          ? Math.max(
              ...promedios
            )
          : null;

      return {
        alumnos:
          grades.length,

        conCalificacion:
          alumnosConCalificacion,

        pendientes:
          grades.length -
          alumnosConCalificacion,

        promedioCurso,

        promedioMasAlto,
      };
    }, [
      grades,
    ]);

  const updateLocalGrade =
    (
      matriculaId: number,
      componenteId: number,
      nota: number | null
    ) => {
      setGrades(
        (current) =>
          current.map(
            (row) => {
              if (
                row.matriculaId !==
                matriculaId
              ) {
                return row;
              }

              const existe =
                row.calificaciones.some(
                  (
                    calificacion
                  ) =>
                    calificacion.componenteId ===
                    componenteId
                );

              const calificaciones =
                existe
                  ? row.calificaciones.map(
                      (
                        calificacion
                      ) =>
                        calificacion.componenteId ===
                        componenteId
                          ? {
                              ...calificacion,
                              nota,
                            }
                          : calificacion
                    )
                  : [
                      ...row.calificaciones,

                      {
                        componenteId,

                        nota,

                        retroalimentacion:
                          null,

                        calificadoEn:
                          null,
                      },
                    ];

              const updatedRow =
                {
                  ...row,
                  calificaciones,
                };

              return {
                ...updatedRow,

                promedio:
                  calcularPromedioFila(
                    updatedRow,
                    componentes
                  ),
              };
            }
          )
      );
    };

  const saveGrade =
    async (
      matriculaId: number,
      componenteId: number,
      rawValue: string
    ) => {
      const row =
        grades.find(
          (item) =>
            item.matriculaId ===
            matriculaId
        );

      if (!row) {
        return;
      }

      const nota =
        parsearNota(
          rawValue
        );

      const key =
        `${matriculaId}-${componenteId}`;

      if (
        nota === undefined
      ) {
        const actual =
          getGrade(
            row,
            componenteId
          );

        setBorradores(
          (current) => ({
            ...current,

            [key]:
              actual === null
                ? ""
                : String(
                    actual
                  ),
          })
        );

        setError(
          "La nota debe ser un número entre 0 y 20."
        );

        return;
      }

      try {
        setGuardando(
          key
        );

        setMensaje(
          ""
        );

        setError(
          ""
        );

        const response =
          await fetch(
            `${API_URL}/calificaciones/docente/calificaciones`,
            {
              method: "PUT",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  matriculaId,
                  componenteId,
                  nota,
                }),
            }
          );

        const data =
          (await response
            .json()
            .catch(
              () => ({})
            )) as {
              message?: string;
            };

        if (
          response.status ===
          401
        ) {
          router.push(
            "/login"
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudo guardar la calificación."
          );
        }

        updateLocalGrade(
          matriculaId,
          componenteId,
          nota
        );

        setBorradores(
          (current) => ({
            ...current,

            [key]:
              nota === null
                ? ""
                : String(
                    nota
                  ),
          })
        );

        setMensaje(
          "Calificación guardada correctamente."
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la calificación."
        );
      } finally {
        setGuardando(
          null
        );
      }
    };

  if (
    cargando &&
    cursos.length ===
      0 &&
    grades.length ===
      0 &&
    selectedCourse ===
      null
  ) {
    return (
      <main className="min-h-screen px-[22px] py-[22px] lg:px-[28px]">
        <header className="mb-5">
          <p className="text-[9px] font-medium uppercase text-gray-500">
            {formatearFechaLarga()}
          </p>

          <h1 className="mt-1 text-[31px] font-semibold tracking-[-0.8px] text-gray-950">
            Calificaciones por Curso
          </h1>

          <p className="mt-1 text-[10px] text-gray-700">
            Cargando información desde la base de datos...
          </p>
        </header>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-[22px] py-[22px] lg:px-[28px]">
      {/* CABECERA */}
      <header className="mb-5">
        <p className="text-[9px] font-medium uppercase text-gray-500">
          {formatearFechaLarga()}
        </p>

        <h1 className="mt-1 text-[31px] font-semibold tracking-[-0.8px] text-gray-950">
          Calificaciones por Curso
        </h1>

        <p className="mt-1 text-[10px] text-gray-700">
          Selecciona un curso y registra la nota individual de cada alumno.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[10px] text-red-700">
          {error}
        </div>
      )}

      {mensaje &&
        !error && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-[10px] text-green-700">
            {mensaje}
          </div>
        )}

      {/* CURSO */}
      <section className="mb-4">
        <label
          htmlFor="curso-calificaciones"
          className="mb-1 block text-[10px] font-semibold text-[#3186d8]"
        >
          Curso
        </label>

        <select
          id="curso-calificaciones"
          value={
            selectedCourse ??
            ""
          }
          onChange={(event) => {
            void handleCourseChange(
              Number(
                event.target
                  .value
              )
            );
          }}
          disabled={
            cursos.length ===
              0 ||
            cargando
          }
          className="h-9 w-[320px] rounded-md border border-[#70a9dd] bg-white px-3 text-[10px] text-[#3186d8] outline-none disabled:opacity-60"
        >
          {cursos.length ===
          0 ? (
            <option value="">
              No tienes cursos asignados
            </option>
          ) : (
            cursos.map(
              (course) => (
                <option
                  key={
                    course.id
                  }
                  value={
                    course.id
                  }
                >
                  {
                    course.codigo
                  }{" "}
                  -{" "}
                  {
                    course.nombre
                  }
                </option>
              )
            )
          )}
        </select>
      </section>

      {/* RESUMEN */}
      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#9ce9ed] px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#73dce0] text-[#3186d8]">
            <span className="text-xl">
              👥
            </span>
          </div>

          <div>
            <p className="text-[26px] font-bold leading-none text-[#1554a0]">
              {
                resumen.alumnos
              }
            </p>

            <p className="text-[9px] text-gray-700">
              Alumnos del curso
            </p>
          </div>
        </article>

        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#b5efc0] px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#82e58f] text-[#1c9f43]">
            ✓
          </div>

          <div>
            <p className="text-[26px] font-bold leading-none text-[#199441]">
              {
                resumen.conCalificacion
              }
            </p>

            <p className="text-[9px] text-gray-700">
              Con calificación
            </p>
          </div>
        </article>

        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#ffe4ab] px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffd379] text-[#df9600]">
            ◷
          </div>

          <div>
            <p className="text-[26px] font-bold leading-none text-[#d89200]">
              {
                resumen.pendientes
              }
            </p>

            <p className="text-[9px] text-gray-700">
              Pendientes por calificar
            </p>
          </div>
        </article>

        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-[#e1b7f8] px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d092f3] text-[#8c40b7]">
            ▥
          </div>

          <div>
            <p className="text-[26px] font-bold leading-none text-[#8c40b7]">
              {resumen.promedioMasAlto ===
              null
                ? "—"
                : resumen.promedioMasAlto.toFixed(
                    1
                  )}
            </p>

            <p className="text-[9px] text-gray-700">
              Promedio más alto del curso
            </p>
          </div>
        </article>
      </section>

      {/* INFORMACIÓN DEL CURSO */}
      {selectedCourseObject && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
          <span className="rounded-full bg-[#eef6ff] px-3 py-1 font-semibold text-[#3186d8]">
            {
              selectedCourseObject.codigo
            }
          </span>

          <span>
            {
              selectedCourseObject.nombre
            }
          </span>

          <span className="text-gray-400">
            · Promedio del curso:{" "}
            {resumen.promedioCurso ===
            null
              ? "—"
              : resumen.promedioCurso.toFixed(
                  1
                )}
          </span>
        </div>
      )}

      {/* BUSCADOR */}
      <div className="mb-3 flex h-9 w-[250px] items-center rounded-md border border-gray-300 bg-white px-3">
        <svg
          className="mr-2 h-4 w-4 text-gray-800"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
          />

          <path d="m20 20-4-4" />
        </svg>

        <input
          value={
            search
          }
          onChange={(event) => {
            setSearch(
              event.target
                .value
            );

            setPage(1);
          }}
          placeholder="Buscar alumno por nombre"
          className="w-full bg-transparent text-[10px] outline-none"
        />
      </div>

      {/* TABLA */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#eceef2]">
                <th className="px-5 py-4 text-left text-[13px] font-semibold">
                  Alumno
                </th>

                {componentes.map(
                  (
                    componente
                  ) => (
                    <th
                      key={
                        componente.id
                      }
                      className="min-w-[132px] px-4 py-4 text-center text-[12px] font-semibold"
                      title={nombreCortoComponente(
                        componente
                      )}
                    >
                      <span className="block truncate">
                        {
                          componente.nombre
                        }
                      </span>

                      {componente.porcentaje !==
                        null && (
                        <span className="mt-1 block text-[9px] font-normal text-gray-500">
                          {
                            componente.porcentaje
                          }
                          %
                        </span>
                      )}
                    </th>
                  )
                )}

                <th className="min-w-[100px] px-4 py-4 text-center text-[13px] font-semibold">
                  Promedio
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map(
                (row) => (
                  <tr
                    key={
                      row.matriculaId
                    }
                    className="border-t border-gray-200"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3186d8] text-[8px] font-semibold text-white">
                          {
                            getInitials(
                              row.alumno
                            )
                          }
                        </div>

                        <span className="text-[13px] font-medium text-gray-800">
                          {
                            row.alumno
                          }
                        </span>
                      </div>
                    </td>

                    {componentes.map(
                      (
                        componente
                      ) => {
                        const grade =
                          getGrade(
                            row,
                            componente.id
                          );

                        const cellKey =
                          `${row.matriculaId}-${componente.id}`;

                        const isSaving =
                          guardando ===
                          cellKey;

                        const draftValue =
                          borradores[
                            cellKey
                          ] ??
                          (grade ===
                          null
                            ? ""
                            : String(
                                grade
                              ));

                        return (
                          <td
                            key={
                              componente.id
                            }
                            className="px-3 py-2 text-center"
                          >
                            <div
                              className={`mx-auto flex h-10 w-[100px] overflow-hidden rounded-md ${getGradeClasses(
                                grade
                              )}`}
                            >
                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  draftValue
                                }
                                disabled={
                                  isSaving
                                }
                                onChange={(
                                  event
                                ) => {
                                  setBorradores(
                                    (
                                      current
                                    ) => ({
                                      ...current,

                                      [cellKey]:
                                        event
                                          .target
                                          .value,
                                    })
                                  );
                                }}
                                onBlur={(
                                  event
                                ) => {
                                  void saveGrade(
                                    row.matriculaId,
                                    componente.id,
                                    event
                                      .currentTarget
                                      .value
                                  );
                                }}
                                className={`w-[70px] bg-transparent px-2 text-center text-[13px] font-semibold outline-none disabled:opacity-60 ${getGradeClasses(
                                  grade
                                )}`}
                                aria-label={`${row.alumno} ${componente.nombre}`}
                              />

                              <span className="flex w-[30px] items-center justify-center border-l border-current/30 text-[10px] font-medium">
                                {isSaving
                                  ? "..."
                                  : "Pts"}
                              </span>
                            </div>
                          </td>
                        );
                      }
                    )}

                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex min-w-[64px] justify-center rounded-md px-3 py-2 text-[13px] font-semibold ${getGradeClasses(
                          row.promedio
                        )}`}
                      >
                        {row.promedio ===
                        null
                          ? "—"
                          : row.promedio.toFixed(
                              1
                            )}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {componentes.length ===
          0 && (
          <div className="border-t border-gray-200 px-6 py-10 text-center text-[11px] text-gray-500">
            Este curso todavía no tiene componentes de calificación configurados en la base de datos. Las notas se podrán registrar cuando existan componentes asociados a la oferta del curso.
          </div>
        )}

        {componentes.length >
          0 &&
          visibleRows.length ===
            0 && (
            <div className="py-10 text-center text-[11px] text-gray-500">
              {grades.length ===
              0
                ? "Este curso no tiene alumnos matriculados actualmente."
                : "No se encontraron alumnos con ese nombre."}
            </div>
          )}
      </section>

      {/* PAGINACIÓN */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] text-gray-600">
          Mostrando{" "}
          {
            visibleRows.length
          }{" "}
          de{" "}
          {
            filteredRows.length
          }{" "}
          alumnos
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.max(
                    1,
                    current -
                      1
                  )
              )
            }
            disabled={
              page ===
              1
            }
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white disabled:opacity-40"
          >
            ‹
          </button>

          {Array.from(
            {
              length:
                totalPages,
            },
            (
              _,
              index
            ) =>
              index + 1
          ).map(
            (
              pageNumber
            ) => (
              <button
                key={
                  pageNumber
                }
                type="button"
                onClick={() =>
                  setPage(
                    pageNumber
                  )
                }
                className={`h-7 min-w-7 rounded border px-2 text-[9px] ${
                  page ===
                  pageNumber
                    ? "border-[#3186d8] bg-[#3186d8] text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                {
                  pageNumber
                }
              </button>
            )
          )}

          <button
            type="button"
            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.min(
                    totalPages,
                    current +
                      1
                  )
              )
            }
            disabled={
              page ===
              totalPages
            }
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>

      <p className="mt-2 text-[9px] text-gray-500">
        Curso seleccionado:{" "}
        {
          selectedCourseObject?.nombre ??
          "—"
        }
      </p>
    </main>
  );
}