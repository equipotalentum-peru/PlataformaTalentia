const viewedKey = (courseId: number) =>
  `talentia-course-progress-${courseId}`;

const quizStartedKey = (
  courseId: number,
  contentId: number
) =>
  `talentia-quiz-started-${courseId}-${contentId}`;

export function getViewedContentIds(
  courseId: number
): Set<number> {
  if (typeof window === "undefined") {
    return new Set();
  }

  const saved = localStorage.getItem(
    viewedKey(courseId)
  );

  if (!saved) {
    return new Set();
  }

  try {
    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed.filter(
        (value): value is number =>
          typeof value === "number"
      )
    );
  } catch {
    return new Set();
  }
}

export function markContentViewed(
  courseId: number,
  contentId: number
): void {
  if (typeof window === "undefined") {
    return;
  }

  const viewed =
    getViewedContentIds(courseId);

  if (viewed.has(contentId)) {
    return;
  }

  viewed.add(contentId);

  localStorage.setItem(
    viewedKey(courseId),
    JSON.stringify(
      Array.from(viewed)
    )
  );

  window.dispatchEvent(
    new CustomEvent(
      "talentia-progress-updated"
    )
  );
}

export function markQuizStarted(
  courseId: number,
  contentId: number
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    quizStartedKey(
      courseId,
      contentId
    ),
    "true"
  );
}

export function isQuizStarted(
  courseId: number,
  contentId: number
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    localStorage.getItem(
      quizStartedKey(
        courseId,
        contentId
      )
    ) === "true"
  );
}

export function clearQuizStarted(
  courseId: number,
  contentId: number
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    quizStartedKey(
      courseId,
      contentId
    )
  );
}