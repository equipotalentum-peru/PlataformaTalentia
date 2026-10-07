"use client";

import Link from "next/link";
import { useEffect, useState, } from "react";
import { API_URL } from "@/lib/api";
import CourseContentIcon from "@/components/common/contenido/CourseContentIcon";
import type { ContentType, } from "@/data/courseContents";
import { getViewedContentIds, } from "@/lib/progress";

const MODULE_COLOR = "#70A9DC";

const tiposIcono: Record<
  string,
  ContentType
> = {
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

  const [codigoCurso, setCodigoCurso] =
    useState("");

  /*
   * IDs de contenidos que el alumno
   * ya completó.
   */
  const [contenidosVistos, setContenidosVistos] =
    useState<Set<number>>(
      () =>
        getViewedContentIds(courseId)
    );

  /*
   * ======================================================
   * CARGAR MÓDULOS DESDE POSTGRESQL
   * ======================================================
   */

  useEffect(() => {
    const controller =
      new AbortController();

    async function cargarModulos() {
      try {
        setCargando(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/cursos/${courseId}/modulos`,
            {
              method: "GET",
              credentials: "include",
              signal:
                controller.signal,
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

        onCursoLoaded?.(
          data.curso
        );

        setCodigoCurso(
          data.curso.codigo
        );

        setModulos(
          Array.isArray(
            data.modulos
          )
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
  }, [
    courseId,
    onCursoLoaded,
  ]);

  /*
   * ======================================================
   * ESCUCHAR CAMBIOS DE PROGRESO
   * ======================================================
   *
   * markContentViewed() dispara:
   *
   * talentia-progress-updated
   *
   * Entonces la lista se vuelve a pintar
   * inmediatamente.
   */

  useEffect(() => {
    const actualizarProgreso =
      () => {
        setContenidosVistos(
          new Set(
            getViewedContentIds(
              courseId
            )
          )
        );
      };

    window.addEventListener(
      "talentia-progress-updated",
      actualizarProgreso
    );

    /*
     * También recuperamos el progreso
     * al montar el componente.
     */
    actualizarProgreso();

    return () => {
      window.removeEventListener(
        "talentia-progress-updated",
        actualizarProgreso
      );
    };
  }, [courseId]);

  /*
   * ======================================================
   * CURSO INVÁLIDO
   * ======================================================
   */

  if (
    !Number.isInteger(courseId) ||
    courseId <= 0
  ) {
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

  /*
   * ======================================================
   * RENDER
   * ======================================================
   */

  return (
    <div className="space-y-2">
      {modulos.map(
        (modulo) => {
          const contenidos =
            modulo.contenidos ??
            [];

          /*
           * Un módulo se considera
           * completado cuando TODOS
           * sus contenidos están vistos.
           */
          const totalContenidos = contenidos.length;
          const contenidosCompletados = contenidos.filter((contenido) => contenidosVistos.has(Number(contenido.id))).length;
          const moduloCompletado = totalContenidos > 0 && contenidosCompletados === totalContenidos;

          const progresoModulo = totalContenidos > 0 ? contenidosCompletados / totalContenidos : 0;

          return (
            <details
              key={modulo.id}
              className="group"
            >
              <summary
                className="
                  flex
                  cursor-pointer
                  list-none
                  items-center
                  gap-3
                  rounded-lg
                  px-3 py-2.5
                  focus-visible:outline-2
                  focus-visible:outline-[#12395B]
                  [&::-webkit-details-marker]:hidden
                "
                style={{
                  backgroundColor:
                    MODULE_COLOR,
                }}
              >

                {/* MARCADOR DE PROGRESO DEL MÓDULO */}
                <span className="relative flex h-6 w-6 shrink-0 items-center justify-center"
                  aria-label={
                    moduloCompletado
                      ? "Módulo completado"
                      : `${contenidosCompletados} de ${totalContenidos} contenidos completados`
                  }
                >
                  {moduloCompletado ? (
                    /*
                    * MÓDULO COMPLETADO
                    *
                    * Círculo blanco
                    * Check azul del módulo
                    */
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={MODULE_COLOR} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l4 4L19 6" />
                      </svg>
                    </span>
                  ) : (
                    /*
                    * MÓDULO EN PROGRESO
                    *
                    * Base azul = mismo azul del módulo
                    * Progreso = sector blanco
                    */
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      {/* Círculo base: mismo azul del módulo */}
                      <circle cx="12" cy="12" r="10" fill={MODULE_COLOR}/>

                      {/* Sector blanco del progreso */}
                      {progresoModulo > 0 && (
                        <path
                          d={(() => {
                            const porcentaje =
                              progresoModulo;

                            const angulo =
                              porcentaje * 360;

                            const radio = 10;

                            const centroX = 12;
                            const centroY = 12;

                            const anguloInicial =
                              -Math.PI / 2;

                            const anguloFinal =
                              anguloInicial +
                              (angulo * Math.PI) / 180;

                            const x1 = centroX + radio * Math.cos(anguloInicial);
                            const y1 = centroY + radio * Math.sin(anguloInicial);
                            const x2 = centroX + radio * Math.cos(anguloFinal);
                            const y2 = centroY + radio * Math.sin(anguloFinal);
                            const largeArcFlag = angulo > 180 ? 1 : 0;

                            return `
                              M ${centroX} ${centroY}
                              L ${x1} ${y1}
                              A ${radio} ${radio}
                                0 ${largeArcFlag} 1
                                ${x2} ${y2}
                              Z
                            `;
                          })()}
                          fill="white"
                        />
                      )}

                      {/* Borde azul del mismo color del módulo */}
                      <circle cx="12" cy="12" r="10" fill="none" stroke={MODULE_COLOR} strokeWidth="1.5"/>
                    </svg>
                  )}
                </span>

                {/* NOMBRE DEL MÓDULO */}
                <span className="min-w-0 flex-1 break-words text-[14px] font-semibold text-[#12395B]">
                  Módulo{" "}
                  {modulo.numero}:{" "}
                  {modulo.titulo}
                </span>

                {/* FLECHA */}
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

                {contenidos.map(
                  (contenido) => {
                    const contenidoId =
                      Number(
                        contenido.id
                      );

                    const visto =
                      contenidosVistos.has(
                        contenidoId
                      );

                    /*
                     * Material que puede
                     * abrirse desde la vista
                     * de contenido.
                     *
                     * Actividades siempre
                     * pueden abrirse.
                     *
                     * Los demás materiales
                     * requieren archivo o
                     * enlace.
                     */
                    const esActividad =
                      contenido.tipo ===
                      "actividad";

                    const esEvaluacion =
                      contenido.tipo ===
                      "evaluacion";

                    const tieneArchivo =
                      Boolean(
                        contenido.rutaArchivo
                      );

                    const tieneEnlace =
                      Boolean(
                        contenido.urlEnlace
                      );

                    const puedeAbrirse =
                      esActividad ||
                      esEvaluacion ||
                      tieneArchivo ||
                      tieneEnlace;

                    return (
                      <li
                        key={
                          contenido.id
                        }
                        className="
                          flex
                          items-center
                          gap-3
                          py-3
                          text-[14px]
                          text-[#12395B]
                        "
                      >

                        {/* ICONO DE TIPO */}
                        <span
                          className="
                            flex
                            h-6 w-6
                            shrink-0
                            items-center
                            justify-center
                          "
                          title={contenido.tipo.toUpperCase()}
                          aria-label={`Tipo: ${contenido.tipo}`}
                        >
                          <CourseContentIcon
                            type={
                              tiposIcono[
                                contenido.tipo
                              ] ??
                              "pdf"
                            }
                            className="h-5 w-5"
                          />
                        </span>

                        {/* TITULO */}
                        {puedeAbrirse ? (
                          <Link
                            href={`/alumno/cursos/${courseId}/contenido/${contenido.id}?material=1`}
                            className="
                              min-w-0
                              flex-1
                              break-words
                              hover:underline
                              focus-visible:underline
                            "
                          >
                            {
                              contenido.titulo
                            }
                          </Link>
                        ) : (
                          <span className="min-w-0 flex-1 break-words">
                            {
                              contenido.titulo
                            }
                          </span>
                        )}

                        {/* CHECK DEL CONTENIDO */}
                        {visto ? (
                          <span
                            className="
                              flex
                              h-5 w-5
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-[#3186d8]
                              text-white
                            "
                            title="Contenido completado"
                            aria-label="Contenido completado"
                          >
                            <svg
                              className="h-3 w-3"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12l4 4L19 6" />
                            </svg>
                          </span>
                        ) : (
                          <span
                            className="
                              h-5 w-5
                              shrink-0
                              rounded-full
                              border-2
                              border-[#3186d8]
                            "
                            title="Contenido pendiente"
                            aria-label="Contenido pendiente"
                          />
                        )}
                      </li>
                    );
                  }
                )}

                {!contenidos.length && (
                  <li className="py-3 text-sm text-gray-500">
                    Este módulo todavía no tiene contenidos.
                  </li>
                )}

              </ul>
            </details>
          );
        }
      )}
    </div>
  );
}