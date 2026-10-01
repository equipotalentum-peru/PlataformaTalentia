"use client";

import { useMemo, useState } from "react";
import type { ForumReply } from "@/data/forums";

import ReplyThread from "./ReplyThread";
import ReplyComposer from "./ReplyComposer";

type ForumDetailProps = {
  title: string;
  description: string;
  replies: ForumReply[];
};

function filterReplies(
  replies: ForumReply[],
  search: string
): ForumReply[] {
  const term = search.trim().toLowerCase();

  if (!term) {
    return replies;
  }

  return replies.reduce<ForumReply[]>((result, reply) => {
    const children = filterReplies(
      reply.replies ?? [],
      search
    );

    const matches =
      reply.author.toLowerCase().includes(term) ||
      reply.content.toLowerCase().includes(term);

    if (matches || children.length > 0) {
      result.push({
        ...reply,
        replies: children,
      });
    }

    return result;
  }, []);
}

function addNestedReply(
  replies: ForumReply[],
  parentId: number,
  newReply: ForumReply
): ForumReply[] {
  return replies.map((reply) => {
    if (reply.id === parentId) {
      return {
        ...reply,
        replies: [...(reply.replies ?? []), newReply],
      };
    }

    if (reply.replies?.length) {
      return {
        ...reply,
        replies: addNestedReply(
          reply.replies,
          parentId,
          newReply
        ),
      };
    }

    return reply;
  });
}

function collectUsers(replies: ForumReply[]): string[] {
  return replies.reduce<string[]>((users, reply) => {
    users.push(reply.author.replaceAll(" ", ""));

    if (reply.replies?.length) {
      users.push(...collectUsers(reply.replies));
    }

    return users;
  }, []);
}

export default function ForumDetail({
  title,
  description,
  replies,
}: ForumDetailProps) {
  const [localReplies, setLocalReplies] =
    useState<ForumReply[]>(replies);

  const [expanded, setExpanded] =
    useState<Record<number, boolean>>({});

  const [visibleCount, setVisibleCount] =
    useState<Record<number, number>>({});

  const [participantSearch, setParticipantSearch] =
    useState("");

  const [replyText, setReplyText] = useState("");

  const [replyingTo, setReplyingTo] =
    useState<ForumReply | null>(null);

  const users = useMemo(
    () => Array.from(new Set(collectUsers(localReplies))),
    [localReplies]
  );

  const filteredReplies = useMemo(
    () =>
      filterReplies(
        localReplies,
        participantSearch
      ),
    [localReplies, participantSearch]
  );

  const toggleReply = (replyId: number) => {
    setExpanded((current) => ({
      ...current,
      [replyId]: !current[replyId],
    }));
  };

  const showMoreReplies = (
    replyId: number,
    total: number
  ) => {
    setVisibleCount((current) => ({
      ...current,
      [replyId]: Math.min(
        (current[replyId] ?? 2) + 3,
        total
      ),
    }));

    setExpanded((current) => ({
      ...current,
      [replyId]: true,
    }));
  };

  const handleReplyTo = (reply: ForumReply) => {
    setReplyingTo(reply);
  };

  const sendReply = () => {
    const content = replyText.trim();

    if (!content) {
      return;
    }

    const newReply: ForumReply = {
      id: Date.now(),
      author: "Gray Padilla",
      initials: "GP",
      date: "Ahora",
      content,
      replies: [],
    };

    setLocalReplies((current) => {
      if (replyingTo) {
        return addNestedReply(
          current,
          replyingTo.id,
          newReply
        );
      }

      return [...current, newReply];
    });

    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className="space-y-2">

      {/* PUBLICACIÓN */}
      <section className="rounded-xl bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00b8b3]">
              <svg
                className="h-7 w-7 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
              </svg>
            </div>

            <div>
              <h2 className="text-[13px] font-bold text-gray-900">
                {title}
              </h2>

              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-700">
                {description}
              </p>
            </div>
          </div>

          <div className="flex h-9 w-full md:ml-auto md:max-w-[215px] items-center rounded-md border border-gray-300 px-3">
            <svg
              className="mr-2 h-4 w-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              value={participantSearch}
              onChange={(event) =>
                setParticipantSearch(event.target.value)
              }
              placeholder="Buscar participante"
              className="w-full bg-transparent text-[10px] outline-none"
            />
          </div>
        </div>
      </section>

      {/* RESPUESTAS */}
      <section className="rounded-xl bg-white px-5 py-4 shadow-sm">
        <ReplyThread
          replies={filteredReplies}
          expanded={expanded}
          visibleCount={visibleCount}
          onToggle={toggleReply}
          onShowMore={showMoreReplies}
          onReply={handleReplyTo}
        />

        {/* COMPOSITOR */}
        <ReplyComposer
          value={replyText}
          onChange={setReplyText}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onReply={sendReply}
          users={users}
        />
      </section>
    </div>
  );
}