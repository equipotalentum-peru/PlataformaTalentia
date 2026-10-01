import type { ChatMessage as ChatMessageType } from "@/data/chat";

type Props = {
  message: ChatMessageType;
};

export default function ChatFileMessage({
  message,
}: Props) {
  if (!message.file) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <div className="w-[280px] rounded-xl border border-gray-300 bg-white p-3 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ef5350] text-white">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M6 3h8l4 4v14H6z" />
              <path d="M14 3v5h5" />
              <path d="M8.5 14h7M8.5 17h5" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-gray-800">
              {message.file.name}
            </p>

            <p className="mt-0.5 text-[9px] text-gray-400">
              {message.file.size}
            </p>
          </div>

          <button
            type="button"
            className="text-[18px] text-[#3186d8]"
            aria-label="Descargar archivo"
          >
            ↓
          </button>

        </div>

        <p className="mt-2 text-right text-[9px] text-gray-400">
          {message.time}
        </p>

      </div>
    </div>
  );
}