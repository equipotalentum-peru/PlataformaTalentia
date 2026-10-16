import TablaSolicitudesPersonas from "@/components/administrador/tabla-solicitudes-personas";

export default function SolicitudesPersonasPage() {
  return (
    <div className="w-full pb-10">

      <div className="mx-auto w-full max-w-[1380px] px-6 lg:px-8 xl:px-10 2xl:px-12">

        <div className="mb-7 pt-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2851]">
            Solicitudes Personas (B2C)
          </h1>

          <p className="mt-1 text-xs font-semibold text-[#64748B]">
            Registro de postulantes individuales e identificación de convenios corporativos.
          </p>
        </div>

        <TablaSolicitudesPersonas />

      </div>

    </div>
  );
}