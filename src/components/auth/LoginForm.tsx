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

      const role = data.user?.rol;

      switch (role) {
        case "Estudiante":
          router.push("/alumno/dashboard");
          break;

        case "Docente":
          router.push("/docente/dashboard");
          break;

        case "Administrador":
          router.push("/administrador/dashboard");
          break;

        default:
          setError("Rol de usuario no reconocido.");
          break;
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
    <div className="w-full text-[13px] text-talentia-primary">

      {/* ==========================================
          TÍTULO
         ========================================== */}

      <div className="mb-8 text-center">

        <p className="mt-5 text-[15px] font-semibold leading-5 text-talentia-primary">
          ¡Bienvenido a nuestra nueva experiencia de
          <br />
          aprendizaje de Talentia!
        </p>

        <p className="mt-8 text-left text-[13px] text-talentia-primary">
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
            className="mb-2 block text-[13px] font-medium text-talentia-blue"
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
                border-talentia-border
                bg-talentia-surface
                px-3
                pr-11
                text-[13px]
                text-talentia-primary
                outline-none
                transition
                focus:border-talentia-blue
                focus:ring-2
                focus:ring-talentia-blue/15
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
                text-talentia-blue
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
            className="mb-2 block text-[13px] font-medium text-talentia-blue"
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
                border-talentia-border
                bg-talentia-surface
                px-3
                pr-11
                text-[13px]
                text-talentia-primary
                outline-none
                transition
                focus:border-talentia-blue
                focus:ring-2
                focus:ring-talentia-blue/15
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
                text-talentia-blue
                transition
                hover:text-talentia-primary
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
    text-[12px]
    font-medium 
    text-talentia-blue
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
              border-talentia-danger/20
              bg-talentia-danger-bg
              px-3 py-2
              text-[13px]
              text-talentia-danger
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
            bg-talentia-action
            text-[13px]
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-talentia-primary
            disabled:cursor-not-allowed
            disabled:opacity-70
          "
        >
          {isLoading
            ? "INGRESANDO..."
            : "INICIAR SESIÓN"}
        </button>

        

  
      </form>

    </div>
  );
}
