"use client";

import { useEffect } from "react";
import {
  rememberCourseSummary,
  useCourseSummary,
} from "@/lib/use-course-summary";

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

type CourseHeaderProps = {
  courseId: number;
  /** Si la vista ya conoce el nombre del curso, se lo pasa; si no, se consulta. */
  nombre?: string | null;
  imagen?: string | null;
  /**
   * true (por defecto): si no llega el nombre, el banner lo consulta solo.
   * false: la vista ya carga los datos del curso por su cuenta.
   */
  fetchIfMissing?: boolean;
};

/*
 * BANNER ÚNICO DEL CURSO (alumno y docente).
 * Todas las vistas del curso (módulos, clases, foro, anuncios, asistencia,
 * crear actividad / evaluación) usan este componente, de modo que:
 *   - el título SIEMPRE es el nombre del curso, y
 *   - la disposición (alto, tamaño, márgenes) la controla globals.css
 *     en los 5 breakpoints (≤1100, ≤860, ≤600, ≤480, ≤380).
 */
export default function CourseHeader({
  courseId,
  nombre,
  imagen,
  fetchIfMissing = true,
}: CourseHeaderProps) {
  const nombreLocal = nombre?.trim() ?? "";
  const tieneNombre = nombreLocal.length > 0;

  useEffect(() => {
    if (tieneNombre) {
      rememberCourseSummary(courseId, {
        nombre: nombreLocal,
        imagen,
      });
    }
  }, [courseId, tieneNombre, nombreLocal, imagen]);

  const consultado = useCourseSummary(
    courseId,
    fetchIfMissing && !tieneNombre
  );

  const titulo = tieneNombre
    ? nombreLocal
    : (consultado?.nombre ?? "");

  const src =
    (tieneNombre ? imagen : consultado?.imagen) ||
    IMAGEN_POR_DEFECTO;

  return (
    <div className="course-banner">
      <img
        key={src}
        src={src}
        alt=""
        className="course-banner__image"
        onError={(event) => {
          if (event.currentTarget.src !== IMAGEN_POR_DEFECTO) {
            event.currentTarget.src = IMAGEN_POR_DEFECTO;
          }
        }}
      />

      <div className="course-banner__shade" />

      <h1 className="course-banner__title">{titulo}</h1>
    </div>
  );
}
