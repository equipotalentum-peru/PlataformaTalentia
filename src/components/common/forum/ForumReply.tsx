import type { ForumReply as ForumReplyType } from "@/data/forums";

type ForumReplyProps = {
  reply: ForumReplyType;
  hasReplies: boolean;
  expanded: boolean;
  onToggle: () => void;
  onReply: () => void;
};

export default function ForumReply({
  reply,
  hasReplies,
  expanded,
  onToggle,
  onReply,
}: ForumReplyProps) {
  const totalReplies = reply.replies?.length ?? 0;

  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00b8b3] text-[10px] font-semibold text-white">
        {reply.initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[11px] font-bold text-gray-900">
            {reply.author}
          </span>

          <span className="text-[9px] text-gray-400">
            {reply.date}
          </span>
        </div>

        <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-gray-700">
          {reply.content}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReply}
            className="text-[10px] font-medium text-gray-600 hover:text-[#3186d8]"
          >
            Responder
          </button>

          {hasReplies && (
            <button
              type="button"
              onClick={onToggle}
              className="text-[10px] font-semibold text-[#3186d8]"
            >
              {expanded
                ? "Ocultar respuestas"
                : `${totalReplies} respuestas`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}