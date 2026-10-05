"use client";
import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "@/lib/api";
import CourseContentIcon from "@/components/common/contenido/CourseContentIcon";
import type { ContentType } from "@/data/courseContents";

const MODULE_COLOR = "#70A9DC";

const tiposIcono: Record<string, ContentType> = {
  pdf: "pdf",
  docx: "word",
  pptx: "ppt",
  video: "video",
  enlace: "link",
  actividad: "activity",
  evaluacion: "quiz",
};

type CourseModulesProps = {
  courseId: number;
  onCursoLoaded?: (curso: {
  id: string;
  nombre: string;
  imagen: string | null;
}) => void;
};

type ContenidoCurso = {
  id: string;
  titulo: string;
  tipo: string;
  descripcion: string | null;
  orden: number;
  rutaArchivo: string | null;
  urlEnlace: string | null;
};

type ModuloCurso = {
  id: number;
  numero: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
  contenidos: ContenidoCurso[];
};

export default function CourseModules({
  courseId,
  onCursoLoaded,
}: CourseModulesProps) {
  const [modulos, setModulos] =
    useState<ModuloCurso[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");
  const [codigoCurso, setCodigoCurso] = useState("");

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
        onCursoLoaded?.(data.curso);
        setCodigoCurso(data.curso.codigo);

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
    }

    return () =>
      controller.abort();

  }, [courseId, onCursoLoaded]);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
        Curso no válido.
      </div>
    );
  }

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
      <details key={modulo.id} className="group">
        <summary
          className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-[#12395B] [&::-webkit-details-marker]:hidden"
          style={{ backgroundColor: MODULE_COLOR }}
        >
          <span className="min-w-0 flex-1 break-words text-[14px] font-semibold text-[#12395B]">
            Módulo {modulo.numero}: {modulo.titulo}
          </span>
          <svg
            className="h-5 w-5 shrink-0 text-[#12395B] transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>

        <ul className="mt-1 divide-y divide-gray-200 bg-white px-4">
          {(modulo.contenidos ?? []).map((contenido) => (
            <li
            key={contenido.id}
            className="flex items-center gap-3 py-3 text-[14px] text-[#12395B]"
            >
              <span
              className="flex h-6 w-6 shrink-0 items-center justify-center"
              title={contenido.tipo.toUpperCase()}
              aria-label={`Tipo: ${contenido.tipo}`}
              >
                <CourseContentIcon
                type={tiposIcono[contenido.tipo] ?? "pdf"}
                className="h-5 w-5"/>
                </span>
                {(contenido.rutaArchivo &&
                (contenido.tipo === "pdf" || contenido.tipo === "pptx")) ||
                (codigoCurso === "ESP-002" && modulo.numero === 1 && contenido.tipo === "actividad") ? (
                  <Link
                    href={`/alumno/cursos/${courseId}/contenido/${contenido.id}?material=1`}
                    className="min-w-0 flex-1 break-words hover:underline focus-visible:underline"
                  >
                    {contenido.titulo}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 break-words">
                    {contenido.titulo}
                  </span>
                )}
                  </li>
            
            
          ))}
          {!modulo.contenidos?.length && (
            <li className="py-3 text-sm text-gray-500">
              Este módulo todavía no tiene contenidos.
            </li>
          )}
        </ul>
      </details>
    ))}
  </div>
);
}
