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
          className={`max-w-[88%] sm:max-w-[70%] rounded-xl border border-talentia-border bg-talentia-surface px-3 py-2 shadow-sm ${
            esMio ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
        >
          <p className="text-[13px] italic text-talentia-muted">
            Mensaje eliminado
          </p>

          <p className="mt-1 text-right text-[12px] text-talentia-muted">
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
      <div className="max-w-[88%] sm:max-w-[70%]">
        <div
          className={`rounded-xl border border-talentia-border bg-talentia-surface px-3 py-2 shadow-sm ${
            esMio ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
        >
          {editando ? (
            <div className="min-w-[min(220px,100%)] space-y-2">
              <textarea
                value={borrador}
                onChange={(event) =>
                  setBorrador(event.target.value)
                }
                maxLength={10000}
                rows={3}
                autoFocus
                className="w-full resize-y rounded-md border border-talentia-border p-2 text-[16px] sm:text-[15px] outline-none focus:border-talentia-blue"
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
                  className="text-[12px] text-talentia-muted"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => void guardarEdicion()}
                  className="rounded-md bg-talentia-action px-2 py-1 text-[12px] text-white disabled:opacity-50"
                >
                  {procesando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[15px] leading-relaxed text-talentia-primary">
                {message.text}
              </p>

              <p className="mt-1 text-right text-[12px] text-talentia-muted">
                {formatearHoraChat(message.time)}
                {message.edited ? " · editado" : ""}
              </p>
            </>
          )}
        </div>

        {esMio && !editando && (
          <div className="mt-1 flex justify-end gap-3 text-[12px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              type="button"
              disabled={procesando}
              onClick={() => {
                setBorrador(message.text ?? "");
                setEditando(true);
                setError("");
              }}
              className="text-talentia-blue hover:underline"
            >
              Editar
            </button>

            <button
              type="button"
              disabled={procesando}
              onClick={() => void borrar()}
              className="text-talentia-danger hover:underline"
            >
              Eliminar
            </button>
          </div>
        )}

        {error && (
          <p className="mt-1 text-[12px] text-talentia-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
