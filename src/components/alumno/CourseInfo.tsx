type CourseInfoProps = {
  progress: number;
};

export default function CourseInfo({
  progress,
}: CourseInfoProps) {
  return (
    <aside className="order-first w-full xl:order-last xl:w-[220px] xl:shrink-0">
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[#3c8edc]">
          Información del curso
        </h3>
      </div>

      {/* PROGRESO */}
      <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#3c8edc]">
            Progreso
          </span>

          <span className="text-[9px] text-[#3c8edc]">
            {progress}% completado
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#3c8edc]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* INFORMACIÓN */}
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="space-y-4">

          <InfoItem
            icon="course"
            label="Curso"
            value="Herramientas TIC"
          />

          <InfoItem
            icon="calendar"
            label="Fecha de inicio"
            value="12 de agosto del 2026"
          />

          <InfoItem
            icon="calendar"
            label="Fecha de fin"
            value="12 de diciembre del 2026"
          />

          <InfoItem
            icon="clock"
            label="Duración"
            value="4 meses"
          />

          <InfoItem
            icon="course"
            label="Modalidad"
            value="Virtual por Zoom"
          />

        </div>
      </div>

      <a
        href="#"
        className="mt-8 flex h-12 items-center justify-center rounded-lg bg-[#3186d8] text-[14px] font-semibold text-white transition hover:bg-[#2777c1]"
      >
        Ver Asistencia
      </a>
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
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf4ff] text-[#3186d8]">
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

      <div>
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-[11px] font-medium text-[#3186d8]">{value}</p>
      </div>
    </div>
  );
}