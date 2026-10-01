"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { courses } from "@/data/courses";

import {
  teacherAnnouncements as initialAnnouncements,
  type TeacherAnnouncement,
} from "@/data/teacher-announcements";

import AnnouncementHeader from "@/components/common/anuncios/AnnouncementHeader";
import AnnouncementList from "@/components/common/anuncios/AnnouncementList";

import CreateAnnouncementModal from "@/components/docente/anuncios/CreateAnnouncementModal";
import EditAnnouncementModal from "@/components/docente/anuncios/EditAnnouncementModal";

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
  const [courseId, setCourseId] = useState(1);

  const [announcements, setAnnouncements] =
    useState<TeacherAnnouncement[]>(
      initialAnnouncements
    );

  const [filter, setFilter] =
    useState<Filter>("Todos");

  const [search, setSearch] = useState("");

  const [menuOpen, setMenuOpen] =
    useState<number | null>(null);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<TeacherAnnouncement | null>(null);

  useEffect(() => {
    params.then(({ cursoId }) => {
      setCourseId(Number(cursoId));
    });
  }, [params]);

  const course =
    courses.find((item) => item.id === courseId) ??
    courses[0];

  const filteredAnnouncements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return announcements.filter((announcement) => {
      const matchesSearch =
        !term ||
        `${announcement.title} ${announcement.content}`
          .toLowerCase()
          .includes(term);

      const matchesFilter =
        filter === "Todos" ||
        (filter === "Publicados" &&
          announcement.status === "Publicado") ||
        (filter === "Borradores" &&
          announcement.status === "Borrador") ||
        (filter === "Ocultos" &&
          announcement.status === "Oculto");

      return matchesSearch && matchesFilter;
    });
  }, [announcements, filter, search]);

  const counts = {
    Todos: announcements.length,
    Publicados: announcements.filter(
      (item) => item.status === "Publicado"
    ).length,
    Borradores: announcements.filter(
      (item) => item.status === "Borrador"
    ).length,
    Ocultos: announcements.filter(
      (item) => item.status === "Oculto"
    ).length,
  };

  const createAnnouncement = ({
    title,
    content,
    status,
  }: {
    title: string;
    content: string;
    status: "Publicado" | "Borrador";
  }) => {
    const newAnnouncement: TeacherAnnouncement = {
      id:
        Math.max(
          0,
          ...announcements.map(
            (item) => item.id
          )
        ) + 1,
      title,
      content,
      date: "Hoy",
      read: true,
      status,
      views: 0,
    };

    setAnnouncements((current) => [
      newAnnouncement,
      ...current,
    ]);

    setCreateOpen(false);
  };

  const editAnnouncement = ({
    id,
    title,
    content,
  }: {
    id: number;
    title: string;
    content: string;
  }) => {
    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === id
          ? {
              ...announcement,
              title,
              content,
            }
          : announcement
      )
    );

    setEditingAnnouncement(null);
  };

  const duplicateAnnouncement = (
    announcement: TeacherAnnouncement
  ) => {
    const duplicate: TeacherAnnouncement = {
      ...announcement,
      id:
        Math.max(
          0,
          ...announcements.map(
            (item) => item.id
          )
        ) + 1,
      title: `Copia de ${announcement.title}`,
      status: "Borrador",
      views: 0,
    };

    setAnnouncements((current) => [
      duplicate,
      ...current,
    ]);

    setMenuOpen(null);
  };

  const hideAnnouncement = (
    announcement: TeacherAnnouncement
  ) => {
    setAnnouncements((current) =>
      current.map((item) =>
        item.id === announcement.id
          ? {
              ...item,
              status: "Oculto",
            }
          : item
      )
    );

    setMenuOpen(null);
  };

  const deleteAnnouncement = (
    announcement: TeacherAnnouncement
  ) => {
    setAnnouncements((current) =>
      current.filter(
        (item) => item.id !== announcement.id
      )
    );

    setMenuOpen(null);
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
        <div className="relative h-[150px] overflow-hidden rounded-t-xl">
          <img
            src={course.imagen}
            alt={course.nombre}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <h1 className="absolute bottom-7 left-5 text-[32px] font-bold text-white">
            {course.nombre}
          </h1>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap border-b border-gray-500 bg-[#eef2f8]">

          <Link
            href={`/docente/cursos/${courseId}`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Contenido de curso
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/clases`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Clases
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/foro`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Foro
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/anuncios`}
            className="border-b-[3px] border-black px-3 py-2 text-[11px] font-medium"
          >
            Anuncios
          </Link>

          <Link
            href={`/docente/cursos/${courseId}/asistencia`}
            className="px-3 py-2 text-[11px] text-gray-700 hover:text-black"
          >
            Asistencia
          </Link>
        </div>

        <div className="mt-2 space-y-2">

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

          {filteredAnnouncements.length === 0 && (
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