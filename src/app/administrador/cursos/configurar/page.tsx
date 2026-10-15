
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

  return <CrearCurso cursoId={id} />;
}
