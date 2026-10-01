import Link from "next/link";
import { notFound } from "next/navigation";

import TeacherAttendance from "@/components/docente/asistencia/TeacherAttendance";
import { courses } from "@/data/courses";

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
        <div className="relative h-[150px] overflow-hidden rounded-t-xl">
          <img
            src={course.imagen}
            alt={course.nombre}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <h1 className="absolute bottom-7 left-5 text-[31px] font-bold text-white">
            {course.nombre} - Asistencia
          </h1>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap border-b border-gray-500 bg-[#eef2f8]">

          <Link
            href={`/docente/cursos/${courseId}`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Contenido de curso
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/clases`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Clases
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/foro`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Foro
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/anuncios`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Anuncios
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/asistencia`}
            className="border-b-[3px] border-black px-3 py-2 text-[11px] font-medium"
          >
            Asistencia
          </Link>

        </div>

        <div className="mt-2">
          <TeacherAttendance courseId={courseId} />
        </div>

      </div>
    </div>
  );
}