import { redirect } from "next/navigation";
import PublicarCursoTalentia from "@/components/administrador/publicar-curso-talentia";

export default async function PublicarCursoTalentiaPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id || !/^\d+$/.test(id)) {
    redirect("/administrador/cursos");
  }

  return (
    <div className="min-h-screen w-full bg-talentia-surface px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <PublicarCursoTalentia cursoId={id} />
    </div>
  );
}
