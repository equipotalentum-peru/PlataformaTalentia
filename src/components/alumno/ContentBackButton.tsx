"use client";

import Link from "next/link";

import {
  clearQuizStarted,
  isQuizStarted,
  markContentViewed,
} from "@/lib/progress";

type ContentBackButtonProps = {
  href: string;
  courseId: number;
  contentId: number;
  contentType:
    | "pdf"
    | "video"
    | "ppt"
    | "word"
    | "activity"
    | "quiz"
    | "link";
};

export default function ContentBackButton({
  href,
  courseId,
  contentId,
  contentType,
}: ContentBackButtonProps) {
  const handleClick = () => {
    /*
     * Contenido normal:
     * al salir también queda visto.
     */
    if (contentType !== "quiz" && contentType !== "activity") {
      markContentViewed(
        courseId,
        contentId
      );

      return;
    }

    /*
     * Quiz:
     * solo se marca si realmente
     * había comenzado.
     */
    if (
      isQuizStarted(
        courseId,
        contentId
      )
    ) {
      markContentViewed(
        courseId,
        contentId
      );

      clearQuizStarted(
        courseId,
        contentId
      );
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="
        flex items-center
        gap-2
        rounded
        bg-[#3186d8]
        px-4 py-2
        text-[12px]
        text-white
        transition
        hover:bg-[#2777c1]
      "
    >
      ← Volver
    </Link>
  );
}