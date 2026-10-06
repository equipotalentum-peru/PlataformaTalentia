"use client";

import { useMemo } from "react";
import type { ForumReply } from "@/data/forums";
import MentionInput from "./MentionInput";

type ReplyComposerProps = {
  value: string;
  onChange: (value: string) => void;
  replyingTo: ForumReply | null;
  onCancelReply: () => void;
  onReply: () => void;
  users: string[];
  initials: string;
  disabled?: boolean;
};

export default function ReplyComposer({
  value,
  onChange,
  replyingTo,
  onCancelReply,
  onReply,
  users,
  initials,
  disabled = false,
}: ReplyComposerProps) {
  const mentionText = value.match(
    /@([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*)$/
  )?.[1];

  const suggestions = useMemo(() => {
    if (mentionText === undefined) {
      return [];
    }

    return users.filter((user) =>
      user
        .toLowerCase()
        .startsWith(mentionText.toLowerCase())
    );
  }, [mentionText, users]);

  const handleSelectMention = (user: string) => {
    onChange(
      value.replace(
        /@[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*$/,
        `@${user} `
      )
    );
  };

  return (
    <div className="flex gap-3 border-t border-gray-100 pt-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00b8b3] text-[10px] font-semibold text-white">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 text-[10px] text-gray-500">
            <span>
              Respondiendo a{" "}
              <span className="font-semibold text-[#3186d8]">
                @{replyingTo.author.replaceAll(" ", "")}
              </span>
            </span>

            <button
              type="button"
              onClick={onCancelReply}
              className="font-semibold text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <MentionInput
              value={value}
              onChange={onChange}
              suggestions={suggestions}
              onSelectSuggestion={handleSelectMention}
              disabled={disabled}
            />
          </div>

          <button
            type="button"
            onClick={onReply}
            disabled={disabled || !value.trim()}
            className="rounded-md bg-[#00b8b3] px-5 py-2 text-[10px] font-medium text-white hover:bg-[#00a7a2]"
          >
            {disabled ? "Enviando..." : "Responder"}
          </button>
        </div>
      </div>
    </div>
  );
}
