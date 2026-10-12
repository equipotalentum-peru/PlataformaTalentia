"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  API_URL,
} from "@/lib/api";


type AttendanceState =
  | "presente"
  | "falta";


type AttendanceSession = {
  id: number;
  numero: number;
  tema: string;
  iniciaEn: string;
};


type StudentAttendance = {
  sesionClaseId: number;
  estado: AttendanceState;
};


type AttendanceStudent = {
  matriculaId: number;
  estudianteId: number;
  nombre: string;
  asistencias: StudentAttendance[];
};


type TeacherAttendanceProps = {
  courseId: number;
};


type ApiSession = {
  id: number | string;
  numero: number | string;
  tema?: string | null;
  iniciaEn?: string | null;
};


type ApiAttendance = {
  sesionClaseId: number | string;
  estado: "Presente" | "Falta";
};


type ApiStudent = {
  matriculaId: number | string;
  estudianteId: number | string;
  nombre: string;
  asistencias?: ApiAttendance[];
};


type AttendanceApiResponse = {
  message?: string;
  sesiones?: ApiSession[];
  estudiantes?: ApiStudent[];
};


function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}


function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}


function getStats(
  asistencias: StudentAttendance[]
) {
  const presentes =
    asistencias.filter(
      (item) =>
        item.estado ===
        "presente"
    ).length;

  const total =
    asistencias.length;

  const faltas =
    total - presentes;

  const porcentaje =
    total > 0
      ? Math.round(
          (presentes / total) *
            100
        )
      : 0;

  return {
    presentes,
    total,
    faltas,
    porcentaje,
  };
}


function copiarEstudiantes(
  lista: AttendanceStudent[]
) {
  return lista.map(
    (student) => ({
      ...student,

      asistencias:
        student.asistencias.map(
          (item) => ({
            ...item,
          })
        ),
    })
  );
}


