"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function NuevaContrasenaPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [correo, setCorreo] =
    useState("");

  const [codigo, setCodigo] =
    useState("");

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  /* ==========================================
     RECUPERAR CORREO Y CÓDIGO
  ========================================== */

  useEffect(() => {
    const correoGuardado =
      sessionStorage.getItem(
        "correo-recuperacion"
      );

    const codigoGuardado =
      sessionStorage.getItem(
        "codigo-recuperacion"
      );

    if (correoGuardado) {
      setCorreo(correoGuardado);
    }

    if (codigoGuardado) {
      setCodigo(codigoGuardado);
    }

    /*
     * Si alguien intenta entrar directamente
     * sin haber verificado un código,
     * lo regresamos al inicio del proceso.
     */
    if (
      !correoGuardado ||
      !codigoGuardado
    ) {
      router.replace(
        "/restablecer-contrasena"
      );
    }
  }, [router]);

  /* ==========================================
     GUARDAR NUEVA CONTRASEÑA
  ========================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMensaje("");

    if (
      !password ||
      !confirmPassword
    ) {
      setError(
        "Completa ambos campos."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres."
      );
      return;
    }

    /*
     * Validar al menos una mayúscula.
     */
    if (!/[A-Z]/.test(password)) {
      setError(
        "La contraseña debe incluir al menos una letra mayúscula."
      );
      return;
    }

    /*
     * Validar al menos una minúscula.
     */
    if (!/[a-z]/.test(password)) {
      setError(
        "La contraseña debe incluir al menos una letra minúscula."
      );
      return;
    }

    /*
     * Validar al menos un número.
     */
    if (!/[0-9]/.test(password)) {
      setError(
        "La contraseña debe incluir al menos un número."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    if (!correo || !codigo) {
      setError(
        "La solicitud de recuperación no es válida."
      );
      return;
    }

    try {
      setIsLoading(true);

      const response =
        await fetch(
          "http://localhost:4000/api/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              correo,
              codigo,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "No se pudo actualizar la contraseña."
        );
        return;
      }

      setMensaje(
        "Contraseña actualizada correctamente."
      );

      /*
       * Eliminamos los datos temporales
       * del proceso de recuperación.
       */
      sessionStorage.removeItem(
        "correo-recuperacion"
      );

      sessionStorage.removeItem(
        "codigo-recuperacion"
      );

      /*
       * Esperamos un momento para mostrar
       * el mensaje y regresamos al login.
       */
      window.setTimeout(() => {
        router.push("/login");
      }, 1200);

    } catch (error) {
      console.error(
        "Error actualizando contraseña:",
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
    <main className="min-h-screen bg-[#e8edf4] flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">

      <div className="grid w-full max-w-[1450px] grid-cols-1 items-center gap-12 lg:grid-cols-2">

        {/* ==========================================
            LADO IZQUIERDO
        ========================================== */}

        <div className="hidden items-center justify-center lg:flex">

          <img
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia"
            className="w-full max-w-[600px] object-contain"
          />

        </div>

        {/* ==========================================
            TARJETA
        ========================================== */}

        <div className="flex justify-center">

          <div className="w-full max-w-[520px] rounded-[20px] bg-white px-5 py-8 shadow-sm sm:rounded-[28px] sm:px-10 sm:py-12 md:px-14">

            {/* LOGO SOLO EN MÓVIL */}

            <div className="mb-8 flex justify-center lg:hidden">

              <img
                src="/images/Talentia_grande_sin_fondo.png"
                alt="Talentia"
                className="w-full max-w-[250px] object-contain"
              />

            </div>

            {/* VOLVER */}

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                router.push(
                  "/restablecer-contrasena/verificar-codigo"
                )
              }
              className="
                mb-10
                text-[14px]
                font-medium
                text-[#2d97e8]
                hover:underline
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              ← Volver
            </button>

            {/* TÍTULO */}

            <h1 className="text-[30px] font-bold tracking-[-0.8px] text-[#102963] sm:text-[34px]">
              Crea tu nueva contraseña
            </h1>

            <p className="mt-4 text-[15px] leading-6 text-gray-500 sm:text-[16px]">
              Ingresa una nueva contraseña segura para tu cuenta.
            </p>

            {/* FORMULARIO */}

            <form
              onSubmit={handleSubmit}
              className="mt-10"
            >

              {/* ==========================================
                  NUEVA CONTRASEÑA
              ========================================== */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-[13px] font-semibold text-[#183665]"
                >
                  Nueva contraseña
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
                    disabled={isLoading}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
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
                      focus:border-[#2d97e8]
                      focus:ring-2
                      focus:ring-[#2d97e8]/15
                      disabled:cursor-not-allowed
                      disabled:bg-gray-100
                    "
                  />

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-[#6f83a5]
                      hover:text-[#2d97e8]
                      disabled:cursor-not-allowed
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
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
              </div>

              {/* ==========================================
                  CONFIRMAR CONTRASEÑA
              ========================================== */}

              <div className="mt-6">

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-[13px] font-semibold text-[#183665]"
                >
                  Confirmar contraseña
                </label>

                <div className="relative">

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    disabled={isLoading}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
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
                      focus:border-[#2d97e8]
                      focus:ring-2
                      focus:ring-[#2d97e8]/15
                      disabled:cursor-not-allowed
                      disabled:bg-gray-100
                    "
                  />

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="
                      absolute
                      right-4
                      top-1/2
                      -translate-y-1/2
                      text-[#6f83a5]
                      hover:text-[#2d97e8]
                      disabled:cursor-not-allowed
                    "
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showConfirmPassword ? (

                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
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
              </div>

              {/* ==========================================
                  REQUISITOS
              ========================================== */}

              <div className="mt-6 text-[13px] text-gray-500">

                <p className="mb-2 font-medium text-gray-600">
                  La contraseña debe incluir:
                </p>

                <ul className="space-y-1">

                  <li>
                    • Mínimo 8 caracteres
                  </li>

                  <li>
                    • Una mayúscula y una minúscula
                  </li>

                  <li>
                    • Al menos un número
                  </li>

                </ul>

              </div>

              {/* ERROR */}

              {error && (
                <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                  {error}
                </div>
              )}

              {/* ÉXITO */}

              {mensaje && (
                <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-700">
                  {mensaje}
                </div>
              )}

              {/* BOTÓN */}

              <button
                type="submit"
                disabled={isLoading}
                className="
                  mt-8
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
                  ? "GUARDANDO..."
                  : "GUARDAR CONTRASEÑA"}
              </button>

            </form>

            {/* VOLVER LOGIN */}

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                router.push("/login")
              }
              className="
                mx-auto
                mt-8
                block
                text-[14px]
                font-semibold
                text-[#2d97e8]
                hover:underline
                disabled:cursor-not-allowed
                disabled:opacity-60
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