"use client";

import { useMemo, useState } from "react";
import type { ForumReply } from "@/data/forums";
import ReplyThread from "./ReplyThread";
import ReplyComposer from "./ReplyComposer";

function filterReplies(replies: ForumReply[], term: string): ForumReply[] {
  if (!term) return replies;
  return replies.flatMap(reply => {
    const children = filterReplies(reply.replies ?? [], term);
    return reply.author.toLowerCase().includes(term) || children.length ? [{ ...reply, replies: children }] : [];
  });
}

export default function ForumDetail({ title, description, replies, onSubmitReply, canReply,
  repliesVisible, currentInitials, readOnlyMessage, participationNotice }: {
  title: string; description: string; replies: ForumReply[];
  onSubmitReply: (content: string, parentId: number | null) => Promise<void>;
  canReply: boolean; repliesVisible: boolean; currentInitials: string; readOnlyMessage: string;
  participationNotice?: string;
}) {
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ForumReply | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => filterReplies(replies, search.trim().toLowerCase()), [replies, search]);
  const users = useMemo(() => {
    const names = new Set<string>();
    const visit = (rows: ForumReply[]) => rows.forEach(row => { names.add(row.author.replaceAll(' ', '')); visit(row.replies ?? []); });
    visit(replies);
    return Array.from(names);
  }, [replies]);
  async function send() {
    if (sending || !text.trim()) return;
    setSending(true); setError("");
    try { await onSubmitReply(text.trim(), replyingTo?.id ?? null); setText(""); setReplyingTo(null); }
    catch (error) { setError(error instanceof Error ? error.message : "No se pudo guardar la respuesta."); }
    finally { setSending(false); }
  }
  return <div className="space-y-2">
    <section className="rounded-lg bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00b8b3]" aria-hidden="true">
            <svg className="h-7 w-7 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
            </svg>
          </div>
          <div className="min-w-0"><h2 className="break-words text-[13px] font-bold text-gray-900">{title}</h2>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-gray-700">{description}</p></div>
        </div>
        <input aria-label="Buscar participante" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar participante"
          className="h-9 w-full shrink-0 rounded-md border border-gray-300 px-3 text-[10px] md:ml-auto md:max-w-[215px]" />
      </div>
    </section>
    <section className="rounded-lg bg-white px-5 py-4 shadow-sm">
      {participationNotice && <p role="status" className="mb-4 text-[11px] text-gray-600">{participationNotice}</p>}
      {!repliesVisible ? !participationNotice && <p className="mb-4 text-[11px] text-gray-600">Participa para ver las respuestas de los demás.</p> :
        filtered.length ? <ReplyThread replies={filtered} onReply={setReplyingTo} canReply={canReply && !sending} /> :
          (search || !participationNotice) && <p className="mb-4 text-[11px] text-gray-600">{search ? 'No se encontraron participantes.' : 'Aún no hay participaciones.'}</p>}
      {error && <p role="alert" className="my-2 text-[11px] text-red-600">{error}</p>}
      {canReply ? <ReplyComposer value={text} onChange={setText} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)}
        onReply={() => void send()} users={users} initials={currentInitials} disabled={sending} /> :
        !participationNotice && <p className="mt-4 text-[11px] text-gray-600">{readOnlyMessage}</p>}
    </section>
  </div>;
}
