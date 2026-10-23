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
  const [allowStudentReplies, setAllowStudentReplies] = useState(
    initialValues?.allowStudentReplies ?? true
  );
  const [showRepliesAfterParticipation, setShowRepliesAfterParticipation] =
    useState(initialValues?.showRepliesAfterParticipation ?? true);
  const [status, setStatus] = useState<TeacherForumStatus>(
    initialValues?.status ?? "Publicado"
  );

  if (!open) return null;

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleSubmit = (selectedStatus = status) => {
    if (saving || !title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      closeDate,
      allowStudentReplies,
      showRepliesAfterParticipation,
      status: selectedStatus,
    });
  };

  const availableStatuses: TeacherForumStatus[] =
    mode === "edit"
      ? ["Borrador", "Publicado", "Cerrado", "Oculto"]
      : ["Borrador", "Publicado"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="forum-form-title"
        className="talentia-modal-panel w-full max-w-[560px]"
        onKeyDown={(event) => {
          if (event.key === "Escape") handleClose();
        }}
      >
        <header className="talentia-modal-heading">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-talentia-selected text-talentia-blue">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="forum-form-title" className="talentia-modal-title">
                {mode === "create" ? "Crear nuevo foro" : "Editar foro"}
              </h2>
              <p className="mt-1 text-sm leading-snug text-talentia-muted">
                Configura la información y las opciones de participación.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="talentia-modal-close"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="talentia-modal-form-grid">
          <label className="block">
            <span className="talentia-modal-label">
              Título del foro <span className="text-talentia-danger">*</span>
            </span>
            <input
              type="text"
              value={title}
              autoFocus
              maxLength={200}
              disabled={saving}
              onChange={(event) => setTitle(event.target.value)}
              className="talentia-modal-input"
              placeholder="Escribe el título del foro"
            />
          </label>

          <label className="block">
            <span className="talentia-modal-label">
              Descripción <span className="text-talentia-danger">*</span>
            </span>
            <textarea
              value={description}
              maxLength={10000}
              disabled={saving}
              onChange={(event) => setDescription(event.target.value)}
              className="talentia-modal-input"
              placeholder="Explica el tema y las indicaciones de participación"
            />
          </label>

          <fieldset className="min-w-0">
            <legend className="talentia-modal-label">Configuración del foro</legend>
            <label className="block max-w-[240px]">
              <span className="mb-2 block text-sm text-talentia-primary">Fecha de cierre (opcional)</span>
              <input
                type="date"
                disabled={saving}
                value={closeDate}
                onChange={(event) => setCloseDate(event.target.value)}
                className="talentia-modal-input"
              />
            </label>

            <div className="mt-4 grid gap-3">
              <label className="flex items-start gap-2 text-sm leading-snug text-talentia-primary">
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={allowStudentReplies}
                  onChange={(event) => setAllowStudentReplies(event.target.checked)}
                />
                <span>Permitir respuestas de estudiantes</span>
              </label>
              <label className="flex items-start gap-2 text-sm leading-snug text-talentia-primary">
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={showRepliesAfterParticipation}
                  onChange={(event) => setShowRepliesAfterParticipation(event.target.checked)}
                />
                <span>Mostrar respuestas solo si el estudiante participó</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="talentia-modal-label">Estado</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {availableStatuses.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-talentia-primary">
                  <input
                    type="radio"
                    disabled={saving}
                    name="forum-status"
                    checked={status === item}
                    onChange={() => setStatus(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="talentia-modal-error">
              {error}
            </p>
          )}
        </div>

        <footer className="talentia-modal-actions">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="talentia-modal-button talentia-modal-button--secondary"
          >
            Cancelar
          </button>
          {mode === "create" && (
            <button
              type="button"
              disabled={saving || !title.trim() || !description.trim()}
              onClick={() => handleSubmit("Borrador")}
              className="talentia-modal-button talentia-modal-button--secondary"
            >
              Guardar borrador
            </button>
          )}
          <button
            type="button"
            disabled={saving || !title.trim() || !description.trim()}
            onClick={() => handleSubmit()}
            className="talentia-modal-button talentia-modal-button--primary"
          >
            {saving ? "Guardando…" : mode === "edit" ? "Guardar cambios" : status === "Borrador" ? "Guardar borrador" : "Publicar foro"}
          </button>
        </footer>
      </section>
    </div>
  );
}
