import TablaSolicitudesPersonas from "@/components/administrador/tabla-solicitudes-personas";

export default function SolicitudesPersonasPage() {
  return (
    <div className="w-full pt-8 pb-10">

      <div className="mx-auto w-full max-w-[1380px] px-6 lg:px-8 xl:px-10 2xl:px-12">

        <div className="mb-7">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2851]">
            Solicitudes Personas
          </h1>

          <p className="mt-1 text-sm font-semibold text-[#64748B]">
            Registro de postulantes individuales e identificación de convenios corporativos.
          </p>
        </div>

        <TablaSolicitudesPersonas />

      </div>

    </div>
  );
}
