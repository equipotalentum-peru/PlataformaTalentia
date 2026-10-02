"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { courseContents } from "@/data/courseContents";
import ContentViewer from "@/components/alumno/contenido/ContentViewer";
import SectionNavigation from "@/components/alumno/SectionNavigation";

type PageProps = {
  params: Promise<{
    cursoId: string;
    contenidoId: string;
  }> | {
    cursoId: string;
    contenidoId: string;
  };
};

export default function ContenidoPage({ params }: PageProps) {
  const router = useRouter();

  // Desempaquetar params (soporta Next.js 13, 14 y 15)
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const cursoId = Number(resolvedParams.cursoId);
  const contenidoId = Number(resolvedParams.contenidoId);

  // 1. Obtener el contenido actual
  const currentContent = courseContents.find((c) => c.id === contenidoId);

  // Función auxiliar para saber si es un enlace
  const isLinkContent = (content?: typeof courseContents[0]) => {
    if (!content) return false;
    const type = (content.type as string)?.toLowerCase();
    const file = content.file || "";
    return (
      type === "link" ||
      type === "url" ||
      type === "enlace" ||
      file.startsWith("http://") ||
      file.startsWith("https://")
    );
  };

  // 2. Si el alumno ingresa directamente a un contenido tipo enlace, abrirlo y omitirlo
  useEffect(() => {
    if (currentContent && isLinkContent(currentContent)) {
      if (currentContent.file) {
        window.open(currentContent.file, "_blank", "noopener,noreferrer");
      }

      // Buscar el siguiente contenido que NO sea enlace para redirigir
      const courseItems = courseContents
        .filter((c) => c.courseId === cursoId)
        .sort((a, b) => a.moduleId - b.moduleId || a.order - b.order);

      const nextValid = courseItems.find(
        (c) => c.id > contenidoId && !isLinkContent(c)
      );

      if (nextValid) {
        router.replace(`/alumno/cursos/${cursoId}/contenido/${nextValid.id}`);
      } else {
        router.replace(`/alumno/cursos/${cursoId}`);
      }
    }
  }, [currentContent, cursoId, contenidoId, router]);

  if (!currentContent) {
    return (
      <div className="p-8 text-center text-gray-500">
        Contenido no encontrado.
      </div>
    );
  }

  // 3. Obtener contenidos del curso ordenados
  const currentCourseContents = courseContents
    .filter((c) => c.courseId === cursoId)
    .sort((a, b) => a.moduleId - b.moduleId || a.order - b.order);

  const currentIndex = currentCourseContents.findIndex(
    (c) => c.id === contenidoId
  );

  // 4. Buscar SIGUIENTE contenido (omitiendo enlaces)
  let nextContent = null;
  if (currentIndex !== -1) {
    for (let i = currentIndex + 1; i < currentCourseContents.length; i++) {
      if (!isLinkContent(currentCourseContents[i])) {
        nextContent = currentCourseContents[i];
        break;
      }
    }
  }

  // 5. Buscar ANTERIOR contenido (omitiendo enlaces)
  let previousContent = null;
  if (currentIndex !== -1) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!isLinkContent(currentCourseContents[i])) {
        previousContent = currentCourseContents[i];
        break;
      }
    }
  }

  const previousHref = previousContent
    ? `/alumno/cursos/${cursoId}/contenido/${previousContent.id}`
    : undefined;

  const nextHref = nextContent
    ? `/alumno/cursos/${cursoId}/contenido/${nextContent.id}`
    : undefined;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <ContentViewer
        title={currentContent.title}
        type={currentContent.type}
        file={currentContent.file}
        contentId={currentContent.id}
        courseId={cursoId}
        previousHref={previousHref}
        nextHref={nextHref}
        exitHref={`/alumno/cursos/${cursoId}`}
      />

      <SectionNavigation
        courseId={cursoId}
        currentContentId={contenidoId}
        currentContentType={currentContent.type}
        previousHref={previousHref}
        nextHref={nextHref}
      />
    </div>
  );
}