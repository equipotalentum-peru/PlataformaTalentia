import type { ReactNode } from "react";
import type { Course } from "@/data/courses";
import { duracionPeriodoMeses, formatearFechaPeriodo } from "@/lib/course-period";

type TeacherCourseInfoProps = {
  course: Course & { modalidad: string | null; fechaInicio: string | null; fechaFin: string | null };
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-talentia-surface text-talentia-blue">
      {children}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c.7-4 2.7-6 6-6s5.3 2 6 6" />
      <path d="M14.5 15c2.5.3 4.1 1.9 4.8 5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M7.5 2.5v4M16.5 2.5v4M3.5 9h17" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h5M8 15h6" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9.5 12 5l9 4.5-9 4.5z" />
      <path d="M7 12.2V16c0 2.1 2.2 3.5 5 3.5s5-1.4 5-3.5v-3.8" />
      <path d="M21 10v5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon>{icon}</Icon>
      <div className="min-w-0">
        <p className="text-[10px] text-talentia-placeholder">{label}</p>
        <p className="break-words text-[11px] font-medium text-talentia-blue">{value}</p>
      </div>
    </div>
  );
}

export default function TeacherCourseInfo({ course }: TeacherCourseInfoProps) {
  const published = course.progreso;

  return (
    <aside className="order-first w-full shrink-0 xl:order-last xl:w-[225px]">
      <h2 className="mb-2 text-[12px] font-semibold text-talentia-primary">Información del curso</h2>

      <div className="space-y-3">
        <section className="rounded-xl bg-talentia-surface p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-talentia-blue">Contenido publicado</span>
            <span className="whitespace-nowrap text-[9px] text-talentia-blue">{published}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-talentia-border">
            <div className="h-full rounded-full bg-talentia-teal" style={{ width: `${published}%` }} />
          </div>
        </section>

        <section className="rounded-xl bg-talentia-surface p-3 shadow-[0_1px_5px_rgba(15,36,61,0.08)]">
          <div className="space-y-4">
            <InfoRow icon={<UsersIcon />} label="Alumnos" value={`${course.alumnos} ${course.alumnos === 1 ? "alumno matriculado" : "alumnos matriculados"}`} />
            <InfoRow icon={<ActivityIcon />} label="Actividades" value={`${course.actividades} ${course.actividades === 1 ? "actividad" : "actividades"}`} />
            <InfoRow icon={<GraduationIcon />} label="Evaluaciones" value={`${course.evaluaciones} ${course.evaluaciones === 1 ? "evaluación" : "evaluaciones"}`} />
            <InfoRow icon={<CalendarIcon />} label="Fecha de inicio" value={formatearFechaPeriodo(course.fechaInicio)} />
            <InfoRow icon={<CalendarIcon />} label="Fecha de fin" value={formatearFechaPeriodo(course.fechaFin)} />
            <InfoRow icon={<GraduationIcon />} label="Duración" value={duracionPeriodoMeses(course.fechaInicio, course.fechaFin)} />
            <InfoRow icon={<ClockIcon />} label="Modalidad" value={course.modalidad === "Hibrido" ? "Híbrido" : course.modalidad || "Por definir"} />
          </div>
        </section>
      </div>
    </aside>
  );
}
