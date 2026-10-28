"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

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

  const inputClassName = `
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
    disabled:cursor-not-allowed
    disabled:opacity-70
  `;

  const eyeButtonClassName = `
    absolute
    right-3
    top-1/2
    -translate-y-1/2
    text-talentia-blue
    transition
    hover:text-talentia-primary
    disabled:cursor-not-allowed
  `;

  const eyeOpenIcon = (
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
  );

  const eyeClosedIcon = (
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
  );

  return (
    <AuthLayout>
      <div className="w-full text-[13px] text-talentia-primary">

        {/* VOLVER */}

        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            router.push(
              "/restablecer-contrasena/verificar-codigo"
            )
          }
          className="text-[12px] font-medium text-talentia-blue hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          ← Volver
        </button>

        {/* TÍTULO */}

        <div className="mb-8 text-center">

          <h1 className="mt-5 text-[15px] font-semibold leading-5 text-talentia-primary">
            Crea tu nueva contraseña
          </h1>

          <p className="mt-8 text-left text-[13px] text-talentia-primary">
            Ingresa una nueva contraseña segura para tu cuenta.
          </p>

        </div>

        {/* FORMULARIO */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* NUEVA CONTRASEÑA */}

          <div>

            <label
              htmlFor="password"
              className="mb-2 block text-[13px] font-medium text-talentia-blue"
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
                className={inputClassName}
              />

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                className={eyeButtonClassName}
                aria-label={
                  showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showPassword
                  ? eyeClosedIcon
                  : eyeOpenIcon}
              </button>

            </div>

          </div>

          {/* CONFIRMAR CONTRASEÑA */}

          <div>

            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-[13px] font-medium text-talentia-blue"
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
                value={confirmPassword}
                disabled={isLoading}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                className={inputClassName}
              />

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                className={eyeButtonClassName}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showConfirmPassword
                  ? eyeClosedIcon
                  : eyeOpenIcon}
              </button>

            </div>

          </div>

          {/* REQUISITOS */}

          <div className="text-[12px] text-talentia-muted">

            <p className="mb-1 font-medium text-talentia-primary">
              La contraseña debe incluir:
            </p>

            <ul className="space-y-0.5">
              <li>• Mínimo 8 caracteres</li>
              <li>• Una mayúscula y una minúscula</li>
              <li>• Al menos un número</li>
            </ul>

          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-3 py-2 text-[13px] text-talentia-danger">
              {error}
            </div>
          )}

          {/* ÉXITO */}

          {mensaje && (
            <div className="rounded-md border border-talentia-success/20 bg-talentia-success-bg px-3 py-2 text-[13px] text-talentia-success">
              {mensaje}
            </div>
          )}

          {/* BOTÓN */}

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
          className="mx-auto mt-5 block text-[12px] font-medium text-talentia-blue hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Volver al inicio de sesión
        </button>

      </div>
    </AuthLayout>
  );
}
