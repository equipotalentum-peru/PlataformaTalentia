import Link from "next/link";
import { forums } from "@/data/forums";

type ForumPageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function ForumPage({
  params,
}: ForumPageProps) {
  const { cursoId } = await params;
  const courseId = Number(cursoId);

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">

        <Link
          href="/alumno/cursos"
          className="mb-3 flex w-fit items-center gap-2 text-[12px] font-medium text-gray-700 hover:text-[#3186d8]"
        >
          ← Volver a cursos
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
            href={`/alumno/cursos/${courseId}`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Contenido de curso
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/clases`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Clases
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/foro`}
            className="border-b-[3px] border-black px-3 py-2 text-[12px] font-medium"
          >
            Foro
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/anuncios`}
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
          >
            Anuncios
          </Link>
        </div>

        {/* DESCRIPCIÓN */}
        <section className="mt-2 rounded-xl bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#3186d8]">
                <svg
                  className="h-8 w-8 text-black"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
                </svg>
              </div>

              <p className="max-w-[570px] text-[12px] leading-snug text-gray-700">
                Comparte ideas, haz preguntas y participa en la comunidad.
                Tu experiencia también enriquece el aprendizaje de los demás.
              </p>
            </div>

            <div className="flex h-9 w-full max-w-[215px] items-center rounded-md border border-gray-300 px-3">
              <svg
                className="mr-2 h-4 w-4 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                placeholder="Buscar foro"
                className="w-full bg-transparent text-[11px] outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </section>

        {/* FILTROS */}
        <div className="my-2 flex gap-2">
          <button
            type="button"
            className="rounded-full bg-[#3186d8] px-4 py-1.5 text-[10px] font-medium text-white"
          >
            Todos
          </button>

          <button
            type="button"
            className="rounded-full bg-white px-4 py-1.5 text-[10px] font-medium text-gray-700"
          >
            Sin responder
          </button>

          <button
            type="button"
            className="rounded-full bg-white px-4 py-1.5 text-[10px] font-medium text-gray-700"
          >
            Respondidos
          </button>
        </div>

        {/* FOROS */}
        <div className="flex flex-col gap-2">
          {forums.map((forum) => (
            <Link
              key={forum.id}
              href={`/alumno/cursos/${courseId}/foro/${forum.id}`}
              className="group flex flex-col gap-4 rounded-lg bg-white px-5 py-3 transition hover:shadow-md md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3186d8] text-[13px] font-semibold text-white">
                  {forum.initials}
                </div>

                <div className="min-w-0">
                  <h2 className="text-[14px] font-bold text-gray-900">
                    {forum.title}
                  </h2>

                  <p className="mt-0.5 max-w-[590px] text-[11px] leading-snug text-gray-700">
                    {forum.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-[11px] text-gray-700 md:w-[175px]">
                <div className="flex items-center gap-1 font-medium">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 3v-5.5A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
                  </svg>

                  {forum.repliesCount} respuestas
                </div>

                <p className="mt-1 text-[10px] text-gray-600">
                  {forum.date}, {forum.time}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}