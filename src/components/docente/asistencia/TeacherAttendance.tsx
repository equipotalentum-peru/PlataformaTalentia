"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";

type AttendanceState = "presente" | "falta" | "sin_registrar";

type AttendanceDay = {
  fecha: string;
  numero: number;
  diaSemana: string;
  puedeRegistrar: boolean;
};

type StudentAttendance = {
  fechaAsistencia: string;
  estado: AttendanceState;
  puedeRegistrar: boolean;
};

type AttendanceStudent = {
  matriculaId: number;
  estudianteId: number;
  nombre: string;
  asistencias: StudentAttendance[];
};

type TeacherAttendanceProps = { courseId: number };
type ApiDay = {
  fecha: string;
  numero: number | string;
  diaSemana: string;
  puedeRegistrar: boolean;
};
type ApiAttendance = {
  fechaAsistencia: string;
  estado: "Presente" | "Falta" | "Sin registrar";
  puedeRegistrar: boolean;
};
type ApiStudent = {
  matriculaId: number | string;
  estudianteId: number | string;
  nombre: string;
  asistencias?: ApiAttendance[];
};
type AttendanceApiResponse = {
  message?: string;
  fechas?: ApiDay[];
  estudiantes?: ApiStudent[];
};

const formatoFechaCorta = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const formatoFechaCompleta = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function fechaUtc(fecha: string) {
  return new Date(`${fecha}T00:00:00Z`);
}

