import { notFound } from "next/navigation";
import TeacherMaterialViewer from "@/components/docente/curso/TeacherMaterialViewer";

export default async function TeacherContentPage({ params }: {
  params: Promise<{ cursoId: string; contenidoId: string }>;
}) {
  const { cursoId, contenidoId } = await params;
  const courseId = Number(cursoId);
  const contentId = Number(contenidoId);
  if (![courseId, contentId].every(id => Number.isSafeInteger(id) && id > 0)) notFound();
  return <TeacherMaterialViewer key={`${courseId}-${contentId}`} courseId={courseId} contentId={contentId} />;
}
