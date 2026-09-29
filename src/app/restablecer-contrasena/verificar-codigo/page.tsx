"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

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
    <main
      className="
        min-h-screen
        bg-[#e8edf4]
        flex
        items-center
        justify-center
        px-4
        py-6
        sm:px-6
        sm:py-10
      "
    >
      <div
        className="
          grid
          w-full
          max-w-[1450px]
          grid-cols-1
          items-center
          gap-12
          lg:grid-cols-2
        "
      >
        {/* LADO IZQUIERDO */}

        <div
          className="
            hidden
            items-center
            justify-center
            lg:flex
          "
        >
          <img
            src="/images/Talentia_grande_sin_fondo.png"
            alt="Talentia"
            className="
              w-full
              max-w-[600px]
              object-contain
            "
          />
        </div>

        {/* TARJETA */}

        <div className="flex justify-center">
          <div
            className="
              w-full
              max-w-[520px]
              rounded-[20px]
              bg-white
              px-5
              py-8
              shadow-sm
              sm:rounded-[28px]
              sm:px-10
              sm:py-12
              md:px-14
            "
          >
            {/* LOGO SOLO EN MÓVIL */}

            <div className="mb-8 flex justify-center lg:hidden">
              <img
                src="/images/Talentia_grande_sin_fondo.png"
                alt="Talentia"
                className="
                  w-full
                  max-w-[250px]
                  object-contain
                "
              />
            </div>

            {/* VOLVER */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/restablecer-contrasena"
                )
              }
              className="
                mb-10
                text-[14px]
                font-medium
                text-[#2d97e8]
                hover:underline
              "
            >
              ← Volver
            </button>

            {/* TÍTULO */}

            <h1
              className="
                text-[30px]
                font-bold
                tracking-[-0.8px]
                text-[#102963]
                sm:text-[34px]
              "
            >
              Verifica tu código
            </h1>

            <p
              className="
                mt-4
                text-[15px]
                leading-6
                text-gray-500
                sm:text-[16px]
              "
            >
              Hemos enviado un código de
              6 dígitos a tu correo
              electrónico.
            </p>

            {/* CORREO */}

            <div
              className="
                mt-7
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  rounded-full
                  bg-blue-50
                  p-3
                  text-[#2d97e8]
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

              <span
                className="
                  break-all
                  text-[14px]
                  font-medium
                  text-gray-700
                "
              >
                {correo ||
                  "Correo no disponible"}
              </span>
            </div>

            {/* FORMULARIO */}

            <form
              onSubmit={handleSubmit}
              className="mt-9"
            >
              <label
                className="
                  mb-4
                  block
                  text-[13px]
                  font-semibold
                  text-[#183665]
                "
              >
                Ingresa el código de
                verificación
              </label>

              {/* 6 CASILLAS */}

              <div
                className="
                  flex
                  justify-between
                  gap-1.5
                  sm:gap-2
                "
              >
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
                        h-[52px]
                        w-full
                        max-w-[55px]
                        rounded-[10px]
                        border
                        border-[#d7dce5]
                        bg-white
                        text-center
                        text-[22px]
                        font-semibold
                        text-[#102963]
                        outline-none
                        transition
                        focus:border-[#2d97e8]
                        focus:ring-2
                        focus:ring-[#2d97e8]/15
                        disabled:cursor-not-allowed
                        disabled:bg-gray-100
                        sm:h-[60px]
                      "
                    />
                  )
                )}
              </div>

              {/* ERROR */}

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

              {/* MENSAJE OK */}

              {mensaje && (
                <div
                  className="
                    mt-4
                    rounded-md
                    border
                    border-green-200
                    bg-green-50
                    px-3
                    py-2
                    text-[12px]
                    text-green-700
                  "
                >
                  {mensaje}
                </div>
              )}

              {/* REENVIAR */}

              <div
                className="
                  mt-7
                  text-center
                  text-[13px]
                  text-gray-500
                "
              >
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
                  className="
                    font-medium
                    text-[#2d97e8]
                    hover:underline
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
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
                  ? "VERIFICANDO..."
                  : "VERIFICAR CÓDIGO"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}