import TeacherSubmissionReview from "@/components/docente/actividades/TeacherSubmissionReview";
type PageProps = { params: Promise<{ cursoId: string; actividadId: string; alumnoId: string }> };
export default async function TeacherSubmissionPage({ params }: PageProps) {
  const { cursoId, actividadId, alumnoId } = await params;
  const courseId = Number(cursoId), activityIdNumber = Number(actividadId), studentId = Number(alumnoId);
  if (![courseId, activityIdNumber, studentId].every((id) => Number.isSafeInteger(id) && id > 0)) return <p className="p-8">Parámetros de entrega no válidos.</p>;
  return <TeacherSubmissionReview courseId={courseId} activityId={activityIdNumber} studentId={studentId} />;
}
