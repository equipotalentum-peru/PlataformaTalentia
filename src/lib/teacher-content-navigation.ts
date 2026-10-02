import type { CourseContent } from "@/data/courseContents";

export function isExternalLink(content: CourseContent): boolean {
  if (!content) return false;
  
  const contentType = String(content.type || "").toLowerCase();
  const externalUrl = (content as Record<string, unknown>).url || 
                      (content as Record<string, unknown>).link || 
                      (content as Record<string, unknown>).fileUrl || 
                      (content as Record<string, unknown>).src;

  return (
    contentType === "link" ||
    contentType === "url" ||
    contentType === "enlace" ||
    Boolean(
      externalUrl &&
      typeof externalUrl === "string" &&
      (externalUrl.startsWith("http://") || externalUrl.startsWith("https://"))
    )
  );
}

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