"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, } from "react";
import type { ChatCourse, } from "@/data/chat";
import { API_URL } from "@/lib/api";

type Props = {
  basePath:
    | "alumno"
    | "docente";
};

export default function ChatCourseList({
  basePath,
}: Props) {
  const [search, setSearch] =
    useState("");

  const [courses, setCourses] =
    useState<ChatCourse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      try {
        const response =
          await fetch(
            `${API_URL}/chat/cursos`,
            {
              credentials:
                "include",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudieron cargar los cursos."
          );
        }

        if (!cancelled) {
          setCourses(
            Array.isArray(
              data.cursos
            )
              ? data.cursos
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los cursos."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void cargar();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCourses =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return courses.filter(
        (course) =>
          `${course.nombre} ${course.codigo}`
            .toLowerCase()
            .includes(term)
      );
    }, [courses, search]);

  return (
    <main className="min-h-screen bg-[#eef2f8] px-2 py-2 lg:px-3">
      <div className="flex min-h-[calc(100vh-16px)] w-full flex-col overflow-hidden rounded-lg border border-[#d4d9e2] bg-white">

        <div className="border-b border-gray-300 px-3 py-4 sm:px-5 sm:py-5">
          <h1 className="text-[24px] font-semibold text-[#18407c] sm:text-[28px]">
            Chat
          </h1>

          <p className="mt-2 text-[12px] text-gray-700">
            Comunícate con tus compañeros y docentes.
          </p>

          <div className="mt-3 flex h-9 w-full items-center sm:w-[250px] rounded-md border border-gray-300 px-3">
            <span className="mr-2 text-[#1f61b4]">
              ⌕
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar cursos"
              className="w-full bg-transparent text-[12px] outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-gray-500">
            Cargando cursos...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[12px] text-red-600">
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {filteredCourses.map(
              (course) => (
                <Link
                  key={course.id}
                  href={`/${basePath}/chat/${course.id}`}
                  className="flex min-h-[78px] items-center justify-between gap-3 border-b border-gray-300 px-3 py-2 hover:bg-[#f5f8fc] sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14 bg-[#2f80d8] text-[13px] font-semibold text-white">
                      {course.initials}
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-[14px] font-bold">
                        {course.nombre}
                      </h2>

                      <p className="mt-1 text-[11px] text-gray-600">
                        {course.codigo}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-right text-[11px]">
                    {course.miembros} miembros
                  </span>
                </Link>
              )
            )}

            {!filteredCourses.length && (
              <p className="p-10 text-center text-[12px] text-gray-500">
                No se encontraron cursos.
              </p>
            )}

          </div>
        )}
      </div>
    </main>
  );
}