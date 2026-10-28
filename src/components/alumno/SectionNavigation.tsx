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
    | "excel"
    | "activity"
    | "quiz"
    | "link"
    | "image";

  previousHref?: string;
  nextHref?: string;
  trackLocalProgress?: boolean;
};

export default function SectionNavigation({
  courseId,
  currentContentId,
  currentContentType,
  previousHref,
  nextHref,
  trackLocalProgress = true,
}: SectionNavigationProps) {
  const handleSectionNavigation = () => {
    if (trackLocalProgress && currentContentType !== "quiz" && currentContentType !== "activity") {
      markContentViewed(
        courseId,
        currentContentId
      );
    }
  };

  const handlePrevious = () => {
    if (trackLocalProgress && currentContentType !== "quiz" && currentContentType !== "activity") {
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
            border border-talentia-border
            bg-talentia-surface
            px-5 py-2
            text-sm
            text-talentia-primary
            transition
            hover:bg-talentia-hover
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
            bg-talentia-action
            px-5 py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-talentia-primary
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
