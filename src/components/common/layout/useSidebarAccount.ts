"use client";

import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";
import { cerrarSesion as cerrarSesionEnServidor } from "@/lib/cerrar-sesion";

type Cuenta = {
  nombre: string;
  iniciales: string;
};

export function useSidebarAccount() {
  const [cuenta, setCuenta] = useState<Cuenta>({ nombre: "Mi perfil", iniciales: "" });
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSalida, setErrorSalida] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

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

        setCuenta({
          nombre,
          iniciales: `${profile.nombres.charAt(0)}${profile.apellidos.charAt(0)}`.toUpperCase(),
        });
      } catch {
        if (!controller.signal.aborted) {
          setCuenta({ nombre: "Mi perfil", iniciales: "" });
        }
      }
    }

    void cargarCuenta();
    return () => controller.abort();
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
