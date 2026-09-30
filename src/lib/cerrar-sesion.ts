import { API_URL } from "@/lib/api";

export async function cerrarSesion() {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("No se pudo cerrar sesión.");
  }

  window.location.replace("/login");
}