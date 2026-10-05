"use client";

import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "@/lib/api";

const MODULE_COLOR = "#70A9DC";

type CourseModulesProps = {
  courseId: number;
};

type ModuloCurso = {
  id: number;
  numero: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
};

export default function CourseModules({
  courseId,
}: CourseModulesProps) {
  const [modulos, setModulos] =
    useState<ModuloCurso[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function cargarModulos() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(
          `${API_URL}/cursos/${courseId}/modulos`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudieron cargar los módulos."
          );
        }

        setModulos(
          Array.isArray(data.modulos)
            ? data.modulos
            : []
        );
      } catch (error) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los módulos."
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setCargando(false);
        }
      }
    }

    if (
      Number.isInteger(courseId) &&
      courseId > 0
    ) {
      void cargarModulos();
    } else {
      setError(
        "Curso no válido."
      );

      setCargando(false);
    }

    return () =>
      controller.abort();

  }, [courseId]);

  if (cargando) {
    return (
      <div className="rounded-lg bg-white px-4 py-5 text-center text-[13px] text-gray-500">
        Cargando módulos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
        {error}
      </div>
    );
  }

  if (modulos.length === 0) {
    return (
      <div className="rounded-lg bg-white px-4 py-5 text-center text-[13px] text-gray-500">
        Este curso todavía no tiene módulos publicados.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {modulos.map((modulo) => (
        <div
          key={modulo.id}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5"
          style={{
            backgroundColor:
              MODULE_COLOR,
          }}
        >
          <div className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-white" />

          <span className="flex-1 text-[14px] font-semibold text-[#12395B]">
            Módulo {modulo.numero}:{" "}
            {modulo.titulo}
          </span>

          <svg
            className="h-5 w-5 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      ))}
    </div>
  );
}