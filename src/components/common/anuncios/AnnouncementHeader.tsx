import type { ReactNode } from "react";

type AnnouncementHeaderProps = {
  action?: ReactNode;
};

export default function AnnouncementHeader({
  action,
}: AnnouncementHeaderProps) {
  return (
    <section className="rounded-xl bg-talentia-surface px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-talentia-blue">
            <svg
              className="h-8 w-8 text-talentia-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 10v4h3l7 4V6l-7 4H4Z" />
              <path d="M17 9c1.5 1.7 1.5 4.3 0 6" />
              <path d="M19.5 6.5c3.5 3.2 3.5 7.8 0 11" />
            </svg>
          </div>

          <div>
            <h2 className="text-[14px] font-bold text-talentia-primary">
              Anuncios
            </h2>

            <p className="mt-1 text-[11px] leading-snug text-talentia-muted">
              Mantente al día con las novedades,
              recordatorios o comunicados hechos por
              el docente del curso.
            </p>
          </div>
        </div>

        {action}
      </div>
    </section>
  );
}