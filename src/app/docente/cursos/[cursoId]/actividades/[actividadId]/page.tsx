import { notFound } from "next/navigation";

import TeacherActivityDetail from "@/components/docente/actividades/TeacherActivityDetail";

import { activities } from "@/data/activities";
import { courses } from "@/data/courses";
import { courseContents } from "@/data/courseContents";

import {
  getTeacherContentHref,
  isExternalLink,
} from "@/lib/teacher-content-navigation";

type PageProps = {
  params: Promise<{
    cursoId: string;
    actividadId: string;
  }>;
};

export default async function TeacherActivityPage({
  params,
}: PageProps) {
  const { cursoId, actividadId } = await params;

  const courseId = Number(cursoId);
  const activityId = Number(actividadId);

  const course = courses.find(
    (item) => item.id === courseId
  );

  const activity = activities.find(
    (item) => item.id === activityId
  );

  if (!course || !activity) {
    notFound();
  }

  /*
   * =========================================================
   * CONTENIDO ACTUAL
   * =========================================================
   */

  const currentContent = courseContents.find(
    (content) =>
      content.courseId === courseId &&
      content.id === activityId &&
      content.type === "activity"
  );

  if (!currentContent) {
    notFound();
  }

  /*
   * =========================================================
   * CONTENIDOS NAVEGABLES
   *
   * CORRECCIÓN:
   *
   * Excluimos los enlaces externos.
   *
   * De esta manera YouTube no aparecerá como:
   *
   * Actividad → Anterior → YouTube
   *
   * sino:
   *
   * Actividad → Anterior → Documento anterior
   * =========================================================
   */

  const contents = courseContents
    .filter(
      (content) =>
        content.courseId === courseId &&
        !isExternalLink(content)
    )
    .sort((a, b) => {
      if (a.moduleId !== b.moduleId) {
        return a.moduleId - b.moduleId;
      }

      return a.order - b.order;
    });

  /*
   * =========================================================
   * POSICIÓN ACTUAL
   * =========================================================
   */

  const currentIndex = contents.findIndex(
    (content) =>
      content.id === currentContent.id
  );

  /*
   * =========================================================
   * CONTENIDO ANTERIOR
   * =========================================================
   */

  const previousContent =
    currentIndex > 0
      ? contents[currentIndex - 1]
      : null;

  /*
   * =========================================================
   * CONTENIDO SIGUIENTE
   * =========================================================
   */

  const nextContent =
    currentIndex >= 0 &&
    currentIndex < contents.length - 1
      ? contents[currentIndex + 1]
      : null;

  return (
    <TeacherActivityDetail
      courseId={courseId}
      activityId={activityId}
      previousSectionHref={
        previousContent
          ? getTeacherContentHref(
              courseId,
              previousContent
            )
          : undefined
      }
      nextSectionHref={
        nextContent
          ? getTeacherContentHref(
              courseId,
              nextContent
            )
          : undefined
      }
    />
  );
}