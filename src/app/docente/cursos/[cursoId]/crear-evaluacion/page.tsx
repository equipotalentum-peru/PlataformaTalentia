"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CreateEvaluation from "@/components/docente/curso/CreateEvaluation";
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

export default function CreateEvaluationPage({
  params,
}: PageProps) {
  const { cursoId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("moduleId") ?? undefined;
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
              "No se pudo cargar la información del curso."
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
      <main className="p-8 text-center text-sm text-gray-500">
        Cargando curso...
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen px-4 py-5 lg:px-6">
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error || "No se encontró el curso o no tienes acceso a él."}
        </p>
      </main>
    );
  }

  return <CreateEvaluation course={course} moduleId={moduleId} />;
}