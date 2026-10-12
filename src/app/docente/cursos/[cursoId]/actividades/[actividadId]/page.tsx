import TeacherActivityDetail from "@/components/docente/actividades/TeacherActivityDetail";
type PageProps = { params: Promise<{ cursoId: string; actividadId: string }> };
export default async function TeacherActivityPage({ params }: PageProps) {
  const { cursoId, actividadId } = await params;
  const courseId = Number(cursoId), activityIdNumber = Number(actividadId);
  if (![courseId, activityIdNumber].every((id) => Number.isSafeInteger(id) && id > 0)) return <p className="p-8">Parámetros de actividad no válidos.</p>;
  return <TeacherActivityDetail courseId={courseId} activityId={activityIdNumber} />;
}
