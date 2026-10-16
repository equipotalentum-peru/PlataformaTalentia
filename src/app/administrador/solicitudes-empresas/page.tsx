import TablaSolicitudesEmpresas from "@/components/administrador/tabla-solicitudes-empresas";

export default function SolicitudesEmpresasPage() {
  return (
    <div className="w-full pb-10">

      <div className="mx-auto w-full max-w-[1380px] px-6 lg:px-8 xl:px-10 2xl:px-12">

        <div className="mb-7 pt-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2851]">
            Solicitudes Empresas (B2B)
          </h1>

          <p className="mt-1 text-xs font-semibold text-[#64748B]">
            Registro de empresas interesadas en capacitación corporativa.
          </p>
        </div>

        <TablaSolicitudesEmpresas />

      </div>

    </div>
  );
}