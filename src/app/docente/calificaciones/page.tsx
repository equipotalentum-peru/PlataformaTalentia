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
    return "bg-talentia-surface text-talentia-primary";
  }

  if (value >= 14) {
    return "bg-talentia-success-bg text-talentia-success";
  }

  if (value >= 11) {
    return "bg-talentia-warning-bg text-talentia-warning";
  }

  return "bg-talentia-danger-bg text-talentia-danger";
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

function normalizarEntradaNumerica(value: string): string | null {
  // Admite únicamente dígitos y un separador decimal, con hasta dos decimales.
  const limpio = value.replace(/,/g, ".");
  return /^\d*(?:\.\d{0,2})?$/.test(limpio) ? limpio : null;
}

function parsearNota(value: string): number | undefined {
  const limpio = value.trim().replace(/,/g, ".");
  if (limpio === "" || !/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(limpio)) {
    return undefined;
  }

  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero < 0 || numero > 20) {
    return undefined;
  }

  return numero;
}

function calcularPromedioFila(
  row: TeacherGradeRow,
  componentes: ComponenteCalificacion[]
) {
  const notasConPeso = row.calificaciones
    .map((calificacion) => {
      const componente = componentes.find(
        (item) => item.id === calificacion.componenteId
      );

      return {
        nota: calificacion.nota,
        porcentaje: componente?.porcentaje ?? null,
      };
    })
    .filter(
      (item) =>
        item.nota !== null &&
        Number(item.porcentaje ?? 0) > 0
    );

  if (notasConPeso.length === 0) {
    return null;
  }

  const promedioPonderado = notasConPeso.reduce(
    (total, item) =>
      total +
      Number(item.nota) *
        (Number(item.porcentaje ?? 0) / 100),
    0
  );

  return Number(promedioPonderado.toFixed(2));
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
            [key]: String(nota),
          })
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
          <h1 className="teacher-page-title text-[35px] font-semibold tracking-[-0.8px] text-talentia-primary">
           Calificaciones por Curso
          </h1>

          <p className="mt-1 text-[15px] text-talentia-primary">
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
        <h1 className="teacher-page-title text-[35px] font-semibold tracking-[-0.8px] text-talentia-primary">
         Calificaciones por Curso
        </h1>

        <p className="mt-2 text-[15px] text-talentia-primary">
         Selecciona un curso y registra la nota individual de cada alumno.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-4 py-3 text-[10px] text-talentia-danger">
          {error}
        </div>
      )}

      {/* CURSO */}
      <section className="mb-4">
        <label
          htmlFor="curso-calificaciones"
          className="mb-1 block text-[15px] font-semibold text-talentia-blue"
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
          className="h-10 w-[360px] rounded-md border border-talentia-border bg-talentia-surface px-3 text-[14px] text-talentia-blue outline-none disabled:opacity-60"
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
        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-talentia-selected px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-talentia-selected text-talentia-blue">
            <span className="text-xl">
              👥
            </span>
          </div>

          <div>
            <p className="text-[28px] font-bold leading-none text-talentia-primary">
              {
                resumen.alumnos
              }
            </p>

            <p className="mt-1 text-[15px] text-talentia-primary">
              Alumnos del curso
            </p>
          </div>
        </article>

        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-talentia-success-bg px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-talentia-success-bg text-talentia-success">
            ✓
          </div>

          <div>
            <p className="text-[28px] font-bold leading-none text-talentia-success">
              {
                resumen.conCalificacion
              }
            </p>

            <p className="mt-1 text-[15px] text-talentia-primary">
              Con calificación
            </p>
          </div>
        </article>

        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-talentia-warning-bg px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-talentia-warning-bg text-talentia-warning">
            ◷
          </div>

          <div>
            <p className="text-[28px] font-bold leading-none text-talentia-warning">
              {
                resumen.pendientes
              }
            </p>

            <p className="mt-1 text-[15px] text-talentia-primary">
              Pendientes por calificar
            </p>
          </div>
        </article>

        <article className="flex min-h-[68px] items-center gap-3 rounded-xl bg-talentia-purple-soft px-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-talentia-purple-soft text-talentia-purple">
            ▥
          </div>

          <div>
            <p className="text-[28px] font-bold leading-none text-talentia-purple">
              {resumen.promedioMasAlto ===
              null
                ? "—"
                : resumen.promedioMasAlto.toFixed(
                    1
                  )}
            </p>

            <p className="mt-1 text-[15px] text-talentia-primary">
              Promedio más alto del curso
            </p>
          </div>
        </article>
      </section>

      {/* INFORMACIÓN DEL CURSO */}
      {selectedCourseObject && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[15px] text-talentia-muted">
          <span className="rounded-full bg-talentia-selected px-3 py-1 font-semibold text-talentia-blue">
            {
              selectedCourseObject.codigo
            }
          </span>

          <span>
            {
              selectedCourseObject.nombre
            }
          </span>

          <span className="text-talentia-muted">
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
      <div className="mb-4 flex h-10 w-[280px] items-center rounded-md border border-talentia-border bg-talentia-surface px-3">
        <svg
          className="mr-2 h-4 w-4 text-talentia-primary"
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
          className="w-full bg-transparent text-[15px] outline-none"
        />
      </div>

      {/* TABLA */}
      <section className="overflow-hidden rounded-xl border border-talentia-border bg-talentia-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-talentia-surface">
                <th className="px-5 py-4 text-left text-[15px] font-semibold">
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
                      className="min-w-[132px] px-4 py-4 text-center text-[14px] font-semibold"
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
                        <span className="mt-1 block text-[12px] font-normal text-talentia-muted">
                          {
                            componente.porcentaje
                          }
                          %
                        </span>
                      )}
                    </th>
                  )
                )}

                <th className="min-w-[100px] px-4 py-4 text-center text-[15px] font-semibold">
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
                    className="border-t border-talentia-border"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-talentia-action text-[12px] font-semibold text-white">
                          {
                            getInitials(
                              row.alumno
                            )
                          }
                        </div>

                        <span className="text-[15px] font-medium text-talentia-primary">
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
                                pattern="[0-9]*[.,]?[0-9]{0,2}"
                                value={draftValue}
                                disabled={isSaving}
                                onChange={(event) => {
                                  const numericValue = normalizarEntradaNumerica(event.target.value);
                                  if (numericValue === null) return;
                                  setBorradores((current) => ({
                                    ...current,
                                    [cellKey]: numericValue,
                                  }));
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void saveGrade(row.matriculaId, componente.id, draftValue);
                                  }
                                }}
                                onBlur={() => {
                                  if (isSaving) return;
                                  if (draftValue.trim() === "") {
                                    setBorradores((current) => ({
                                      ...current,
                                      [cellKey]: grade === null ? "" : String(grade),
                                    }));
                                    return;
                                  }
                                  const draftNote = parsearNota(draftValue);
                                  if (
                                    draftNote === undefined ||
                                    grade === null ||
                                    Math.abs(draftNote - grade) > 0.000001
                                  ) {
                                    void saveGrade(row.matriculaId, componente.id, draftValue);
                                  }
                                }}
                                className={`w-full min-w-0 flex-1 bg-transparent px-2 text-center text-[15px] font-semibold outline-none disabled:opacity-60 ${getGradeClasses(
                                  grade
                                )}`}
                                aria-label={`${row.alumno} ${componente.nombre}`}
                              />
                            </div>
                          </td>
                        );
                      }
                    )}

                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex min-w-[64px] justify-center rounded-md px-3 py-2 text-[15px] font-semibold ${getGradeClasses(
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
          <div className="border-t border-talentia-border px-6 py-10 text-center text-[13px] text-talentia-muted">
            Este curso todavía no tiene componentes de calificación configurados en la base de datos. Las notas se podrán registrar cuando existan componentes asociados a la oferta del curso.
          </div>
        )}

        {componentes.length >
          0 &&
          visibleRows.length ===
            0 && (
            <div className="py-10 text-center text-[13px] text-talentia-muted">
              {grades.length ===
              0
                ? "Este curso no tiene alumnos matriculados actualmente."
                : "No se encontraron alumnos con ese nombre."}
            </div>
          )}
      </section>

      {/* PAGINACIÓN */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[14px] text-talentia-primary">
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
            className="flex h-7 w-7 items-center justify-center rounded border border-talentia-border bg-talentia-surface disabled:opacity-40"
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
                className={`h-7 min-w-7 rounded border px-2 text-[13px] ${
                  page ===
                  pageNumber
                    ? "border-talentia-blue bg-talentia-action text-white"
                    : "border-talentia-border bg-talentia-surface text-talentia-primary"
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
            className="flex h-7 w-7 items-center justify-center rounded border border-talentia-border bg-talentia-surface disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>

      <p className="mt-2 text-[13px] text-talentia-muted">
        Curso seleccionado:{" "}
        {
          selectedCourseObject?.nombre ??
          "—"
        }
      </p>
    </main>
  );
}
