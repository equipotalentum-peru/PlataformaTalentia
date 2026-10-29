"use client";

import Link from "next/link";

type Content = { id: string | number; tipo: string };

type Props = {
  courseId: number;
  previous?: Content;
  next?: Content;
  previousHref?: string;
  nextHref?: string;
};

export default function TeacherContentNavigation({ courseId, previous, next, previousHref, nextHref }: Props) {
  function href(item: Content) {
    const base = `/docente/cursos/${courseId}`;
    if (item.tipo === "actividad") return `${base}/actividades/${item.id}`;
    if (item.tipo === "evaluacion") return `${base}/evaluaciones/${item.id}/seguimiento`;
    return `${base}/contenido/${item.id}`;
  }

  const previousUrl = previousHref ?? (previous ? href(previous) : undefined);
  const nextUrl = nextHref ?? (next ? href(next) : undefined);

  return (
    <nav aria-label="Navegación de contenidos" className="mt-5 flex items-center justify-between gap-4" style={{ fontFamily: "Poppins, Arial, Helvetica, sans-serif" }}>
      {previousUrl ? (
        <Link href={previousUrl} className="rounded border border-talentia-border bg-talentia-surface px-5 py-2 text-sm font-medium text-talentia-primary transition hover:bg-talentia-hover">
          Anterior
        </Link>
      ) : <span />}
      {nextUrl ? (
        <Link href={nextUrl} className="rounded bg-talentia-action px-5 py-2 text-sm font-medium text-white transition hover:bg-talentia-primary">
          Siguiente
        </Link>
      ) : <span />}
    </nav>
  );
}
