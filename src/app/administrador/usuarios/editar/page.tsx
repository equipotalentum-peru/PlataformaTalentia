import { Suspense } from "react";
import EditarUsuario from "@/components/administrador/editar-usuario";

export default function EditarUsuarioPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <EditarUsuario />
    </Suspense>
  );
}