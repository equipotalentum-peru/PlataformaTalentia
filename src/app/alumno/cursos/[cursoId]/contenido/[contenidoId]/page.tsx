import Link from "next/link";
import { redirect } from "next/navigation";
import ContentViewer from "@/components/alumno/contenido/ContentViewer";
import { courseContents, courseModules } from "@/data/courseContents";
import ContentBackButton from "@/components/alumno/ContentBackButton";
import SectionNavigation from "@/components/alumno/SectionNavigation";
import MaterialViewer from "@/components/alumno/contenido/MaterialViewer";

type ContentPageProps = {
  params: Promise<{
    cursoId: string;
    contenidoId: string;
  }>;
  searchParams: Promise<{
    material?: string;
  }>;
};

// Función auxiliar para detectar si un ítem es un enlace externo
function checkIsExternalLink(content: Record<string, unknown>): boolean {
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

export default async function ContentPage({ params, searchParams }: ContentPageProps) {
  const { cursoId, contenidoId } = await params;

  const courseId = Number(cursoId);
  const contentId = Number(contenidoId);

  const { material } = await searchParams;

  if (material === "1") {
    if (![courseId, contentId].every(
      (id) => Number.isSafeInteger(id) && id > 0
    )) {
      return <p>Contenido no válido.</p>;
    }

    return (
      <div className="min-h-screen px-4 py-4 lg:px-5">
        <div className="mx-auto max-w-[1000px]">
          <Link
            href={`/alumno/cursos/${courseId}`}
            className="mb-4 inline-block text-[#12395B] hover:underline"
          >
            Volver al curso
          </Link>
          <MaterialViewer
            key={`${courseId}-${contentId}`}
            courseId={courseId}
            contentId={contentId}
          />
        </div>
      </div>
    );
  }

  const content = courseContents.find(
    (item) => item.courseId === courseId && item.id === contentId
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

  // 1. SI EL CONTENIDO SOLICITADO ES UN ENLACE, LO REDIRIGIMOS DE VUELTA AL CURSO
  if (checkIsExternalLink(content as Record<string, unknown>)) {
    redirect(`/alumno/cursos/${courseId}`);
  }

  const module = courseModules.find(
    (item) => item.id === content.moduleId
  );

  // 2. FILTRAR LA LISTA PARA EXCLUIR TODOS LOS ENLACES EXTERNOS
  const courseContentsList = courseContents.filter(
    (item) =>
      item.courseId === courseId &&
      !checkIsExternalLink(item as Record<string, unknown>)
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
