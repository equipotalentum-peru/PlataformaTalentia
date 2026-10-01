import { notFound } from "next/navigation";
import { courses } from "@/data/courses";
import TeacherCourseDetail from "@/components/docente/curso/TeacherCourseDetail";

type TeacherCoursePageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function TeacherCoursePage({ params }: TeacherCoursePageProps) {
  const { cursoId } = await params;
  const courseId = Number(cursoId);
  const course = courses.find((item) => item.id === courseId);

  if (!course) {
    notFound();
  }

  return <TeacherCourseDetail course={course} />;
}
