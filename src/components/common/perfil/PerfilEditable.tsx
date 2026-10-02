"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import VistaPerfil from "@/components/common/perfil/vista-perfil";
import { API_URL } from "@/lib/api";
import { notificarFotoPerfil } from "@/lib/profile-events";

type PerfilEstudiante = {
  id: string;
  nombres: string;
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
};

type Props = {
  rolEsperado: PerfilEstudiante["rol"];
};

const rutasPorRol: Record<PerfilEstudiante["rol"], string> = {
  Estudiante: "/alumno/perfil",
  Docente: "/docente/perfil",
  Administrador: "/administrador/dashboard",
};

type DatosEdicion = {
  fechaNacimiento: string;
  genero: string;
  nacionalidad: string;
  direccion: string;
  telefono: string;
};

type SeccionEdicion = "adicional" | "contacto";
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

export default function PerfilEditable({ rolEsperado }: Props) {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null);
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState<SeccionEdicion | null>(null);
  const [datosEdicion, setDatosEdicion] = useState<DatosEdicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");
  const archivoFoto = useRef<HTMLInputElement>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState("");
  const [errorFoto, setErrorFoto] = useState("");
  const [eliminandoFoto, setEliminandoFoto] = useState(false);

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

        if (profile.rol !== rolEsperado) {
          router.replace(rutasPorRol[profile.rol]);
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
  }, [router, rolEsperado]);

  function abrirEdicion(nuevaSeccion: SeccionEdicion) {
    if (!perfil || subiendoFoto || eliminandoFoto) return;

    setDatosEdicion({
      fechaNacimiento: perfil.fechaNacimiento ?? "",
      genero: codigoGenero(perfil.genero),
      nacionalidad: perfil.nacionalidad ?? "",
      direccion: perfil.direccion ?? "",
      telefono: perfil.telefono ?? "",
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

  async function subirFoto(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";

    if (!archivo || subiendoFoto || eliminandoFoto || guardando || seccion !== null) return;

    setErrorFoto("");
    setMensajeFoto("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      setErrorFoto("Selecciona una imagen JPG, PNG o WebP.");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setErrorFoto("La foto no debe superar los 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("foto", archivo);
    setSubiendoFoto(true);

    try {
      const response = await fetch(`${API_URL}/profile/photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || typeof data.fotoPerfil !== "string") {
        throw new Error(data.message ?? "No se pudo subir la foto.");
      }

      setPerfil((perfilActual) =>
        perfilActual ? { ...perfilActual, fotoPerfil: data.fotoPerfil } : perfilActual
      );
      notificarFotoPerfil(data.fotoPerfil);
      setMensajeFoto("Foto actualizada correctamente.");
    } catch (requestError) {
      setErrorFoto(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo subir la foto."
      );
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function eliminarFoto() {
    if (!perfil?.fotoPerfil || subiendoFoto || eliminandoFoto || guardando || seccion !== null) return;
    if (!window.confirm("¿Eliminar tu foto de perfil?")) return;

    setErrorFoto("");
    setMensajeFoto("");
    setEliminandoFoto(true);

    try {
      const response = await fetch(`${API_URL}/profile/photo`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || data.fotoPerfil !== null) {
        throw new Error(data.message ?? "No se pudo eliminar la foto.");
      }

      setPerfil((perfilActual) =>
        perfilActual ? { ...perfilActual, fotoPerfil: null } : perfilActual
      );
      notificarFotoPerfil(null);
      setMensajeFoto("Foto eliminada correctamente.");
    } catch (requestError) {
      setErrorFoto(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo eliminar la foto."
      );
    } finally {
      setEliminandoFoto(false);
    }
  }

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!perfil) return <div className="p-8 text-gray-600">Cargando perfil...</div>;

  const nombreCompleto = perfil.nombres.toUpperCase()
  const iniciales = perfil.nombres
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte.charAt(0))
  .join("")
  .toUpperCase()

  return (
    <>
      <input
        ref={archivoFoto}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Seleccionar foto de perfil"
        className="hidden"
        onChange={subirFoto}
        disabled={subiendoFoto || eliminandoFoto || guardando || seccion !== null}
      />
      {errorFoto || mensajeFoto ? (
        <div className="px-6 pt-4 lg:px-10">
          <div
            className={`mx-auto flex max-w-[1050px] items-start gap-3 rounded-md border px-4 py-3 text-sm ${
              errorFoto
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#bfdbfe] bg-[#eff6ff] text-[#2782df]"
            }`}
          >
            <p role={errorFoto ? "alert" : "status"} className="min-w-0 flex-1 break-words py-1.5">
              {errorFoto || mensajeFoto}
            </p>
            <button
              type="button"
              aria-label="Cerrar aviso de foto"
              title="Cerrar aviso"
              onClick={() => {
                setMensajeFoto("");
                setErrorFoto("");
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-2xl leading-none transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      ) : null}
      <VistaPerfil
        iniciales={iniciales}
        fotoPerfil={perfil.fotoPerfil ? new URL(perfil.fotoPerfil, API_URL).href : null}
        onCambiarFoto={() => archivoFoto.current?.click()}
        onEliminarFoto={eliminarFoto}
        subiendoFoto={subiendoFoto}
        eliminandoFoto={eliminandoFoto}
        fotoDeshabilitada={guardando || seccion !== null}
        nombreCompleto={nombreCompleto}
        usuario={perfil.usuario}
        rol={rolEsperado}
        etiquetaId={
          rolEsperado === "Estudiante"
          ? "ID de estudiante"
          : rolEsperado === "Docente"
          ? "ID de docente"
          : "ID de administrador"
        }
        correo={mostrarDato(perfil.correo)}
        numeroId={mostrarDato(perfil.idPersona)}
        fechaNacimiento={mostrarFecha(perfil.fechaNacimiento)}
        genero={mostrarGenero(perfil.genero)}
        nacionalidad={mostrarDato(perfil.nacionalidad)}
        direccion={mostrarDato(perfil.direccion)}
        telefono={mostrarDato(perfil.telefono)}
        onEditarAdicional={() => abrirEdicion("adicional")}
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
