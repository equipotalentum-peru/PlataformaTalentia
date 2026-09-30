import Link from "next/link";
import CourseModules from "@/components/alumno/CourseModules";
import CourseInfo from "@/components/alumno/CourseInfo";

type CourseDetailPageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { cursoId } = await params;

  const courseId = Number(cursoId);

  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">

        {/* VOLVER */}
        <Link
          href="/alumno/cursos"
          className="mb-3 flex w-fit items-center gap-2 text-[12px] font-medium text-gray-700 transition hover:text-[#3186d8]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>

          Volver a cursos
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
            className="border-b-[3px] border-black px-3 py-2 text-[12px] font-medium"
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
            className="px-3 py-2 text-[12px] text-gray-700 hover:text-black"
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

        {/* CONTENIDO */}
        <div className="flex flex-col gap-5 py-2 lg:flex-row">

          <section className="flex-1">
            <CourseModules courseId={courseId} />
          </section>

          <CourseInfo progress={30} />

        </div>
      </div>
    </div>
  );
}