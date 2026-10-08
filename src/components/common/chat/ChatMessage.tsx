import type { ChatMessage as ChatMessageType } from "@/data/chat";
import { formatearHoraChat, } from "@/lib/chat-time";

type Props = {
  message: ChatMessageType;
};

export default function ChatMessage({
  message,
}: Props) {
  if (!message.text) {
    return null;
  }

  const isMine = message.sender === "me";

  return (
    <div
      className={`flex ${
        isMine
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[70%] rounded-xl border px-3 py-2 shadow-sm ${
          isMine
            ? "rounded-br-sm border-gray-200 bg-white"
            : "rounded-bl-sm border-gray-200 bg-white"
        }`}
      >
        <p className="text-[11px] leading-relaxed text-gray-800">
          {message.text}
        </p>

        <p className="mt-1 text-right text-[9px] text-gray-400">
          {formatearHoraChat(
            message.time
          )}
        </p>
      </div>
    </div>
  );
}