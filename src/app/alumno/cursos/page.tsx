"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";

type CursoAlumno = {
  id: number;
  nombre: string;
  codigo: string;
  imagen: string | null;
  progreso: number;
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80";

export default function MisCursosPage() {
  const router = useRouter();

  const [cursos, setCursos] = useState<CursoAlumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarCursos() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(
          `${API_URL}/cursos/mis-cursos`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudieron cargar tus cursos."
          );
        }

        setCursos(
          Array.isArray(data.cursos)
            ? data.cursos
            : []
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar tus cursos."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarCursos();

    return () => controller.abort();
  }, [router]);

  return (
    <div className="min-h-screen px-[52px] py-[33px]">
      <header className="mb-[31px]">
        <h1 className="text-[29px] font-semibold tracking-[-0.7px] text-gray-900">
          Mis cursos
        </h1>
      </header>

      {cargando ? (
        <section className="flex min-h-[180px] max-w-[980px] items-center justify-center">
          <p className="text-[14px] text-gray-500">
            Cargando tus cursos...
          </p>
        </section>
      ) : error ? (
        <section className="max-w-[980px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </section>
      ) : cursos.length === 0 ? (
        <section className="flex min-h-[180px] max-w-[980px] items-center justify-center rounded-lg bg-white shadow-sm">
          <p className="text-[14px] text-gray-500">
            No tienes cursos matriculados actualmente.
          </p>
        </section>
      ) : (
        <section className="grid max-w-[980px] grid-cols-1 gap-[18px] md:grid-cols-2">
          {cursos.map((curso) => {
            const imagen =
              curso.imagen || IMAGEN_POR_DEFECTO;

            const progreso = Math.min(
              100,
              Math.max(
                0,
                Number(curso.progreso) || 0
              )
            );

            return (
              <button
                key={curso.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/alumno/cursos/${curso.id}`
                  )
                }
                className="group relative block h-[164px] overflow-hidden rounded-[13px] bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={imagen}
                  alt={curso.nombre}
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-[16px]">
                  <div className="mb-[9px] flex items-center justify-between gap-4">
                    <h2 className="line-clamp-2 text-[16px] font-semibold leading-tight text-white">
                      {curso.nombre}
                    </h2>

                    <span className="shrink-0 text-[14px] font-medium text-white">
                      {progreso}% completado
                    </span>
                  </div>

                  <div className="h-[17px] overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#2c8ee8]"
                      style={{
                        width: `${progreso}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
