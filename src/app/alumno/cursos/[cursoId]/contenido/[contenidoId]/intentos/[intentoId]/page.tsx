import StudentEvaluationAttemptReview from "@/components/alumno/evaluaciones/StudentEvaluationAttemptReview";

type PageProps = {
  params: Promise<{
    cursoId: string;
    contenidoId: string;
    intentoId: string;
  }>;
};

export default async function StudentEvaluationAttemptPage({ params }: PageProps) {
  const { cursoId, contenidoId, intentoId } = await params;
  const courseId = Number(cursoId);
  const contentId = Number(contenidoId);
  const attemptId = Number(intentoId);

  if (
    !Number.isSafeInteger(courseId) || courseId <= 0 ||
    !Number.isSafeInteger(contentId) || contentId <= 0 ||
    !Number.isSafeInteger(attemptId) || attemptId <= 0
  ) {
    return <main className="p-8"><p role="alert">El identificador del intento no es válido.</p></main>;
  }

  return (
    <div className="min-h-screen px-4 py-4 lg:px-5">
      <div className="mx-auto max-w-[1180px]">
        <StudentEvaluationAttemptReview
          courseId={courseId}
          contentId={contentId}
          attemptId={attemptId}
        />
      </div>
    </div>
  );
}
