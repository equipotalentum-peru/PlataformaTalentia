import { API_URL } from "@/lib/api";

export const IMAGEN_PORTADA_POR_DEFECTO =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

/** Convierte una referencia interna r2:// en el endpoint autenticado que sirve la portada. */
export function resolverImagenPortadaCurso(
  imagen: string | null | undefined,
  cursoId: number | string,
  fallback: string = IMAGEN_PORTADA_POR_DEFECTO
): string {
  const valor = imagen?.trim();

  if (!valor) return fallback;
  if (valor.startsWith("r2://")) {
    return `${API_URL}/cursos/${encodeURIComponent(String(cursoId))}/portada`;
  }

  return valor;
}
