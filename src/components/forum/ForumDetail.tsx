"use client";

import { useMemo, useState } from "react";
import type { ForumReply } from "@/data/forums";

type ForumDetailProps = {
  title: string;
  description: string;
  replies: ForumReply[];
};

type ReplyThreadProps = {
  replies: ForumReply[];
  parentAuthor?: string;
};

function ReplyThread({
  replies,
  parentAuthor,
}: ReplyThreadProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [visibleCount, setVisibleCount] = useState<
    Record<number, number>
  >({});

  const toggleReplies = (replyId: number) => {
    setExpanded((current) => ({
      ...current,
      [replyId]: !current[replyId],
    }));
  };

  const showMore = (replyId: number, total: number) => {
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

  return (
    <div className="mt-3">
      {replies.map((reply) => {
        const totalReplies = reply.replies?.length ?? 0;
        const visible = Math.min(
          visibleCount[reply.id] ?? 2,
          totalReplies
        );

        const isExpanded = expanded[reply.id] ?? false;

        return (
          <div
            key={reply.id}
            className="mb-2 rounded-lg border-l-2 border-[#d7e4f3] pl-4"
          >
            <div className="flex gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3186d8] text-[10px] font-semibold text-white">
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

                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-gray-600 hover:text-[#3186d8]"
                  >
                    Responder
                  </button>

                  {totalReplies > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isExpanded) {
                          setExpanded((current) => ({
                            ...current,
                            [reply.id]: false,
                          }));
                        } else {
                          toggleReplies(reply.id);
                        }
                      }}
                      className="text-[10px] font-semibold text-[#3186d8]"
                    >
                      {isExpanded
                        ? "Ocultar respuestas"
                        : `${totalReplies} respuestas`}
                    </button>
                  )}
                </div>

                {isExpanded && reply.replies && (
                  <div className="mt-3">
                    <ReplyThread
                      replies={reply.replies.slice(
                        0,
                        visible
                      )}
                      parentAuthor={reply.author}
                    />

                    {visible < totalReplies && (
                      <button
                        type="button"
                        onClick={() =>
                          showMore(
                            reply.id,
                            totalReplies
                          )
                        }
                        className="mt-1 text-[10px] font-semibold text-[#3186d8] hover:underline"
                      >
                        Ver{" "}
                        {totalReplies - visible}{" "}
                        respuestas más
                      </button>
                    )}

                    {visible === totalReplies &&
                      totalReplies > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((current) => ({
                              ...current,
                              [reply.id]: false,
                            }))
                          }
                          className="mt-1 block text-[10px] font-semibold text-[#3186d8] hover:underline"
                        >
                          Ocultar respuestas
                        </button>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ForumDetail({
  title,
  description,
  replies,
}: ForumDetailProps) {
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(
    null
  );

  const suggestionUsers = useMemo(
    () => [
      "AndreaLópez",
      "MaríaFernandaTorres",
      "CarlosPérez",
      "LuisGómez",
    ],
    []
  );

  const mentionText = replyText.match(
    /@([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*)$/
  )?.[1];

  const mentionSuggestions =
    mentionText !== undefined
      ? suggestionUsers.filter((user) =>
          user
            .toLowerCase()
            .startsWith(mentionText.toLowerCase())
        )
      : [];

  const sendReply = () => {
    if (!replyText.trim()) return;

    console.log({
      replyingTo,
      replyText,
    });

    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className="space-y-2">

      {/* PUBLICACIÓN PRINCIPAL */}
      <section className="rounded-xl bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3186d8]">
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

          <div className="ml-auto hidden h-8 w-[205px] items-center rounded-md border border-gray-300 px-3 md:flex">
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
              placeholder="Buscar participante"
              className="w-full bg-transparent text-[10px] outline-none"
            />
          </div>

        </div>
      </section>

      {/* RESPUESTAS */}
      <section className="rounded-xl bg-white px-5 py-4 shadow-sm">

        <ReplyThread replies={replies} />

        {/* NUEVA RESPUESTA */}
        <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3186d8] text-[10px] font-semibold text-white">
            GP
          </div>

          <div className="relative flex-1">
            {replyingTo && (
              <div className="mb-2 text-[10px] text-gray-500">
                Respondiendo a{" "}
                <span className="font-semibold text-[#3186d8]">
                  @{replyingTo}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={replyText}
                onChange={(event) =>
                  setReplyText(event.target.value)
                }
                placeholder="Escribe tu respuesta..."
                className="h-9 flex-1 rounded-md border border-gray-300 px-3 text-[11px] outline-none focus:border-[#3186d8]"
              />

              <button
                type="button"
                onClick={sendReply}
                className="rounded-md bg-[#3186d8] px-5 text-[11px] font-medium text-white hover:bg-[#2777c1]"
              >
                Responder
              </button>
            </div>

            {mentionSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-[230px] rounded-md border border-gray-200 bg-white p-1 shadow-lg">
                {mentionSuggestions.map((user) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => {
                      setReplyText((current) =>
                        current.replace(
                          /@[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*$/,
                          `@${user} `
                        )
                      );
                    }}
                    className="block w-full rounded px-2 py-1.5 text-left text-[10px] hover:bg-[#eef5fc]"
                  >
                    @{user}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}