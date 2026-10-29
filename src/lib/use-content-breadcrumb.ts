"use client";

import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";

type ModuleItem = {
  id: string | number;
  titulo: string;
  tipo: string;
  orden?: number;
};

type ModuleApi = {
  numero: number;
  orden?: number;
  titulo: string;
  contenidos: ModuleItem[];
};

/*
 * Devuelve el texto del encabezado con el formato:
 * "Módulo 1: Nombre del módulo > 1.6 Nombre del contenido"
 *
 * Sirve para actividades (docente y alumno) igual que
 * para los materiales, así todo se ve con la misma sintaxis.
 */
export function useContentContext(
  courseId: number,
  contentId: number
) {
  const [context, setContext] = useState<{
    courseId: number;
    contentId: number;
    breadcrumb: string;
    previous?: ModuleItem;
    next?: ModuleItem;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `${API_URL}/cursos/${courseId}/modulos`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return;
        }

        const modules = [...(result.modulos ?? []) as ModuleApi[]].sort(
          (a, b) => (a.orden ?? a.numero) - (b.orden ?? b.numero)
        );
        const navigation = modules.flatMap((courseModule) =>
          [...courseModule.contenidos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        ).filter((item) => item.tipo !== "enlace");
        const currentIndex = navigation.findIndex((item) => Number(item.id) === contentId);

        for (const courseModule of modules) {
          const items = [...courseModule.contenidos].sort(
            (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
          );

          const index = items.findIndex(
            (item) => Number(item.id) === contentId
          );

          if (index >= 0) {
            if (controller.signal.aborted) return;
            setContext({
              courseId,
              contentId,
              breadcrumb: `Módulo ${courseModule.numero}: ${courseModule.titulo} > ${courseModule.numero}.${index + 1} ${items[index].titulo}`,
              previous: currentIndex > 0 ? navigation[currentIndex - 1] : undefined,
              next: currentIndex >= 0 ? navigation[currentIndex + 1] : undefined,
            });

            return;
          }
        }
      } catch {
        /* si falla, simplemente no se muestra el detalle */
      }
    }

    void load();

    return () => controller.abort();
  }, [courseId, contentId]);

  return context?.courseId === courseId && context.contentId === contentId
    ? context
    : { breadcrumb: "", previous: undefined, next: undefined };
}

export function useContentBreadcrumb(courseId: number, contentId: number) {
  return useContentContext(courseId, contentId).breadcrumb;
}
