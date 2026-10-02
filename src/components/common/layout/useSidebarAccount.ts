"use client";

import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";
import { cerrarSesion as cerrarSesionEnServidor } from "@/lib/cerrar-sesion";
import { PROFILE_PHOTO_UPDATED_EVENT } from "@/lib/profile-events";

type Cuenta = {
  nombre: string;
  iniciales: string;
  fotoPerfil: string | null;
};

export function useSidebarAccount() {
  const [cuenta, setCuenta] = useState<Cuenta>({ nombre: "Mi perfil", iniciales: "", fotoPerfil: null });
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSalida, setErrorSalida] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let fotoActualizada = false;

    function actualizarFoto(event: Event) {
      const fotoPerfil = (event as CustomEvent<unknown>).detail;
      if (typeof fotoPerfil !== "string" && fotoPerfil !== null) return;

      const fotoUrl = fotoPerfil ? new URL(fotoPerfil, API_URL).href : null;
      fotoActualizada = true;
      setCuenta((actual) => ({ ...actual, fotoPerfil: fotoUrl }));
    }

    async function cargarCuenta() {
      try {
        const response = await fetch(`${API_URL}/profile`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const { profile } = await response.json();
        if (
          !profile ||
          typeof profile.nombres !== "string" ||
          typeof profile.apellidos !== "string" ||
          controller.signal.aborted
        ) {
          return;
        }

        const nombre = `${profile.nombres} ${profile.apellidos}`.trim();
        if (!nombre) return;

        const fotoUrl = typeof profile.fotoPerfil === "string" && profile.fotoPerfil
          ? new URL(profile.fotoPerfil, API_URL).href
          : null;

        setCuenta((actual) => ({
          nombre,
          iniciales: `${profile.nombres.charAt(0)}${profile.apellidos.charAt(0)}`.toUpperCase(),
          fotoPerfil: fotoActualizada ? actual.fotoPerfil : fotoUrl,
        }));
      } catch {
        if (!controller.signal.aborted) {
          setCuenta((actual) => ({
            nombre: "Mi perfil",
            iniciales: "",
            fotoPerfil: fotoActualizada ? actual.fotoPerfil : null,
          }));
        }
      }
    }

    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, actualizarFoto);
    void cargarCuenta();
    return () => {
      controller.abort();
      window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, actualizarFoto);
    };
  }, []);

  async function cerrarSesion() {
    setCerrandoSesion(true);
    setErrorSalida(false);

    try {
      await cerrarSesionEnServidor();
    } catch {
      setErrorSalida(true);
      setCerrandoSesion(false);
    }
  }

  return { ...cuenta, cerrarSesion, cerrandoSesion, errorSalida };
}
