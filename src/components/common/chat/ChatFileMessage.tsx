
"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType, } from "@/data/chat";
import { API_URL } from "@/lib/api";
import { formatearHoraChat, } from "@/lib/chat-time";
import ChatAttachmentIcon from "./ChatAttachmentIcon";

type Props = {
  message: ChatMessageType;
  onDelete: (id: number) => Promise<void>;
};

export default function ChatFileMessage({
  message,
  onDelete,
}: Props) {
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  const archivo = message.file;

  if (!archivo) {
    return null;
  }

  const esMio = message.sender === "me";

  const descargar = () => {
    window.open(
      `${API_URL}/chat/adjuntos/${archivo.id}`,
      "_blank",
      "noopener,noreferrer"
    );
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
          : "No se pudo eliminar el archivo."
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
      <div className="w-[300px] max-w-full">
        <div className="rounded-xl border border-talentia-border bg-talentia-surface p-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* SVG según el formato del archivo */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-talentia-surface text-talentia-muted">
              <ChatAttachmentIcon
                filename={archivo.name}
                className="h-7 w-7"
              />
            </div>

            {/* Nombre y tamaño */}
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-semibold text-talentia-primary"
                title={archivo.name}
              >
                {archivo.name}
              </p>

              <p className="mt-0.5 text-[12px] text-talentia-muted">
                {archivo.size}
              </p>
            </div>

            {/* Botón de descarga con SVG */}
            <button
              type="button"
              onClick={descargar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-talentia-blue transition hover:bg-talentia-hover hover:text-talentia-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-talentia-blue"
              aria-label={`Descargar ${archivo.name}`}
              title="Descargar archivo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </button>
          </div>

          <p className="mt-2 text-right text-[12px] text-talentia-muted">
            {formatearHoraChat(message.time)}
          </p>
        </div>

        {/* Eliminar solo los archivos propios */}
        {esMio && (
          <div className="mt-1 flex justify-end text-[12px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              type="button"
              disabled={procesando}
              onClick={() => void borrar()}
              className="text-talentia-danger hover:underline disabled:opacity-50"
            >
              {procesando
                ? "Eliminando..."
                : "Eliminar"}
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
