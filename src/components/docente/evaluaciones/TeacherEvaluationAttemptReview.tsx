"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type OptionDetail = {
  id: string;
  numero: number;
  texto: string;
  esCorrecta: boolean;
  seleccionada: boolean;
};

type RelationDetail = {
  id: string;
  numero: number;
  elementoIzquierda: string;
  respuestaCorrecta: string;
  respuestaAlumno: string;
};

type AttachedFile = {
  id: string;
  nombreArchivo: string;
  mimeType: string | null;
  tamanoBytes: number | null;
};

type QuestionDetail = {
  id: string;
  numero: number;
  enunciado: string;
  tipo: string;
  puntaje: number;
  permiteArchivos: boolean;
  archivos: AttachedFile[];
  respuesta: {
    texto: string | null;
    esCorrecta: boolean | null;
    puntosObtenidos: number | null;
  };
  opciones: OptionDetail[];
  relaciones: RelationDetail[];
};

type AttemptDetail = {
  contenido: {
    id: string;
    titulo: string;
    descripcion: string;
    numeroModulo: number;
    tituloModulo: string;
  };
  alumno: {
    id: string;
    nombre: string;
  };
  intento: {
    id: string;
    numeroIntento: number;
    iniciadoEn: string;
    enviadoEn: string | null;
    estado: string;
    puntosObtenidos: number;
    puntajeTotal: number | null;
    nota: number | null;
    tiempoUsadoSegundos: number | null;
  };
  preguntas: QuestionDetail[];
};

