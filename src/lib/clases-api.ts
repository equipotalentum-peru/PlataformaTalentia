import { API_URL } from "@/lib/api";

export async function obtenerClasesAlumno(
  cursoId: number
) {
  const response = await fetch(
    `${API_URL}/clases/alumno/${cursoId}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ??
        "No se pudieron obtener las clases."
    );
  }

  return data;
}

export async function obtenerClasesDocente(
  cursoId: number
) {
  const response = await fetch(
    `${API_URL}/clases/docente/${cursoId}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ??
        "No se pudieron obtener las clases."
    );
  }

  return data;
}

export async function crearClase(
  cursoId: number,
  data: {
    moduloId?: number | null;
    numeroSesion?: number;
    tema: string;
    iniciaEn: string;
    terminaEn: string;
    urlZoom?: string | null;
  }
) {
  const response = await fetch(
    `${API_URL}/clases/docente/${cursoId}`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ??
        "No se pudo crear la clase."
    );
  }

  return result;
}

export async function editarClase(
  cursoId: number,
  claseId: number,
  data: {
    moduloId?: number | null;
    tema?: string;
    iniciaEn?: string;
    terminaEn?: string;
  }
) {
  const response = await fetch(
    `${API_URL}/clases/docente/${cursoId}/${claseId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ??
        "No se pudo editar la clase."
    );
  }

  return result;
}

export async function cancelarClase(
  cursoId: number,
  claseId: number
) {
  const response = await fetch(
    `${API_URL}/clases/docente/${cursoId}/${claseId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ??
        "No se pudo cancelar la clase."
    );
  }

  return result;
}