export default function TeacherAttendance({
  courseId,
}: TeacherAttendanceProps) {
  const [
    sessions,
    setSessions,
  ] =
    useState<
      AttendanceSession[]
    >([]);

  const [
    students,
    setStudents,
  ] =
    useState<
      AttendanceStudent[]
    >([]);

  const [
    originalStudents,
    setOriginalStudents,
  ] =
    useState<
      AttendanceStudent[]
    >([]);

  const [
    editing,
    setEditing,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");


  /* =====================================================
     CARGAR ASISTENCIA DESDE POSTGRESQL
  ===================================================== */

  useEffect(() => {
    const controller =
      new AbortController();

    async function cargarAsistencia() {
      try {
        setLoading(true);
        setError("");
        setSaved(false);
        setEditing(false);

        const response =
          await fetch(
            `${API_URL}/asistencias/docente/${courseId}`,
            {
              method: "GET",

              credentials:
                "include",

              signal:
                controller.signal,
            }
          );

        const data =
          (
            await response
              .json()
              .catch(() => ({}))
          ) as AttendanceApiResponse;

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudo cargar la asistencia."
          );
        }

        const sesiones:
          AttendanceSession[] =
          Array.isArray(
            data.sesiones
          )
            ? data.sesiones.map(
                (item) => ({
                  id:
                    Number(
                      item.id
                    ),

                  numero:
                    Number(
                      item.numero
                    ),

                  tema:
                    String(
                      item.tema ??
                        ""
                    ),

                  iniciaEn:
                    String(
                      item.iniciaEn ??
                        ""
                    ),
                })
              )
            : [];

        const alumnos:
          AttendanceStudent[] =
          Array.isArray(
            data.estudiantes
          )
            ? data.estudiantes.map(
                (item) => ({
                  matriculaId:
                    Number(
                      item.matriculaId
                    ),

                  estudianteId:
                    Number(
                      item.estudianteId
                    ),

                  nombre:
                    String(
                      item.nombre ??
                        ""
                    ),

                  asistencias:
                    Array.isArray(
                      item.asistencias
                    )
                      ? item.asistencias.map(
                          (
                            asistencia
                          ) => ({
                            sesionClaseId:
                              Number(
                                asistencia.sesionClaseId
                              ),

                            estado:
                              asistencia.estado ===
                              "Falta"
                                ? "falta"
                                : "presente",
                          })
                        )
                      : [],
                })
              )
            : [];

        setSessions(
          sesiones
        );

        setStudents(
          alumnos
        );

        setOriginalStudents(
          copiarEstudiantes(
            alumnos
          )
        );
      } catch (err) {
        if (
          controller.signal
            .aborted
        ) {
          return;
        }

        console.error(
          "Error cargando asistencia:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la asistencia."
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setLoading(false);
        }
      }
    }

    void cargarAsistencia();

    return () => {
      controller.abort();
    };
  }, [courseId]);


  /* =====================================================
     BUSCADOR
  ===================================================== */

  const filteredStudents =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return students;
      }

      return students.filter(
        (student) =>
          student.nombre
            .toLowerCase()
            .includes(term)
      );
    }, [
      students,
      search,
    ]);


  /* =====================================================
     CAMBIAR CHECK ↔ X
  ===================================================== */

  const toggleAttendance = (
    matriculaId: number,
    sesionClaseId: number
  ) => {
    if (!editing) {
      return;
    }

    setStudents(
      (current) =>
        current.map(
          (student) => {
            if (
              student.matriculaId !==
              matriculaId
            ) {
              return student;
            }

            return {
              ...student,

              asistencias:
                student.asistencias.map(
                  (item) => {
                    if (
                      item.sesionClaseId !==
                      sesionClaseId
                    ) {
                      return item;
                    }

                    return {
                      ...item,

                      estado:
                        item.estado ===
                        "presente"
                          ? "falta"
                          : "presente",
                    };
                  }
                ),
            };
          }
        )
    );

    setSaved(false);
  };


  /* =====================================================
     EDITAR / CANCELAR EDICIÓN
  ===================================================== */

  const handleEdit = () => {
    if (editing) {
      setStudents(
        copiarEstudiantes(
          originalStudents
        )
      );

      setEditing(false);
      setSaved(false);

      return;
    }

    setOriginalStudents(
      copiarEstudiantes(
        students
      )
    );

    setEditing(true);
    setSaved(false);
    setError("");
  };


  /* =====================================================
     GUARDAR EN POSTGRESQL
  ===================================================== */

  const handleSave =
    async () => {
      if (
        !editing ||
        saving
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        const registros =
          students.flatMap(
            (student) =>
              student.asistencias.map(
                (item) => ({
                  matriculaId:
                    student.matriculaId,

                  sesionClaseId:
                    item.sesionClaseId,

                  estado:
                    item.estado ===
                    "presente"
                      ? "Presente"
                      : "Falta",
                })
              )
          );

        if (
          registros.length === 0
        ) {
          throw new Error(
            "No hay registros de asistencia para guardar."
          );
        }

        const response =
          await fetch(
            `${API_URL}/asistencias/docente/${courseId}`,
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
                  registros,
                }),
            }
          );

        const data =
          (
            await response
              .json()
              .catch(() => ({}))
          ) as {
            message?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudo guardar la asistencia."
          );
        }

        /*
         * Lo que acabamos de guardar
         * pasa a ser el nuevo estado
         * original.
         */
        setOriginalStudents(
          copiarEstudiantes(
            students
          )
        );

        setEditing(false);
        setSaved(true);

        window.setTimeout(
          () => {
            setSaved(false);
          },
          2500
        );
      } catch (err) {
        console.error(
          "Error guardando asistencia:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo guardar la asistencia."
        );
      } finally {
        setSaving(false);
      }
    };


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="w-full">
      {/* CABECERA DE ASISTENCIA */}
      <section className="rounded-xl bg-white px-4 py-3 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-[15px] font-bold text-gray-900">
            Registrar asistencia
          </h1>

          <div className="flex gap-2">
            {/* EDITAR / CANCELAR */}
            <button
              type="button"
              onClick={
                handleEdit
              }
              disabled={
                loading ||
                saving ||
                students.length ===
                  0 ||
                sessions.length ===
                  0
              }
              className={`rounded-md px-4 py-2 text-[10px] font-semibold transition ${
                loading ||
                saving ||
                students.length ===
                  0 ||
                sessions.length ===
                  0
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : editing
                    ? "bg-[#eef5fc] text-[#3186d8] hover:bg-[#e3eef9]"
                    : "bg-[#3186d8] text-white hover:bg-[#2777c1]"
              }`}
            >
              {editing
                ? "Cancelar edición"
                : "Editar asistencia"}
            </button>

            {/* GUARDAR */}
            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                !editing ||
                saving ||
                students.length ===
                  0 ||
                sessions.length ===
                  0
              }
              className={`rounded-md px-4 py-2 text-[10px] font-semibold transition ${
                editing &&
                !saving &&
                students.length >
                  0 &&
                sessions.length >
                  0
                  ? "bg-[#00b8b3] text-white hover:bg-[#00a7a2]"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {saving
                ? "Guardando..."
                : "Guardar asistencia"}
            </button>
          </div>
        </div>


        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}


        {/* BUSCADOR */}
        <div className="mb-4 flex h-9 w-full max-w-[360px] items-center rounded-md bg-[#eeeeee] px-3">
          <svg
            className="mr-2 h-4 w-4 text-[#3186d8]"
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
            type="text"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar estudiante"
            disabled={loading}
            className="w-full bg-transparent text-[11px] outline-none disabled:cursor-not-allowed"
          />
        </div>


        {/* CARGANDO */}
        {loading && (
          <div className="py-10 text-center text-[11px] text-gray-500">
            Cargando asistencia...
          </div>
        )}


        {/* SIN SESIONES */}
        {!loading &&
          sessions.length ===
            0 && (
            <div className="py-10 text-center text-[11px] text-gray-500">
              Este curso todavía no
              tiene sesiones de clase
              registradas.
            </div>
          )}


        {/* TABLA */}
        {!loading &&
          sessions.length >
            0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse text-[10px]">
                  <thead>
                    {/* CABECERA PRINCIPAL */}
                    <tr className="bg-[#eeeeee]">
                      <th
                        rowSpan={
                          2
                        }
                        className="w-[42px] border-r border-gray-300 px-2 py-2 text-center font-semibold"
                      >
                        N°
                      </th>

                      <th
                        rowSpan={
                          2
                        }
                        className="min-w-[220px] border-r border-gray-300 px-3 py-2 text-left font-semibold"
                      >
                        Estudiante
                      </th>

                      <th
                        colSpan={
                          sessions.length
                        }
                        className="border-r border-gray-300 px-2 py-2 text-center font-semibold"
                      >
                        Semanas
                      </th>

                      <th
                        rowSpan={
                          2
                        }
                        className="w-[60px] px-2 py-2 text-center font-semibold"
                      >
                        Asistencia
                      </th>

                      <th
                        rowSpan={
                          2
                        }
                        className="w-[52px] px-2 py-2 text-center font-semibold"
                      >
                        % Asis.
                      </th>

                      <th
                        rowSpan={
                          2
                        }
                        className="w-[52px] px-2 py-2 text-center font-semibold"
                      >
                        Faltas
                      </th>
                    </tr>


                    {/* NÚMERO DE CADA SESIÓN */}
                    <tr className="bg-[#f7f7f7]">
                      {sessions.map(
                        (
                          session
                        ) => (
                          <th
                            key={
                              session.id
                            }
                            title={
                              session.tema
                            }
                            className="w-[28px] border-r border-gray-200 px-1 py-1 text-center font-medium"
                          >
                            {
                              session.numero
                            }
                          </th>
                        )
                      )}
                    </tr>
                  </thead>


                  <tbody>
                    {filteredStudents.map(
                      (
                        student,
                        index
                      ) => {
                        const stats =
                          getStats(
                            student.asistencias
                          );

                        return (
                          <tr
                            key={
                              student.matriculaId
                            }
                            className="border-t border-gray-200"
                          >
                            {/* N° */}
                            <td className="border-r border-gray-200 px-2 py-2 text-center">
                              {index +
                                1}
                            </td>


                            {/* ESTUDIANTE */}
                            <td className="border-r border-gray-200 px-3 py-2 font-medium text-gray-800">
                              {
                                student.nombre
                              }
                            </td>


                            {/* CHECK / X */}
                            {student.asistencias.map(
                              (
                                attendance
                              ) => (
                                <td
                                  key={`${student.matriculaId}-${attendance.sesionClaseId}`}
                                  className="border-r border-gray-200 p-0 text-center"
                                >
                                  <button
                                    type="button"
                                    disabled={
                                      !editing ||
                                      saving
                                    }
                                    onClick={() =>
                                      toggleAttendance(
                                        student.matriculaId,
                                        attendance.sesionClaseId
                                      )
                                    }
                                    className={`flex h-[30px] w-full items-center justify-center ${
                                      editing &&
                                      !saving
                                        ? "cursor-pointer hover:bg-gray-100"
                                        : "cursor-default"
                                    }`}
                                  >
                                    {attendance.estado ===
                                    "presente" ? (
                                      <span className="text-[#20c85a]">
                                        <CheckIcon />
                                      </span>
                                    ) : (
                                      <span className="text-[#ff5252]">
                                        <XIcon />
                                      </span>
                                    )}
                                  </button>
                                </td>
                              )
                            )}


                            {/* ASISTENCIA */}
                            <td className="px-2 py-2 text-center font-medium">
                              {
                                stats.presentes
                              }
                              /
                              {
                                stats.total
                              }
                            </td>


                            {/* PORCENTAJE */}
                            <td className="px-2 py-2 text-center font-medium">
                              {
                                stats.porcentaje
                              }
                              %
                            </td>


                            {/* FALTAS */}
                            <td className="px-2 py-2 text-center font-medium">
                              {
                                stats.faltas
                              }
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>


              {/* SIN ESTUDIANTES */}
              {filteredStudents.length ===
                0 && (
                <div className="py-10 text-center text-[11px] text-gray-500">
                  {search.trim()
                    ? "No se encontraron estudiantes."
                    : "No hay estudiantes matriculados en este curso."}
                </div>
              )}
            </>
          )}
      </section>


      {/* MENSAJE GUARDADO */}
      {saved && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-[#163f66] px-4 py-3 text-[11px] font-medium text-white shadow-xl">
          Asistencia guardada
          correctamente.
        </div>
      )}
    </div>
  );
}