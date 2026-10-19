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
          className="mb-3 flex w-fit items-center gap-2 text-[12px] font-medium text-gray-700 transition hover:text-[#3186d8]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>

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