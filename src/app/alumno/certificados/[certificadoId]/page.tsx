import Link from "next/link";
import {
  cookies,
} from "next/headers";

import {
  API_URL,
} from "@/lib/api";

import CertificateDownloadButton
  from "@/components/alumno/certificados/CertificateDownloadButton";

type CertificadoDetallePageProps = {
  params: Promise<{
    certificadoId: string;
  }>;
};

type CertificadoDetalle = {
  id: number;
  curso: string;
  codigoCurso: string;
  descripcion:
    | string
    | null;
  estudiante: string;
  numeroCertificado: string;
  codigoVerificacion: string;
  emitidoEn: string;
  duracion: string;
  estado: "Completado";
};

export default async function CertificadoDetallePage({
  params,
}: CertificadoDetallePageProps) {
  const { certificadoId } = await params;

  const id = Number(certificadoId);

 const cookieStore =
  await cookies();

const cookieHeader =
  cookieStore
    .getAll()
    .map(
      (cookie) =>
        `${cookie.name}=${cookie.value}`
    )
    .join("; ");

const response =
  await fetch(
    `${API_URL}/certificados/${id}`,
    {
      headers: {
        cookie:
          cookieHeader,
      },

      cache:
        "no-store",
    }
  );

if (
  !response.ok
) {
  return (
    <div className="min-h-screen px-[30px] py-[32px] lg:px-[45px]">

      <h1 className="text-[30px] font-semibold text-gray-900">
        Certificado no encontrado
      </h1>

      <Link
        href="/alumno/certificados"
        className="mt-5 inline-block text-[#2d97e8] hover:underline"
      >
        ← Volver a certificados
      </Link>

    </div>
  );
}

const data = (await response.json()) as {
  certificado: CertificadoDetalle;
};

const certificado = {
  ...data.certificado,

  fecha:
    new Intl.DateTimeFormat(
      "es-PE",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone:
          "America/Lima",
      }
    ).format(
      new Date(
        data.certificado
          .emitidoEn
      )
    ),

  /*
   * Mantiene tu JSX existente
   * sin tener que cambiarlo.
   */
  certificado:
    data.certificado
      .numeroCertificado,
};

  if (!certificado) {
    return (
      <div className="min-h-screen px-[30px] py-[32px] lg:px-[45px]">
        <h1 className="text-[30px] font-semibold text-gray-900">
          Certificado no encontrado
        </h1>

        <Link
          href="/alumno/certificados"
          className="mt-5 inline-block text-[#2d97e8] hover:underline"
        >
          ← Volver a certificados
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-[30px] py-[32px] lg:px-[45px]">

      {/* VOLVER */}
      <Link
        href="/alumno/certificados"
        className="mb-5 flex w-fit items-center gap-2 text-[14px] font-semibold text-[#2d97e8] transition hover:text-[#1d79c1]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path
            d="m15 18-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        Volver
      </Link>

      {/* TÍTULO */}
      <header className="mb-7">
        <h1 className="text-[34px] font-semibold tracking-[-0.8px] text-gray-900">
          Certificado de finalización
        </h1>

        <p className="mt-2 text-[14px] text-gray-500">
          A continuación puedes ver tu certificado.
          También puedes descargarlo en PDF.
        </p>
      </header>

      {/* CONTENIDO */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">

        {/* CERTIFICADO */}
        <section className="rounded-[16px] bg-white p-6 shadow-sm">

          <div className="overflow-hidden rounded-[12px] border border-[#d9e2ec] bg-white">

            {/* PARTE SUPERIOR */}
            <div className="border-b border-[#e2e8f0] px-8 py-5">

              <div className="flex items-center justify-between">

                <img
                  src="/images/Talentia_grande_sin_fondo.png"
                  alt="Talentia"
                  className="w-[180px] object-contain"
                />

                <span className="rounded-full bg-[#dcfce7] px-4 py-2 text-[12px] font-semibold text-[#15803d]">
                  {certificado.estado}
                </span>

              </div>

            </div>

            {/* CUERPO CERTIFICADO */}
            <div className="px-8 py-12 text-center">

              <p className="text-[17px] font-semibold uppercase tracking-[2px] text-[#2d97e8]">
                Talentia
              </p>

              <h2 className="mt-4 text-[30px] font-bold uppercase tracking-[1px] text-[#287ad2]">
                Certificado de finalización
              </h2>

              <p className="mt-8 text-[15px] text-gray-600">
                Se certifica que
              </p>

              <h3 className="mt-3 text-[36px] font-bold text-[#2d97e8]">
                {certificado.estudiante}
              </h3>

              <p className="mt-4 text-[15px] text-gray-600">
                ha completado satisfactoriamente el curso
              </p>

              <h4 className="mt-3 text-[25px] font-bold text-[#2d97e8]">
                {certificado.curso}
              </h4>

              <p className="mx-auto mt-7 max-w-[650px] text-[14px] leading-6 text-gray-500">
                Desarrollando las competencias necesarias
                para aplicar herramientas tecnológicas en
                entornos académicos y profesionales.
              </p>

              {/* FIRMA Y FECHA */}
              <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">

                <div>
                  <p className="text-[12px] text-gray-400">
                    Fecha de emisión
                  </p>

                  <p className="mt-2 text-[14px] font-semibold text-gray-800">
                    {certificado.fecha}
                  </p>
                </div>

                <div>
                  <div className="mx-auto w-[130px] border-t border-gray-400 pt-2">
                    <p className="text-[12px] text-gray-500">
                      Firma autorizada
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mx-auto flex h-[86px] w-[86px] items-center justify-center rounded-[8px] border border-gray-300 bg-[#f7f9fb]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-11 w-11 text-gray-500"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <path d="M14 14h3v3h-3z" />
                      <path d="M18 18h3v3h-3z" />
                      <path d="M18 14h3" />
                      <path d="M14 18v3" />
                    </svg>
                  </div>

                  <p className="mt-2 text-[10px] text-gray-400">
                    Código de validación
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* INFORMACIÓN DERECHA */}
        <aside className="h-fit rounded-[16px] bg-white p-6 shadow-sm">

          <h2 className="text-[19px] font-semibold text-gray-900">
            Información del certificado
          </h2>

          <div className="mt-6 space-y-6">

            {/* CURSO */}
            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e7f2ff] text-[#2d97e8]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 8h8" />
                  <path d="M8 12h8" />
                </svg>
              </div>

              <div>
                <p className="text-[12px] text-gray-400">
                  Curso
                </p>

                <p className="mt-1 text-[14px] font-semibold text-gray-800">
                  {certificado.curso}
                </p>
              </div>

            </div>

            {/* ESTUDIANTE */}
            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e9f9f5] text-[#10a89c]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>

              <div>
                <p className="text-[12px] text-gray-400">
                  Estudiante
                </p>

                <p className="mt-1 text-[14px] font-semibold text-gray-800">
                  {certificado.estudiante}
                </p>
              </div>

            </div>

            {/* FECHA */}
            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#fff4df] text-[#f59e0b]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M8 3v4" />
                  <path d="M16 3v4" />
                  <path d="M3 10h18" />
                </svg>
              </div>

              <div>
                <p className="text-[12px] text-gray-400">
                  Fecha de emisión
                </p>

                <p className="mt-1 text-[14px] font-semibold text-gray-800">
                  {certificado.fecha}
                </p>
              </div>

            </div>

            {/* DURACIÓN */}
            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafe] text-[#8b5cf6]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>

              <div>
                <p className="text-[12px] text-gray-400">
                  Duración
                </p>

                <p className="mt-1 text-[14px] font-semibold text-gray-800">
                  {certificado.duracion}
                </p>
              </div>

            </div>

            {/* CÓDIGO */}
            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e8f1ff] text-[#4169e1]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M5 4h14v16H5z" />
                  <path d="M8 8h8" />
                  <path d="M8 12h5" />
                </svg>
              </div>

              <div>
                <p className="text-[12px] text-gray-400">
                  Código
                </p>

                <p className="mt-1 text-[14px] font-semibold text-gray-800">
                  {certificado.certificado}
                </p>
              </div>

            </div>

          </div>

          {/* BOTÓN DESCARGAR */}
       <CertificateDownloadButton
  certificadoId={
    certificado.id
  }

  fileName={
    `certificado-${certificado.codigoCurso}.pdf`
  }

  label="Descargar PDF"

  className="mt-8 flex h-[50px] w-full items-center justify-center gap-2 rounded-[9px] bg-[#2d97e8] text-[14px] font-semibold text-white transition hover:bg-[#2188d6] disabled:cursor-not-allowed disabled:opacity-60"
/>

        </aside>

      </div>

    </div>
  );
}