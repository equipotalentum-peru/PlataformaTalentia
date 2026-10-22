"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type OpcionEvaluacion = {
  id: string;
  numero: number;
  texto: string;
  esCorrecta?: boolean;
};

type RelacionEvaluacion = {
  id: string;
  numero: number;
  elementoIzquierda: string;
  elementoDerecha?: string;
};

type PreguntaEvaluacion = {
  id: string;
  numero: number;
  enunciado: string;
  tipo: string;
  puntaje: number;
  permiteArchivos: boolean;
  opciones: OpcionEvaluacion[];
  relaciones: RelacionEvaluacion[];
};

type EvaluacionDetalle = {
  contenido: {
    id: string;
    titulo: string;
    descripcion: string;
    estado: string;
    numeroModulo: number;
    tituloModulo: string;
  };
  evaluacion: {
    id: string;
    tipo: string;
    instrucciones: string;
    intentosPermitidos: number;
    tiempoLimiteMinutos: number | null;
    puntajeTotal: number | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    calificada: boolean;
    estado: string;
  };
  preguntas: PreguntaEvaluacion[];
};

type ContenidoNavegable = {
  id: string | number;
  tipo: string;
  orden: number;
};

type ModuloNavegable = {
  numero?: number;
  orden?: number;
  contenidos?: ContenidoNavegable[];
};

function etiquetaTipo(tipo: string) {
  switch (tipo) {
    case "seleccion_unica": return "Selección única";
    case "seleccion_multiple": return "Selección múltiple";
    case "verdadero_falso": return "Verdadero / Falso";
    case "respuesta_abierta": return "Respuesta abierta";
    case "relacional": return "Pregunta relacional";
    default: return tipo;
  }
}

