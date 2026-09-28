"use client";

import Link from "next/link";
import {
  markContentViewed,
} from "@/lib/progress";

type SectionNavigationProps = {
  courseId: number;
  currentContentId: number;
  currentContentType:
    | "pdf"
    | "video"
    | "ppt"
    | "word"
    | "activity"
    | "quiz"
    | "link";

  previousHref?: string;
  nextHref?: string;
};

export default function SectionNavigation({
  courseId,
  currentContentId,
  currentContentType,
  previousHref,
  nextHref,
}: SectionNavigationProps) {
  const handleSectionNavigation = () => {
    if (currentContentType !== "quiz" && currentContentType !== "activity") {
      markContentViewed(
        courseId,
        currentContentId
      );
    }
  };

  const handlePrevious = () => {
    if (currentContentType !== "quiz") {
      markContentViewed(
        courseId,
        currentContentId
      );
    }
  };

  return (
    <div className="mt-5 flex items-center justify-between">

      {previousHref ? (
        <Link
          href={previousHref}
          onClick={handlePrevious}
          className="
            rounded
            border border-gray-400
            bg-white
            px-5 py-2
            text-sm
            text-gray-800
            transition
            hover:bg-gray-100
          "
        >
          ← Anterior
        </Link>
      ) : (
        <div />
      )}

      {nextHref ? (
        <Link
          href={nextHref}
          onClick={
            handleSectionNavigation
          }
          className="
            rounded
            bg-[#3186d8]
            px-5 py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-[#2777c1]
          "
        >
          Siguiente →
        </Link>
      ) : (
        <div />
      )}

    </div>
  );
}