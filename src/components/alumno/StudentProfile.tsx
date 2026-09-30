"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import VistaPerfil from "@/components/perfiles/vista-perfil";
import { API_URL } from "@/lib/api";

type PerfilEstudiante = {
  id: string;
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string | null;
  rol: "Estudiante" | "Docente" | "Administrador";
  idPersona: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  telefono: string | null;
  fotoPerfil: string | null;
  idioma: string;
  zonaHoraria: string;
};

type DatosEdicion = {
  fechaNacimiento: string;
  genero: string;
  nacionalidad: string;
  direccion: string;
  telefono: string;
  idioma: string;
  zonaHoraria: string;
};

type SeccionEdicion = "adicional" | "sistema" | "contacto";
type CampoEdicion = {
  nombre: keyof DatosEdicion;
  etiqueta: string;
  tipo?: "date" | "tel" | "textarea" | "select";
  maxLength?: number;
  requerido?: boolean;
};

const secciones: Record<
  SeccionEdicion,
  { titulo: string; campos: CampoEdicion[] }
> = {
  adicional: {
    titulo: "Editar información adicional",
    campos: [
      { nombre: "fechaNacimiento", etiqueta: "Fecha de nacimiento", tipo: "date" },
      { nombre: "genero", etiqueta: "Género", tipo: "select" },
      { nombre: "nacionalidad", etiqueta: "Nacionalidad", maxLength: 80 },
    ],
  },
  sistema: {
    titulo: "Editar configuración del sistema",
    campos: [
      { nombre: "idioma", etiqueta: "Idioma", maxLength: 50, requerido: true },
      { nombre: "zonaHoraria", etiqueta: "Zona horaria", maxLength: 50, requerido: true },
    ],
  },
  contacto: {
    titulo: "Editar información de contacto",
    campos: [
      { nombre: "direccion", etiqueta: "Dirección" },
      { nombre: "telefono", etiqueta: "Número de teléfono", tipo: "tel", maxLength: 20 },
    ],
  },
};

function mostrarDato(valor: string | null, texto = "No registrado") {
  return valor?.trim() || texto;
}

function codigoGenero(valor: string | null) {
  const genero = valor?.trim().toLowerCase();
  if (genero === "m" || genero === "masculino") return "M";
  if (genero === "f" || genero === "femenino") return "F";
  return "";
}

function mostrarGenero(valor: string | null) {
  const codigo = codigoGenero(valor);
  if (codigo === "M") return "Masculino";
  if (codigo === "F") return "Femenino";
  return mostrarDato(valor);
}

function mostrarFecha(fecha: string | null) {
  if (!fecha) return "No registrada";

  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

export default function StudentProfile() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null);
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState<SeccionEdicion | null>(null);
  const [datosEdicion, setDatosEdicion] = useState<DatosEdicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarPerfil() {
      try {
        const response = await fetch(`${API_URL}/profile`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message ?? "No se pudo cargar el perfil.");
        }

        const profile = data.profile as PerfilEstudiante;

        if (profile.rol !== "Estudiante") {
          router.replace(
            profile.rol === "Administrador"
              ? "/administrador/dashboard"
              : "/docente/perfil"
          );
          return;
        }

        setPerfil(profile);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el perfil."
        );
      }
    }

    cargarPerfil();
    return () => controller.abort();
  }, [router]);

  function abrirEdicion(nuevaSeccion: SeccionEdicion) {
    if (!perfil) return;

    setDatosEdicion({
      fechaNacimiento: perfil.fechaNacimiento ?? "",
      genero: codigoGenero(perfil.genero),
      nacionalidad: perfil.nacionalidad ?? "",
      direccion: perfil.direccion ?? "",
      telefono: perfil.telefono ?? "",
      idioma: perfil.idioma,
      zonaHoraria: perfil.zonaHoraria,
    });
    setErrorEdicion("");
    setSeccion(nuevaSeccion);
  }

  async function guardarCambios(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seccion || !datosEdicion) return;

    const changes = Object.fromEntries(
      secciones[seccion].campos.map(({ nombre }) => [nombre, datosEdicion[nombre]])
    );

    setGuardando(true);
    setErrorEdicion("");

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(changes),
      });
      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo actualizar el perfil.");
      }

      setPerfil(data.profile);
      setSeccion(null);
      setDatosEdicion(null);
    } catch (requestError) {
      setErrorEdicion(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar el perfil."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!perfil) return <div className="p-8 text-gray-600">Cargando perfil...</div>;

  const nombreCompleto = `${perfil.nombres} ${perfil.apellidos}`.toUpperCase();
  const iniciales = `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase();

  return (
    <>
      <VistaPerfil
        iniciales={iniciales}
        nombreCompleto={nombreCompleto}
        usuario={perfil.usuario}
        rol="Estudiante"
        correo={mostrarDato(perfil.correo)}
        etiquetaId="ID de estudiante"
        numeroId={mostrarDato(perfil.idPersona)}
        fechaNacimiento={mostrarFecha(perfil.fechaNacimiento)}
        genero={mostrarGenero(perfil.genero)}
        nacionalidad={mostrarDato(perfil.nacionalidad)}
        direccion={mostrarDato(perfil.direccion)}
        telefono={mostrarDato(perfil.telefono)}
        idioma={perfil.idioma}
        zonaHoraria={perfil.zonaHoraria}
        onEditarAdicional={() => abrirEdicion("adicional")}
        onEditarSistema={() => abrirEdicion("sistema")}
        onEditarContacto={() => abrirEdicion("contacto")}
      />

      {seccion && datosEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-edicion-perfil"
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 id="titulo-edicion-perfil" className="text-xl font-semibold text-[#2782df]">
              {secciones[seccion].titulo}
            </h2>

            <form onSubmit={guardarCambios} className="mt-5 space-y-4">
              {secciones[seccion].campos.map((campo) => (
                <label key={campo.nombre} className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-800">
                    {campo.etiqueta}
                  </span>
                  {campo.tipo === "textarea" ? (
                    <textarea
                      value={datosEdicion[campo.nombre]}
                      rows={3}
                      onChange={(event) =>
                        setDatosEdicion({ ...datosEdicion, [campo.nombre]: event.target.value })
                      }
                      className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-[#2782df]"
                    />
                  ) : campo.tipo === "select" ? (
                    <select
                      value={datosEdicion[campo.nombre]}
                      onChange={(event) =>
                        setDatosEdicion({ ...datosEdicion, [campo.nombre]: event.target.value })
                      }
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-[#2782df]"
                    >
                      <option value="">Seleccionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  ) : (
                    <input
                      type={campo.tipo ?? "text"}
                      value={datosEdicion[campo.nombre]}
                      maxLength={campo.maxLength}
                      required={campo.requerido}
                      onChange={(event) =>
                        setDatosEdicion({ ...datosEdicion, [campo.nombre]: event.target.value })
                      }
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-gray-900 outline-none focus:border-[#2782df]"
                    />
                  )}
                </label>
              ))}

              {errorEdicion && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorEdicion}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setSeccion(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-md bg-[#2782df] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f6fbe] disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
