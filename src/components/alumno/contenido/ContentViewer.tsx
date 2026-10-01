"use client";

import type { ContentType } from "@/data/courseContents";

import CommonContentViewer from "@/components/common/contenido/ContentViewer";
import QuizViewer from "@/components/common/contenido/QuizViewer";
import ActivityViewer from "./ActivityViewer";

type ContentViewerProps = {
  title: string;
  type: ContentType;
  file?: string;
  contentId?: number;
  courseId?: number;
  previousHref?: string;
  nextHref?: string;
  exitHref?: string;
};

export default function ContentViewer({
  title,
  type,
  file,
  contentId,
  courseId,
  previousHref,
  nextHref,
  exitHref,
}: ContentViewerProps) {
  if (
    type === "quiz" &&
    contentId &&
    exitHref &&
    courseId
  ) {
    return (
      <QuizViewer
        quizId={contentId}
        courseId={courseId}
        previousHref={previousHref}
        nextHref={nextHref}
        exitHref={exitHref}
      />
    );
  }

  if (
    type === "activity" &&
    contentId &&
    courseId &&
    exitHref
  ) {
    return (
      <ActivityViewer
        activityId={contentId}
        courseId={courseId}
        previousHref={previousHref}
        nextHref={nextHref}
        exitHref={exitHref}
      />
    );
  }

  return (
    <CommonContentViewer
      title={title}
      type={type}
      file={file}
    />
  );
}