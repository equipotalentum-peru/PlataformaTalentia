"use client";

import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";

type ModuleItem = {
  id: string | number;
  titulo: string;
  orden?: number;
};

type ModuleApi = {
  numero: number;
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
export function useContentBreadcrumb(
  courseId: number,
  contentId: number
) {
  const [breadcrumb, setBreadcrumb] = useState("");

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

        for (const module of (result.modulos ?? []) as ModuleApi[]) {
          const items = [...module.contenidos].sort(
            (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
          );

          const index = items.findIndex(
            (item) => Number(item.id) === contentId
          );

          if (index >= 0) {
            setBreadcrumb(
              `Módulo ${module.numero}: ${module.titulo} > ${module.numero}.${index + 1} ${items[index].titulo}`
            );

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

  return breadcrumb;
}
