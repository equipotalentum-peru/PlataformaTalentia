import { notFound } from "next/navigation";
import ForumCourse from "@/components/common/foros/ForumCourse";

export default async function ForumDetailPage({ params }: { params: Promise<{ cursoId: string; foroId: string }> }) {
  const { cursoId, foroId } = await params;
  const courseId = Number(cursoId);
  if (!Number.isSafeInteger(courseId) || courseId <= 0 || !/^\d+$/.test(foroId)) notFound();
  return <ForumCourse key={`${cursoId}-${foroId}`} courseId={courseId} role="alumno" forumId={foroId} />;
}
