"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError(
        "Ingresa tu usuario y contraseña."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            usuario: username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "No se pudo iniciar sesión."
        );
      }

      if (data.user.rol === "Administrador") {
        router.push("/administrador/dashboard");
      } else if (data.user.rol === "Docente") {
        router.push("/docente");
      } else {
        router.push("/alumno/cursos");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al iniciar sesión."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">

      {/* ==========================================
          TÍTULO
         ========================================== */}

      <div className="mb-8 text-center">

        <p className="mt-5 text-[16px] font-semibold leading-5 text-gray-900">
          ¡Bienvenido a nuestra nueva experiencia de
          <br />
          aprendizaje de Talentia!
        </p>

        <p className="mt-8 text-left text-[13px] text-gray-800">
          Ingresa tus datos para iniciar sesión
        </p>

      </div>

      {/* ==========================================
          FORMULARIO
         ========================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* USUARIO */}

        <div>

          <label
            htmlFor="username"
            className="mb-2 block text-[12px] font-medium text-[#2f73c9]"
          >
            Usuario
          </label>

          <div className="relative">

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
              autoComplete="username"
              className="
                h-[40px]
                w-full
                rounded-[7px]
                border
                border-[#d7d9df]
                bg-white
                px-3
                pr-11
                text-[13px]
                text-gray-800
                outline-none
                transition
                focus:border-[#2e86dc]
                focus:ring-2
                focus:ring-[#2e86dc]/15
              "
            />

            {/* Icono */}
            <button
              type="button"
              tabIndex={-1}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-[#2f73c9]
              "
              aria-label="Usuario"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.5"
                />

                <path d="M5 20c.8-3.4 3.2-5.3 7-5.3s6.2 1.9 7 5.3" />
              </svg>
            </button>

          </div>

        </div>

        {/* CONTRASEÑA */}

        <div>

          <label
            htmlFor="password"
            className="mb-2 block text-[12px] font-medium text-[#2f73c9]"
          >
            Contraseña
          </label>

          <div className="relative">

            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              className="
                h-[40px]
                w-full
                rounded-[7px]
                border
                border-[#d7d9df]
                bg-white
                px-3
                pr-11
                text-[13px]
                text-gray-800
                outline-none
                transition
                focus:border-[#2e86dc]
                focus:ring-2
                focus:ring-[#2e86dc]/15
              "
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (current) => !current
                )
              }
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-[#2f73c9]
                transition
                hover:text-[#1554a0]
              "
              aria-label={
                showPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.5 10.5a2.1 2.1 0 0 0 3 3" />
                  <path d="M9.9 5.2A10 10 0 0 1 12 5c5 0 8.5 4 9.5 7a12 12 0 0 1-2.2 3.8" />
                  <path d="M6.3 6.3A11.2 11.2 0 0 0 2.5 12c1 3 4.5 7 9.5 7 1.2 0 2.3-.2 3.3-.6" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle
                    cx="12"
                    cy="12"
                    r="2.5"
                  />
                </svg>
              )}
            </button>

          </div>

          <div className="mt-2 text-right">

           <button 
  type="button"
  onClick={() => router.push("/restablecer-contrasena")}
  className=" 
    text-[11px] 
    font-medium 
    text-[#2867bd] 
    hover:underline 
  " 
> 
  Restablecer contraseña 
</button>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div
            className="
              rounded-md
              border
              border-red-200
              bg-red-50
              px-3 py-2
              text-[12px]
              text-red-600
            "
          >
            {error}
          </div>
        )}

        {/* INICIAR SESIÓN */}

        <button
          type="submit"
          disabled={isLoading}
          className="
            mt-5
            h-[45px]
            w-full
            rounded-[8px]
            bg-[#2d97e8]
            text-[13px]
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-[#2088d8]
            disabled:cursor-not-allowed
            disabled:opacity-70
          "
        >
          {isLoading
            ? "INGRESANDO..."
            : "INICIAR SESIÓN"}
        </button>

        {/* O */}

        <div className="relative py-0.5">

          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-transparent" />
          </div>

          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[12px] font-semibold text-gray-500">
              Ó
            </span>
          </div>

        </div>

        {/* REGISTRARSE */}

        <button
          type="button"
          onClick={() => router.push("/registro")}
          className="
            h-[45px]
            w-full
            rounded-[8px]
            bg-[#1554ad]
            text-[13px]
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-[#0d4697]
          "
        >
          REGISTRARSE
        </button>

      </form>

    </div>
  );
}