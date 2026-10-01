import type { ForumReply } from "@/data/forums";
import ForumReplyComponent from "./ForumReply";

type ReplyThreadProps = {
  replies: ForumReply[];
  expanded: Record<number, boolean>;
  visibleCount: Record<number, number>;
  onToggle: (replyId: number) => void;
  onShowMore: (replyId: number, total: number) => void;
  onReply: (reply: ForumReply) => void;
  depth?: number;
};

export default function ReplyThread({
  replies,
  expanded,
  visibleCount,
  onToggle,
  onShowMore,
  onReply,
  depth = 0,
}: ReplyThreadProps) {
  return (
    <div className={depth > 0 ? "mt-3 space-y-3 border-l-2 border-[#d7e4f3] pl-4" : "space-y-3"}>
      {replies.map((reply) => {
        const childReplies = reply.replies ?? [];
        const totalReplies = childReplies.length;

        const visible = Math.min(
          visibleCount[reply.id] ?? 2,
          totalReplies
        );

        const isExpanded = expanded[reply.id] ?? false;

        return (
          <div key={reply.id}>
            <ForumReplyComponent
              reply={reply}
              hasReplies={totalReplies > 0}
              expanded={isExpanded}
              onToggle={() => onToggle(reply.id)}
              onReply={() => onReply(reply)}
            />

            {isExpanded && totalReplies > 0 && (
              <div className="mt-3">
                <ReplyThread
                  replies={childReplies.slice(0, visible)}
                  expanded={expanded}
                  visibleCount={visibleCount}
                  onToggle={onToggle}
                  onShowMore={onShowMore}
                  onReply={onReply}
                  depth={depth + 1}
                />

                {visible < totalReplies && (
                  <button
                    type="button"
                    onClick={() =>
                      onShowMore(reply.id, totalReplies)
                    }
                    className="mt-2 ml-4 text-[10px] font-semibold text-[#3186d8] hover:underline"
                  >
                    Ver {totalReplies - visible} respuestas más
                  </button>
                )}

                {visible === totalReplies &&
                  totalReplies > 2 && (
                    <button
                      type="button"
                      onClick={() => onToggle(reply.id)}
                      className="mt-2 ml-4 block text-[10px] font-semibold text-[#3186d8] hover:underline"
                    >
                      Ocultar respuestas
                    </button>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}