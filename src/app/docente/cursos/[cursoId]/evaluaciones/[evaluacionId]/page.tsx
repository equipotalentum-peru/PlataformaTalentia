import { notFound } from "next/navigation";
import TeacherEvaluationViewer from "@/components/docente/evaluaciones/TeacherEvaluationViewer";
import { courses } from "@/data/courses";
import { quizzes } from "@/data/quizzes";
import { courseContents, } from "@/data/courseContents";
import { getTeacherContentHref, } from "@/lib/teacher-content-navigation";

type PageProps = {
  params: Promise<{
    cursoId: string;
    evaluacionId: string;
  }>;
};

export default async function TeacherEvaluationPage({
  params,
}: PageProps) {
  const { cursoId, evaluacionId } = await params;

  const courseId = Number(cursoId);
  const evaluationId = Number(evaluacionId);

  const course = courses.find(
    (item) => item.id === courseId
  );

  const quiz = quizzes.find(
    (item) => item.id === evaluationId
  );

  if (!course || !quiz) {
    notFound();
  }

  const currentContent = courseContents.find(
    (content) =>
      content.courseId === courseId &&
      content.id === evaluationId &&
      content.type === "quiz"
  );

  if (!currentContent) {
    notFound();
  }

  const contents = courseContents
    .filter((content) => content.courseId === courseId)
    .sort((a, b) => a.id - b.id);

  const currentIndex = contents.findIndex(
    (content) => content.id === currentContent.id
  );

  const previousContent =
    currentIndex > 0
      ? contents[currentIndex - 1]
      : null;

  const nextContent =
    currentIndex >= 0 &&
    currentIndex < contents.length - 1
      ? contents[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen px-3 py-4 lg:px-5">
      <div className="mx-auto max-w-[1080px]">

        {/* BARRA SUPERIOR */}
        <div className="mb-3 flex items-center gap-3">
          <a
            href={`/docente/cursos/${courseId}`}
            className="rounded-md bg-[#3186d8] px-3 py-1.5 text-[10px] font-medium text-white"
          >
            ← Volver
          </a>

          <span className="truncate text-[11px] text-gray-700">
            Módulo 1: Introducción a las TIC &gt;{" "}
            {quiz.title}
          </span>
        </div>

        <TeacherEvaluationViewer
          quizId={evaluationId}
          courseId={courseId}
          editHref={`/docente/cursos/${courseId}/crear-evaluacion?evaluacionId=${evaluationId}`}
          exitHref={`/docente/cursos/${courseId}`}
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

      </div>
    </div>
  );
}