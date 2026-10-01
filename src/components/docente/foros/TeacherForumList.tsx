"use client";

import { useMemo, useState } from "react";

import ForumHeader from "@/components/common/forum/ForumHeader";
import ForumList from "@/components/common/forum/ForumList";

import ForumFormModal from "./ForumFormModal";

import {
  teacherForums as initialForums,
  type TeacherForum,
  type TeacherForumStatus,
} from "@/data/teacher-forums";

type TeacherForumListProps = {
  courseId: number;
};

type Filter =
  | "Todos"
  | "Publicados"
  | "Borradores"
  | "Cerrados";

export default function TeacherForumList({
  courseId,
}: TeacherForumListProps) {
  const [forums, setForums] =
    useState<TeacherForum[]>(initialForums);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<Filter>("Todos");

  const [menuOpen, setMenuOpen] = useState<string | null>(
    null
  );

  const [createOpen, setCreateOpen] = useState(false);

  const [editForum, setEditForum] =
    useState<TeacherForum | null>(null);

  const filteredForums = useMemo(() => {
    return forums.filter((forum) => {
      const matchesSearch =
        `${forum.title} ${forum.description}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "Todos" ||
        (filter === "Publicados" &&
          forum.status === "Publicado") ||
        (filter === "Borradores" &&
          forum.status === "Borrador") ||
        (filter === "Cerrados" &&
          forum.status === "Cerrado");

      return matchesSearch && matchesFilter;
    });
  }, [forums, search, filter]);

  const counts = {
    Todos: forums.length,
    Publicados: forums.filter(
      (forum) => forum.status === "Publicado"
    ).length,
    Borradores: forums.filter(
      (forum) => forum.status === "Borrador"
    ).length,
    Cerrados: forums.filter(
      (forum) => forum.status === "Cerrado"
    ).length,
  };

  const handleCreate = (values: {
    title: string;
    description: string;
    closeDate: string;
    allowStudentReplies: boolean;
    showRepliesAfterParticipation: boolean;
    status: TeacherForumStatus;
  }) => {
    const id = `foro-${Date.now()}`;

    const newForum: TeacherForum = {
      id,
      title: values.title,
      description: values.description,
      author: "Gloria Rocha",
      initials: "GR",
      repliesCount: 0,
      date: "Hoy",
      time: "Ahora",
      replies: [],
      status: values.status,
      closeDate: values.closeDate,
      allowStudentReplies:
        values.allowStudentReplies,
      showRepliesAfterParticipation:
        values.showRepliesAfterParticipation,
      views: 0,
    };

    setForums((current) => [newForum, ...current]);
    setCreateOpen(false);
  };

  const handleEdit = (values: {
    title: string;
    description: string;
    closeDate: string;
    allowStudentReplies: boolean;
    showRepliesAfterParticipation: boolean;
    status: TeacherForumStatus;
  }) => {
    if (!editForum) {
      return;
    }

    setForums((current) =>
      current.map((forum) =>
        forum.id === editForum.id
          ? {
              ...forum,
              title: values.title,
              description: values.description,
              closeDate: values.closeDate,
              allowStudentReplies:
                values.allowStudentReplies,
              showRepliesAfterParticipation:
                values.showRepliesAfterParticipation,
              status: values.status,
            }
          : forum
      )
    );

    setEditForum(null);
  };

  const handleDuplicate = (forum: TeacherForum) => {
    const duplicate: TeacherForum = {
      ...forum,
      id: `foro-${Date.now()}`,
      title: `Copia de ${forum.title}`,
      repliesCount: 0,
      replies: [],
      status: "Borrador",
      views: 0,
    };

    setForums((current) => [
      duplicate,
      ...current,
    ]);

    setMenuOpen(null);
  };

  const handleHide = (forum: TeacherForum) => {
    setForums((current) =>
      current.map((item) =>
        item.id === forum.id
          ? {
              ...item,
              status: "Borrador",
            }
          : item
      )
    );

    setMenuOpen(null);
  };

  const handleDelete = (forum: TeacherForum) => {
    setForums((current) =>
      current.filter((item) => item.id !== forum.id)
    );

    setMenuOpen(null);
  };

  return (
    <>
      <ForumHeader
        search={search}
        onSearchChange={setSearch}
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#3186d8] px-4 text-[10px] font-semibold text-white"
          >
            <span className="text-[16px] leading-none">
              +
            </span>
            Crear Foro
          </button>
        }
      />

      {/* FILTROS */}
      <div className="my-2 flex flex-wrap gap-2">
        {(
          [
            "Todos",
            "Publicados",
            "Borradores",
            "Cerrados",
          ] as Filter[]
        ).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-1.5 text-[10px] font-medium ${
              filter === item
                ? "bg-[#00b8b3] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {item} ({counts[item]})
          </button>
        ))}
      </div>

      {/* LISTA */}
      <ForumList
        forums={filteredForums}
        courseId={courseId}
        basePath="docente"
        renderMeta={(forum) => (
          <div className="hidden text-right text-[10px] text-gray-600 md:block">
            <div className="font-medium">
              💬 {forum.repliesCount} respuestas
            </div>

            <div className="mt-1">
              {forum.status === "Publicado"
                ? `${forum.date}, ${forum.time}`
                : forum.status}
            </div>
          </div>
        )}
        renderActions={(forum) => (
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setMenuOpen((current) =>
                  current === forum.id
                    ? null
                    : forum.id
                )
              }
              className="flex h-8 w-7 items-center justify-center rounded-md text-[#3186d8] hover:bg-[#eef5fc]"
              aria-label="Acciones del foro"
            >
              ⋮
            </button>

            {menuOpen === forum.id && (
              <div className="absolute right-0 top-9 z-30 w-[125px] overflow-hidden rounded-md border border-gray-700 bg-white shadow-lg">

                <button
                  type="button"
                  onClick={() => {
                    setEditForum(forum);
                    setMenuOpen(null);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-gray-800 hover:bg-gray-100"
                >
                  Editar
                  <span>✎</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDuplicate(forum)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-gray-800 hover:bg-gray-100"
                >
                  Duplicar
                  <span>□</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleHide(forum)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-gray-800 hover:bg-gray-100"
                >
                  Ocultar
                  <span>◉</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(forum)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-red-500 hover:bg-red-50"
                >
                  Eliminar
                  <span>🗑</span>
                </button>
              </div>
            )}
          </div>
        )}
      />

      {filteredForums.length === 0 && (
        <div className="rounded-xl bg-white px-5 py-10 text-center text-[11px] text-gray-500">
          No hay foros que coincidan con la búsqueda.
        </div>
      )}

      <ForumFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ForumFormModal
        open={Boolean(editForum)}
        mode="edit"
        initialValues={
          editForum
            ? {
                title: editForum.title,
                description: editForum.description,
                closeDate:
                  editForum.closeDate ?? "",
                allowStudentReplies:
                  editForum.allowStudentReplies,
                showRepliesAfterParticipation:
                  editForum.showRepliesAfterParticipation,
                status: editForum.status,
              }
            : undefined
        }
        onClose={() => setEditForum(null)}
        onSubmit={handleEdit}
      />
    </>
  );
}