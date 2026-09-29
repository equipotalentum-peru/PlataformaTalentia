"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen bg-[#e8edf4] flex items-center justify-center px-6 py-10">

      <div className="grid w-full max-w-[1450px] grid-cols-1 items-center gap-12 lg:grid-cols-2">

        {/* =========================
            LADO IZQUIERDO
           ========================= */}

        <div className="hidden items-center justify-center lg:flex">

          <img
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia"
            className="w-full max-w-[600px] object-contain"
          />

        </div>

        {/* =========================
            TARJETA
           ========================= */}

        <div className="flex justify-center">

          <div className="w-full max-w-[520px] rounded-[28px] bg-white px-10 py-12 shadow-sm md:px-14">

            {/* LOGO SOLO EN MÓVIL */}

            <div className="mb-8 flex justify-center lg:hidden">
              <img
                src="/images/Talentia_grande_sin_fondo.png"
                alt="Talentia"
                className="w-full max-w-[260px] object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mb-10 text-[14px] font-medium text-[#2d97e8] hover:underline"
            >
              ← Volver
            </button>

            <h1 className="text-[34px] font-bold tracking-[-0.8px] text-[#102963]">
              Restablecer contraseña
            </h1>

            <p className="mt-4 text-[16px] leading-6 text-gray-500">
              Ingresa tu correo electrónico y te enviaremos un código para
              restablecer tu contraseña.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10"
            >

              <label
                htmlFor="email"
                className="mb-2 block text-[13px] font-semibold text-[#183665]"
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
                    h-[56px]
                    w-full
                    rounded-[10px]
                    border
                    border-[#d7dce5]
                    bg-white
                    px-4
                    pr-12
                    text-[14px]
                    text-gray-800
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-[#2d97e8]
                    focus:ring-2
                    focus:ring-[#2d97e8]/15
                    disabled:cursor-not-allowed
                    disabled:bg-gray-100
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-[#6f83a5]
                  "
                >
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

              {error && (
                <div
                  className="
                    mt-4
                    rounded-md
                    border
                    border-red-200
                    bg-red-50
                    px-3
                    py-2
                    text-[12px]
                    text-red-600
                  "
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="
                  mt-7
                  h-[56px]
                  w-full
                  rounded-[10px]
                  bg-[#2d97e8]
                  text-[14px]
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
                  ? "ENVIANDO..."
                  : "ENVIAR CÓDIGO"}
              </button>

            </form>

            <div className="mt-7 flex items-start gap-3 text-[12px] leading-5 text-gray-500">

              <div className="mt-0.5 rounded-full bg-blue-50 p-2 text-[#2d97e8]">

                <svg
                  className="h-4 w-4"
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

              </div>

              <p>
                Tu información está segura. Solo enviaremos un código de
                recuperación a tu correo electrónico.
              </p>

            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="
                mx-auto
                mt-9
                block
                text-[14px]
                font-semibold
                text-[#2d97e8]
                hover:underline
              "
            >
              Volver al inicio de sesión
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}