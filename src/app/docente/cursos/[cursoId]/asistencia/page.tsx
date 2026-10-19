import Link from "next/link";
import { notFound } from "next/navigation";

import TeacherAttendance from "@/components/docente/asistencia/TeacherAttendance";


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

  if (
  !Number.isSafeInteger(
    courseId
  ) ||
  courseId <= 0
) {
  notFound();
}

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto w-full">

        {/* VOLVER */}
        <Link
          href="/docente/cursos"
          className="app-back-link mb-3"
        >
          <span aria-hidden="true">{"<"}</span>


          Volver a cursos
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