import { notFound } from "next/navigation";
import ForumCourse from "@/components/common/foros/ForumCourse";

export default async function TeacherForumPage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params;
  const courseId = Number(cursoId);
  if (!Number.isSafeInteger(courseId) || courseId <= 0) notFound();
  return <ForumCourse key={cursoId} courseId={courseId} role="docente" />;
}
