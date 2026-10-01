"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { chatCourses } from "@/data/chat";

type Props = {
  basePath: "alumno" | "docente";
};

export default function ChatCourseList({
  basePath,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return chatCourses.filter((course) =>
      `${course.nombre} ${course.codigo}`
        .toLowerCase()
        .includes(term)
    );
  }, [search]);

  return (
    <main className="min-h-screen bg-[#eef2f8] px-2 py-2 lg:px-3">
      <div className="flex min-h-[calc(100vh-16px)] w-full flex-col overflow-hidden rounded-lg border border-[#d4d9e2] bg-white">

        <div className="border-b border-gray-300 px-5 py-5">
          <h1 className="text-[28px] font-semibold text-[#18407c]">
            Chat
          </h1>

          <p className="mt-2 text-[12px] text-gray-700">
            Comunícate con tus compañeros y docentes.
          </p>

          <div className="mt-3 flex h-9 w-[250px] items-center rounded-md border border-gray-300 px-3">
            <span className="mr-2 text-[#1f61b4]">
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar cursos"
              className="w-full bg-transparent text-[12px] outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/${basePath}/chat/${course.id}`}
              className="flex min-h-[78px] items-center justify-between border-b border-gray-300 px-6 hover:bg-[#f5f8fc]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2f80d8] text-[13px] font-semibold text-white">
                  {course.initials}
                </div>

                <div>
                  <h2 className="text-[14px] font-bold">
                    {course.nombre}
                  </h2>

                  <p className="mt-1 text-[11px] text-gray-600">
                    {course.codigo}
                  </p>
                </div>
              </div>

              <span className="text-[11px]">
                {course.miembros} miembros
              </span>
            </Link>
          ))}

          {!filteredCourses.length && (
            <p className="p-10 text-center text-[12px] text-gray-500">
              No se encontraron cursos.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}