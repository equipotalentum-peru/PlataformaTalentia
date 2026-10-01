"use client";

import { useEffect, useState } from "react";
import type { TeacherAnnouncement } from "@/data/teacher-announcements";

type EditAnnouncementModalProps = {
  open: boolean;
  announcement: TeacherAnnouncement | null;
  onClose: () => void;
  onSave: (data: {
    id: number;
    title: string;
    content: string;
  }) => void;
};

export default function EditAnnouncementModal({
  open,
  announcement,
  onClose,
  onSave,
}: EditAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!announcement) {
      return;
    }

    setTitle(announcement.title);
    setContent(announcement.content);
  }, [announcement]);

  if (!open || !announcement) {
    return null;
  }

  const submit = () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    onSave({
      id: announcement.id,
      title: title.trim(),
      content: content.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-xl bg-white px-6 py-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#3186d8]">
            Editar anuncio:
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-[22px] leading-none text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-[#3186d8]">
              Título:
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="h-9 w-full rounded-md bg-[#eeeeee] px-3 text-[10px] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-[#3186d8]">
              Contenido:
            </span>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              className="h-[150px] w-full resize-none rounded-md bg-[#eeeeee] p-3 text-[10px] outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#eeeeee] px-5 py-2 text-[10px] font-medium text-gray-700"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-[#3186d8] px-5 py-2 text-[10px] font-semibold text-white"
          >
            Publicar anuncio
          </button>
        </div>
      </div>
    </div>
  );
}