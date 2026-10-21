import TeacherEvaluationAttemptReview from "@/components/docente/evaluaciones/TeacherEvaluationAttemptReview";

type PageProps = {
  params: Promise<{
    cursoId: string;
    evaluacionId: string;
    alumnoId: string;
    intentoId: string;
  }>;
};

export default async function TeacherEvaluationAttemptPage({ params }: PageProps) {
  const { cursoId, evaluacionId, alumnoId, intentoId } = await params;
  const courseId = Number(cursoId);
  const contentId = Number(evaluacionId);
  const studentId = Number(alumnoId);
  const attemptId = Number(intentoId);

  if (
    !Number.isSafeInteger(courseId) || courseId <= 0 ||
    !Number.isSafeInteger(contentId) || contentId <= 0 ||
    !Number.isSafeInteger(studentId) || studentId <= 0 ||
    !Number.isSafeInteger(attemptId) || attemptId <= 0
  ) {
    return <main className="p-8"><p role="alert">Los identificadores del intento no son válidos.</p></main>;
  }

  return (
    <div className="min-h-screen px-4 py-4 lg:px-5">
      <div className="mx-auto max-w-[1180px]">
        <TeacherEvaluationAttemptReview
          courseId={courseId}
          contentId={contentId}
          studentId={studentId}
          attemptId={attemptId}
        />
      </div>
    </div>
  );
}
