import { notFound } from "next/navigation";

import TeacherSubmissionReview from "@/components/docente/actividades/TeacherSubmissionReview";
import { activities } from "@/data/activities";
import { courses } from "@/data/courses";
import { teacherActivityStudents } from "@/data/teacher-activities";
import { courseContents, } from "@/data/courseContents";
import { getTeacherContentHref, } from "@/lib/teacher-content-navigation";

type PageProps = {
  params: Promise<{
    cursoId: string;
    actividadId: string;
    alumnoId: string;
  }>;
};

export default async function SubmissionReviewPage({
  params,
}: PageProps) {
  const {
    cursoId,
    actividadId,
    alumnoId,
  } = await params;

  const courseId = Number(cursoId);
  const activityId = Number(actividadId);
  const studentId = Number(alumnoId);

  const exists =
    courses.some((course) => course.id === courseId) &&
    activities.some(
      (activity) => activity.id === activityId
    ) &&
    teacherActivityStudents.some(
      (student) => student.id === studentId
    );

  if (!exists) {
    notFound();
  }

  const currentContent = courseContents.find(
    (content) =>
      content.courseId === courseId &&
      content.id === activityId &&
      content.type === "activity"
  );

  if (!currentContent) {
    notFound();
  }

  const courseContentsList = courseContents
    .filter((content) => content.courseId === courseId)
    .sort((a, b) => a.id - b.id);

  const currentIndex =
    courseContentsList.findIndex(
      (content) => content.id === currentContent.id
    );

  const previousContent =
    currentIndex > 0
      ? courseContentsList[currentIndex - 1]
      : null;

  const nextContent =
    currentIndex >= 0 &&
    currentIndex < courseContentsList.length - 1
      ? courseContentsList[currentIndex + 1]
      : null;

  return (
    <TeacherSubmissionReview
      courseId={courseId}
      activityId={activityId}
      studentId={studentId}
    />
  );
}