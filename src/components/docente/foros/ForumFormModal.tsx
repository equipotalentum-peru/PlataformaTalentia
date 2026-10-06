"use client";

import { useState } from "react";
import type { TeacherForumStatus } from "@/data/teacher-forums";

export type ForumFormValues = {
  title: string;
  description: string;
  closeDate: string;
  allowStudentReplies: boolean;
  showRepliesAfterParticipation: boolean;
  status: TeacherForumStatus;
};

type ForumFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<ForumFormValues>;
  onClose: () => void;
  onSubmit: (values: ForumFormValues) => void;
  saving?: boolean;
  error?: string;
};

export default function ForumFormModal({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  saving = false,
  error = "",
}: ForumFormModalProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [closeDate, setCloseDate] = useState(initialValues?.closeDate ?? "");
  const [allowStudentReplies, setAllowStudentReplies] =
    useState(initialValues?.allowStudentReplies ?? true);
  const [
    showRepliesAfterParticipation,
    setShowRepliesAfterParticipation,
  ] = useState(initialValues?.showRepliesAfterParticipation ?? true);

  const [status, setStatus] =
    useState<TeacherForumStatus>(initialValues?.status ?? "Publicado");

  if (!open) {
    return null;
  }

  const handleSubmit = (selectedStatus = status) => {
    if (saving || !title.trim() || !description.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      closeDate,
      allowStudentReplies,
      showRepliesAfterParticipation,
      status: selectedStatus,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={mode === "create" ? "Crear nuevo foro" : "Editar foro"}
        onKeyDown={event => { if (event.key === "Escape" && !saving) onClose(); }}
        className="max-h-[90vh] w-full max-w-[430px] overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">

        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00b8b3]">
              <svg
                className="h-7 w-7 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
              </svg>
            </div>

            <div>
              <h2 className="text-[16px] font-bold text-gray-900">
                {mode === "create"
                  ? "Crear nuevo foro"
                  : "Editar foro"}
              </h2>

              <p className="text-[9px] leading-tight text-gray-600">
                Configura la información y las opciones de
                participación.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[22px] leading-none text-gray-700"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-gray-800">
              Título del foro<span className="text-red-500">*</span>
            </span>

            <input
              value={title}
              autoFocus
              maxLength={200}
              disabled={saving}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-[10px] outline-none focus:border-[#3186d8]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-gray-800">
              Descripción<span className="text-red-500">*</span>
            </span>

            <textarea
              value={description}
              maxLength={10000}
              disabled={saving}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              className="h-[80px] w-full resize-none rounded-md border border-gray-300 p-3 text-[10px] outline-none focus:border-[#3186d8]"
            />
          </label>

          <div>
            <p className="mb-1 text-[10px] font-semibold text-gray-800">
              Configuración del foro
            </p>

            <label className="mb-2 block text-[10px] text-gray-600">
              Fecha de cierre (opcional)
            </label>

            <input
              type="date"
              disabled={saving}
              value={closeDate}
              onChange={(event) =>
                setCloseDate(event.target.value)
              }
              className="h-9 w-full max-w-[185px] rounded-md border border-gray-300 px-3 text-[10px]"
            />

            <label className="mt-3 flex items-center gap-2 text-[10px] text-gray-700">
              <input
                type="checkbox"
                disabled={saving}
                checked={allowStudentReplies}
                onChange={(event) =>
                  setAllowStudentReplies(
                    event.target.checked
                  )
                }
                className="accent-[#3186d8]"
              />

              Permitir respuesta de estudiantes
            </label>

            <label className="mt-2 flex items-center gap-2 text-[10px] text-gray-700">
              <input
                type="checkbox"
                disabled={saving}
                checked={showRepliesAfterParticipation}
                onChange={(event) =>
                  setShowRepliesAfterParticipation(
                    event.target.checked
                  )
                }
                className="accent-[#3186d8]"
              />

              Mostrar respuestas solo si el estudiante participó
            </label>
          </div>

          {(
            <div>
              <p className="mb-1 text-[10px] font-semibold text-gray-800">
                Estado
              </p>

              <div className="flex gap-5">
                {(["Borrador", "Publicado", ...(mode === "edit" ? ["Cerrado", "Oculto"] : [])] as TeacherForumStatus[]).map(
                  (item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 text-[10px] text-gray-700"
                    >
                      <input
                        type="radio"
                        disabled={saving}
                        name="forum-status"
                        checked={status === item}
                        onChange={() =>
                          setStatus(item)
                        }
                      />

                      {item}
                    </label>
                  )
                )}
              </div>
            </div>
          )}

        </div>

        {error && <p role="alert" className="mt-3 text-[11px] text-red-600">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md bg-[#e8eef5] px-4 py-2 text-[10px] font-semibold text-[#3186d8]"
          >
            Cancelar
          </button>

          {mode === "create" && (
            <button
              type="button"
              disabled={saving || !title.trim() || !description.trim()}
              onClick={() => handleSubmit("Borrador")}
              className="rounded-md bg-[#dbeefa] px-4 py-2 text-[10px] font-semibold text-[#3186d8]"
            >
              Guardar borrador
            </button>
          )}

          <button
            type="button"
            disabled={saving || !title.trim() || !description.trim()}
            onClick={() => handleSubmit()}
            className="rounded-md bg-[#00b8b3] px-4 py-2 text-[10px] font-semibold text-white"
          >
            {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : status === "Borrador" ? "Guardar borrador" : "Publicar foro"}
          </button>
        </div>
      </div>
    </div>
  );
}
