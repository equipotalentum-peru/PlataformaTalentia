"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useContentContext } from "@/lib/use-content-breadcrumb";
import TeacherContentNavigation from "@/components/docente/curso/TeacherContentNavigation";

type EvaluationInfo = {
  contenidoId: string;
  evaluacionId: string;
  titulo: string;
  descripcion: string;
  numeroModulo: number;
  tituloModulo: string;
  instrucciones: string;
  intentosPermitidos: number;
  tiempoLimiteMinutos: number | null;
  puntajeTotal: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  calificada: boolean;
  estado: string;
};

type LastAttempt = {
  id: string;
  numeroIntento: number;
  estado: string;
  enviadoEn: string | null;
  puntosObtenidos: number;
};

type StudentSummary = {
  alumnoId: string;
  matriculaId: string;
  alumno: string;
  correo: string;
  intentosUsados: number;
  ultimoIntento: LastAttempt | null;
  /** Nota general guardada en calificaciones (puede diferir del puntaje del intento). */
  notaCalificacion: number | null;
};

type AttemptSummary = {
  id: string;
  numeroIntento: number;
  iniciadoEn: string;
  enviadoEn: string | null;
  estado: string;
  puntosObtenidos: number;
  puntajeTotal: number | null;
  puedeRevisar: boolean;
};

