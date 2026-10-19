
import { redirect } from "next/navigation";
import CrearCurso from "@/components/administrador/crear-curso";

export default async function ConfigurarPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    redirect("/administrador/cursos");
  }

  return (
    <div className="min-h-screen w-full bg-talentia-surface px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <CrearCurso cursoId={id} />
    </div>
  );
}
