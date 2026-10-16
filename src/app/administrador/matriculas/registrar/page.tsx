"use client";

import RegistrarMatricula, {
  type MatriculaFormData,
} from "@/components/administrador/registrar-matrícula";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function RegistrarMatriculaPage() {
  const router = useRouter();

  const handleCancelar = () => {
    router.push("/administrador/matriculas");
  };

  const handleRegistrar = async (datos: MatriculaFormData) => {
    const response = await fetch(`${API_URL}/administrador/matriculas`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await response.json().catch(() => ({}));

    if (response.status === 401) {
      router.push("/login");
      throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
    }

    if (!response.ok) {
      throw new Error(resultado.message ?? "No se pudo registrar la matrícula.");
    }

    router.push("/administrador/matriculas");
    router.refresh();
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
          Inscribir alumno en una oferta publicada y validar disponibilidad.
        </p>
      </div>

      <RegistrarMatricula
        onCancelar={handleCancelar}
        onRegistrar={handleRegistrar}
      />
    </div>
  );
}
