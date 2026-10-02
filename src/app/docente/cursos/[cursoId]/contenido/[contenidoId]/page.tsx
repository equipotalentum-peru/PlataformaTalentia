import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ContentViewer from "@/components/common/contenido/ContentViewer";

import { courses } from "@/data/courses";
import {
  courseContents,
  courseModules,
} from "@/data/courseContents";

import {
  getTeacherContentHref,
  isExternalLink,
} from "@/lib/teacher-content-navigation";

type TeacherContentPageProps = {
  params: Promise<{
    cursoId: string;
    contenidoId: string;
  }>;
};

export default async function TeacherContentPage({
  params,
}: TeacherContentPageProps) {
  const { cursoId, contenidoId } = await params;

  const courseId = Number(cursoId);
  const contentId = Number(contenidoId);

  const course = courses.find((item) => item.id === courseId);
  if (!course) notFound();

  const content = courseContents.find(
    (item) => item.courseId === courseId && item.id === contentId
  );
  if (!content) notFound();

  /*
   * REDIRECCIONES DE TIPOS QUE NO VAN EN ESTE VISOR
   */
  if (content.type === "activity") {
    redirect(`/docente/cursos/${courseId}/actividades/${content.id}`);
  }

  if (content.type === "quiz") {
    redirect(`/docente/cursos/${courseId}/evaluaciones/${content.id}`);
  }

  // Si intentan entrar a un enlace directamente por URL, lo regresamos al módulo
  if (isExternalLink(content)) {
    redirect(`/docente/cursos/${courseId}`);
  }

  const module = courseModules.find((item) => item.id === content.moduleId);

  /*
   * FILTRADO ESTRICTO DE CONTENIDOS PARA NAVEGACIÓN:
   * Obtenemos SOLO los contenidos del curso que NO son enlaces externos.
   */
  const validNavContents = courseContents.filter(
    (item) => item.courseId === courseId && !isExternalLink(item)
  );

  // Encontrar la posición actual dentro de la lista YA filtrada
  const currentIndex = validNavContents.findIndex((item) => item.id === content.id);

  const previousContent =
    currentIndex > 0 ? validNavContents[currentIndex - 1] : null;

  const nextContent =
    currentIndex >= 0 && currentIndex < validNavContents.length - 1
      ? validNavContents[currentIndex + 1]
      : null;

  // Generamos los enlaces con la función Helper
  const previousHref = previousContent
    ? getTeacherContentHref(courseId, previousContent)
    : undefined;

  const nextHref = nextContent
    ? getTeacherContentHref(courseId, nextContent)
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
            Módulo {content.moduleId}: {module?.title}
            {" > "}
            {content.moduleId}.{content.order} {content.title}
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