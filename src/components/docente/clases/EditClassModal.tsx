"use client";

import { useEffect, useState } from "react";
import type { ClassSession } from "@/data/classes";

type EditClassModalProps = {
  open: boolean;
  classSession: ClassSession | null;
  onClose: () => void;
  onSave: (data: {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
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

  useEffect(() => {
    if (!classSession) {
      return;
    }

    setTitle(classSession.tema);

    if (classSession.iniciaEn) {
      setDate(
        classSession.iniciaEn.slice(0, 10)
      );
      setStartTime(
        classSession.iniciaEn.slice(11, 16)
      );
    }
  }, [classSession]);

  if (!open || !classSession) {
    return null;
  }

  const handleSave = () => {
    if (!title.trim() || !date) {
      return;
    }

    onSave({
      id: classSession.id,
      title: title.trim(),
      date,
      startTime,
      endTime,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[360px] rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[19px] font-bold text-[#3186d8]">
            Editar Clase
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-[28px] leading-none text-gray-800"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-gray-800">
              Título:
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              className="h-9 w-full rounded-md bg-[#eeeeee] px-3 text-[11px] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-gray-800">
              Fecha:
            </span>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="h-9 w-full rounded-md bg-[#eeeeee] px-3 text-[11px] outline-none"
            />
          </label>

          <input
            type="time"
            value={startTime}
            onChange={(event) =>
              setStartTime(event.target.value)
            }
          />

          <input
            type="time"
            value={endTime}
            onChange={(event) =>
              setEndTime(event.target.value)
            }
          />
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-[#1250ad] px-9 py-2 text-[14px] font-bold text-white hover:bg-[#0e4396]"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}