function formatearFecha(valor: string | null) {
  if (!valor) return "Sin programar";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Sin programar";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

function hrefContenido(courseId: number, item: ContenidoNavegable) {
  if (item.tipo === "actividad") {
    return `/docente/cursos/${courseId}/actividades/${item.id}`;
  }
  if (item.tipo === "evaluacion") {
    return `/docente/cursos/${courseId}/evaluaciones/${item.id}`;
  }
  return `/docente/cursos/${courseId}/contenido/${item.id}`;
}

export default function TeacherEvaluationViewer({
  courseId,
  contentId,
  exitHref,
}: {
  courseId: number;
  contentId: number;
  exitHref: string;
}) {
  const router = useRouter();
  const [detalle, setDetalle] = useState<EvaluacionDetalle | null>(null);
  const [previousHref, setPreviousHref] = useState<string | undefined>();
  const [nextHref, setNextHref] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvaluation() {
      try {
        setLoading(true);
        setError("");

        const options = {
          credentials: "include" as const,
          cache: "no-store" as RequestCache,
          signal: controller.signal,
        };

        const [evaluationResponse, modulesResponse] = await Promise.all([
          fetch(
            `${API_URL}/cursos/${courseId}/contenidos/${contentId}/evaluacion`,
            options
          ),
          fetch(`${API_URL}/cursos/${courseId}/modulos`, options),
        ]);

        const evaluationData = await evaluationResponse
          .json()
          .catch(() => ({}));

        if (evaluationResponse.status === 401 || modulesResponse.status === 401) {
          router.push("/login");
          return;
        }

        if (!evaluationResponse.ok) {
          throw new Error(
            evaluationData.message ??
              `No se pudo cargar la evaluación (HTTP ${evaluationResponse.status}).`
          );
        }

        if (
          !evaluationData.contenido ||
          !evaluationData.evaluacion ||
          !Array.isArray(evaluationData.preguntas)
        ) {
          throw new Error("El servidor devolvió una evaluación incompleta.");
        }

        setDetalle(evaluationData as EvaluacionDetalle);

        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json().catch(() => ({}));
          const modules: ModuloNavegable[] = Array.isArray(modulesData.modulos)
            ? modulesData.modulos
            : [];

          const navegables = modules
            .slice()
            .sort((a, b) => Number(a.orden ?? a.numero ?? 0) - Number(b.orden ?? b.numero ?? 0))
            .flatMap((module) =>
              (Array.isArray(module.contenidos) ? module.contenidos : [])
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .filter((item) => item.tipo !== "enlace")
            );

          const currentIndex = navegables.findIndex(
            (item) => Number(item.id) === contentId
          );

          setPreviousHref(
            currentIndex > 0
              ? hrefContenido(courseId, navegables[currentIndex - 1])
              : undefined
          );
          setNextHref(
            currentIndex >= 0 && currentIndex < navegables.length - 1
              ? hrefContenido(courseId, navegables[currentIndex + 1])
              : undefined
          );
        }
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la evaluación."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadEvaluation();
    return () => controller.abort();
  }, [courseId, contentId, router]);

  if (loading) {
    return (
      <div role="status" className="rounded-xl border border-talentia-border bg-talentia-surface p-8 text-sm text-talentia-muted">
        Cargando evaluación y preguntas...
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="rounded-xl border border-talentia-danger/30 bg-talentia-surface p-6">
        <p role="alert" className="text-sm text-talentia-danger">
          {error || "No se encontró la evaluación o no tienes acceso a ella."}
        </p>
        <Link
          href={exitHref}
          className="mt-4 inline-flex rounded-md bg-talentia-action px-4 py-2 text-sm font-semibold text-white"
        >
          Volver al curso
        </Link>
      </div>
    );
  }

  const { contenido, evaluacion, preguntas } = detalle;

  return (
    <div>
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <Link href={exitHref} className="app-back-link shrink-0">
          <span aria-hidden="true">{"<"}</span>
          Volver al curso
        </Link>
        <span className="min-w-0 text-[14px] text-talentia-primary">
          Módulo {contenido.numeroModulo}: {contenido.tituloModulo} &gt;{" "}
          {contenido.titulo}
        </span>
      </div>

      <div className="rounded-xl border border-talentia-border bg-talentia-surface px-4 py-5 sm:px-7 sm:py-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-talentia-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-talentia-primary">
              {contenido.titulo}
            </h1>
            <p className="mt-1 text-sm text-talentia-primary">
              Vista del docente · {etiquetaTipo(evaluacion.tipo)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-3 py-1 font-semibold ${
                evaluacion.estado === "Publicada"
                  ? "bg-talentia-success-bg text-talentia-success"
                  : "bg-talentia-selected text-talentia-blue"
              }`}>
                {evaluacion.estado}
              </span>
              <span className="rounded-full bg-talentia-border/40 px-3 py-1 text-talentia-primary">
                {evaluacion.calificada ? "Calificable" : "No calificable"}
              </span>
            </div>
          </div>

          <Link
            href={exitHref}
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-talentia-border bg-talentia-surface px-4 py-2 text-sm font-medium text-talentia-primary transition hover:bg-talentia-hover"
          >
            Salir
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-talentia-selected px-4 py-3">
            <p className="text-xs text-talentia-blue">Preguntas</p>
            <p className="mt-1 text-xl font-bold text-talentia-primary">
              {preguntas.length}
            </p>
          </div>
          <div className="rounded-lg bg-talentia-selected px-4 py-3">
            <p className="text-xs text-talentia-blue">Puntaje total</p>
            <p className="mt-1 text-xl font-bold text-talentia-primary">
              {evaluacion.puntajeTotal ?? "—"} pts
            </p>
          </div>
          <div className="rounded-lg bg-talentia-selected px-4 py-3">
            <p className="text-xs text-talentia-blue">Tiempo límite</p>
            <p className="mt-1 text-base font-bold text-talentia-primary">
              {evaluacion.tiempoLimiteMinutos
                ? `${evaluacion.tiempoLimiteMinutos} minutos`
                : "Sin límite"}
            </p>
          </div>
          <div className="rounded-lg bg-talentia-selected px-4 py-3">
            <p className="text-xs text-talentia-blue">Intentos permitidos</p>
            <p className="mt-1 text-xl font-bold text-talentia-primary">
              {evaluacion.intentosPermitidos}
            </p>
          </div>
        </div>

        {(evaluacion.instrucciones || contenido.descripcion) && (
          <section className="mb-6 rounded-lg border border-talentia-border p-4">
            <h2 className="mb-2 text-base font-semibold text-talentia-primary">
              Instrucciones
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-talentia-primary">
              {evaluacion.instrucciones || contenido.descripcion}
            </p>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-talentia-primary">
              Preguntas de la evaluación
            </h2>
            <span className="text-sm text-talentia-muted">
              {preguntas.reduce((total, pregunta) => total + Number(pregunta.puntaje || 0), 0)} pts asignados
            </span>
          </div>

          {preguntas.length === 0 ? (
            <p className="rounded-lg bg-talentia-selected p-4 text-sm text-talentia-primary">
              Esta evaluación todavía no tiene preguntas.
            </p>
          ) : preguntas.map((pregunta, index) => (
            <article key={pregunta.id} className="rounded-xl border border-talentia-border p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-lg bg-talentia-action px-3 py-1.5 text-sm font-semibold text-white">
                  Pregunta {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-talentia-selected px-3 py-1 text-xs font-semibold text-talentia-blue">
                    {etiquetaTipo(pregunta.tipo)}
                  </span>
                  <span className="text-sm font-semibold text-talentia-primary">
                    {pregunta.puntaje} pts
                  </span>
                </div>
              </div>

              <h3 className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-talentia-primary">
                {pregunta.enunciado}
              </h3>

              {pregunta.tipo === "respuesta_abierta" ? (
                <div className="mt-4 rounded-lg bg-talentia-selected/60 p-4">
                  <p className="mb-2 text-sm font-semibold text-talentia-primary">
                    Respuesta abierta del alumno
                  </p>
                  <div className="min-h-24 rounded-md border border-dashed border-talentia-border bg-talentia-surface p-3 text-sm text-talentia-muted">
                    El alumno responderá escribiendo su texto.
                  </div>
                  <p className="mt-2 text-xs text-talentia-muted">
                    {pregunta.permiteArchivos
                      ? "Esta pregunta permite adjuntar archivos."
                      : "Esta pregunta no permite adjuntar archivos."}
                  </p>
                </div>
              ) : pregunta.tipo === "relacional" ? (
                <div className="mt-4 space-y-2">
                  {pregunta.relaciones.map((relacion) => (
                    <div
                      key={relacion.id}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-talentia-border bg-talentia-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"
                    >
                      <span className="text-sm text-talentia-primary">
                        {relacion.elementoIzquierda}
                      </span>
                      <span className="text-center text-sm font-bold text-talentia-blue">↔</span>
                      <span className="text-sm font-semibold text-talentia-success">
                        {relacion.elementoDerecha ?? "Sin pareja"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {pregunta.opciones.map((opcion, optionIndex) => (
                    <div
                      key={opcion.id}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-3 ${
                        opcion.esCorrecta
                          ? "border-talentia-success/40 bg-talentia-success-bg/60"
                          : "border-talentia-border bg-talentia-surface"
                      }`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        opcion.esCorrecta
                          ? "border-talentia-success bg-talentia-success text-white"
                          : "border-talentia-border"
                      }`}>
                        {opcion.esCorrecta ? "✓" : String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap text-sm text-talentia-primary">
                        {opcion.texto}
                      </span>
                      {opcion.esCorrecta && (
                        <span className="shrink-0 rounded-full bg-talentia-success-bg px-2 py-1 text-xs font-semibold text-talentia-success">
                          Correcta
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-talentia-border pt-5">
          {previousHref ? (
            <Link href={previousHref} className="rounded-md border border-talentia-border px-4 py-2 text-sm text-talentia-primary hover:bg-talentia-hover">
              ← Anterior
            </Link>
          ) : <span />}
          {nextHref ? (
            <Link href={nextHref} className="rounded-md bg-talentia-action px-5 py-2 text-sm font-semibold text-white hover:bg-talentia-primary">
              Siguiente →
            </Link>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}