function obtenerEstado(estado: ApiAttendance["estado"] | undefined): AttendanceState {
  if (estado === "Falta") return "falta";
  if (estado === "Sin registrar" || estado == null) return "sin_registrar";
  return "presente";
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function getStats(asistencias: StudentAttendance[]) {
  const fechasEvaluables = asistencias.filter((item) => item.puedeRegistrar);
  const presentes = fechasEvaluables.filter((item) => item.estado === "presente").length;
  const faltas = fechasEvaluables.filter((item) => item.estado === "falta").length;
  const total = fechasEvaluables.length;
  return {
    presentes,
    total,
    faltas,
    porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
  };
}

function copiarEstudiantes(lista: AttendanceStudent[]) {
  return lista.map((student) => ({
    ...student,
    asistencias: student.asistencias.map((item) => ({ ...item })),
  }));
}

export default function TeacherAttendance({ courseId }: TeacherAttendanceProps) {
  const [fechas, setFechas] = useState<AttendanceDay[]>([]);
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [originalStudents, setOriginalStudents] = useState<AttendanceStudent[]>([]);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fechasPasadas = fechas.filter((fecha) => fecha.puedeRegistrar);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarAsistencia() {
      try {
        setLoading(true);
        setError("");
        setSaved(false);
        setEditing(false);

        const response = await fetch(`${API_URL}/asistencias/docente/${courseId}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => ({}))) as AttendanceApiResponse;

        if (!response.ok) {
          throw new Error(data.message ?? "No se pudo cargar la asistencia.");
        }

        const fechasCargadas: AttendanceDay[] = Array.isArray(data.fechas)
          ? data.fechas.map((item) => ({
              fecha: String(item.fecha ?? ""),
              numero: Number(item.numero),
              diaSemana: String(item.diaSemana ?? "Día"),
              puedeRegistrar: Boolean(item.puedeRegistrar),
            }))
          : [];

        const alumnos: AttendanceStudent[] = Array.isArray(data.estudiantes)
          ? data.estudiantes.map((item) => {
              const registros = new Map<string, ApiAttendance>();
              for (const asistencia of Array.isArray(item.asistencias) ? item.asistencias : []) {
                registros.set(asistencia.fechaAsistencia, asistencia);
              }

              return {
                matriculaId: Number(item.matriculaId),
                estudianteId: Number(item.estudianteId),
                nombre: String(item.nombre ?? ""),
                asistencias: fechasCargadas.map((fecha) => {
                  const registro = registros.get(fecha.fecha);
                  return {
                    fechaAsistencia: fecha.fecha,
                    puedeRegistrar: fecha.puedeRegistrar,
                    // Conserva el comportamiento actual: una fecha pasada sin fila
                    // aparece como Presente hasta que el docente registra las faltas.
                    estado: registro
                      ? obtenerEstado(registro.estado)
                      : fecha.puedeRegistrar
                        ? "presente"
                        : "sin_registrar",
                  };
                }),
              };
            })
          : [];

        setFechas(fechasCargadas);
        setStudents(alumnos);
        setOriginalStudents(copiarEstudiantes(alumnos));
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error cargando asistencia:", err);
        setError(err instanceof Error ? err.message : "No se pudo cargar la asistencia.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void cargarAsistencia();
    return () => controller.abort();
  }, [courseId]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) => student.nombre.toLowerCase().includes(term));
  }, [students, search]);

  const toggleAttendance = (matriculaId: number, fechaAsistencia: string) => {
    if (!editing) return;

    setStudents((current) => current.map((student) => {
      if (student.matriculaId !== matriculaId) return student;

      return {
        ...student,
        asistencias: student.asistencias.map((item) => {
          if (item.fechaAsistencia !== fechaAsistencia || !item.puedeRegistrar) return item;
          return {
            ...item,
            estado: item.estado === "presente" ? "falta" : "presente",
          };
        }),
      };
    }));

    setSaved(false);
  };

  const handleEdit = () => {
    if (editing) {
      setStudents(copiarEstudiantes(originalStudents));
      setEditing(false);
      setSaved(false);
      return;
    }

    setOriginalStudents(copiarEstudiantes(students));
    setEditing(true);
    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    if (!editing || saving) return;

    const registros = students.flatMap((student) => student.asistencias
      .filter((item) => item.puedeRegistrar && item.estado !== "sin_registrar")
      .map((item) => ({
        matriculaId: student.matriculaId,
        fechaAsistencia: item.fechaAsistencia,
        estado: item.estado === "falta" ? "Falta" : "Presente",
      })));

    if (registros.length === 0) {
      setError("Todavía no hay fechas de asistencia pasadas que se puedan guardar.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/asistencias/docente/${courseId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registros }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) throw new Error(data.message ?? "No se pudo guardar la asistencia.");

      setOriginalStudents(copiarEstudiantes(students));
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Error guardando asistencia:", err);
      setError(err instanceof Error ? err.message : "No se pudo guardar la asistencia.");
    } finally {
      setSaving(false);
    }
  };

  const puedeEditar = fechasPasadas.length > 0;

  return (
    <div className="w-full">
      <section className="rounded-xl bg-talentia-surface px-4 py-3 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-[15px] font-bold text-talentia-primary">Registrar asistencia</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEdit}
              disabled={loading || saving || students.length === 0 || !puedeEditar}
              className={`rounded-md px-4 py-2 text-[10px] font-semibold transition ${
                loading || saving || students.length === 0 || !puedeEditar
                  ? "cursor-not-allowed bg-talentia-border text-talentia-disabled-text"
                  : editing
                    ? "bg-talentia-action text-talentia-blue hover:bg-talentia-primary"
                    : "bg-talentia-action text-white hover:bg-talentia-primary"
              }`}
            >
              {editing ? "Cancelar edición" : "Editar asistencia"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editing || saving || students.length === 0 || !puedeEditar}
              className={`rounded-md px-4 py-2 text-[10px] font-semibold transition ${
                editing && !saving && students.length > 0 && puedeEditar
                  ? "bg-talentia-action text-white hover:bg-talentia-primary"
                  : "cursor-not-allowed bg-talentia-border text-talentia-disabled-text"
              }`}
            >
              {saving ? "Guardando..." : "Guardar asistencia"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-3 py-2 text-[11px] text-talentia-danger" role="alert">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-4 rounded-md border border-talentia-success/20 bg-talentia-success-bg px-3 py-2 text-[11px] text-talentia-success" role="status">
            La asistencia se guardó correctamente.
          </div>
        )}

        <div className="mb-4 flex h-9 w-full max-w-[360px] items-center rounded-md bg-talentia-surface px-3">
          <svg className="mr-2 h-4 w-4 text-talentia-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar estudiante"
            disabled={loading}
            className="w-full bg-transparent text-[11px] outline-none disabled:cursor-not-allowed"
          />
        </div>

        {loading && <div className="py-10 text-center text-[11px] text-talentia-muted">Cargando asistencia...</div>}

        {!loading && fechas.length === 0 && (
          <div className="py-10 text-center text-[11px] leading-5 text-talentia-muted">
            Este curso todavía no tiene fechas de asistencia configuradas. Desde Administrador, edita el curso, selecciona un periodo académico y marca al menos un día de la semana.
          </div>
        )}

        {!loading && fechas.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-[10px]">
                <thead>
                  <tr className="bg-talentia-surface">
                    <th rowSpan={2} className="w-[42px] border-r border-talentia-border px-2 py-2 text-center font-semibold">N°</th>
                    <th rowSpan={2} className="min-w-[220px] border-r border-talentia-border px-3 py-2 text-left font-semibold">Estudiante</th>
                    <th colSpan={fechas.length} className="border-r border-talentia-border px-2 py-2 text-center font-semibold">Fechas de asistencia</th>
                    <th rowSpan={2} className="w-[60px] px-2 py-2 text-center font-semibold">Asistencia</th>
                    <th rowSpan={2} className="w-[52px] px-2 py-2 text-center font-semibold">% Asis.</th>
                    <th rowSpan={2} className="w-[52px] px-2 py-2 text-center font-semibold">Faltas</th>
                  </tr>
                  <tr className="bg-talentia-surface">
                    {fechas.map((fecha) => (
                      <th
                        key={fecha.fecha}
                        title={formatoFechaCompleta.format(fechaUtc(fecha.fecha))}
                        className="w-[48px] border-r border-talentia-border px-1 py-1 text-center font-medium"
                      >
                        {formatoFechaCorta.format(fechaUtc(fecha.fecha))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const stats = getStats(student.asistencias);
                    return (
                      <tr key={student.matriculaId} className="border-t border-talentia-border">
                        <td className="border-r border-talentia-border px-2 py-2 text-center">{index + 1}</td>
                        <td className="border-r border-talentia-border px-3 py-2 font-medium text-talentia-primary">{student.nombre}</td>
                        {student.asistencias.map((attendance) => (
                          <td key={`${student.matriculaId}-${attendance.fechaAsistencia}`} className="border-r border-talentia-border p-0 text-center">
                            <button
                              type="button"
                              disabled={!editing || saving || !attendance.puedeRegistrar}
                              title={
                                !attendance.puedeRegistrar
                                  ? "La asistencia se podrá registrar cuando llegue esta fecha."
                                  : attendance.estado === "falta"
                                    ? "Marcar presente"
                                    : "Marcar falta"
                              }
                              aria-label={`${student.nombre}, ${attendance.fechaAsistencia}: ${attendance.estado === "presente" ? "Presente" : attendance.estado === "falta" ? "Falta" : "Sin registrar"}`}
                              onClick={() => toggleAttendance(student.matriculaId, attendance.fechaAsistencia)}
                              className={`flex h-[30px] w-full items-center justify-center ${
                                editing && !saving && attendance.puedeRegistrar
                                  ? "cursor-pointer hover:bg-talentia-hover"
                                  : "cursor-default"
                              } ${!attendance.puedeRegistrar ? "text-talentia-muted opacity-50" : ""}`}
                            >
                              {attendance.estado === "presente" ? (
                                <span className="text-talentia-success"><CheckIcon /></span>
                              ) : attendance.estado === "falta" ? (
                                <span className="text-talentia-danger"><XIcon /></span>
                              ) : (
                                <span aria-hidden="true">—</span>
                              )}
                            </button>
                          </td>
                        ))}
                        <td className="px-2 py-2 text-center font-medium">{stats.presentes}/{stats.total}</td>
                        <td className="px-2 py-2 text-center font-medium">{stats.porcentaje}%</td>
                        <td className="px-2 py-2 text-center font-medium">{stats.faltas}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="py-10 text-center text-[11px] text-talentia-muted">
                {search.trim() ? "No se encontraron estudiantes." : "No hay estudiantes matriculados en este curso."}
              </div>
            )}

            {!puedeEditar && (
              <p className="mt-3 text-[11px] text-talentia-muted">
                Aún no hay fechas de asistencia alcanzadas dentro del periodo seleccionado.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