function formatTime(seconds: number | null) {
  if (seconds === null) return "Sin límite";
  const value = Math.max(0, seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return [hours, minutes, secs].map((item) => String(item).padStart(2, "0")).join(":");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

function labelType(type: string) {
  switch (type) {
    case "seleccion_unica": return "Selección única";
    case "seleccion_multiple": return "Selección múltiple";
    case "verdadero_falso": return "Verdadero / Falso";
    case "respuesta_abierta": return "Respuesta abierta";
    case "relacional": return "Relacional";
    default: return type;
  }
}

function optionClass(option: OptionDetail) {
  if (option.seleccionada && option.esCorrecta) return "border-emerald-300 bg-emerald-50";
  if (option.seleccionada && !option.esCorrecta) return "border-rose-300 bg-rose-50";
  if (option.esCorrecta) return "border-emerald-200 bg-emerald-50/50";
  return "border-talentia-border bg-white";
}

export default function TeacherEvaluationAttemptReview({
  courseId,
  contentId,
  studentId,
  attemptId,
}: {
  courseId: number;
  contentId: number;
  studentId: number;
  attemptId: number;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [puntajesBorrador, setPuntajesBorrador] = useState<Record<string, string>>({});
  const [preguntaGuardando, setPreguntaGuardando] = useState<string | null>(null);
  const [mensajeCalificacion, setMensajeCalificacion] = useState("");
  const [errorCalificacion, setErrorCalificacion] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${API_URL}/cursos/${courseId}/contenidos/${contentId}/evaluacion/docente/alumnos/${studentId}/intentos/${attemptId}/detalle`,
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
          throw new Error(data.message || "No se pudo cargar el intento.");
        }

        const loadedDetail = data as AttemptDetail;
        setDetail(loadedDetail);
        setPuntajesBorrador(Object.fromEntries(
          loadedDetail.preguntas
            .filter((question) => question.tipo === "respuesta_abierta")
            .map((question) => [
              question.id,
              question.respuesta.puntosObtenidos == null ? "" : String(question.respuesta.puntosObtenidos),
            ])
        ));
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el intento.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [attemptId, contentId, courseId, router, studentId]);

  async function guardarPuntaje(question: QuestionDetail) {
    const raw = puntajesBorrador[question.id] ?? "";
    const points = raw.trim() === "" ? Number.NaN : Number(raw);
    if (!Number.isFinite(points) || points < 0 || points > question.puntaje || Math.abs(points * 100 - Math.round(points * 100)) > 1e-8) {
      setErrorCalificacion(`Escribe un puntaje entre 0 y ${question.puntaje} con hasta dos decimales.`);
      setMensajeCalificacion("");
      return;
    }

    setPreguntaGuardando(question.id);
    setErrorCalificacion("");
    setMensajeCalificacion("");
    try {
      const endpoint = `${API_URL}/cursos/${courseId}/contenidos/${contentId}/evaluacion/docente/alumnos/${studentId}/intentos/${attemptId}`;
      const response = await fetch(`${endpoint}/preguntas/${question.id}/calificacion`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puntosObtenidos: points }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) throw new Error(result.message || "No se pudo guardar el puntaje.");

      const detailResponse = await fetch(`${endpoint}/detalle`, {
        credentials: "include",
        cache: "no-store",
      });
      const updatedDetail = await detailResponse.json().catch(() => ({}));
      if (!detailResponse.ok) throw new Error(updatedDetail.message || "El puntaje se guardó, pero no se pudo actualizar la vista.");
      const nextDetail = updatedDetail as AttemptDetail;
      setDetail(nextDetail);
      setPuntajesBorrador(Object.fromEntries(
        nextDetail.preguntas
          .filter((item) => item.tipo === "respuesta_abierta")
          .map((item) => [item.id, item.respuesta.puntosObtenidos == null ? "" : String(item.respuesta.puntosObtenidos)])
      ));
      setMensajeCalificacion(result.message || "Puntaje guardado correctamente.");
      setErrorCalificacion("");
    } catch (saveError) {
      setErrorCalificacion(saveError instanceof Error ? saveError.message : "No se pudo guardar el puntaje.");
      setMensajeCalificacion("");
    } finally {
      setPreguntaGuardando(null);
    }
  }

  const backHref = `/docente/cursos/${courseId}/evaluaciones/${contentId}/seguimiento`;

  if (loading) {
    return <div className="rounded-xl border border-talentia-border bg-white p-8 text-sm text-talentia-muted">Cargando intento del alumno...</div>;
  }

  if (error || !detail) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-6">
        <p className="text-sm text-rose-700">{error || "No se encontró el intento."}</p>
        <Link href={backHref} className="mt-4 inline-flex rounded-md bg-talentia-action px-4 py-2 text-sm font-semibold text-white">Volver al seguimiento</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="app-back-link">
          <span aria-hidden="true">{"<"}</span> Volver al seguimiento
        </Link>
        <span className="rounded-full bg-talentia-selected px-4 py-2 text-xs font-semibold text-talentia-primary">
          {detail.alumno.nombre} · Intento {detail.intento.numeroIntento}
        </span>
      </div>

      <section className="rounded-xl border border-talentia-border bg-white p-5 sm:p-7">
        <div className="border-b border-talentia-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-talentia-blue">Revisión del intento</p>
          <h1 className="mt-1 text-2xl font-bold text-talentia-primary">{detail.contenido.titulo}</h1>
          <p className="mt-2 text-sm text-talentia-primary"><span className="font-semibold">Alumno:</span> {detail.alumno.nombre}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-talentia-selected p-4"><p className="text-xs text-talentia-muted">Estado</p><p className="mt-1 font-bold text-talentia-primary">{detail.intento.estado}</p></div>
          <div className="rounded-xl bg-talentia-selected p-4"><p className="text-xs text-talentia-muted">Puntaje</p><p className="mt-1 font-bold text-talentia-primary">{detail.intento.puntosObtenidos.toFixed(2)} / {Number(detail.intento.puntajeTotal ?? 0).toFixed(2)} pts</p>{detail.intento.nota !== null && <p className="mt-1 text-xs font-semibold text-talentia-primary">Nota final: {detail.intento.nota.toFixed(2)} / 20</p>}</div>
          <div className="rounded-xl bg-talentia-selected p-4"><p className="text-xs text-talentia-muted">Tiempo usado</p><p className="mt-1 font-bold text-talentia-primary">{formatTime(detail.intento.tiempoUsadoSegundos)}</p></div>
          <div className="rounded-xl bg-talentia-selected p-4"><p className="text-xs text-talentia-muted">Enviado</p><p className="mt-1 text-sm font-semibold text-talentia-primary">{formatDate(detail.intento.enviadoEn)}</p></div>
        </div>
      </section>

      {(mensajeCalificacion || errorCalificacion) && (
        <p role={errorCalificacion ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${errorCalificacion ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {errorCalificacion || mensajeCalificacion}
        </p>
      )}

      <section className="space-y-4">
        {detail.preguntas.map((question) => (
          <article key={question.id} className="rounded-xl border border-talentia-border bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-lg bg-talentia-action px-4 py-2 text-sm font-semibold text-white">Pregunta {question.numero}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-talentia-selected px-3 py-1.5 text-xs font-semibold text-talentia-blue">{labelType(question.tipo)}</span>
                <span className="text-sm font-bold text-talentia-primary">{question.puntaje} pts</span>
              </div>
            </div>

            <h2 className="mt-5 whitespace-pre-wrap text-base font-semibold leading-relaxed text-talentia-primary">{question.enunciado}</h2>

            {["seleccion_unica", "seleccion_multiple", "verdadero_falso"].includes(question.tipo) && (
              <div className="mt-5 space-y-2.5">
                {question.opciones.map((option, index) => (
                  <div key={option.id} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${optionClass(option)}`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current/30 text-xs font-semibold">{question.tipo === "verdadero_falso" ? "" : String.fromCharCode(65 + index)}</span>
                      <span className="text-sm text-talentia-primary">{option.texto}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {option.seleccionada && <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-talentia-primary">Marcada por el alumno</span>}
                      {option.esCorrecta && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Correcta</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {question.tipo === "respuesta_abierta" && (
              <div className="mt-5 rounded-lg border border-talentia-border bg-talentia-selected/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-talentia-muted">Respuesta del alumno</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-talentia-primary">{question.respuesta.texto?.trim() || "Sin respuesta."}</p>
                {question.archivos.length > 0 && (
                  <div className="mt-4 border-t border-talentia-border pt-3">
                    <p className="text-xs font-semibold text-talentia-primary">Documentos adjuntos</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {question.archivos.map((file) => (
                        <a key={file.id} href={`${API_URL}/cursos/${courseId}/contenidos/${contentId}/evaluacion/archivo/${file.id}`} className="inline-flex w-fit max-w-full items-center gap-2 text-sm font-medium text-talentia-blue underline underline-offset-2">
                          <span className="truncate">{file.nombreArchivo}</span>
                          <span className="shrink-0">Descargar</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {question.tipo === "relacional" && (
              <div className="mt-5 space-y-2.5">
                {question.relaciones.map((relation) => {
                  const correct = relation.respuestaAlumno === relation.respuestaCorrecta;
                  return (
                    <div key={relation.id} className={`grid gap-2 rounded-lg border p-4 sm:grid-cols-3 ${correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                      <p className="text-sm font-semibold text-talentia-primary">{relation.elementoIzquierda}</p>
                      <p className="text-sm text-talentia-primary">Alumno: <strong>{relation.respuestaAlumno || "Sin respuesta"}</strong></p>
                      <p className="text-sm text-talentia-primary">Correcta: <strong>{relation.respuestaCorrecta}</strong></p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-talentia-border pt-4 text-xs">
              {question.respuesta.esCorrecta === true && <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800">Correcta</span>}
              {question.respuesta.esCorrecta === false && <span className="rounded-full bg-rose-100 px-3 py-1.5 font-semibold text-rose-800">Incorrecta</span>}
              {question.respuesta.puntosObtenidos === null && <span className="rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">Pendiente de revisión</span>}
              {question.tipo !== "respuesta_abierta" && <span className="rounded-full bg-talentia-selected px-3 py-1.5 font-semibold text-talentia-primary">{Number(question.respuesta.puntosObtenidos ?? 0).toFixed(2)} / {question.puntaje.toFixed(2)} pts</span>}
            </div>
            {question.tipo === "respuesta_abierta" && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg bg-talentia-selected/30 p-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-[240px]">
                  <label htmlFor={`puntaje-${question.id}`} className="mb-1.5 block text-xs font-semibold text-talentia-primary">Puntos obtenidos (máximo {question.puntaje})</label>
                  <input
                    id={`puntaje-${question.id}`}
                    type="number"
                    min={0}
                    max={question.puntaje}
                    step="0.01"
                    value={puntajesBorrador[question.id] ?? ""}
                    onChange={(event) => setPuntajesBorrador((current) => ({ ...current, [question.id]: event.target.value }))}
                    disabled={preguntaGuardando === question.id}
                    className="w-full rounded-md border border-talentia-border bg-white px-3 py-2 text-sm text-talentia-primary outline-none focus:border-talentia-blue disabled:opacity-60"
                  />
                </div>
                <button type="button" onClick={() => void guardarPuntaje(question)} disabled={preguntaGuardando !== null} className="rounded-md bg-talentia-action px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-60">
                  {preguntaGuardando === question.id ? "Guardando..." : "Guardar puntaje"}
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
