"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { forums } from "@/data/forums";

import ForumHeader from "@/components/common/forum/ForumHeader";
import ForumList from "@/components/common/forum/ForumList";

type ForumPageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default function ForumPage({
  params,
}: ForumPageProps) {
  const [courseId, setCourseId] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    params.then(({ cursoId }) => {
      setCourseId(Number(cursoId));
    });
  }, [params]);

  const filteredForums = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return forums;
    }

    return forums.filter((forum) =>
      `${forum.title} ${forum.description}`
        .toLowerCase()
        .includes(term)
    );
  }, [search]);

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">

        {/* VOLVER */}
        <Link
          href="/alumno/cursos"
          className="mb-2 flex w-fit items-center gap-2 text-[11px] font-medium text-gray-700 hover:text-[#3186d8]"
        >
          ← Volver a cursos
        </Link>

        {/* BANNER */}
        <div className="relative h-[150px] overflow-hidden rounded-t-xl">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
            alt="Herramientas TIC"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <h1 className="absolute bottom-7 left-5 text-[32px] font-bold text-white">
            Herramientas TIC
          </h1>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-500 bg-[#eef2f8]">
          <Link
            href={`/alumno/cursos/${courseId}`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Contenido de curso
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/clases`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Clases
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/foro`}
            className="border-b-[3px] border-black px-3 py-2 text-[11px] font-medium"
          >
            Foro
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/anuncios`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Anuncios
          </Link>
        </div>

        <div className="mt-2 space-y-2">

          {/* CABECERA COMÚN */}
          <ForumHeader
            search={search}
            onSearchChange={setSearch}
          />

          {/* FILTROS */}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full bg-[#3186d8] px-4 py-1.5 text-[10px] font-medium text-white"
            >
              Todos
            </button>

            <button
              type="button"
              className="rounded-full bg-white px-4 py-1.5 text-[10px] font-medium text-gray-700"
            >
              Sin responder
            </button>

            <button
              type="button"
              className="rounded-full bg-white px-4 py-1.5 text-[10px] font-medium text-gray-700"
            >
              Respondidos
            </button>
          </div>

          {/* LISTA */}
          <ForumList
            forums={filteredForums}
            courseId={courseId}
            basePath="alumno"
            renderMeta={(forum) => (
              <div className="shrink-0 text-right text-[11px] text-gray-700">
                <div className="flex items-center gap-1 font-medium">
                  💬 {forum.repliesCount} respuestas
                </div>

                <p className="mt-1 text-[10px] text-gray-600">
                  {forum.date}, {forum.time}
                </p>
              </div>
            )}
          />

          {filteredForums.length === 0 && (
            <div className="rounded-xl bg-white px-5 py-10 text-center text-[11px] text-gray-500">
              No se encontraron foros.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}