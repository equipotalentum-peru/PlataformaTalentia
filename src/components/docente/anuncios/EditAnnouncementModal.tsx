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
    if (!announcement || !open) return;
    setTitle(announcement.title ?? "");
    setContent(announcement.content ?? "");
    setError("");
  }, [announcement, open]);

  if (!open || !announcement) return null;

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
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo editar el anuncio."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-announcement-title"
        className="talentia-modal-panel w-full max-w-[560px]"
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <header className="talentia-modal-heading">
          <h2 id="edit-announcement-title" className="talentia-modal-title">
            Editar anuncio
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="talentia-modal-close"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="talentia-modal-form-grid">
          <label className="block">
            <span className="talentia-modal-label">Título</span>
            <input
              type="text"
              value={title}
              maxLength={200}
              disabled={saving}
              onChange={(event) => setTitle(event.target.value)}
              className="talentia-modal-input"
            />
          </label>

          <label className="block">
            <span className="talentia-modal-label">Contenido</span>
            <textarea
              value={content}
              disabled={saving}
              onChange={(event) => setContent(event.target.value)}
              className="talentia-modal-input"
            />
          </label>

          {error && (
            <p role="alert" className="talentia-modal-error">
              {error}
            </p>
          )}
        </div>

        <footer className="talentia-modal-actions">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="talentia-modal-button talentia-modal-button--secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="talentia-modal-button talentia-modal-button--primary"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </footer>
      </section>
    </div>
  );
}
