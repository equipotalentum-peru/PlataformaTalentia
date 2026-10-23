"use client";

import { useEffect, useState } from "react";
import type { ClassSession } from "@/data/classes";

type ClassFormData = {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};

type EditClassModalProps = {
  open: boolean;
  classSession: ClassSession | null;
  onClose: () => void;
  onSave: (data: ClassFormData) => Promise<void> | void;
};

export default function EditClassModal({
  open,
  classSession,
  onClose,
  onSave,
}: EditClassModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !classSession) return;

    setTitle(classSession.tema ?? "");
    setDate(classSession.iniciaEn?.slice(0, 10) ?? "");
    setStartTime(classSession.iniciaEn?.slice(11, 16) || "10:00");
    setEndTime(classSession.terminaEn?.slice(11, 16) || "11:30");
    setError("");
  }, [open, classSession]);

  if (!open || !classSession) return null;

  const close = () => {
    if (!saving) onClose();
  };

  const handleSave = async () => {
    if (!title.trim() || !date || !startTime || !endTime) {
      setError("Completa el título, la fecha y las horas de la clase.");
      return;
    }
    if (endTime <= startTime) {
      setError("La hora de término debe ser posterior a la hora de inicio.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        id: classSession.id,
        title: title.trim(),
        date,
        startTime,
        endTime,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la clase. Inténtalo nuevamente."
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
        aria-labelledby="edit-class-title"
        className="talentia-modal-panel w-full max-w-[520px]"
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <header className="talentia-modal-heading">
          <h2 id="edit-class-title" className="talentia-modal-title">
            Editar clase
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
            <span className="talentia-modal-label">Título de la clase</span>
            <input
              type="text"
              value={title}
              maxLength={200}
              disabled={saving}
              onChange={(event) => setTitle(event.target.value)}
              className="talentia-modal-input"
              placeholder="Tema de la clase"
            />
          </label>

          <label className="block">
            <span className="talentia-modal-label">Fecha</span>
            <input
              type="date"
              value={date}
              disabled={saving}
              onChange={(event) => setDate(event.target.value)}
              className="talentia-modal-input"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="talentia-modal-label">Hora de inicio</span>
              <input
                type="time"
                value={startTime}
                disabled={saving}
                onChange={(event) => setStartTime(event.target.value)}
                className="talentia-modal-input"
              />
            </label>
            <label className="block">
              <span className="talentia-modal-label">Hora de término</span>
              <input
                type="time"
                value={endTime}
                disabled={saving}
                onChange={(event) => setEndTime(event.target.value)}
                className="talentia-modal-input"
              />
            </label>
          </div>

          <p className="talentia-modal-help">Zona horaria: Lima (GMT-5).</p>
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
            onClick={() => void handleSave()}
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
