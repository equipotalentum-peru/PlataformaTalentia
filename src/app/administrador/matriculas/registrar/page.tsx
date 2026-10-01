"use client";

import RegistrarMatricula, {
  MatriculaFormData,
} from "@/components/administrador/registrar-matrícula";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegistrarMatriculaPage() {
  const router = useRouter();

  const handleCancelar = () => {
    router.push("/administrador/matriculas");
  };

  // Usar el tipo importado en lugar de 'any'
  const handleRegistrar = (datos: MatriculaFormData) => {
    console.log("Matrícula registrada:", datos);
    router.push("/administrador/matriculas");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-4">
      <Link
        href="/administrador/matriculas"
        className="text-xs font-bold text-[#64748B] hover:text-[#0F2851] flex items-center gap-1 mb-2"
      >
        ← Volver a matrículas
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
          Registrar matrícula
        </h1>
        <p className="text-xs font-semibold text-[#64748B] mt-1">
          Inscribir alumno en curso y validar disponibilidad.
        </p>
      </div>

      <RegistrarMatricula
        onCancelar={handleCancelar}
        onRegistrar={handleRegistrar}
      />
    </div>
  );
}