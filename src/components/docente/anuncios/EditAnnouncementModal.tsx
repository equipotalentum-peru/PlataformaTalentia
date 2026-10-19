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
  }) => Promise<void> | void;
};

export default function EditAnnouncementModal({
  open,
  announcement,
  onClose,
  onSave,
}: EditAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!announcement) {
      return;
    }

    setTitle(announcement.title);
    setContent(announcement.content);
    setError("");
  }, [announcement]);

  if (!open || !announcement) {
    return null;
  }

  const close = () => {
    if (saving) return;
    setError("");
    onClose();
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("El título y el contenido son obligatorios.");
      return;
    }

    if (title.trim().length > 200) {
      setError("El título no puede superar los 200 caracteres.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({
        id: announcement.id,
        title: title.trim(),
        content: content.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo editar el anuncio."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-xl bg-talentia-surface px-6 py-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-talentia-primary">
            Editar anuncio:
          </h2>

          <button
            type="button"
            onClick={close}
            className="text-[22px] leading-none text-talentia-muted hover:text-talentia-primary"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-talentia-blue">
              Título:
            </span>

            <input
              value={title}
              maxLength={200}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="h-9 w-full rounded-md bg-talentia-surface px-3 text-[10px] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-talentia-blue">
              Contenido:
            </span>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              className="h-[150px] w-full resize-none rounded-md bg-talentia-surface p-3 text-[10px] outline-none"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-3 py-2 text-[10px] text-talentia-danger"
            >
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="rounded-md bg-talentia-surface px-5 py-2 text-[10px] font-medium text-talentia-primary disabled:opacity-60 border border-talentia-border"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="rounded-md bg-talentia-action px-5 py-2 text-[10px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
