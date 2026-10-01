import { notFound } from "next/navigation";
import { courses } from "@/data/courses";
import CreateEvaluation from "@/components/docente/curso/CreateEvaluation";

type PageProps = {
  params: Promise<{ cursoId: string }>;
  searchParams?: Promise<{ moduleId?: string }>;
};

export default async function CreateEvaluationPage({ params, searchParams }: PageProps) {
  const { cursoId } = await params;
  const query = searchParams ? await searchParams : {};
  const course = courses.find((item) => item.id === Number(cursoId));

  if (!course) notFound();

  return <CreateEvaluation course={course} moduleId={query.moduleId} />;
}

