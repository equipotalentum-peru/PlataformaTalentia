export type EstadoAnuncio =
  | "Publicado"
  | "Borrador"
  | "Oculto";

export async function peticionAnuncios<T = any>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);

  if (
    init.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : `La solicitud falló (${response.status}).`
    );
  }

  return data as T;
}

export function formatearFechaAnuncio(valor: string | null | undefined): string {
  if (!valor) return "";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "";

  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}