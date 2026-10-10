"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type CourseTabKey =
  | "contenido"
  | "clases"
  | "foro"
  | "anuncios"
  | "asistencia";

type CourseTabsProps = {
  role: "alumno" | "docente";
  courseId: number;
  active: CourseTabKey;
  /** false = pestañas sin navegación (p. ej. al crear una actividad). */
  interactive?: boolean;
};

const TABS: { key: CourseTabKey; label: string; path: string }[] = [
  { key: "contenido", label: "Contenido de curso", path: "" },
  { key: "clases", label: "Clases", path: "/clases" },
  { key: "foro", label: "Foro", path: "/foro" },
  { key: "anuncios", label: "Anuncios", path: "/anuncios" },
  { key: "asistencia", label: "Asistencia", path: "/asistencia" },
];

/*
 * PESTAÑAS ÚNICAS DEL CURSO (alumno y docente).
 * En pantallas angostas hacen scroll horizontal (sin saltos de línea) y la
 * pestaña activa se centra automáticamente.
 */
export default function CourseTabs({
  role,
  courseId,
  active,
  interactive = true,
}: CourseTabsProps) {
  const listRef = useRef<HTMLElement | null>(null);

  const tabs = TABS.filter(
    (tab) => tab.key !== "asistencia" || role === "docente"
  );

  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>(".is-active");

    if (!list || !current) return;

    list.scrollLeft =
      current.offsetLeft -
      (list.clientWidth - current.offsetWidth) / 2;
  }, [active]);

  const base = `/${role}/cursos/${courseId}`;

  return (
    <nav
      ref={listRef}
      className="course-tabs"
      aria-label="Secciones del curso"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const className = `course-tabs__item${
          isActive ? " is-active" : ""
        }`;

        return interactive ? (
          <Link
            key={tab.key}
            href={`${base}${tab.path}`}
            className={className}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ) : (
          <span
            key={tab.key}
            className={className}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </span>
        );
      })}
    </nav>
  );
}
