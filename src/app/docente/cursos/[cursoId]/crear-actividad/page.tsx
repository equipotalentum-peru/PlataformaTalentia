import { notFound } from "next/navigation";
import { courses } from "@/data/courses";
import CreateActivity from "@/components/docente/curso/CreateActivity";

type PageProps = {
  params: Promise<{ cursoId: string }>;
  searchParams?: Promise<{ moduleId?: string }>;
};

export default async function CreateActivityPage({ params, searchParams }: PageProps) {
  const { cursoId } = await params;
  const query = searchParams ? await searchParams : {};
  const course = courses.find((item) => item.id === Number(cursoId));

  if (!course) notFound();

  return <CreateActivity course={course} moduleId={query.moduleId} />;
}
