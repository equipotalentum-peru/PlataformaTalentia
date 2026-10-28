"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

export default function RestablecerContrasenaPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        "http://localhost:4000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "No se pudo enviar el código."
        );

        return;
      }

      sessionStorage.setItem(
        "correo-recuperacion",
        email.trim()
      );

      router.push(
        "/restablecer-contrasena/verificar-codigo"
      );
    } catch (error) {
      console.error(
        "Error enviando código:",
        error
      );

      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full text-[13px] text-talentia-primary">

        {/* VOLVER */}

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-[12px] font-medium text-talentia-blue hover:underline"
        >
          ← Volver
        </button>

        {/* TÍTULO */}

        <div className="mb-8 text-center">

          <h1 className="mt-5 text-[15px] font-semibold leading-5 text-talentia-primary">
            Restablecer contraseña
          </h1>

          <p className="mt-8 text-left text-[13px] text-talentia-primary">
            Ingresa tu correo electrónico y te enviaremos un código para
            restablecer tu contraseña.
          </p>

        </div>

        {/* FORMULARIO */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label
              htmlFor="email"
              className="mb-2 block text-[13px] font-medium text-talentia-blue"
            >
              Correo electrónico
            </label>

            <div className="relative">

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="tu.correo@ejemplo.com"
                autoComplete="email"
                disabled={isLoading}
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
                  placeholder:text-talentia-placeholder
                  focus:border-talentia-blue
                  focus:ring-2
                  focus:ring-talentia-blue/15
                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              />

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-talentia-blue">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />

                  <path d="m4 7 8 6 8-6" />
                </svg>
              </div>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-3 py-2 text-[13px] text-talentia-danger">
              {error}
            </div>
          )}

          {/* ENVIAR CÓDIGO */}

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
              ? "ENVIANDO..."
              : "ENVIAR CÓDIGO"}
          </button>

        </form>

        {/* AVISO */}

        <div className="mt-5 flex items-start gap-2 text-[12px] leading-5 text-talentia-muted">

          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-talentia-blue"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect
              x="6"
              y="10"
              width="12"
              height="10"
              rx="2"
            />

            <path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" />
          </svg>

          <p>
            Tu información está segura. Solo enviaremos un código de
            recuperación a tu correo electrónico.
          </p>

        </div>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mx-auto mt-5 block text-[12px] font-medium text-talentia-blue hover:underline"
        >
          Volver al inicio de sesión
        </button>

      </div>
    </AuthLayout>
  );
}
