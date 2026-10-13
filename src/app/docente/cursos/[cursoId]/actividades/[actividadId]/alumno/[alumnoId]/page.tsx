import TeacherSubmissionReview from "@/components/docente/actividades/TeacherSubmissionReview";

type PageProps = {
  params: Promise<{ cursoId: string; actividadId: string; alumnoId: string }>;
  searchParams: Promise<{ entregaId?: string | string[] }>;
};

export default async function TeacherSubmissionPage({ params, searchParams }: PageProps) {
  const [{ cursoId, actividadId, alumnoId }, query] = await Promise.all([params, searchParams]);
  const courseId = Number(cursoId);
  const activityIdNumber = Number(actividadId);
  const studentId = Number(alumnoId);
  const rawSubmissionId = Array.isArray(query.entregaId) ? query.entregaId[0] : query.entregaId;
  const parsedSubmissionId = rawSubmissionId ? Number(rawSubmissionId) : undefined;
  const initialSubmissionId = parsedSubmissionId != null && Number.isSafeInteger(parsedSubmissionId) && parsedSubmissionId > 0
    ? parsedSubmissionId
    : undefined;

  if (![courseId, activityIdNumber, studentId].every((id) => Number.isSafeInteger(id) && id > 0)) {
    return <p className="p-8">Parámetros de entrega no válidos.</p>;
  }

  return (
    <TeacherSubmissionReview
      courseId={courseId}
      activityId={activityIdNumber}
      studentId={studentId}
      initialSubmissionId={initialSubmissionId}
    />
  );
}
