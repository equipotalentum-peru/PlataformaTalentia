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
    modalidad: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
  } | null>(null);

  const courseId = Number(cursoId);
  const cursoActual = curso && Number(curso.id) === courseId ? curso : null;

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">

        {/* VOLVER */}
        <Link
          href="/alumno/cursos"
          className="app-back-link mb-3"
        >
          <span aria-hidden="true">{"<"}</span>


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
  courseId={courseId}
  course={cursoActual}
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
