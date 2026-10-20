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

  if (!open) {
    return null;
  }

  const close = () => {
    if (saving) return;
    setError("");
    onClose();
  };

  const submit = async (
    selectedStatus: "Publicado" | "Borrador"
  ) => {
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
      // Si el servidor falla, se lanza el error y NO se borra lo escrito.
      await onSave({
        title: title.trim(),
        content: content.trim(),
        status: selectedStatus,
      });

      setTitle("");
      setContent("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el anuncio."
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
          <h2 className="text-[15px] font-bold text-talentia-primary">
            Crear nuevo anuncio:
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
            <span className="mb-1 block text-[13px] font-semibold text-talentia-blue">
              Título:
            </span>

            <input
              value={title}
              maxLength={200}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="h-9 w-full rounded-md bg-talentia-surface px-3 text-[13px] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-talentia-blue">
              Contenido:
            </span>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              className="h-[120px] w-full resize-none rounded-md bg-talentia-surface p-3 text-[13px] outline-none"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-3 py-2 text-[13px] text-talentia-danger"
            >
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="rounded-md bg-talentia-surface px-4 py-2 text-[13px] font-medium text-talentia-primary disabled:opacity-60 border border-talentia-border"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void submit("Borrador")}
            disabled={saving}
            className="rounded-md bg-talentia-surface px-4 py-2 text-[13px] font-medium text-talentia-primary disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar borrador"}
          </button>

          <button
            type="button"
            onClick={() => void submit("Publicado")}
            disabled={saving}
            className="rounded-md bg-talentia-action px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Publicando..." : "Publicar anuncio"}
          </button>
        </div>
      </div>
    </div>
  );
}
