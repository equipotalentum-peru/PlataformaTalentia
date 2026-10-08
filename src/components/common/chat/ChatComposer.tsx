"use client";

import { useRef, } from "react";
import type { KeyboardEvent, } from "react";

type Props = {
  value: string;
  onChange: (
    value: string
  ) => void;
  onSend: () => void;
  onSendFile?: (
    file: File
  ) => void;
};

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onSendFile,
}: Props) {
  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key ===
      "Enter"
    ) {
      event.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      onSendFile?.(
        file
      );
    }

    event.target.value = "";
  };

  return (
    <div className="border-t border-gray-300 bg-white px-4 py-3">
      <div className="flex items-center gap-3">

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={
            handleFileChange
          }
        />

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-500 hover:text-gray-800"
          aria-label="Adjuntar archivo"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m21.4 11.6-7.9 7.9a5 5 0 0 1-7.1-7.1l8.5-8.5a3.5 3.5 0 0 1 5 5L11 17.8a2 2 0 0 1-2.8-2.8l7.8-7.8" />
          </svg>
        </button>

        <input
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder="Escribe un mensaje"
          className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-[11px] outline-none focus:border-[#3186d8]"
        />

        <button
          type="button"
          onClick={
            onSend
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f80d8] text-white transition hover:bg-[#2777c1]"
          aria-label="Enviar mensaje"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m21 3-7.1 18-3.5-7.4L3 10z" />
            <path d="M10.4 13.6 21 3" />
          </svg>
        </button>

      </div>
    </div>
  );
}