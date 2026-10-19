"use client";

import { useState } from "react";

type CreateClassModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
};

export default function CreateClassModal({
  open,
  onClose,
  onSave,
}: CreateClassModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] =
    useState("10:00");
  const [endTime, setEndTime] =
    useState("11:30");

  if (!open) {
    return null;
  }

  const handleSave = () => {
    if (
      !title.trim() ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return;
    }

    if (endTime <= startTime) {
      return;
    }

    onSave({
      title: title.trim(),
      date,
      startTime,
      endTime,
    });

    setTitle("");
    setDate("");
    setStartTime("10:00");
    setEndTime("11:30");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[380px] rounded-lg bg-talentia-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[19px] font-bold text-talentia-primary">
            Crear Clase
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-[28px] leading-none text-talentia-primary"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-talentia-primary">
              Título:
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="h-9 w-full rounded-md bg-talentia-surface px-3 text-[11px] outline-none focus:ring-2 focus:ring-talentia-blue/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-talentia-primary">
              Fecha:
            </span>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="h-9 w-full rounded-md bg-talentia-surface px-3 text-[11px] outline-none focus:ring-2 focus:ring-talentia-blue/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-talentia-primary">
                Hora de inicio:
              </span>

              <input
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(
                    event.target.value
                  )
                }
                className="h-9 w-full rounded-md bg-talentia-surface px-3 text-[11px] outline-none focus:ring-2 focus:ring-talentia-blue/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-talentia-primary">
                Hora de término:
              </span>

              <input
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(
                    event.target.value
                  )
                }
                className="h-9 w-full rounded-md bg-talentia-surface px-3 text-[11px] outline-none focus:ring-2 focus:ring-talentia-blue/30"
              />
            </label>
          </div>

          <p className="text-[10px] text-talentia-muted">
            Zona horaria: Lima (GMT-5)
          </p>

          {endTime <= startTime &&
            startTime &&
            endTime && (
              <p className="text-[10px] text-talentia-danger">
                La hora de término debe ser posterior
                a la hora de inicio.
              </p>
            )}
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-talentia-action px-9 py-2 text-[14px] font-bold text-white hover:bg-talentia-primary"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}