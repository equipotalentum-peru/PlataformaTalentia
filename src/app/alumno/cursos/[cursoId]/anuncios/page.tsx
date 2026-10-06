"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Announcement } from "@/data/announcements";
import { API_URL } from "@/lib/api";
import { formatearFechaAnuncio, peticionAnuncios } from "@/lib/anuncios-api";

type AnnouncementsPageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

type Filter = "Todos" | "Leídos" | "No leídos";

export default function AnnouncementsPage({
  params,
}: AnnouncementsPageProps) {
  const [courseId, setCourseId] = useState<number>(0);
  const [course, setCourse] = useState({ nombre: "", imagen: "" });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filter, setFilter] = useState<Filter>("Todos");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    params.then(({ cursoId }) => {
      if (activo) setCourseId(Number(cursoId));
    }).catch(() => {
      if (activo) setError("No se pudo determinar el curso.");
    });
    return () => { activo = false; };
  }, [params]);

  useEffect(() => {
    if (!courseId) return;
    const controller = new AbortController();

    async function cargarAnuncios() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/cursos/${courseId}/anuncios`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof data.message === "string" ? data.message : "No se pudieron cargar los anuncios.");
        }
        setCourse({ nombre: data.curso.nombre, imagen: data.curso.imagen ?? "" });
        setAnnouncements((Array.isArray(data.anuncios) ? data.anuncios : []).map((item: {
          id: number; title: string; content: string; date: string; read: boolean;
        }) => ({
          id: Number(item.id),
          title: item.title,
          date: formatearFechaAnuncio(item.date),
          content: item.content,
          read: Boolean(item.read),
        })));
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los anuncios.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void cargarAnuncios();
    return () => controller.abort();
  }, [courseId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedAnnouncement(null);
    };
    if (selectedAnnouncement) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedAnnouncement]);

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filter === "Leídos") return announcement.read;
    if (filter === "No leídos") return !announcement.read;
    return true;
  });

  const openAnnouncement = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    if (announcement.read) return;

    try {
      await peticionAnuncios(`${API_URL}/anuncios/${announcement.id}/lectura`, {
        method: "POST",
      });
      setAnnouncements((current) => current.map((item) => item.id === announcement.id ? { ...item, read: true } : item));
      setSelectedAnnouncement((current) => current?.id === announcement.id ? { ...current, read: true } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la lectura.");
    }
  };

  return (
    <>
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
          <div className="relative h-[150px] overflow-hidden rounded-t-xl">
            <img
              src={course.imagen || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"}
              alt={course.nombre || "Curso"}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/20" />

            <h1 className="absolute bottom-7 left-5 text-[32px] font-bold text-white">
              {course.nombre || "Anuncios del curso"}
            </h1>
          </div>

          {/* TABS */}
          <div className="flex overflow-x-auto border-b border-gray-500 bg-[#eef2f8]">
            <Link
              href={`/alumno/cursos/${courseId}`}
              className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-700 hover:text-black"
            >
              Contenido de curso
            </Link>

            <Link
              href={`/alumno/cursos/${courseId}/clases`}
              className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-700 hover:text-black"
            >
              Clases
            </Link>

            <Link
              href={`/alumno/cursos/${courseId}/foro`}
              className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-700 hover:text-black"
            >
              Foro
            </Link>

            <Link
              href={`/alumno/cursos/${courseId}/anuncios`}
              className="whitespace-nowrap border-b-[3px] border-black px-3 py-2 text-[12px] font-medium"
            >
              Anuncios
            </Link>
          </div>

          {/* CABECERA */}
          <section className="mt-2 rounded-xl bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">

              {/* ICONO */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#3186d8]">
                <svg
                  className="h-8 w-8 text-black"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 10v4h3l7 4V6l-7 4H4Z" />
                  <path d="M17 9c1.5 1.7 1.5 4.3 0 6" />
                  <path d="M19.5 6.5c3.5 3.2 3.5 7.8 0 11" />
                </svg>
              </div>

              <div>
                <h2 className="text-[14px] font-bold text-gray-900">
                  Anuncios
                </h2>

                <p className="mt-1 text-[11px] leading-snug text-gray-500">
                  Mantente al día con las novedades, recordatorios o
                  comunicados hechos por el docente del curso.
                </p>
              </div>
            </div>
          </section>

          {error && (
            <div role="alert" className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
              <span>{error}</span>
              <button type="button" onClick={() => window.location.reload()} className="shrink-0 font-semibold underline">Reintentar</button>
            </div>
          )}
          {loading && announcements.length === 0 && (
            <div className="mt-2 rounded-lg bg-white px-4 py-6 text-center text-[11px] text-gray-500">Cargando anuncios...</div>
          )}

          {/* FILTROS */}
          <div className="my-2 flex gap-2">
            {(["Todos", "Leídos", "No leídos"] as Filter[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-medium transition ${
                    filter === item
                      ? "bg-[#3186d8] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {/* LISTA */}
          <div className="flex flex-col gap-2">
            {filteredAnnouncements.map(
              (announcement) => (
                <article
                  key={announcement.id}
                  className={`rounded-lg bg-white px-5 py-3 shadow-sm ${
                    !announcement.read
                      ? "border-l-4 border-[#3186d8]"
                      : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    {/* CONTENIDO */}
                    <div className="flex min-w-0 items-center gap-4">

                      {/* ICONO */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3186d8]">
                        <svg
                          className="h-7 w-7 text-black"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 10v4h3l7 4V6l-7 4H4Z" />
                          <path d="M17 9c1.5 1.7 1.5 4.3 0 6" />
                          <path d="M19.5 6.5c3.5 3.2 3.5 7.8 0 11" />
                        </svg>
                      </div>

                      <div className="min-w-0">

                        <h3 className="text-[14px] font-bold text-gray-900">
                          {announcement.title}
                        </h3>

                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {announcement.date}
                        </p>

                        {/* 2 LÍNEAS + ... */}
                        <p className="mt-1 line-clamp-2 max-w-[620px] text-[11px] leading-snug text-gray-700">
                          {announcement.content}
                        </p>
                      </div>
                    </div>

                    {/* BOTÓN */}
                    <div className="flex shrink-0 justify-end md:pl-4">
                      <button
                        type="button"
                        onClick={() =>
                          openAnnouncement(announcement)
                        }
                        className="flex items-center gap-2 rounded-md bg-[#3186d8] px-4 py-1.5 text-[10px] font-medium text-white transition hover:bg-[#2777c1]"
                      >
                        Ver detalles

                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>

                  </div>
                </article>
              )
            )}
          </div>

          {/* SIN RESULTADOS */}
          {!loading && !error && filteredAnnouncements.length === 0 && (
            <div className="rounded-xl bg-white py-10 text-center text-[12px] text-gray-500">
              No hay anuncios en esta categoría.
            </div>
          )}

        </div>
      </div>

      {/* MODAL */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAnnouncement(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-title"
            className="relative w-full max-w-[650px] overflow-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* CABECERA MODAL */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">

              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3186d8]">
                  <svg
                    className="h-6 w-6 text-black"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 10v4h3l7 4V6l-7 4H4Z" />
                    <path d="M17 9c1.5 1.7 1.5 4.3 0 6" />
                  </svg>
                </div>

                <div>
                  <h2
                    id="announcement-title"
                    className="text-[16px] font-bold text-gray-900"
                  >
                    {selectedAnnouncement.title}
                  </h2>

                  <p className="mt-1 text-[10px] text-gray-400">
                    {selectedAnnouncement.date}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Cerrar anuncio"
                onClick={() =>
                  setSelectedAnnouncement(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* CONTENIDO MODAL */}
            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-gray-700">
                {selectedAnnouncement.content}
              </p>
            </div>

            {/* PIE */}
            <div className="flex justify-end border-t border-gray-200 px-6 py-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedAnnouncement(null)
                }
                className="rounded-md bg-[#3186d8] px-5 py-2 text-[11px] font-medium text-white transition hover:bg-[#2777c1]"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}