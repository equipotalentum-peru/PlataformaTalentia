import TablaSolicitudesPersonas from "@/components/administrador/tabla-solicitudes-personas";

export default function SolicitudesPersonasPage() {
  return (
    <div className="w-full max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Solicitudes Personas (B2C)
        </h1>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Registro de postulantes individuales e identificación de convenios corporativos.
        </p>
      </div>

      <TablaSolicitudesPersonas />
    </div>
  );
}