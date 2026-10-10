import Link from "next/link";
import { notFound } from "next/navigation";

import TeacherAttendance from "@/components/docente/asistencia/TeacherAttendance";
import { courses } from "@/data/courses";

import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
type PageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function TeacherAttendancePage({
  params,
}: PageProps) {
  const { cursoId } = await params;

  const courseId = Number(cursoId);

  const course = courses.find(
    (item) => item.id === courseId
  );

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto w-full">

        {/* VOLVER */}
        <Link
          href="/docente/cursos"
          className="mb-2 flex w-fit items-center gap-2 text-[11px] font-medium text-gray-700 hover:text-[#3186d8]"
        >
          ← Volver a cursos
        </Link>

        {/* BANNER */}
        <CourseHeader courseId={courseId} />

        {/* TABS */}
        <CourseTabs role="docente" courseId={courseId} active="asistencia" />

        <div className="mt-2">
          <TeacherAttendance courseId={courseId} />
        </div>

      </div>
    </div>
  );
}