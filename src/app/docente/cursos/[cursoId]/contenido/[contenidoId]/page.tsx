import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ContentViewer from "@/components/common/contenido/ContentViewer";

import { courses } from "@/data/courses";
import {
  courseContents,
  courseModules,
} from "@/data/courseContents";

type TeacherContentPageProps = {
  params: Promise<{
    cursoId: string;
    contenidoId: string;
  }>;
};

// Función para verificar si un ítem es un enlace externo
function checkIsExternalLink(content: Record<string, unknown>): boolean {
  if (!content) return false;
  
  const contentType = String(content.type || "").toLowerCase();
  const externalUrl = (content.url || content.link || content.fileUrl || content.src) as string | undefined;

  return (
    contentType === "link" ||
    contentType === "url" ||
    contentType === "enlace" ||
    Boolean(
      externalUrl &&
      (externalUrl.startsWith("http://") || externalUrl.startsWith("https://"))
    )
  );
}

// Función para obtener la URL exacta según el tipo de contenido
function getContentHref(courseId: number, item: Record<string, unknown>): string | undefined {
  if (!item || item.id === undefined || item.id === null) {
    return undefined;
  }

  const itemType = String(item.type || "").toLowerCase();

  if (itemType === "activity") {
    return `/docente/cursos/${courseId}/actividades/${item.id}`;
  }

  if (itemType === "quiz") {
    return `/docente/cursos/${courseId}/evaluaciones/${item.id}`;
  }

  return `/docente/cursos/${courseId}/contenido/${item.id}`;
}

export default async function TeacherContentPage({
  params,
}: TeacherContentPageProps) {
  const { cursoId, contenidoId } = await params;

  const courseId = Number(cursoId);
  const contentId = Number(contenidoId);

  const course = courses.find(
    (item) => item.id === courseId
  );

  if (!course) {
    notFound();
  }

  const content = courseContents.find(
    (item) =>
      item.courseId === courseId &&
      item.id === contentId
  );

  if (!content) {
    notFound();
  }

  /*
   * REDIRECCIONES DIRECTAS
   */
  if (content.type === "activity") {
    redirect(
      `/docente/cursos/${courseId}/actividades/${content.id}`
    );
  }

  if (content.type === "quiz") {
    redirect(
      `/docente/cursos/${courseId}/evaluaciones/${content.id}`
    );
  }

  // Si se entra directamente a la URL de un enlace, redirigir al curso
  if (checkIsExternalLink(content as Record<string, unknown>)) {
    redirect(`/docente/cursos/${courseId}`);
  }

  const module = courseModules.find(
    (item) => item.id === content.moduleId
  );

  /*
   * LISTA NAVEGABLE FILTRADA:
   * Solo incluye elementos del curso con ID válido y que NO sean enlaces.
   */
  const validContents = courseContents.filter(
    (item) =>
      item.courseId === courseId &&
      item.id !== undefined &&
      !checkIsExternalLink(item as Record<string, unknown>)
  );

  const currentIndex = validContents.findIndex(
    (item) => item.id === content.id
  );

  const previousContent =
    currentIndex > 0
      ? validContents[currentIndex - 1]
      : null;

  const nextContent =
    currentIndex >= 0 &&
    currentIndex < validContents.length - 1
      ? validContents[currentIndex + 1]
      : null;

  // Obtener URLs explícitas para la navegación
  const previousHref = previousContent
    ? getContentHref(courseId, previousContent as Record<string, unknown>)
    : undefined;

  const nextHref = nextContent
    ? getContentHref(courseId, nextContent as Record<string, unknown>)
    : undefined;

  const backHref = `/docente/cursos/${courseId}`;

  return (
    <div className="min-h-screen px-4 py-4 lg:px-5">
      <div className="mx-auto max-w-[1000px]">

        {/* CABECERA */}
        <div className="mb-3 flex min-w-0 items-center gap-3">

          <Link
            href={backHref}
            className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-gray-700 transition hover:text-[#3186d8]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>

            Volver a cursos
          </Link>

          <span className="min-w-0 truncate text-[11px] text-gray-700">
            Módulo {content.moduleId}:{" "}
            {module?.title}
            {" > "}
            {content.moduleId}.{content.order}{" "}
            {content.title}
          </span>

        </div>

        {/* VISOR COMÚN */}
        <ContentViewer
          title={content.title}
          type={content.type}
          file={content.file}
        />

        {/* NAVEGACIÓN */}
        <div className="mt-5 flex items-center justify-between gap-4">

          {previousHref ? (
            <Link
              href={previousHref}
              className="rounded border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              ← Anterior
            </Link>
          ) : (
            <span />
          )}

          {nextHref ? (
            <Link
              href={nextHref}
              className="rounded bg-[#3186d8] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#2777c1]"
            >
              Siguiente →
            </Link>
          ) : (
            <span />
          )}

        </div>

      </div>
    </div>
  );
}