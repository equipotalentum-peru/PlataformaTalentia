import type { ForumReply } from "@/data/forums";
import ForumReplyComponent from "./ForumReply";

export default function ReplyThread({ replies, onReply, canReply, depth = 0 }: {
  replies: ForumReply[]; onReply: (reply: ForumReply) => void; canReply: boolean; depth?: number;
}) {
  return <div className={depth > 0 && depth <= 3 ? "mt-3 space-y-3 border-l-2 border-[#d7e4f3] pl-3" : "space-y-3"}>
    {replies.map(reply => <div key={reply.id}>
      <ForumReplyComponent reply={reply} hasReplies={Boolean(reply.replies?.length)} onReply={() => onReply(reply)} canReply={canReply} />
      {Boolean(reply.replies?.length) && <ReplyThread replies={reply.replies!} onReply={onReply} canReply={canReply} depth={depth + 1} />}
    </div>)}
  </div>;
}
