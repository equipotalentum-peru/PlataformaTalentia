import type { CourseContent } from "@/data/courseContents";

export function getTeacherContentHref(
  courseId: number,
  content: CourseContent
): string {
  if (content.type === "activity") {
    return `/docente/cursos/${courseId}/actividades/${content.id}`;
  }

  if (content.type === "quiz") {
    return `/docente/cursos/${courseId}/evaluaciones/${content.id}`;
  }

  return `/docente/cursos/${courseId}/contenido/${content.id}`;
}