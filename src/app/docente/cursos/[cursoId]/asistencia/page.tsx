"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import TeacherAttendance from "@/components/docente/asistencia/TeacherAttendance";
import type { Course } from "@/data/courses";
import { API_URL } from "@/lib/api";

type PageProps = {
  params: Promise<{ cursoId: string }>;
};

type CursoApi = {
  id: number | string;
  nombre: string;
  codigo: string;
  imagen: string | null;
};

type ModulosResponse = {
  curso?: CursoApi;
  message?: string;
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

export default function TeacherAttendancePage({
  params,
}: PageProps) {
  const { cursoId } = use(params);
  const router = useRouter();
  const courseId = Number(cursoId);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      setError("El identificador del curso no es válido.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadCourse() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/cursos/${courseId}/modulos`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = (await response
          .json()
          .catch(() => ({}))) as ModulosResponse;

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok || !data.curso) {
          throw new Error(
            data.message ??
              "No se pudo cargar la información de este curso."
          );
        }

        setCourse({
          id: Number(data.curso.id),
          nombre: data.curso.nombre,
          codigo: data.curso.codigo,
          imagen: data.curso.imagen || IMAGEN_POR_DEFECTO,
          alumnos: 0,
          actividades: 0,
          evaluaciones: 0,
          progreso: 0,
          accent: "#54d6d8",
        });
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la información del curso."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCourse();

    return () => controller.abort();
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Cargando curso...
      </div>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen px-4 py-5 lg:px-6">
        <Link
          href="/docente/cursos"
          className="text-sm text-[#3186d8] hover:underline"
        >
          ← Volver a cursos
        </Link>

        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error || "No se encontró el curso o no tienes acceso a él."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto w-full max-w-[1200px]">
        <Link
          href="/docente/cursos"
          className="mb-2 flex w-fit items-center gap-2 text-[11px] font-medium text-gray-700 hover:text-[#3186d8]"
        >
          ← Volver a cursos
        </Link>

        <div className="relative h-[150px] overflow-hidden rounded-t-xl bg-[#12395B]">
          <img
            src={course.imagen}
            alt={course.nombre}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/30" />

          <h1 className="absolute bottom-5 left-4 right-4 break-words text-2xl font-bold text-white sm:left-5 sm:text-[31px]">
            {course.nombre} - Asistencia
          </h1>
        </div>

        <nav
          className="flex flex-wrap border-b border-gray-300 bg-[#eef2f8]"
          aria-label="Secciones del curso"
        >
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
            aria-current="page"
            className="border-b-[3px] border-black px-3 py-2 text-[11px] font-medium"
          >
            Asistencia
          </Link>
        </nav>

        <div className="mt-2">
          <TeacherAttendance courseId={courseId} />
        </div>
      </div>
    </main>
  );
}