"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, } from "react";
import type { ChatCourse, } from "@/data/chat";
import { API_URL } from "@/lib/api";
import { resolverImagenPortadaCurso } from "@/lib/curso-imagen";
import ChatAvatar from "./ChatAvatar";

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
    <main className="min-h-screen bg-talentia-surface px-2 py-2 lg:px-3">
      <div className="flex min-h-[calc(100vh-16px)] w-full flex-col overflow-hidden rounded-lg border border-talentia-border bg-talentia-surface">

        <div className="border-b border-talentia-border px-3 py-4 sm:px-5 sm:py-5">
          <h1 className="student-page-title teacher-page-title text-[24px] font-semibold text-talentia-primary sm:text-[28px]">
            Chat
          </h1>

          <p className="mt-2 text-[13px] text-talentia-primary">
            Comunícate con tus compañeros y docentes.
          </p>

          <div className="mt-3 flex h-9 w-full items-center sm:w-[250px] rounded-md border border-talentia-border px-3">
            <span className="mr-2 text-talentia-blue">
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
              className="w-full bg-transparent text-[13px] outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-talentia-muted">
            Cargando cursos...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[13px] text-talentia-danger">
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {filteredCourses.map(
              (course) => (
                <Link
                  key={course.id}
                  href={`/${basePath}/chat/${course.id}`}
                  className="flex min-h-[78px] items-center justify-between gap-3 border-b border-talentia-border px-3 py-2 hover:bg-talentia-hover sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <ChatAvatar
                      src={
                        course.imagen
                          ? resolverImagenPortadaCurso(course.imagen, course.id, "")
                          : null
                      }
                      initials={course.initials}
                      name={course.nombre}
                      className="h-11 w-11 bg-talentia-blue text-[13px] sm:h-14 sm:w-14"
                    />

                    <div className="min-w-0">
                      <h2 className="break-words text-[15px] font-bold">
                        {course.nombre}
                      </h2>

                      <p className="mt-1 text-[13px] text-talentia-primary">
                        {course.codigo}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-right text-[13px]">
                    {course.miembros} miembros
                  </span>
                </Link>
              )
            )}

            {!filteredCourses.length && (
              <p className="p-10 text-center text-[13px] text-talentia-muted">
                No se encontraron cursos.
              </p>
            )}

          </div>
        )}
      </div>
    </main>
  );
}
