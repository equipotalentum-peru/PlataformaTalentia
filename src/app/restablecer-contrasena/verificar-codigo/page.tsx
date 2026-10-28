"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

export default function VerificarCodigoPage() {
  const router = useRouter();

  const [codigo, setCodigo] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [correo, setCorreo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputsRef = useRef<
    Array<HTMLInputElement | null>
  >([]);

  useEffect(() => {
    const correoGuardado =
      sessionStorage.getItem(
        "correo-recuperacion"
      );

    if (correoGuardado) {
      setCorreo(correoGuardado);
    }
  }, []);

  const handleChange = (
    index: number,
    value: string
  ) => {
    const numero = value
      .replace(/\D/g, "")
      .slice(-1);

    const nuevoCodigo = [...codigo];

    nuevoCodigo[index] = numero;

    setCodigo(nuevoCodigo);

    if (numero && index < 5) {
      inputsRef.current[
        index + 1
      ]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Backspace" &&
      !codigo[index] &&
      index > 0
    ) {
      inputsRef.current[
        index - 1
      ]?.focus();
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMensaje("");

    const codigoCompleto =
      codigo.join("");

    if (codigoCompleto.length !== 6) {
      setError(
        "Ingresa el código de 6 dígitos."
      );
      return;
    }

    if (!correo) {
      setError(
        "No se encontró el correo de recuperación."
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        "http://localhost:4000/api/auth/verify-reset-code",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            correo,
            codigo: codigoCompleto,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Código inválido o expirado."
        );
        return;
      }

      sessionStorage.setItem(
        "codigo-recuperacion",
        codigoCompleto
      );

      router.push(
        "/restablecer-contrasena/nueva-contrasena"
      );
    } catch (error) {
      console.error(
        "Error verificando código:",
        error
      );

      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setError("");
    setMensaje("");

    if (!correo) {
      setError(
        "No se encontró el correo de recuperación."
      );
      return;
    }

    try {
      setIsResending(true);

      const response = await fetch(
        "http://localhost:4000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            correo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "No se pudo reenviar el código."
        );
        return;
      }

      setCodigo([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      sessionStorage.removeItem(
        "codigo-recuperacion"
      );

      setMensaje(
        "Se envió un nuevo código a tu correo."
      );

      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    } catch (error) {
      console.error(
        "Error reenviando código:",
        error
      );

      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full text-[13px] text-talentia-primary">

        {/* VOLVER */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/restablecer-contrasena"
            )
          }
          className="text-[12px] font-medium text-talentia-blue hover:underline"
        >
          ← Volver
        </button>

        {/* TÍTULO */}

        <div className="mb-8 text-center">

          <h1 className="mt-5 text-[15px] font-semibold leading-5 text-talentia-primary">
            Verifica tu código
          </h1>

          <p className="mt-8 text-left text-[13px] text-talentia-primary">
            Hemos enviado un código de 6 dígitos a tu correo electrónico.
          </p>

          {/* CORREO */}

          <div className="mt-3 flex items-center gap-2 text-left">

            <svg
              className="h-5 w-5 shrink-0 text-talentia-blue"
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

            <span className="break-all text-[13px] font-medium text-talentia-primary">
              {correo ||
                "Correo no disponible"}
            </span>

          </div>

        </div>

        {/* FORMULARIO */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label className="mb-2 block text-[13px] font-medium text-talentia-blue">
              Código de verificación
            </label>

            {/* 6 CASILLAS */}

            <div className="flex justify-between gap-1.5 min-[380px]:gap-2">
              {codigo.map(
                (valor, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[
                        index
                      ] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={valor}
                    disabled={
                      isLoading ||
                      isResending
                    }
                    onChange={(event) =>
                      handleChange(
                        index,
                        event.target.value
                      )
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(
                        index,
                        event
                      )
                    }
                    className="
                      h-[44px]
                      w-full
                      max-w-[48px]
                      rounded-[7px]
                      border
                      border-talentia-border
                      bg-talentia-surface
                      text-center
                      text-[16px]
                      font-semibold
                      text-talentia-primary
                      outline-none
                      transition
                      focus:border-talentia-blue
                      focus:ring-2
                      focus:ring-talentia-blue/15
                      disabled:cursor-not-allowed
                      disabled:opacity-70
                    "
                  />
                )
              )}
            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-3 py-2 text-[13px] text-talentia-danger">
              {error}
            </div>
          )}

          {/* MENSAJE OK */}

          {mensaje && (
            <div className="rounded-md border border-talentia-success/20 bg-talentia-success-bg px-3 py-2 text-[13px] text-talentia-success">
              {mensaje}
            </div>
          )}

          {/* REENVIAR */}

          <div className="text-center text-[12px] text-talentia-muted">
            ¿No recibiste el código?{" "}

            <button
              type="button"
              onClick={
                handleReenviarCodigo
              }
              disabled={
                isLoading ||
                isResending
              }
              className="font-medium text-talentia-blue hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending
                ? "Reenviando..."
                : "Reenviar código"}
            </button>
          </div>

          {/* BOTÓN */}

          <button
            type="submit"
            disabled={
              isLoading ||
              isResending
            }
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
              ? "VERIFICANDO..."
              : "VERIFICAR CÓDIGO"}
          </button>

        </form>

      </div>
    </AuthLayout>
  );
}
