"use client";

import { useState } from "react";
import { duracionPeriodoMeses, formatearFechaPeriodo } from "@/lib/course-period";
import StudentAttendanceModal from "./StudentAttendanceModal";

type CourseInfoProps = {
  progress: number;
  courseId: number;
  course: {
    nombre: string;
    modalidad: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
  } | null;
};

export default function CourseInfo({
  progress,
  courseId,
  course,
}: CourseInfoProps) {
  const [asistenciaAbierta, setAsistenciaAbierta] = useState(false);
  return (
    <aside className="order-first w-full xl:order-last xl:w-[220px] xl:shrink-0">
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold text-talentia-primary">
          Información del curso
        </h3>
      </div>

      {/* PROGRESO */}
      <div className="mb-3 rounded-xl bg-talentia-surface p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium text-talentia-blue">
            Progreso
          </span>

          <span className="text-[12px] text-talentia-blue">
            {progress}% completado
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-talentia-border">
          <div
            className="h-full rounded-full bg-talentia-teal"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* INFORMACIÓN */}
      <div className="rounded-xl bg-talentia-surface p-3 shadow-sm">
        <div className="space-y-4">

          <InfoItem
            icon="course"
            label="Curso"
            value={course?.nombre || "No disponible"}
          />

          <InfoItem
            icon="calendar"
            label="Fecha de inicio"
            value={formatearFechaPeriodo(course?.fechaInicio)}
          />

          <InfoItem
            icon="calendar"
            label="Fecha de fin"
            value={formatearFechaPeriodo(course?.fechaFin)}
          />

          <InfoItem
            icon="clock"
            label="Duración"
            value={duracionPeriodoMeses(course?.fechaInicio, course?.fechaFin)}
          />

          <InfoItem
            icon="course"
            label="Modalidad"
            value={course?.modalidad === "Hibrido" ? "Híbrido" : course?.modalidad || "Por definir"}
          />

        </div>
      </div>

      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setAsistenciaAbierta(true)}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-talentia-action text-[13px] font-semibold text-white transition hover:bg-talentia-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talentia-blue/30 focus-visible:ring-offset-2"
      >
        Ver Asistencia
      </button>
      {asistenciaAbierta && <StudentAttendanceModal key={courseId} courseId={courseId} onClose={() => setAsistenciaAbierta(false)} />}
    </aside>
  );
}

function InfoItem({
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-talentia-selected text-talentia-blue">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2 2" />
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-[12px] text-talentia-muted">{label}</p>
        <p className="break-words text-[13px] font-medium text-talentia-blue">{value}</p>
      </div>
    </div>
  );
}
