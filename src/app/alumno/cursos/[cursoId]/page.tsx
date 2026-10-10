"use client";

import { use, useState } from "react";
import Link from "next/link";
import CourseModules from "@/components/alumno/CourseModules";
import CourseInfo from "@/components/alumno/CourseInfo";

import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
type CourseDetailPageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { cursoId } = use(params);
  const [curso, setCurso] = useState<{
    id: string;
    nombre: string;
    imagen: string | null;
    progreso: number;
  } | null>(null);

  const courseId = Number(cursoId);
  const cursoActual = curso && Number(curso.id) === courseId ? curso : null;

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">

        {/* VOLVER */}
        <Link
          href="/alumno/cursos"
          className="mb-3 flex w-fit items-center gap-2 text-[12px] font-medium text-gray-700 transition hover:text-[#3186d8]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>

          Volver a cursos
        </Link>

        {/* BANNER */}
        <CourseHeader
          courseId={courseId}
          nombre={cursoActual?.nombre}
          imagen={cursoActual?.imagen}
          fetchIfMissing={false}
        />

        {/* TABS */}
        <CourseTabs role="alumno" courseId={courseId} active="contenido" />

        {/* CONTENIDO */}
        <div className="flex flex-col gap-5 py-2 xl:flex-row">

          <section className="min-w-0 flex-1">
            <CourseModules courseId={courseId} onCursoLoaded={setCurso} />
          </section>

          <CourseInfo
  progress={
    Number(
      cursoActual?.progreso ?? 0
    )
  }
/>

        </div>
      </div>
    </div>
  );
}
