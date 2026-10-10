"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

export type CourseSummary = {
  nombre: string;
  imagen: string | null;
};

/*
 * Caché en memoria: al cambiar entre Contenido / Clases / Foro / Anuncios /
 * Asistencia el banner ya conoce el nombre del curso y no parpadea.
 */
const cache = new Map<number, CourseSummary>();

export function rememberCourseSummary(
  courseId: number,
  summary: { nombre?: string | null; imagen?: string | null }
) {
  const nombre = summary.nombre?.trim();

  if (!courseId || !nombre) return;

  cache.set(courseId, {
    nombre,
    imagen: summary.imagen ?? null,
  });
}

/*
 * Devuelve el nombre/imagen del curso. Si todavía no están en caché y
 * `enabled` es true, los consulta con el mismo endpoint de solo lectura que
 * ya usan las vistas de módulos (GET /cursos/:id/modulos), válido para
 * alumno y docente. Con `enabled` en false solo lee la caché.
 */
export function useCourseSummary(
  courseId: number,
  enabled = true
): CourseSummary | null {
  const [loaded, setLoaded] = useState<{
    id: number;
    summary: CourseSummary;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !courseId || cache.has(courseId)) return;

    const controller = new AbortController();

    async function cargar() {
      try {
        const response = await fetch(
          `${API_URL}/cursos/${courseId}/modulos`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.curso?.nombre) return;

        rememberCourseSummary(courseId, data.curso);

        const summary = cache.get(courseId);

        if (summary && !controller.signal.aborted) {
          setLoaded({ id: courseId, summary });
        }
      } catch {
        /* El banner simplemente queda sin título si falla la red. */
      }
    }

    void cargar();

    return () => controller.abort();
  }, [courseId, enabled]);

  if (loaded?.id === courseId) return loaded.summary;

  return cache.get(courseId) ?? null;
}
