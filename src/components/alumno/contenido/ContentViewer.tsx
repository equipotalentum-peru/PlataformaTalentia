"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  /* ======================================================
   * REDIRECCIÓN AUTOMÁTICA DE ENLACES EXTERNOS
   * ====================================================== */
  useEffect(() => {
    const rawType = (type as string)?.toLowerCase();
    const isLinkType =
      rawType === "link" || rawType === "url" || rawType === "enlace";
    const isExternalUrl =
      file && (file.startsWith("http://") || file.startsWith("https://"));

    if (isLinkType || isExternalUrl) {
      if (file) {
        window.open(file, "_blank", "noopener,noreferrer");
      }
      // Regresa al listado del curso o a la ruta de salida
      if (exitHref) {
        router.push(exitHref);
      } else {
        router.back();
      }
    }
  }, [type, file, exitHref, router]);

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