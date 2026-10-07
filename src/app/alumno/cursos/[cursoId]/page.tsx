"use client";

import { use, useState } from "react";
import Link from "next/link";
import CourseModules from "@/components/alumno/CourseModules";
import CourseInfo from "@/components/alumno/CourseInfo";

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
        <div className="relative flex min-h-[180px] items-end overflow-hidden rounded-t-xl bg-[#12395B] p-5">
          {cursoActual?.imagen && (
            <img
              src={cursoActual.imagen}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-black/50" />

          <h1 className="relative min-w-0 break-words text-[24px] font-bold text-white">
            {cursoActual?.nombre ?? "Curso"}
          </h1>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-500 bg-[#eef2f8]">
          <Link
            href={`/alumno/cursos/${courseId}`}
            className="border-b-[3px] border-black px-3 py-2 text-[12px] font-medium"
          >
            Contenido de curso
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/clases`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Clases
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/foro`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Foro
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/anuncios`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Anuncios
          </Link>
        </div>

        {/* CONTENIDO */}
        <div className="flex flex-col gap-5 py-2 lg:flex-row">

          <section className="flex-1">
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
