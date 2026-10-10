"use client";

import { useEffect, useMemo, useState, } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import type { ClassSession, } from "@/data/classes";
import { obtenerClasesAlumno, } from "@/lib/clases-api";

import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
type ClassesPageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default function ClassesPage({
  params,
}: ClassesPageProps) {
  const router = useRouter();

  const [courseId, setCourseId] =
    useState<number | null>(null);

  const [clases, setClases] =
    useState<ClassSession[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    params.then(({ cursoId }) => {
      const id = Number(cursoId);

      if (
        !Number.isSafeInteger(id) ||
        id <= 0
      ) {
        setError("Curso no válido.");
        setLoading(false);
        return;
      }

      setCourseId(id);

      obtenerClasesAlumno(id)
        .then((data) => {
          setClases(
            Array.isArray(data.clases)
              ? data.clases
              : []
          );
        })
        .catch((err) => {
          if (
            err instanceof Error
          ) {
            setError(err.message);
          } else {
            setError(
              "No se pudieron cargar las clases."
            );
          }
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [params]);

  const proximaClase = clases.find(
    (clase) =>
      clase.estado === "En curso"
  ) ??
  clases.find(
    (clase) =>
      clase.estado === "Próxima"
  ) ??
  clases.find(
    (clase) =>
      clase.estado === "Programada"
  );

  if (loading) {
    return (
      <div className="p-10 text-center">
        Cargando clases...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  const handleJoin = async (
    clase: ClassSession
  ) => {
    if (!courseId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/clases/alumno/${courseId}/${clase.id}/unirse`,
        {
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "No se pudo abrir la reunión."
        );
      }

      window.open(
        data.joinUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleRecording = async (
    clase: ClassSession
  ) => {
    if (!courseId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/clases/alumno/${courseId}/${clase.id}/grabaciones`,
        {
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "No se pudo obtener la grabación."
        );
      }

      const grabacion =
        data.grabaciones?.[0];

      if (!grabacion?.url) {
        throw new Error(
          "No hay grabaciones disponibles."
        );
      }

      window.open(
        grabacion.url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">

        {/* VOLVER */}
        <Link
          href="/alumno/cursos"
          className="mb-3 flex w-fit items-center gap-2 text-[12px] font-medium text-gray-700 transition hover:text-[#3186d8]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>

          Volver a cursos
        </Link>

        {/* BANNER */}
        <CourseHeader courseId={courseId ?? 0} />

        {/* TABS */}
        <CourseTabs role="alumno" courseId={courseId ?? 0} active="clases" />

        {/* PRÓXIMA CLASE */}
        {proximaClase && (
          <section className="mt-2 rounded-xl bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2588db] text-white">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="17"
                      rx="2"
                    />
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <path d="M3 9h18" />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase text-gray-500">
                    {proximaClase.estado === "En curso"
                      ? "Clase en curso"
                      : "Próxima clase"}
                  </p>

                  <h2 className="text-[17px] font-bold text-gray-900">
                    Sesión {proximaClase.numero}:{" "}
                    {proximaClase.tema}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="17"
                          rx="2"
                        />
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <path d="M3 9h18" />
                      </svg>

                      {proximaClase.fecha}
                    </span>

                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>

                      {proximaClase.horario}
                    </span>

                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="7" r="3" />
                        <path d="M5 21c.8-4.2 3.1-6.5 7-6.5s6.2 2.3 7 6.5" />
                      </svg>

                      Prof. Gloria Rocha
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${API_URL}/clases/alumno/${courseId}/${proximaClase.id}/unirse`,
                      {
                        credentials: "include",
                      }
                    );

                    const data =
                      await response.json();

                    if (!response.ok) {
                      throw new Error(
                        data.message ??
                          "No se pudo abrir la reunión."
                      );
                    }

                    window.open(
                      data.joinUrl,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error(error);
                  }
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#3186d8] px-5 text-[12px] font-medium text-white transition hover:bg-[#2777c1]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="3"
                    y="7"
                    width="18"
                    height="12"
                    rx="2"
                  />
                  <path d="M8 7l1.5-3h5L16 7" />
                  <circle cx="12" cy="13" r="3" />
                </svg>

                Unirse por Zoom
              </button>

            </div>
          </section>
        )}

        {/* TODAS LAS CLASES */}
        <section className="mt-3 rounded-xl bg-white shadow-sm">

          <div className="px-4 pt-3">
            <h2 className="text-[14px] font-bold text-gray-900">
              Todas las clases
            </h2>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-y border-gray-200 bg-[#f8fafc]">
                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Sesión
                  </th>

                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Tema
                  </th>

                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Fecha y Hora
                  </th>

                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Estado
                  </th>

                  <th className="px-4 py-2.5 text-right font-semibold text-gray-800">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {clases.map((clase) => {
                  const finalizada =
                    clase.estado === "Finalizada";

                  const proxima =
                    clase.estado === "Próxima";

                  return (
                    <tr
                      key={clase.id}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 text-gray-700">
                        {clase.numero}
                      </td>

                      <td className="px-4 py-2.5 text-gray-700">
                        {clase.tema}
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-700">
                          {clase.fecha}
                        </div>

                        <div className="text-[10px] text-gray-400">
                          {clase.horario}
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-medium ${
                            clase.estado === "Finalizada"
                              ? "bg-[#cef1d2] text-[#27a844]"
                              : clase.estado === "En curso"
                                ? "bg-[#ffe6a3] text-[#c58a00]"
                                : clase.estado === "Cancelada"
                                  ? "bg-[#f7c7c7] text-[#c44242]"
                                  : "bg-[#77c3fb] text-[#2479c5]"
                          }`}
                        >
                          {clase.estado}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-right">
                        {finalizada && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleRecording(clase)
                            }
                            className="inline-flex h-8 min-w-[125px] items-center justify-center gap-2 rounded-md bg-[#3186d8] px-4 text-[10px] font-medium text-white transition hover:bg-[#2777c1]"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="7"
                                width="18"
                                height="12"
                                rx="2"
                              />
                              <path d="M8 7l1.5-3h5L16 7" />
                              <circle
                                cx="12"
                                cy="13"
                                r="3"
                              />
                            </svg>

                            Ver grabación
                          </button>
                        )}

                        {clase.estado === "En curso" && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleJoin(clase)
                            }
                            className="inline-flex h-8 min-w-[125px] items-center justify-center gap-2 rounded-md bg-[#3186d8] px-4 text-[10px] font-medium text-white transition hover:bg-[#2777c1]"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="7"
                                width="18"
                                height="12"
                                rx="2"
                              />
                              <path d="M8 7l1.5-3h5L16 7" />
                              <circle
                                cx="12"
                                cy="13"
                                r="3"
                              />
                            </svg>

                            Unirse por Zoom
                          </button>
                        )}

                        {clase.estado === "Próxima" && (
                          <button
                            type="button"
                            disabled
                            className="inline-flex h-8 min-w-[125px] cursor-not-allowed items-center justify-center gap-2 rounded-md bg-gray-300 px-4 text-[10px] font-medium text-gray-500"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="7"
                                width="18"
                                height="12"
                                rx="2"
                              />
                              <path d="M8 7l1.5-3h5L16 7" />
                              <circle
                                cx="12"
                                cy="13"
                                r="3"
                              />
                            </svg>

                            Unirse por Zoom
                          </button>
                        )}

                        {clase.estado === "Programada" && (
                          <button
                            type="button"
                            disabled
                            className="inline-flex h-8 min-w-[125px] cursor-not-allowed items-center justify-center gap-2 rounded-md bg-gray-300 px-4 text-[10px] font-medium text-gray-500"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="7"
                                width="18"
                                height="12"
                                rx="2"
                              />
                              <path d="M8 7l1.5-3h5L16 7" />
                              <circle
                                cx="12"
                                cy="13"
                                r="3"
                              />
                            </svg>

                            Unirse por Zoom
                          </button>
                        )}

                        {clase.estado === "Cancelada" && (
                          <span className="text-gray-400">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}