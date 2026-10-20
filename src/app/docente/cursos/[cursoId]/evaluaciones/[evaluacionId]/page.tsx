import TeacherEvaluationViewer from "@/components/docente/evaluaciones/TeacherEvaluationViewer";

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
  const contentId = Number(evaluacionId);

  if (
    !Number.isSafeInteger(courseId) ||
    courseId <= 0 ||
    !Number.isSafeInteger(contentId) ||
    contentId <= 0
  ) {
    return (
      <main className="p-8">
        <p role="alert">El identificador de la evaluación no es válido.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 lg:px-5">
      <div className="mx-auto max-w-[1080px]">
        <TeacherEvaluationViewer
          courseId={courseId}
          contentId={contentId}
          exitHref={`/docente/cursos/${courseId}`}
        />
      </div>
    </div>
  );
}
