"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";

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
    apellidos: string;
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
      box: "bg-[#eec5ff]",
      icon: "bg-[#e1a8fa] text-[#7e43b1]",
      number: "text-[#7e43b1]",
    },
    {
      label: "Alumnos",
      value: String(datos?.resumen.alumnos ?? 0),
      type: "students" as const,
      box: "bg-[#adffc9]",
      icon: "bg-[#80efac] text-[#16a349]",
      number: "text-[#16a349]",
    },
    {
      label: "Actividades por calificar",
      value: String(datos?.resumen.actividadesPorCalificar ?? 0),
      type: "activities" as const,
      box: "bg-[#ffe3a5]",
      icon: "bg-[#ffd27c] text-[#d89200]",
      number: "text-[#d89200]",
    },
    {
      label: "Evaluaciones próximas",
      value: String(datos?.resumen.evaluacionesProximas ?? 0),
      type: "evaluations" as const,
      box: "bg-[#9fd9ff]",
      icon: "bg-[#71c3f6] text-[#2677bb]",
      number: "text-[#2677bb]",
    },
  ];

  if (cargando) {
    return (
      <div className="min-h-screen w-full px-[24px] py-[22px] lg:px-[30px]">
        <h1 className="text-[34px] font-semibold text-gray-950">
          Dashboard del docente
        </h1>
        <p className="mt-8 text-[14px] text-gray-500">
          Cargando dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full px-[24px] py-[22px] lg:px-[30px]">
        <h1 className="text-[34px] font-semibold text-gray-950">
          Dashboard del docente
        </h1>
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-[24px] py-[22px] lg:px-[30px]">
      {/* ENCABEZADO */}
      <header className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.6px] text-[#3186d8]">
          {formatearFechaLarga()}
        </p>

        <h1 className="mt-1 text-[38px] font-semibold tracking-[-0.7px] text-[#3186d8]">
          Bienvenida {datos?.docente.nombres || "Docente"}
        </h1>

        <p className="mt-1 text-[14px] text-[#3186d8]">
          Tienes {datos?.resumen.actividadesPorCalificar ?? 0} actividades pendientes de calificar
        </p>
      </header>

      {/* KPI */}
      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article
            key={item.label}
            className={`flex min-h-[78px] items-center gap-3 rounded-[14px] px-4 py-3 ${item.box}`}
          >
            <div
              className={`flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[15px] ${item.icon}`}
            >
              <KpiIcon type={item.type} />
            </div>

            <div>
              <p
                className={`text-[34px] font-bold leading-none ${item.number}`}
              >
                {item.value}
              </p>

              <p className="mt-1 text-[13px] font-medium text-gray-700">
                {item.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        {/* PENDIENTES */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold text-[#3186d8]">
              Pendientes de revisión
            </h2>

            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[10px] font-semibold text-[#3186d8]">
              {datos?.resumen.revisionesPendientes ?? 0} pendientes
            </span>
          </div>

          <div className="divide-y divide-gray-200">
            {pendientesRevision.length === 0 ? (
              <div className="py-7 text-center text-[12px] text-gray-500">
                No tienes entregas pendientes de revisión.
              </div>
            ) : (
              pendientesRevision.map((item) => (
                <Link
                  key={`${item.tipo}-${item.id}-${item.cursoId}`}
                  href="/docente/calificaciones"
                  className="block py-2.5 transition hover:bg-gray-50"
                >
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[10px] font-medium ${
                      item.tipo === "Examen"
                        ? "bg-[#eadcff] text-[#8752bb]"
                        : item.tipo === "Evaluación"
                          ? "bg-[#e8f4ff] text-[#2b7cc3]"
                          : "bg-[#f9cbd4] text-[#c84262]"
                    }`}
                  >
                    {item.tipo}
                  </span>

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-[#3186d8]">
                        {item.titulo}
                      </p>

                      <p className="text-[11px] text-gray-500">
                        {item.curso} - {item.pendientes} pendientes
                      </p>
                    </div>

                    <span className="shrink-0 text-xl text-gray-700">›</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>

        {/* MIS CURSOS */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[18px] font-semibold text-[#3186d8]">
            Mis cursos
          </h2>

          <div className="divide-y divide-gray-200">
            {cursos.length === 0 ? (
              <div className="py-7 text-center text-[12px] text-gray-500">
                No tienes cursos asignados actualmente.
              </div>
            ) : (
              cursos.map((course) => (
                <Link
                  key={course.codigo}
                  href={`/docente/cursos/${course.id}`}
                  className="flex items-center gap-3 py-2 transition hover:bg-gray-50"
                >
                  <img
                    src={course.imagen || IMAGEN_POR_DEFECTO}
                    alt={course.nombre}
                    className="h-10 w-14 rounded-md object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-[#3186d8]">
                      {course.nombre}
                    </p>

                    <p className="text-[11px] text-gray-500">
                      {course.codigo}
                    </p>

                    <p className="text-[11px] text-gray-500">
                      {course.alumnos} alumnos
                    </p>
                  </div>

                  <span className="text-xl text-gray-700">›</span>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>

      {/* PARTE INFERIOR */}
      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* RESUMEN ALUMNOS */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-center text-[20px] font-semibold text-[#3186d8]">
            Resumen de alumnos
          </h2>

          <div className="flex items-center justify-center gap-4">
            <div className="relative flex h-[130px] w-[130px] items-center justify-center">
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
                  stroke="#eeeeee"
                  strokeWidth="12"
                />

                {arcoAlDia > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={CIRCULO_RADIO}
                    fill="none"
                    stroke="#c76dff"
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
                    stroke="#55d3d3"
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
                    stroke="#f3b44f"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${arcoBajoRendimiento} ${Math.max(0, CIRCUNFERENCIA - arcoBajoRendimiento)}`}
                    strokeDashoffset={-(arcoAlDia + arcoPendientes)}
                  />
                )}
              </svg>

              <div className="text-center">
                <p className="text-[30px] font-bold text-[#3186d8]">
                  {totalAlumnos}
                </p>

                <p className="text-[11px] font-medium text-[#3186d8]">
                  Alumnos
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-[11px] text-gray-600">
              <p>
                <span className="mr-1 text-[#c76dff]">●</span>
                Al día: {resumenAlumnos.alDia}
              </p>
              <p>
                <span className="mr-1 text-[#55d3d3]">●</span>
                Con pendientes: {resumenAlumnos.conPendientes}
              </p>
              <p>
                <span className="mr-1 text-[#f3b44f]">●</span>
                Bajo rendimiento: {resumenAlumnos.bajoRendimiento}
              </p>
            </div>
          </div>

          <p className="mt-3 text-center text-[9px] leading-relaxed text-gray-400">
            Se considera "al día" a quien tiene 80 % o más de progreso y no presenta bajo rendimiento. "Bajo rendimiento" se marca cuando el promedio registrado es menor a 11.
          </p>
        </article>

        {/* EVALUACIONES */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[20px] font-semibold text-[#3186d8]">
            Próximas evaluaciones
          </h2>

          <div className="divide-y divide-gray-200">
            {evaluaciones.length === 0 ? (
              <div className="py-7 text-center text-[11px] text-gray-500">
                No hay evaluaciones próximas.
              </div>
            ) : (
              evaluaciones.map((evaluation) => (
                <div key={evaluation.id} className="py-2">
                  <p className="text-[10px] font-semibold text-[#3186d8]">
                    {evaluation.titulo}
                  </p>

                  <div className="flex justify-between gap-2 text-[10px] text-gray-500">
                    <span className="truncate">{evaluation.curso}</span>

                    <span className="shrink-0">
                      {formatearFechaCorta(evaluation.fecha)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* ACTIVIDAD RECIENTE */}
        <article className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[20px] font-semibold text-[#3186d8]">
            Actividad reciente
          </h2>

          <div className="divide-y divide-gray-200">
            {actividadReciente.length === 0 ? (
              <div className="py-7 text-center text-[11px] text-gray-500">
                No hay actividad reciente registrada.
              </div>
            ) : (
              actividadReciente.map((activity, index) => (
                <div
                  key={`${activity.tipo}-${activity.fecha}-${index}`}
                  className="py-2.5"
                >
                  <p className="text-[10px] text-gray-700">
                    {activity.texto}
                  </p>

                  <p className="mt-1 text-right text-[10px] text-gray-400">
                    {formatearFechaHora(activity.fecha)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}