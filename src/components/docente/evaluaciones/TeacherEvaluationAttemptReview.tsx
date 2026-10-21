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

type QuestionDetail = {
  id: string;
  numero: number;
  enunciado: string;
  tipo: string;
  puntaje: number;
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

        setDetail(data as AttemptDetail);
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
          <div className="rounded-xl bg-talentia-selected p-4"><p className="text-xs text-talentia-muted">Puntaje</p><p className="mt-1 font-bold text-talentia-primary">{detail.intento.puntosObtenidos.toFixed(2)} / {Number(detail.intento.puntajeTotal ?? 0).toFixed(2)} pts</p></div>
          <div className="rounded-xl bg-talentia-selected p-4"><p className="text-xs text-talentia-muted">Tiempo usado</p><p className="mt-1 font-bold text-talentia-primary">{formatTime(detail.intento.tiempoUsadoSegundos)}</p></div>
          <div className="rounded-xl bg-talentia-selected p-4"><p className="text-xs text-talentia-muted">Enviado</p><p className="mt-1 text-sm font-semibold text-talentia-primary">{formatDate(detail.intento.enviadoEn)}</p></div>
        </div>
      </section>

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
              {question.respuesta.esCorrecta === null && <span className="rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-800">Pendiente de revisión</span>}
              <span className="rounded-full bg-talentia-selected px-3 py-1.5 font-semibold text-talentia-primary">{Number(question.respuesta.puntosObtenidos ?? 0).toFixed(2)} / {question.puntaje.toFixed(2)} pts</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
