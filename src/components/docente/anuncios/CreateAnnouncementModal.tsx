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
      <div className="w-full max-w-[460px] rounded-xl bg-white px-6 py-5 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#3186d8]">
            Crear nuevo anuncio:
          </h2>

          <button
            type="button"
            onClick={close}
            className="text-[22px] leading-none text-gray-500 hover:text-black"
            aria-label="Cerrar"
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
              maxLength={200}
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
              className="h-[120px] w-full resize-none rounded-md bg-[#eeeeee] p-3 text-[10px] outline-none"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700"
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
            className="rounded-md bg-[#eeeeee] px-4 py-2 text-[10px] font-medium text-gray-700 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void submit("Borrador")}
            disabled={saving}
            className="rounded-md bg-[#eeeeee] px-4 py-2 text-[10px] font-medium text-gray-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar borrador"}
          </button>

          <button
            type="button"
            onClick={() => void submit("Publicado")}
            disabled={saving}
            className="rounded-md bg-[#3186d8] px-4 py-2 text-[10px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Publicando..." : "Publicar anuncio"}
          </button>
        </div>
      </div>
    </div>
  );
}
