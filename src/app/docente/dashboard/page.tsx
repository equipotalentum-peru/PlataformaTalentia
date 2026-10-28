"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { resolverImagenPortadaCurso } from "@/lib/curso-imagen";

type PendienteRevision = {
  id: number;
  tipo: "Actividad" | "Examen" | "Evaluación";
  titulo: string;
  curso: string;
  codigo: string;
  cursoId: number;
  contenidoId: number;
  pendientes: number;
  fecha: string | null;
};

type CursoDocente = {
  id: number;
  nombre: string;
  codigo: string;
  imagen: string | null;
  alumnos: number;
};

type EvaluacionDashboard = {
  id: number;
  titulo: string;
  curso: string;
  codigo: string;
  fecha: string | null;
};

type ActividadReciente = {
  tipo: string;
  texto: string;
  fecha: string;
};

type DashboardData = {
  docente: {
    nombres: string;
  };
  resumen: {
    cursosAsignados: number;
    alumnos: number;
    actividadesPorCalificar: number;
    evaluacionesProximas: number;
    revisionesPendientes: number;
  };
  pendientesRevision: PendienteRevision[];
  cursos: CursoDocente[];
  resumenAlumnos: {
    total: number;
    alDia: number;
    conPendientes: number;
    bajoRendimiento: number;
  };
  evaluaciones: EvaluacionDashboard[];
  actividadReciente: ActividadReciente[];
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

const CIRCULO_RADIO = 51;
const CIRCUNFERENCIA = 2 * Math.PI * CIRCULO_RADIO;

function formatearFechaLarga() {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date())
    .replace(/^./, (letra) => letra.toUpperCase());
}

function formatearFechaCorta(fecha: string | null) {
  if (!fecha) return "";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(valor);
}

function formatearFechaHora(fecha: string) {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "";
  }

  const ahora = new Date();
  const esHoy =
    valor.getFullYear() === ahora.getFullYear() &&
    valor.getMonth() === ahora.getMonth() &&
    valor.getDate() === ahora.getDate();

  if (esHoy) {
    return `Hoy, ${new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(valor)}`;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(valor);
}

function KpiIcon({
  type,
}: {
  type: "courses" | "students" | "activities" | "evaluations";
}) {
  if (type === "courses") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
      </svg>
    );
  }

  if (type === "students") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20c.8-4 2.8-6 6-6s5.2 2 6 6" />
        <path d="M14.5 15c2.5.3 4.1 1.9 4.8 5" />
      </svg>
    );
  }

  if (type === "activities") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </svg>
  );
}

/*
 * Actividad  -> pantalla de entregas/calificación de la actividad.
 * Examen / Evaluación -> pantalla de seguimiento de la evaluación.
 */
function obtenerRutaPendiente(item: PendienteRevision) {
  if (item.tipo === "Actividad") {
    return `/docente/cursos/${item.cursoId}/actividades/${item.contenidoId}`;
  }

  return `/docente/cursos/${item.cursoId}/evaluaciones/${item.contenidoId}/seguimiento`;
}

function obtenerPartesFecha(fecha: string | null) {
  if (!fecha) return null;

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;

  return {
    dia: new Intl.DateTimeFormat("es-PE", { day: "2-digit" }).format(valor),
    mes: new Intl.DateTimeFormat("es-PE", { month: "short" })
      .format(valor)
      .replace(".", "")
      .toUpperCase(),
    hora: new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(valor),
  };
}

function obtenerEtiquetaPlazo(fecha: string | null) {
  if (!fecha) return null;

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const inicioFecha = new Date(valor);
  inicioFecha.setHours(0, 0, 0, 0);

  const dias = Math.round(
    (inicioFecha.getTime() - inicioHoy.getTime()) / 86400000
  );

  if (dias <= 0) {
    return { texto: "Hoy", estilo: "bg-talentia-danger-bg text-talentia-danger" };
  }

  if (dias === 1) {
    return { texto: "Mañana", estilo: "bg-talentia-warning-bg text-talentia-warning" };
  }

  if (dias <= 7) {
    return { texto: `En ${dias} días`, estilo: "bg-talentia-warning-bg text-talentia-warning" };
  }

  return { texto: `En ${dias} días`, estilo: "bg-talentia-selected text-talentia-blue" };
}

