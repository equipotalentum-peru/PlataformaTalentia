import TablaSolicitudesEmpresas from "@/components/administrador/tabla-solicitudes-empresas";

export default function SolicitudesEmpresasPage() {
  return (
    <div className="w-full max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Solicitudes Empresas (B2B)
        </h1>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Registro de empresas interesadas en capacitación corporativa.
        </p>
      </div>

      <TablaSolicitudesEmpresas />
    </div>
  );
}