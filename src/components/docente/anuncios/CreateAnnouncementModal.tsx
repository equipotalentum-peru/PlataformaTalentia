"use client";

import { useState } from "react";

type CreateAnnouncementModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    status: "Publicado" | "Borrador";
  }) => void;
};

export default function CreateAnnouncementModal({
  open,
  onClose,
  onSave,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] =
    useState<"Publicado" | "Borrador">("Publicado");

  if (!open) {
    return null;
  }

  const submit = (
    selectedStatus: "Publicado" | "Borrador"
  ) => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      status: selectedStatus,
    });

    setTitle("");
    setContent("");
    setStatus("Publicado");
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
            Crear nuevo anuncio:
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
              className="h-[95px] w-full resize-none rounded-md bg-[#eeeeee] p-3 text-[10px] outline-none"
            />
          </label>

          <div>
            <p className="mb-2 text-[10px] font-semibold text-[#3186d8]">
              Estado:
            </p>

            <div className="flex gap-8">
              <label className="flex items-center gap-2 text-[10px]">
                <input
                  type="radio"
                  name="announcement-status"
                  checked={status === "Borrador"}
                  onChange={() =>
                    setStatus("Borrador")
                  }
                />
                Borrador
              </label>

              <label className="flex items-center gap-2 text-[10px]">
                <input
                  type="radio"
                  name="announcement-status"
                  checked={status === "Publicado"}
                  onChange={() =>
                    setStatus("Publicado")
                  }
                />
                Publicado
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#eeeeee] px-4 py-2 text-[10px] font-medium text-gray-700"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => submit("Borrador")}
            className="rounded-md bg-[#eeeeee] px-4 py-2 text-[10px] font-medium text-gray-700"
          >
            Guardar borrador
          </button>

          <button
            type="button"
            onClick={() => submit("Publicado")}
            className="rounded-md bg-[#3186d8] px-4 py-2 text-[10px] font-semibold text-white"
          >
            Publicar anuncio
          </button>
        </div>
      </div>
    </div>
  );
}