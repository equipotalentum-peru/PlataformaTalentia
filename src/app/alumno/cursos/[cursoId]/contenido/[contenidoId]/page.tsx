import Link from "next/link";
import ContentViewer from "@/components/alumno/contenido/ContentViewer";
import { courseContents, courseModules } from "@/data/courseContents";
import ContentBackButton from "@/components/alumno/ContentBackButton";
import SectionNavigation from "@/components/alumno/SectionNavigation";

type ContentPageProps = {
  params: Promise<{
    cursoId: string;
    contenidoId: string;
  }>;
};

export default async function ContentPage({
  params,
}: ContentPageProps) {
  const { cursoId, contenidoId } = await params;

  const courseId = Number(cursoId);
  const contentId = Number(contenidoId);

  const content = courseContents.find(
    (item) =>
      item.courseId === courseId &&
      item.id === contentId
  );

  if (!content) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-semibold">
          Contenido no encontrado
        </h1>
      </div>
    );
  }

  const module = courseModules.find(
    (item) => item.id === content.moduleId
  );

  const courseContentsList = courseContents.filter(
    (item) => item.courseId === courseId
  );

  const currentIndex = courseContentsList.findIndex(
    (item) => item.id === content.id
  );

  const previousContent =
    currentIndex > 0
      ? courseContentsList[currentIndex - 1]
      : null;

  const nextContent =
    currentIndex < courseContentsList.length - 1
      ? courseContentsList[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen px-4 py-4 lg:px-5">

      {/* CABECERA */}
      <div className="mx-auto max-w-[1000px]">

        <div className="mb-3 flex items-center gap-4">

          <ContentBackButton
            href={`/alumno/cursos/${courseId}`}
            courseId={courseId}
            contentId={content.id}
            contentType={content.type}
          />

          <span className="truncate text-[13px] text-gray-700">
            Módulo {content.moduleId}: {module?.title}
            {" > "}
            {content.moduleId}.{content.order} {content.title}
          </span>

        </div>

        {/* VISOR */}
        <ContentViewer
          title={content.title}
          type={content.type}
          file={content.file}
          contentId={content.id}
          courseId={courseId}
          previousHref={
            previousContent
              ? `/alumno/cursos/${courseId}/contenido/${previousContent.id}`
              : undefined
          }
          nextHref={
            nextContent
              ? `/alumno/cursos/${courseId}/contenido/${nextContent.id}`
              : undefined
          }
          exitHref={`/alumno/cursos/${courseId}`}
        />

        {/* NAVEGACIÓN DE CONTENIDO */}
        {content.type !== "quiz" && (
          <SectionNavigation
            courseId={courseId}
            currentContentId={content.id}
            currentContentType={content.type}
            previousHref={
              previousContent
                ? `/alumno/cursos/${courseId}/contenido/${previousContent.id}`
                : undefined
            }
            nextHref={
              nextContent
                ? `/alumno/cursos/${courseId}/contenido/${nextContent.id}`
                : undefined
            }
          />
        )}

      </div>
    </div>
  );
}