function obtenerTiempoRelativo(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "";

  const minutos = Math.floor((Date.now() - valor.getTime()) / 60000);

  if (minutos < 1) return "Justo ahora";
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;

  return formatearFechaHora(fecha);
}

const ESTILOS_ACTIVIDAD: Record<
  string,
  { fondo: string; texto: string; etiqueta: string }
> = {
  calificacion: {
    fondo: "bg-talentia-success-bg",
    texto: "text-talentia-success",
    etiqueta: "Calificación",
  },
  matricula: {
    fondo: "bg-talentia-purple-soft",
    texto: "text-talentia-purple",
    etiqueta: "Matrícula",
  },
  contenido: {
    fondo: "bg-talentia-selected",
    texto: "text-talentia-blue",
    etiqueta: "Contenido",
  },
  evaluacion: {
    fondo: "bg-talentia-warning-bg",
    texto: "text-talentia-warning",
    etiqueta: "Evaluación",
  },
};

function ActivityIcon({ tipo }: { tipo: string }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "h-[18px] w-[18px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (tipo === "calificacion") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.6 2.6L16 9.5" />
      </svg>
    );
  }

  if (tipo === "matricula") {
    return (
      <svg {...props}>
        <circle cx="10" cy="8" r="3.2" />
        <path d="M4 20c.7-3.6 2.8-5.4 6-5.4" />
        <path d="M18 14v6M15 17h6" />
      </svg>
    );
  }

  if (tipo === "evaluacion") {
    return (
      <svg {...props}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const CURSOS_VISIBLES = 5;
const ITEMS_VISIBLES = 3;

export default function TeacherDashboardPage() {
  const router = useRouter();

  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarDashboard() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(
          `${API_URL}/dashboard/docente`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof data.message === "string"
              ? data.message
              : "No se pudo cargar el dashboard del docente."
          );
        }

        setDatos(data as DashboardData);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el dashboard del docente."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarDashboard();

    return () => controller.abort();
  }, [router]);

  const pendientesRevision = datos?.pendientesRevision ?? [];
  const cursos = datos?.cursos ?? [];
  const evaluaciones = datos?.evaluaciones ?? [];
  const actividadReciente = datos?.actividadReciente ?? [];

  const resumenAlumnos = datos?.resumenAlumnos ?? {
    total: 0,
    alDia: 0,
    conPendientes: 0,
    bajoRendimiento: 0,
  };

  const totalAlumnos = Math.max(0, Number(resumenAlumnos.total) || 0);

  const porcentajeAlDia = useMemo(() => {
    if (totalAlumnos === 0) return 0;
    return resumenAlumnos.alDia / totalAlumnos;
  }, [resumenAlumnos.alDia, totalAlumnos]);

  const porcentajePendientes = useMemo(() => {
    if (totalAlumnos === 0) return 0;
    return resumenAlumnos.conPendientes / totalAlumnos;
  }, [resumenAlumnos.conPendientes, totalAlumnos]);

  const arcoAlDia = CIRCUNFERENCIA * porcentajeAlDia;
  const arcoPendientes = CIRCUNFERENCIA * porcentajePendientes;
  const arcoBajoRendimiento = Math.max(
    0,
    CIRCUNFERENCIA - arcoAlDia - arcoPendientes
  );

  const kpis = [
    {
      label: "Cursos asignados",
      value: String(datos?.resumen.cursosAsignados ?? 0),
      type: "courses" as const,
      box: "bg-talentia-purple-soft",
      icon: "bg-talentia-purple-soft text-talentia-purple",
      number: "text-talentia-purple",
    },
    {
      label: "Alumnos",
      value: String(datos?.resumen.alumnos ?? 0),
      type: "students" as const,
      box: "bg-talentia-success-bg",
      icon: "bg-talentia-success/15 text-talentia-success",
      number: "text-talentia-success",
    },
    {
      label: "Actividades por calificar",
      value: String(datos?.resumen.actividadesPorCalificar ?? 0),
      type: "activities" as const,
      box: "bg-talentia-warning-bg",
      icon: "bg-talentia-warning/15 text-talentia-warning",
      number: "text-talentia-warning",
    },
    {
      label: "Evaluaciones próximas",
      value: String(datos?.resumen.evaluacionesProximas ?? 0),
      type: "evaluations" as const,
      box: "bg-talentia-selected",
      icon: "bg-talentia-selected text-talentia-blue",
      number: "text-talentia-blue",
    },
  ];

  if (cargando) {
    return (
      <div className="min-h-screen w-full px-[24px] py-[22px] lg:px-[30px]">
        <h1 className="teacher-page-title text-[34px] font-semibold text-talentia-primary">
          Dashboard del docente
        </h1>
        <p className="mt-8 text-[14px] text-talentia-muted">
          Cargando dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full px-[24px] py-[22px] lg:px-[30px]">
        <h1 className="teacher-page-title text-[34px] font-semibold text-talentia-primary">
          Dashboard del docente
        </h1>
        <div className="mt-8 rounded-lg border border-talentia-danger/20 bg-talentia-danger-bg px-5 py-4 text-[14px] text-talentia-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 text-[14px] leading-relaxed text-talentia-primary sm:px-6 lg:px-[30px]">
      {/* ENCABEZADO */}
      <header className="mb-6">
        <h1 className="teacher-page-title text-[34px] font-semibold text-talentia-primary">
          Bienvenida {datos?.docente.nombres || "Docente"}
        </h1>

        <p className="mt-2 text-[12px] font-medium uppercase text-talentia-muted">
          {formatearFechaLarga()}
        </p>

        <p className="mt-2 text-[14px] text-talentia-muted">
          Tienes {datos?.resumen.actividadesPorCalificar ?? 0} actividades pendientes de calificar
        </p>
      </header>

      {/* KPI */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article
            key={item.label}
            className={`flex min-h-[104px] min-w-0 items-center gap-4 rounded-lg px-5 py-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${item.box}`}
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${item.icon}`}
            >
              <KpiIcon type={item.type} />
            </div>

            <div className="min-w-0">
              <p
                className={`h-9 text-[36px] font-bold leading-none tabular-nums ${item.number}`}
              >
                {item.value}
              </p>

              <p className="mt-2 min-h-10 break-words text-[14px] font-medium leading-5 text-talentia-primary">
                {item.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* PENDIENTES */}
        <article className="min-w-0 rounded-lg border border-talentia-border bg-talentia-surface p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold text-talentia-primary">
              Pendientes de revisión
            </h2>

            <span className="rounded-full bg-talentia-selected px-3 py-1 text-[12px] font-semibold text-talentia-blue">
              {datos?.resumen.revisionesPendientes ?? 0} pendientes
            </span>
          </div>

          <div className="divide-y divide-talentia-border">
            {pendientesRevision.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-talentia-muted">
                No tienes entregas pendientes de revisión.
              </div>
            ) : (
              pendientesRevision.map((item) => (
                <Link
                  key={`${item.tipo}-${item.id}-${item.cursoId}`}
                  href={obtenerRutaPendiente(item)}
                  className="block py-4 transition hover:bg-talentia-hover"
                >
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[12px] font-medium ${
                      item.tipo === "Examen"
                        ? "bg-talentia-purple-soft text-talentia-purple"
                        : item.tipo === "Evaluación"
                          ? "bg-talentia-selected text-talentia-blue"
                          : "bg-talentia-danger-bg text-talentia-danger"
                    }`}
                  >
                    {item.tipo}
                  </span>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-[14px] font-semibold text-talentia-primary">
                        {item.titulo}
                      </p>

                      <p className="mt-1 break-words text-[12px] text-talentia-muted">
                        {item.curso} - {item.pendientes} pendientes
                      </p>
                    </div>

                    <span className="shrink-0 text-xl text-talentia-primary">›</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>

        {/* MIS CURSOS */}
        <article className="min-w-0 rounded-lg border border-talentia-border bg-talentia-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold text-talentia-primary">
              Mis cursos
            </h2>

            <Link
              href="/docente/cursos"
              className="text-[14px] font-medium text-talentia-blue transition hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {cursos.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-talentia-muted">
                No tienes cursos asignados actualmente.
              </div>
            ) : (
              cursos.slice(0, CURSOS_VISIBLES).map((course) => (
                <Link
                  key={course.codigo}
                  href={`/docente/cursos/${course.id}`}
                  className="flex items-center gap-4 rounded-[13px] border border-talentia-border bg-talentia-surface p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  
                <img
                  src={resolverImagenPortadaCurso(
                    course.imagen,
                    course.id,
                    IMAGEN_POR_DEFECTO
                  )}
                  alt={course.nombre}
                  onError={(event) => {
                    const imagen = event.currentTarget;

                    if (imagen.dataset.fallbackApplied === "true") {
                      return;
                    }

                    imagen.dataset.fallbackApplied = "true";
                    imagen.src = IMAGEN_POR_DEFECTO;
                  }}
                  className="h-14 w-[72px] shrink-0 rounded-md object-cover"
                />

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[14px] font-semibold leading-5 text-talentia-primary">
                      {course.nombre}
                    </p>

                    <p className="mt-1 text-[12px] text-talentia-muted">
                      {course.codigo}
                    </p>

                    <p className="text-[12px] text-talentia-muted">
                      {course.alumnos} alumnos
                    </p>
                  </div>

                  <span className="shrink-0 text-xl text-talentia-primary">›</span>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>

      {/* PARTE INFERIOR */}
      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* RESUMEN ALUMNOS */}
        <article className="min-w-0 rounded-lg border border-talentia-border bg-talentia-surface p-5 sm:p-6">
          <h2 className="mb-5 text-[18px] font-semibold text-talentia-primary">
            Resumen de alumnos
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <div className="relative flex h-[156px] w-[156px] shrink-0 items-center justify-center">
              <svg
                viewBox="0 0 140 140"
                className="absolute inset-0 h-full w-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="70"
                  cy="70"
                  r={CIRCULO_RADIO}
                  fill="none"
                  stroke="var(--talentia-border)"
                  strokeWidth="12"
                />

                {arcoAlDia > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={CIRCULO_RADIO}
                    fill="none"
                    stroke="var(--talentia-purple)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${arcoAlDia} ${Math.max(0, CIRCUNFERENCIA - arcoAlDia)}`}
                    strokeDashoffset="0"
                  />
                )}

                {arcoPendientes > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={CIRCULO_RADIO}
                    fill="none"
                    stroke="var(--talentia-teal)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${arcoPendientes} ${Math.max(0, CIRCUNFERENCIA - arcoPendientes)}`}
                    strokeDashoffset={-arcoAlDia}
                  />
                )}

                {arcoBajoRendimiento > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={CIRCULO_RADIO}
                    fill="none"
                    stroke="var(--talentia-warning)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${arcoBajoRendimiento} ${Math.max(0, CIRCUNFERENCIA - arcoBajoRendimiento)}`}
                    strokeDashoffset={-(arcoAlDia + arcoPendientes)}
                  />
                )}
              </svg>

              <div className="text-center">
                <p className="text-[34px] font-bold tabular-nums text-talentia-primary">
                  {totalAlumnos}
                </p>

                <p className="text-[12px] font-medium text-talentia-muted">
                  Alumnos
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[13px] text-talentia-primary">
              <p>
                <span className="mr-1 text-talentia-purple">●</span>
                Al día: {resumenAlumnos.alDia}
              </p>
              <p>
                <span className="mr-1 text-talentia-blue">●</span>
                Con pendientes: {resumenAlumnos.conPendientes}
              </p>
              <p>
                <span className="mr-1 text-talentia-warning">●</span>
                Bajo rendimiento: {resumenAlumnos.bajoRendimiento}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[12px] leading-relaxed text-talentia-muted">
            Se considera &quot;al día&quot; a quien tiene 80 % o más de progreso y no presenta bajo rendimiento. &quot;Bajo rendimiento&quot; se marca cuando el promedio registrado es menor a 14.
          </p>
        </article>

        {/* EVALUACIONES */}
        <article className="min-w-0 overflow-hidden rounded-lg border border-talentia-border bg-talentia-surface p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-talentia-selected text-talentia-blue">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
              </span>

              <h2 className="text-[18px] font-semibold text-talentia-primary">
                Próximas evaluaciones
              </h2>
            </div>

            {evaluaciones.length > 0 && (
              <span className="rounded-full bg-talentia-selected px-3 py-1 text-[12px] font-semibold text-talentia-blue">
                {datos?.resumen.evaluacionesProximas ?? evaluaciones.length}
              </span>
            )}
          </div>

          {evaluaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-talentia-border bg-talentia-hover/40 px-4 py-10 text-center">
              <span className="text-3xl">🎉</span>
              <p className="text-[13px] font-medium text-talentia-primary">
                No hay evaluaciones próximas
              </p>
              <p className="text-[12px] text-talentia-muted">
                Cuando programes una, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {evaluaciones.slice(0, ITEMS_VISIBLES).map((evaluation) => {
                const partes = obtenerPartesFecha(evaluation.fecha);
                const plazo = obtenerEtiquetaPlazo(evaluation.fecha);

                return (
                  <div
                    key={evaluation.id}
                    className="group flex items-center gap-4 rounded-xl border border-talentia-border bg-talentia-surface p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-talentia-blue/40 hover:shadow-md"
                  >
                    <div className="flex h-[60px] w-[56px] shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-talentia-blue to-talentia-purple text-white shadow-sm">
                      <span className="text-[22px] font-bold leading-none tabular-nums">
                        {partes?.dia ?? "--"}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold tracking-wider">
                        {partes?.mes ?? ""}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-[14px] font-semibold leading-5 text-talentia-primary">
                        {evaluation.titulo}
                      </p>

                      <p className="mt-0.5 break-words text-[12px] text-talentia-muted">
                        {evaluation.curso}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {plazo && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${plazo.estilo}`}
                          >
                            {plazo.texto}
                          </span>
                        )}

                        {partes && (
                          <span className="text-[11px] text-talentia-muted">
                            ⏰ {partes.hora}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* ACTIVIDAD RECIENTE */}
        <article className="min-w-0 overflow-hidden rounded-lg border border-talentia-border bg-talentia-surface p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-talentia-purple-soft text-talentia-purple">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h4l3 8 4-16 3 8h4" />
              </svg>
            </span>

            <h2 className="text-[18px] font-semibold text-talentia-primary">
              Actividad reciente
            </h2>
          </div>

          {actividadReciente.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-talentia-border bg-talentia-hover/40 px-4 py-10 text-center">
              <span className="text-3xl">🕊️</span>
              <p className="text-[13px] font-medium text-talentia-primary">
                Todo tranquilo por aquí
              </p>
              <p className="text-[12px] text-talentia-muted">
                No hay actividad reciente registrada.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-4">
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-[19px] top-3 w-px bg-talentia-border"
              />

              {actividadReciente.slice(0, ITEMS_VISIBLES).map((activity, index) => {
                const estilo =
                  ESTILOS_ACTIVIDAD[activity.tipo] ?? ESTILOS_ACTIVIDAD.contenido;

                return (
                  <li
                    key={`${activity.tipo}-${activity.fecha}-${index}`}
                    className="relative flex gap-3"
                  >
                    <span
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-talentia-surface ${estilo.fondo} ${estilo.texto}`}
                    >
                      <ActivityIcon tipo={activity.tipo} />
                    </span>

                    <div className="min-w-0 flex-1 rounded-xl border border-talentia-border bg-talentia-surface px-3.5 py-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${estilo.fondo} ${estilo.texto}`}
                        >
                          {estilo.etiqueta}
                        </span>

                        <span className="shrink-0 text-[11px] text-talentia-muted">
                          {obtenerTiempoRelativo(activity.fecha)}
                        </span>
                      </div>

                      <p className="mt-1.5 break-words text-[13px] leading-5 text-talentia-primary">
                        {activity.texto}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </article>
      </section>
    </main>
  );
}



