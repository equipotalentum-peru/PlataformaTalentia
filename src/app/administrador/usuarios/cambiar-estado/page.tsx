import { Suspense } from "react";
import CambiarEstadoUsuario from "@/components/administrador/estado-usuario";

export default function CambiarEstadoUsuarioPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <CambiarEstadoUsuario />
    </Suspense>
  );
}