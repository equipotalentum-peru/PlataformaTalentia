"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { TeacherAnnouncement } from "@/data/teacher-announcements";
import { API_URL } from "@/lib/api";
import { formatearFechaAnuncio, peticionAnuncios } from "@/lib/anuncios-api";

import AnnouncementHeader from "@/components/common/anuncios/AnnouncementHeader";
import AnnouncementList from "@/components/common/anuncios/AnnouncementList";

import CreateAnnouncementModal from "@/components/docente/anuncios/CreateAnnouncementModal";
import EditAnnouncementModal from "@/components/docente/anuncios/EditAnnouncementModal";

import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";
type PageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

type Filter =
  | "Todos"
  | "Publicados"
  | "Borradores"
  | "Ocultos";

export default function TeacherAnnouncementsPage({
  params,
}: PageProps) {
  const [courseId, setCourseId] = useState(0);
  const [course, setCourse] = useState({ nombre: "", imagen: "" });
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [filter, setFilter] = useState<Filter>("Todos");
  const [search] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<TeacherAnnouncement | null>(null);

  useEffect(() => {
    let activo = true;
    params.then(({ cursoId }) => {
      if (activo) setCourseId(Number(cursoId));
    }).catch(() => {
      if (activo) setLoadError("No se pudo determinar el curso.");
    });
    return () => { activo = false; };
  }, [params]);

  const loadAnnouncements = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await peticionAnuncios<{
        curso: { id: number; nombre: string; imagen: string | null };
        anuncios: Array<{
          id: number; title: string; content: string; date: string;
          status: "Publicado" | "Borrador" | "Oculto"; views: number;
        }>;
      }>(`${API_URL}/cursos/${courseId}/anuncios`);

      setCourse({ nombre: data.curso.nombre, imagen: data.curso.imagen ?? "" });
      setAnnouncements(data.anuncios.map((item) => ({
        id: Number(item.id),
        title: item.title,
        content: item.content,
        date: formatearFechaAnuncio(item.date),
        read: true,
        status: item.status,
        views: Number(item.views) || 0,
      })));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los anuncios.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const filteredAnnouncements = useMemo(() => {
    const term = search.trim().toLowerCase();
    return announcements.filter((announcement) => {
      const matchesSearch = !term || `${announcement.title} ${announcement.content}`.toLowerCase().includes(term);
      const matchesFilter = filter === "Todos"
        || (filter === "Publicados" && announcement.status === "Publicado")
        || (filter === "Borradores" && announcement.status === "Borrador")
        || (filter === "Ocultos" && announcement.status === "Oculto");
      return matchesSearch && matchesFilter;
    });
  }, [announcements, filter, search]);

  const createAnnouncement = async ({ title, content, status }: {
    title: string; content: string; status: "Publicado" | "Borrador";
  }) => {
    setActionError("");
    await peticionAnuncios(`${API_URL}/cursos/${courseId}/anuncios`, {
      method: "POST",
      body: JSON.stringify({ titulo: title, contenido: content, estado: status }),
    });
    setCreateOpen(false);
    await loadAnnouncements();
  };

  const editAnnouncement = async ({ id, title, content }: {
    id: number; title: string; content: string;
  }) => {
    setActionError("");
    await peticionAnuncios(`${API_URL}/anuncios/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ titulo: title, contenido: content }),
    });
    setEditingAnnouncement(null);
    await loadAnnouncements();
  };

  const duplicateAnnouncement = async (announcement: TeacherAnnouncement) => {
    setMenuOpen(null);
    setActionError("");
    try {
      await peticionAnuncios(`${API_URL}/cursos/${courseId}/anuncios`, {
        method: "POST",
        body: JSON.stringify({ titulo: `Copia de ${announcement.title}`, contenido: announcement.content, estado: "Borrador" }),
      });
      await loadAnnouncements();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo duplicar el anuncio.");
    }
  };

  const hideAnnouncement = async (announcement: TeacherAnnouncement) => {
    setMenuOpen(null);
    setActionError("");
    try {
      await peticionAnuncios(`${API_URL}/anuncios/${announcement.id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "Oculto" }),
      });
      await loadAnnouncements();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo ocultar el anuncio.");
    }
  };

  const deleteAnnouncement = async (announcement: TeacherAnnouncement) => {
    setMenuOpen(null);
    if (!window.confirm(`¿Eliminar el anuncio «${announcement.title}»? Esta acción no se puede deshacer.`)) return;
    setActionError("");
    try {
      await peticionAnuncios(`${API_URL}/anuncios/${announcement.id}`, { method: "DELETE" });
      await loadAnnouncements();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo eliminar el anuncio.");
    }
  };

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1100px]">

        {/* VOLVER */}
        <Link
          href="/docente/cursos"
          className="mb-2 flex w-fit items-center gap-2 text-[11px] font-medium text-gray-700 hover:text-[#3186d8]"
        >
          ← Volver a cursos
        </Link>

        {/* BANNER */}
        <CourseHeader
          courseId={courseId}
          nombre={course.nombre}
          imagen={course.imagen}
          fetchIfMissing={false}
        />

        {/* TABS */}
        <CourseTabs role="docente" courseId={courseId} active="anuncios" />

        <div className="mt-2 space-y-2">
          {loadError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
              <span>{loadError}</span>
              <button type="button" onClick={() => void loadAnnouncements()} className="shrink-0 font-semibold underline">Reintentar</button>
            </div>
          )}
          {actionError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
              <span>{actionError}</span>
              <button type="button" onClick={() => setActionError("")} className="font-semibold">×</button>
            </div>
          )}
          {loading && announcements.length === 0 && (
            <div className="rounded-lg bg-white px-4 py-6 text-center text-[11px] text-gray-500">Cargando anuncios...</div>
          )}

          {/* CABECERA */}
          <AnnouncementHeader
            action={
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#3186d8] px-4 text-[10px] font-semibold text-white"
              >
                <span className="text-[16px]">
                  +
                </span>

                Crear Anuncio
              </button>
            }
          />

          {/* FILTROS */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                "Todos",
                "Publicados",
                "Borradores",
                "Ocultos",
              ] as Filter[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-1.5 text-[10px] font-medium ${
                  filter === item
                    ? "bg-[#3186d8] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* LISTA */}
          <AnnouncementList
            announcements={
              filteredAnnouncements
            }
            renderMeta={(announcement) => (
              <div className="hidden items-center gap-1 text-[10px] text-gray-600 md:flex">
                <span>◉</span>
                <span>
                  {announcement.views} vistas
                </span>
              </div>
            )}
            renderAction={(announcement) => (
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen((current) =>
                      current === announcement.id
                        ? null
                        : announcement.id
                    )
                  }
                  className="flex h-8 w-7 items-center justify-center rounded-md text-[#3186d8] hover:bg-[#eef5fc]"
                  aria-label="Acciones del anuncio"
                >
                  ⋮
                </button>

                {menuOpen === announcement.id && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-[40] cursor-default"
                      aria-label="Cerrar menú"
                      onClick={() =>
                        setMenuOpen(null)
                      }
                    />

                    <div className="absolute right-0 top-9 z-[50] w-[125px] overflow-hidden rounded-md border border-gray-700 bg-white shadow-lg">

                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnouncement(
                            announcement
                          );
                          setMenuOpen(null);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-gray-800 hover:bg-gray-100"
                      >
                        Editar
                        <span>✎</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          duplicateAnnouncement(
                            announcement
                          )
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-gray-800 hover:bg-gray-100"
                      >
                        Duplicar
                        <span>□</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          hideAnnouncement(
                            announcement
                          )
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-gray-800 hover:bg-gray-100"
                      >
                        Ocultar
                        <span>◉</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteAnnouncement(
                            announcement
                          )
                        }
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-red-500 hover:bg-red-50"
                      >
                        Eliminar
                        <span>🗑</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          />

          {!loading && !loadError && filteredAnnouncements.length === 0 && (
            <div className="rounded-xl bg-white py-10 text-center text-[11px] text-gray-500">
              No hay anuncios que coincidan con
              la búsqueda.
            </div>
          )}
        </div>
      </div>

      {/* MODALES */}

      <CreateAnnouncementModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={createAnnouncement}
      />

      <EditAnnouncementModal
        open={Boolean(editingAnnouncement)}
        announcement={editingAnnouncement}
        onClose={() =>
          setEditingAnnouncement(null)
        }
        onSave={editAnnouncement}
      />
    </div>
  );
}