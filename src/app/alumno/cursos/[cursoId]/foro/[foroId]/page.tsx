import Link from "next/link";
import { notFound } from "next/navigation";

import { forums } from "@/data/forums";
import ForumDetail from "@/components/common/forum/ForumDetail";

type ForumDetailPageProps = {
  params: Promise<{
    cursoId: string;
    foroId: string;
  }>;
};

export default async function ForumDetailPage({
  params,
}: ForumDetailPageProps) {
  const { cursoId, foroId } = await params;

  const forum = forums.find(
    (item) => item.id === foroId
  );

  if (!forum) {
    notFound();
  }

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">

        <Link
          href={`/alumno/cursos/${cursoId}/foro`}
          className="mb-2 flex w-fit items-center gap-1 rounded-full bg-[#3186d8] px-3 py-1 text-[10px] font-medium text-white hover:bg-[#2777c1]"
        >
          ← Volver a Foro
        </Link>

        {/* BANNER */}
        <div className="relative h-[150px] overflow-hidden rounded-t-xl">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
            alt="Herramientas TIC"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <h1 className="absolute bottom-7 left-5 text-[32px] font-bold text-white">
            Herramientas TIC
          </h1>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-500 bg-[#eef2f8]">
          <Link
            href={`/alumno/cursos/${cursoId}`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Contenido de curso
          </Link>

          <Link
            href={`/alumno/cursos/${cursoId}/clases`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Clases
          </Link>

          <Link
            href={`/alumno/cursos/${cursoId}/foro`}
            className="border-b-[3px] border-black px-3 py-2 text-[12px] font-medium"
          >
            Foro
          </Link>

          <Link
            href={`/alumno/cursos/${cursoId}/anuncios`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Anuncios
          </Link>
        </div>

        <div className="mt-2">
          <ForumDetail
            title={forum.title}
            description={forum.description}
            replies={forum.replies}
          />
        </div>
      </div>
    </div>
  );
}