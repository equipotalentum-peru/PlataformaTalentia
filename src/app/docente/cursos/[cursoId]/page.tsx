import { notFound } from "next/navigation";
import TeacherCourseDetail from "@/components/docente/curso/TeacherCourseDetail";

type TeacherCoursePageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function TeacherCoursePage({ params }: TeacherCoursePageProps) {
  const { cursoId } = await params;
  const courseId = Number(cursoId);
  if (!Number.isSafeInteger(courseId) || courseId <= 0) {
    notFound();
  }

  return <TeacherCourseDetail key={cursoId} courseId={courseId} />;
}