type AttemptsResponse = {
  alumno: { id: string; nombre: string };
  intentosPermitidos: number;
  intentos: AttemptSummary[];
  message?: string;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

function formatDate(value: string | null) {
  if (!value) return "Por definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "Calificado":
      return "bg-emerald-100 text-emerald-800";
    case "Enviado":
      return "bg-sky-100 text-sky-800";
    case "En curso":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function TeacherEvaluationTracking({
  courseId,
  contentId,
}: {
  courseId: number;
  contentId: number;
}) {
  const router = useRouter();
  const { previous, next } = useContentContext(courseId, contentId);
  const [evaluation, setEvaluation] = useState<EvaluationInfo | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [error, setError] = useState("");
  const [attemptsError, setAttemptsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${API_URL}/cursos/${courseId}/contenidos/${contentId}/evaluacion/docente/seguimiento`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(data.message || "No se pudo cargar el seguimiento de la evaluación.");
        }

        const incomingStudents = Array.isArray(data.alumnos) ? data.alumnos as StudentSummary[] : [];
        setEvaluation(data.evaluacion as EvaluationInfo);
        setStudents(incomingStudents);
        setSelectedStudentId((current) => {
          if (current && incomingStudents.some((student) => student.alumnoId === current)) {
            return current;
          }
          return incomingStudents[0]?.alumnoId ?? null;
        });
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el seguimiento.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [contentId, courseId, router]);

  useEffect(() => {
    if (!selectedStudentId) {
      setAttempts([]);
      setAttemptsError("");
      return;
    }

    const controller = new AbortController();

    async function loadAttempts() {
      try {
        setLoadingAttempts(true);
        setAttemptsError("");
        const response = await fetch(
          `${API_URL}/cursos/${courseId}/contenidos/${contentId}/evaluacion/docente/alumnos/${selectedStudentId}/intentos`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );
        const data = await response.json().catch(() => ({})) as AttemptsResponse;

        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(data.message || "No se pudo cargar el historial de intentos.");
        }

        setAttempts(Array.isArray(data.intentos) ? data.intentos : []);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setAttempts([]);
        setAttemptsError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los intentos.");
      } finally {
        if (!controller.signal.aborted) setLoadingAttempts(false);
      }
    }

    void loadAttempts();
    return () => controller.abort();
  }, [contentId, courseId, router, selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.alumnoId === selectedStudentId) ?? students[0] ?? null,
    [selectedStudentId, students]
  );

  if (loading) {
    return <div className="rounded-xl border border-talentia-border bg-white p-8 text-sm text-talentia-muted">Cargando seguimiento de evaluación...</div>;
  }

  if (error || !evaluation) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-6">
        <p className="text-sm text-rose-700">{error || "No se encontró la evaluación."}</p>
        <Link href={`/docente/cursos/${courseId}`} className="mt-4 inline-flex rounded-md bg-talentia-action px-4 py-2 text-sm font-semibold text-white">Volver al curso</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-32px)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link href={`/docente/cursos/${courseId}`} className="app-back-link">
            <span aria-hidden="true">{"<"}</span> Volver
          </Link>
          <span className="text-sm text-talentia-primary">
            Módulo {evaluation.numeroModulo}: {evaluation.tituloModulo} &gt; {evaluation.titulo}
          </span>
        </div>
        <Link
          href={`/docente/cursos/${courseId}/evaluaciones/${contentId}`}
          className="rounded-md border border-talentia-border bg-white px-4 py-2 text-sm font-semibold text-talentia-primary transition hover:bg-talentia-hover"
        >
          Ver preguntas de la evaluación
        </Link>
      </div>

      <div className="grid flex-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0">
          <section className="border-b border-talentia-border pb-4">
            <h1 className="text-2xl font-bold leading-tight text-talentia-primary">Evaluación: {evaluation.titulo}</h1>
            {evaluation.descripcion && <p className="mt-2 text-sm leading-relaxed text-talentia-primary">{evaluation.descripcion}</p>}
          </section>

          <h2 className="mt-4 text-base font-bold text-talentia-primary">Alumnos</h2>

          <section className="mt-4 overflow-hidden rounded-xl border border-talentia-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-talentia-surface">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-talentia-primary">Alumno</th>
                    <th className="px-4 py-3 text-center font-semibold text-talentia-primary">Intentos</th>
                    <th className="px-4 py-3 text-center font-semibold text-talentia-primary">Estado</th>
                    <th className="px-4 py-3 text-center font-semibold text-talentia-primary">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-talentia-muted">No hay alumnos matriculados para esta evaluación.</td></tr>
                  ) : students.map((student, index) => {
                    const selected = selectedStudent?.alumnoId === student.alumnoId;
                    const notaIntentoNoCalificada =
                      !evaluation.calificada &&
                      student.ultimoIntento?.estado === "Calificado" &&
                      evaluation.puntajeTotal !== null &&
                      evaluation.puntajeTotal > 0
                        ? Math.max(
                            0,
                            Math.min(
                              20,
                              Number(
                                ((student.ultimoIntento.puntosObtenidos / evaluation.puntajeTotal) * 20).toFixed(2)
                              )
                            )
                          )
                        : null;
                    // Ya terminó la evaluación y el alumno no envió nada = 0
                    const evaluacionTerminada =
                      evaluation.fechaFin !== null &&
                      new Date(evaluation.fechaFin).getTime() <= Date.now();
                    const noEnvio =
                      !student.ultimoIntento ||
                      student.ultimoIntento.estado === "En curso";
                    const notaSinEnvio =
                      evaluacionTerminada && noEnvio ? 0 : null;
                    const notaMostrar =
                      student.notaCalificacion ?? notaIntentoNoCalificada ?? notaSinEnvio;
                    return (
                      <tr
                        key={student.alumnoId}
                        onClick={() => setSelectedStudentId(student.alumnoId)}
                        className={`cursor-pointer border-t border-talentia-border transition ${selected ? "bg-cyan-50" : "hover:bg-talentia-hover"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index % 2 === 0 ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"}`}>
                              {initials(student.alumno)}
                            </span>
                            <div>
                              <p className="font-semibold text-talentia-primary">{student.alumno}</p>
                              <p className="text-xs text-talentia-muted">{student.correo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-talentia-primary">{student.intentosUsados} / {evaluation.intentosPermitidos}</td>
                        <td className="px-4 py-3 text-center">
                          {student.ultimoIntento ? (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(student.ultimoIntento.estado)}`}>{student.ultimoIntento.estado}</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{evaluacionTerminada ? "No envió" : "Sin intento"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-talentia-primary">
                          {notaMostrar !== null && Number.isFinite(notaMostrar)
                            ? `${notaMostrar.toFixed(2)} / 20.00`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <section>
            <h2 className="text-base font-bold text-talentia-primary">Detalles de la evaluación</h2>
            <div className="mt-3 space-y-3 rounded-xl border border-talentia-border bg-white p-4 text-sm">
              <div><p className="text-talentia-blue">Fecha de inicio</p><p className="mt-1 font-medium text-talentia-primary">{formatDate(evaluation.fechaInicio)}</p></div>
              <div><p className="text-talentia-blue">Fecha de fin</p><p className="mt-1 font-medium text-talentia-primary">{formatDate(evaluation.fechaFin)}</p></div>
              <div><p className="text-talentia-blue">Intentos</p><p className="mt-1 font-medium text-talentia-primary">{evaluation.intentosPermitidos} intentos permitidos</p></div>
              <div><p className="text-talentia-blue">Tiempo límite</p><p className="mt-1 font-medium text-talentia-primary">{evaluation.tiempoLimiteMinutos ? `${evaluation.tiempoLimiteMinutos} minutos` : "Sin límite"}</p></div>
              <div><p className="text-talentia-blue">Puntuación máxima</p><p className="mt-1 font-medium text-talentia-primary">{Number(evaluation.puntajeTotal ?? 0)} puntos</p></div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-talentia-primary">Alumno seleccionado</h2>
            {selectedStudent ? (
              <div className="mt-3">
                <p className="text-sm text-talentia-primary"><span className="font-semibold">Alumno:</span> {selectedStudent.alumno}</p>
                <p className="mt-1 text-sm text-talentia-primary"><span className="font-semibold">Intentos usados:</span> {attempts.length} de {evaluation.intentosPermitidos}</p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-talentia-primary">Historial de intentos</h3>
                  <span className="text-xs text-talentia-muted">Del 1 al último</span>
                </div>

                {loadingAttempts ? (
                  <div className="mt-3 rounded-lg border border-talentia-border bg-white p-4 text-sm text-talentia-muted">Cargando intentos...</div>
                ) : attemptsError ? (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{attemptsError}</div>
                ) : attempts.length === 0 ? (
                  <div className="mt-3 rounded-lg border border-talentia-border bg-white p-4 text-sm text-talentia-blue">Este estudiante todavía no ha enviado ningún intento.</div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {attempts.map((attempt) => (
                      <div key={attempt.id} className="rounded-lg border border-talentia-border bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-talentia-primary">Intento {attempt.numeroIntento}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(attempt.estado)}`}>{attempt.estado}</span>
                        </div>
                        <p className="mt-2 text-xs text-talentia-muted">Entrega: {formatDateTime(attempt.enviadoEn)}</p>
                        <p className="mt-1 text-xs font-semibold text-talentia-primary">
                          Nota: {attempt.estado === "Calificado" ? `${attempt.puntosObtenidos.toFixed(2)} / ${Number(attempt.puntajeTotal ?? 0).toFixed(2)}` : "—"}
                        </p>
                        {attempt.puedeRevisar && (
                          <Link
                            href={`/docente/cursos/${courseId}/evaluaciones/${contentId}/seguimiento/alumno/${selectedStudent.alumnoId}/intentos/${attempt.id}`}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-talentia-action px-3 py-2 text-xs font-semibold text-white transition hover:bg-talentia-primary"
                          >
                            Ver intento
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-talentia-muted">Selecciona un alumno para ver sus intentos.</p>
            )}
          </section>
        </aside>
      </div>
      <TeacherContentNavigation courseId={courseId} previous={previous} next={next} />
    </div>
  );
}