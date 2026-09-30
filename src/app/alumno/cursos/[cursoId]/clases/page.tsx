import Link from "next/link";

type ClassesPageProps = {
  params: Promise<{
    cursoId: string;
  }>;
};

const clases = [
  {
    id: 1,
    numero: "01",
    tema: "Introducción a las TIC",
    fecha: "Lun, 7 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
  },
  {
    id: 2,
    numero: "02",
    tema: "Herramientas de productividad",
    fecha: "Lun, 14 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
  },
  {
    id: 3,
    numero: "03",
    tema: "Colaboración en la nube",
    fecha: "Lun, 21 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
  },
  {
    id: 4,
    numero: "04",
    tema: "Seguridad digital",
    fecha: "Lun, 28 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
  },
  {
    id: 5,
    numero: "05",
    tema: "Comunicación digital",
    fecha: "Lun, 5 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
  },
  {
    id: 6,
    numero: "06",
    tema: "Gestión y organización de la información",
    fecha: "Lun, 7 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Próxima",
  },
  {
    id: 7,
    numero: "07",
    tema: "Herramientas de creación de contenido",
    fecha: "Lun, 12 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Programada",
  },
  {
    id: 8,
    numero: "08",
    tema: "Inteligencia artificial aplicada",
    fecha: "Lun, 19 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Programada",
  },
  {
    id: 9,
    numero: "09",
    tema: "Proyecto final",
    fecha: "Lun, 26 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Programada",
  },
];

export default async function ClassesPage({
  params,
}: ClassesPageProps) {
  const { cursoId } = await params;
  const courseId = Number(cursoId);

  const proximaClase = clases.find(
    (clase) => clase.estado === "Próxima"
  );

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
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
            alt="Herramientas TIC"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/20" />

          <h1 className="absolute bottom-7 left-5 text-[32px] font-bold text-white">
            Herramientas TIC
          </h1>
        </div>

        {/* TABS */}
        <div className="flex overflow-x-auto border-b border-gray-500 bg-[#eef2f8]">
          <Link
            href={`/alumno/cursos/${courseId}`}
            className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-700 transition hover:text-black"
          >
            Contenido de curso
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/clases`}
            className="whitespace-nowrap border-b-[3px] border-black px-3 py-2 text-[12px] font-medium"
          >
            Clases
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/foro`}
            className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-700 transition hover:text-black"
          >
            Foro
          </Link>

          <Link
            href={`/alumno/cursos/${courseId}/anuncios`}
            className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-700 transition hover:text-black"
          >
            Anuncios
          </Link>
        </div>

        {/* PRÓXIMA CLASE */}
        {proximaClase && (
          <section className="mt-2 rounded-xl bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2588db] text-white">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="17"
                      rx="2"
                    />
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <path d="M3 9h18" />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase text-gray-500">
                    Próxima clase
                  </p>

                  <h2 className="text-[17px] font-bold text-gray-900">
                    Sesión {proximaClase.numero}:{" "}
                    {proximaClase.tema}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="17"
                          rx="2"
                        />
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <path d="M3 9h18" />
                      </svg>

                      {proximaClase.fecha}
                    </span>

                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>

                      {proximaClase.horario}
                    </span>

                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="7" r="3" />
                        <path d="M5 21c.8-4.2 3.1-6.5 7-6.5s6.2 2.3 7 6.5" />
                      </svg>

                      Prof. Gloria Rocha
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#3186d8] px-5 text-[12px] font-medium text-white transition hover:bg-[#2777c1]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="3"
                    y="7"
                    width="18"
                    height="12"
                    rx="2"
                  />
                  <path d="M8 7l1.5-3h5L16 7" />
                  <circle cx="12" cy="13" r="3" />
                </svg>

                Unirse por Zoom
              </button>

            </div>
          </section>
        )}

        {/* TODAS LAS CLASES */}
        <section className="mt-3 rounded-xl bg-white shadow-sm">

          <div className="px-4 pt-3">
            <h2 className="text-[14px] font-bold text-gray-900">
              Todas las clases
            </h2>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-y border-gray-200 bg-[#f8fafc]">
                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Sesión
                  </th>

                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Tema
                  </th>

                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Fecha y Hora
                  </th>

                  <th className="px-4 py-2.5 font-semibold text-gray-800">
                    Estado
                  </th>

                  <th className="px-4 py-2.5 text-right font-semibold text-gray-800">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {clases.map((clase) => {
                  const finalizada =
                    clase.estado === "Finalizada";

                  const proxima =
                    clase.estado === "Próxima";

                  return (
                    <tr
                      key={clase.id}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 text-gray-700">
                        {clase.numero}
                      </td>

                      <td className="px-4 py-2.5 text-gray-700">
                        {clase.tema}
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-700">
                          {clase.fecha}
                        </div>

                        <div className="text-[10px] text-gray-400">
                          {clase.horario}
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-medium ${
                            finalizada
                              ? "bg-[#cef1d2] text-[#27a844]"
                              : proxima
                                ? "bg-[#77c3fb] text-[#2479c5]"
                                : "bg-[#77c3fb] text-[#2479c5]"
                          }`}
                        >
                          {clase.estado}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          disabled={!finalizada && !proxima}
                          className={`inline-flex min-w-[140px] items-center justify-center gap-2 rounded-md px-3 py-1.5 text-[10px] font-medium transition ${
                            finalizada
                              ? "bg-[#3186d8] text-white hover:bg-[#2777c1]"
                              : proxima
                                ? "bg-[#3186d8] text-white hover:bg-[#2777c1]"
                                : "cursor-not-allowed bg-gray-300 text-gray-500"
                          }`}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="7"
                              width="18"
                              height="12"
                              rx="2"
                            />
                            <path d="M8 7l1.5-3h5L16 7" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>

                          {finalizada
                            ? "Ver grabación"
                            : proxima
                              ? "Unirse por Zoom"
                              : "Unirse por Zoom"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}