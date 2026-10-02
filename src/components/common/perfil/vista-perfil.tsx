import type { ReactNode } from "react";
import Image from "next/image";

type CampoPerfil = {
  etiqueta: string;
  valor: string;
};

type VistaPerfilProps = {
  iniciales: string;
  fotoPerfil?: string | null;
  onCambiarFoto?: () => void;
  onEliminarFoto?: () => void;
  subiendoFoto?: boolean;
  eliminandoFoto?: boolean;
  fotoDeshabilitada?: boolean;
  nombreCompleto: string;
  usuario: string;
  rol: "Estudiante" | "Docente" | "Administrador";
  correo: string;
  etiquetaId: string;
  numeroId: string;
  fechaNacimiento: string;
  genero: string;
  nacionalidad: string;
  direccion: string;
  telefono: string;
  onEditarAdicional?: () => void;
  onEditarContacto?: () => void;
};

function BotonEditar({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-[#2782df] px-3 py-1 text-sm text-[#2782df] transition hover:bg-[#e8f3ff]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34a.995.995 0 0 0-1.41 0l-1.84 1.83l3.75 3.75l1.84-1.83M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25Z" />
      </svg>
      <span>Editar</span>
    </button>
  );
}

function TarjetaInformacion({
  titulo,
  icono,
  campos,
  editable = true,
  onEditar,
  className = "",
}: {
  titulo: string;
  icono: ReactNode;
  campos: CampoPerfil[];
  editable?: boolean;
  onEditar?: () => void;
  className?: string;
}) {
  return (
    <section className={`rounded-lg bg-white p-3 ${className}`}>
      <div className="mb-2 flex min-h-8 items-center justify-between">
        <div className="flex items-center gap-2 text-[#2782df]">
          {icono}
          <h2 className="font-semibold">{titulo}</h2>
        </div>

        {editable && <BotonEditar onClick={onEditar} />}
      </div>

      <dl className="border border-gray-300">
        {campos.map((campo) => (
          <div
            key={campo.etiqueta}
            className="grid gap-1 border-b border-gray-300 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(150px,0.9fr)_minmax(0,1.4fr)]"
          >
            <dt className="font-semibold text-gray-900">
              {campo.etiqueta}
            </dt>

            <dd className="break-words text-gray-700">
              {campo.valor}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function VistaPerfil({
  iniciales,
  fotoPerfil,
  onCambiarFoto,
  onEliminarFoto,
  subiendoFoto = false,
  eliminandoFoto = false,
  fotoDeshabilitada = false,
  nombreCompleto,
  usuario,
  rol,
  correo,
  etiquetaId,
  numeroId,
  fechaNacimiento,
  genero,
  nacionalidad,
  direccion,
  telefono,
  onEditarAdicional,
  onEditarContacto,
}: VistaPerfilProps) {
  return (
    <div className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-[1050px]">
        <h1 className="mb-4 text-3xl font-semibold text-[#2782df]">
          Mi perfil
        </h1>

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#2495e9] text-3xl font-semibold text-white">
              {fotoPerfil ? (
                <Image
                  src={fotoPerfil}
                  alt={`Foto de perfil de ${nombreCompleto}`}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : iniciales}
            </div>

            <button
              type="button"
              onClick={onCambiarFoto}
              disabled={!onCambiarFoto || subiendoFoto || eliminandoFoto || fotoDeshabilitada}
              aria-label={subiendoFoto ? "Subiendo foto de perfil" : "Cambiar foto de perfil"}
              aria-busy={subiendoFoto}
              title={subiendoFoto ? "Subiendo foto" : "Cambiar foto de perfil"}
              className="absolute bottom-0 right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#1679ca] bg-[#2495e9] text-black transition hover:bg-[#2782df] disabled:cursor-wait disabled:opacity-60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 4h-3.17L15 2H9L7.17 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12m-8-11a5 5 0 1 0 0 10a5 5 0 0 0 0-10m0 8a3 3 0 1 1 0-6a3 3 0 0 1 0 6" />
              </svg>
            </button>
            {fotoPerfil && (
              <button
                type="button"
                onClick={onEliminarFoto}
                disabled={!onEliminarFoto || subiendoFoto || eliminandoFoto || fotoDeshabilitada}
                aria-label={eliminandoFoto ? "Eliminando foto de perfil" : "Eliminar foto de perfil"}
                aria-busy={eliminandoFoto}
                title={eliminandoFoto ? "Eliminando foto" : "Eliminar foto de perfil"}
                className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/55 text-white transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2782df] disabled:cursor-wait [@media(hover:none)]:opacity-100 ${eliminandoFoto ? "opacity-100" : "opacity-0"}`}
              >
                <svg
                  aria-hidden="true"
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 7h16" />
                  <path d="M9 7V4h6v3" />
                  <path d="M7 7l1 13h8l1-13" />
                </svg>
              </button>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-black">
              {nombreCompleto}
            </p>
            <p className="text-base text-gray-800">{usuario}</p>
            <span className="mt-1 inline-flex rounded-md bg-[#2495e9] px-4 py-1 text-sm text-white">
              {rol}
            </span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaInformacion
            titulo="Información básica"
            icono={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 4a4 4 0 1 1 0 8a4 4 0 0 1 0-8m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
              </svg>
            }
            editable={false}
            className="lg:col-span-2"
            campos={[
              { etiqueta: "Nombre completo", valor: nombreCompleto },
              { etiqueta: "Dirección de correo electrónico", valor: correo },
              { etiqueta: etiquetaId, valor: numeroId },
            ]}
          />

          <TarjetaInformacion
            titulo="Información adicional"
            onEditar={onEditarAdicional}
            icono={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 2a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6m7 1.5L18.5 9H13V3.5M6 4h5v7h7v9H6V4m2 10v2h8v-2H8m0 4v2h5v-2H8" />
              </svg>
            }
            campos={[
              { etiqueta: "Fecha de nacimiento", valor: fechaNacimiento },
              { etiqueta: "Género", valor: genero },
              { etiqueta: "Nacionalidad", valor: nacionalidad },
            ]}
          />

          <TarjetaInformacion
            titulo="Información de contacto"
            onEditar={onEditarContacto}
            icono={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6.62 10.79a15.46 15.46 0 0 0 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25c1.12.37 2.32.57 3.57.57c.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1c0 1.25.2 2.45.57 3.57c.11.35.03.74-.25 1.02l-2.2 2.2Z" />
              </svg>
            }
            campos={[
              { etiqueta: "Dirección", valor: direccion },
              { etiqueta: "Número de teléfono", valor: telefono },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
