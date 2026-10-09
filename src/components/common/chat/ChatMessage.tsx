"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType, } from "@/data/chat";
import { formatearHoraChat, } from "@/lib/chat-time";

type Props = {
  message: ChatMessageType;
  onEdit: (
    id: number,
    contenido: string
  ) => Promise<void>;
  onDelete: (
    id: number
  ) => Promise<void>;
};

export default function ChatMessage({
  message,
  onEdit,
  onDelete,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(
    message.text ?? ""
  );
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const esMio = message.sender === "me";

  if (message.deleted) {
    return (
      <div
        className={`flex ${
          esMio ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-[70%] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm ${
            esMio ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
        >
          <p className="text-[11px] italic text-gray-500">
            Mensaje eliminado
          </p>

          <p className="mt-1 text-right text-[9px] text-gray-400">
            {formatearHoraChat(message.time)}
          </p>
        </div>
      </div>
    );
  }

  if (!message.text) return null;

  const guardarEdicion = async () => {
    const contenido = borrador.trim();

    if (!contenido) {
      setError("El mensaje no puede quedar vacío.");
      return;
    }

    try {
      setProcesando(true);
      setError("");

      await onEdit(message.id, contenido);

      setEditando(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo editar el mensaje."
      );
    } finally {
      setProcesando(false);
    }
  };

  const borrar = async () => {
    try {
      setProcesando(true);
      setError("");

      await onDelete(message.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el mensaje."
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      className={`group flex ${
        esMio ? "justify-end" : "justify-start"
      }`}
    >
      <div className="max-w-[70%]">
        <div
          className={`rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm ${
            esMio ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
        >
          {editando ? (
            <div className="min-w-[220px] space-y-2">
              <textarea
                value={borrador}
                onChange={(event) =>
                  setBorrador(event.target.value)
                }
                maxLength={10000}
                rows={3}
                autoFocus
                className="w-full resize-y rounded-md border border-gray-300 p-2 text-[11px] outline-none focus:border-[#3186d8]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => {
                    setBorrador(message.text ?? "");
                    setEditando(false);
                    setError("");
                  }}
                  className="text-[10px] text-gray-500"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => void guardarEdicion()}
                  className="rounded-md bg-[#3186d8] px-2 py-1 text-[10px] text-white disabled:opacity-50"
                >
                  {procesando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-gray-800">
                {message.text}
              </p>

              <p className="mt-1 text-right text-[9px] text-gray-400">
                {formatearHoraChat(message.time)}
                {message.edited ? " · editado" : ""}
              </p>
            </>
          )}
        </div>

        {esMio && !editando && (
          <div className="mt-1 flex justify-end gap-3 text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              type="button"
              disabled={procesando}
              onClick={() => {
                setBorrador(message.text ?? "");
                setEditando(true);
                setError("");
              }}
              className="text-[#3186d8] hover:underline"
            >
              Editar
            </button>

            <button
              type="button"
              disabled={procesando}
              onClick={() => void borrar()}
              className="text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </div>
        )}

        {error && (
          <p className="mt-1 text-[10px] text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}