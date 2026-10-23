"use client";

import { useState } from "react";

type CreateAnnouncementModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    status: "Publicado" | "Borrador";
  }) => Promise<void> | void;
};

export default function CreateAnnouncementModal({
  open,
  onClose,
  onSave,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    if (saving) return;
    setError("");
    onClose();
  };

  const submit = async (selectedStatus: "Publicado" | "Borrador") => {
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
        title: title.trim(),
        content: content.trim(),
        status: selectedStatus,
      });
      setTitle("");
      setContent("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el anuncio."
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
        aria-labelledby="create-announcement-title"
        className="talentia-modal-panel w-full max-w-[560px]"
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <header className="talentia-modal-heading">
          <h2 id="create-announcement-title" className="talentia-modal-title">
            Crear nuevo anuncio
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
              placeholder="Escribe el título del anuncio"
            />
          </label>

          <label className="block">
            <span className="talentia-modal-label">Contenido</span>
            <textarea
              value={content}
              disabled={saving}
              onChange={(event) => setContent(event.target.value)}
              className="talentia-modal-input"
              placeholder="Escribe la información que recibirán los alumnos"
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
            onClick={() => void submit("Borrador")}
            disabled={saving}
            className="talentia-modal-button talentia-modal-button--secondary"
          >
            {saving ? "Guardando…" : "Guardar borrador"}
          </button>
          <button
            type="button"
            onClick={() => void submit("Publicado")}
            disabled={saving}
            className="talentia-modal-button talentia-modal-button--primary"
          >
            {saving ? "Publicando…" : "Publicar anuncio"}
          </button>
        </footer>
      </section>
    </div>
  );
}
