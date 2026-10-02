"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInvitacion, setTokenInvitacion] = useState("");
  const [validandoInvitacion, setValidandoInvitacion] = useState(true);
  const [invitacionValida, setInvitacionValida] = useState(false);
  const [tipoAlumnoInvitado, setTipoAlumnoInvitado] = useState("");

const [formData, setFormData] = useState({
  nombres: "",
  dni: "",
  empresaAliada: "",
  usuario: "",
  genero: "",
  telefono: "",
  fechaNacimiento: "",
  direccion: "",
  correo: "",
  password: "",
  confirmPassword: "",
});

useEffect(() => {
  async function validarInvitacion() {
    try {
      setValidandoInvitacion(true);
      setError("");

      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setInvitacionValida(false);
        setError(
          "Necesitas un enlace de invitación válido para registrarte."
        );
        return;
      }

      setTokenInvitacion(token);

      const response = await fetch(
        `${API_URL}/auth/registration-invitation?token=${encodeURIComponent(
          token
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(
          data.message ??
            "La invitación es inválida o ha expirado."
        );
      }

      setFormData((actual) => ({
  ...actual,
  nombres: data.nombre || "",
  dni: data.dni || "",
  telefono: data.telefono || "",
  correo: data.correo || "",
  empresaAliada:
    data.tipoAlumno === "Convenio"
      ? data.empresaAliada || ""
      : "",
}));

setTipoAlumnoInvitado(data.tipoAlumno || "");

      setInvitacionValida(true);
    } catch (error) {
      setInvitacionValida(false);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo validar la invitación."
      );
    } finally {
      setValidandoInvitacion(false);
    }
  }

  validarInvitacion();
}, []);

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setError("");

    if (
      !formData.nombres.trim() ||
      !formData.usuario.trim() ||
      !formData.correo.trim() ||
      !formData.password
    ) {
      setError("Completa todos los campos.");
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    if (formData.password.length < 8) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombres: formData.nombres,
            dni: formData.dni.trim(),
            empresaAliada: formData.empresaAliada.trim() || null,
            usuario: formData.usuario,
            genero: formData.genero,
            telefono: formData.telefono.trim(),
            fechaNacimiento: formData.fechaNacimiento,
            direccion: formData.direccion.trim(),
           correo: formData.correo.trim().toLowerCase(),
           password: formData.password,
           token: tokenInvitacion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "No se pudo registrar el usuario."
        );
      }

      router.push("/login");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al registrar el usuario."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Título adaptable */}
      <h1 className="text-[20px] min-[380px]:text-[22px] min-[480px]:text-[24px] min-[600px]:text-[26px] min-[1100px]:text-[28px] font-bold tracking-[-0.5px] text-black text-center mb-3 min-[480px]:mb-5 min-[1100px]:mb-6">
        REGISTRO
      </h1>

      <form onSubmit={handleSubmit} className="space-y-2.5 min-[380px]:space-y-3 min-[480px]:space-y-4">
        {/* Nombres */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Nombre Completo
          </label>
          <input
            type="text"
  name="nombres"
  value={formData.nombres}
  readOnly
  required
  className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-gray-100 px-3 text-gray-600 cursor-not-allowed"
          />
        </div>

      

        <div>
          <label htmlFor="registro-dni" className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            DNI
          </label>
          <input
            id="registro-dni"
  name="dni"
  value={formData.dni}
  readOnly
  type="text"
  className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-gray-100 px-3 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="registro-empresa" className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Empresa aliada
          </label>
          <input
              id="registro-empresa"
  name="empresaAliada"
  value={formData.empresaAliada}
  onChange={handleChange}
  type="text"
  disabled={tipoAlumnoInvitado === "Externo"}
  placeholder={
    tipoAlumnoInvitado === "Externo"
      ? "No aplica para alumno externo"
      : "Empresa aliada"
  }
  className={`h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] px-3 text-[13px] outline-none ${
    tipoAlumnoInvitado === "Externo"
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : "bg-white text-gray-800 focus:border-[#2e86dc]"
  }`}
          />
        </div>

        {/* Usuario */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Usuario
          </label>
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            required
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-white px-2.5 min-[380px]:px-3 text-[12px] min-[380px]:text-[13px] text-gray-800 outline-none transition focus:border-[#2e86dc] focus:ring-2 focus:ring-[#2e86dc]/15"
          />
        </div>

        <div>
          <label htmlFor="registro-genero" className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Género
          </label>
          <select
            id="registro-genero"
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-white px-2.5 min-[380px]:px-3 text-[12px] min-[380px]:text-[13px] text-gray-800 outline-none transition focus:border-[#2e86dc] focus:ring-2 focus:ring-[#2e86dc]/15"
          >
            <option value="" disabled>Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div>
          <label htmlFor="registro-telefono" className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Teléfono
          </label>
          <input
            id="registro-telefono"
  name="telefono"
  value={formData.telefono}
  readOnly
  type="tel"
  className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-gray-100 px-3 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="registro-fecha-nacimiento" className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Fecha de nacimiento
          </label>
          <input
            id="registro-fecha-nacimiento"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
            type="date"
            autoComplete="bday"
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-white px-2.5 min-[380px]:px-3 text-[12px] min-[380px]:text-[13px] text-gray-800 outline-none transition focus:border-[#2e86dc] focus:ring-2 focus:ring-[#2e86dc]/15"
          />
        </div>

        <div>
          <label htmlFor="registro-direccion" className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Dirección
          </label>
          <input
            id="registro-direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            type="text"
            autoComplete="street-address"
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-white px-2.5 min-[380px]:px-3 text-[12px] min-[380px]:text-[13px] text-gray-800 outline-none transition focus:border-[#2e86dc] focus:ring-2 focus:ring-[#2e86dc]/15"
          />
        </div>

        {/* Correo electrónico */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Correo electrónico
          </label>
          <input
            type="email"
            name="correo"
            value={formData.correo}
             readOnly
             required
             autoComplete="email"
             inputMode="email"
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-gray-100 px-2.5 min-[380px]:px-3 text-[12px] min-[380px]:text-[13px] text-gray-600 outline-none cursor-not-allowed"
          />
        </div>

        {/* Contraseña */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-white px-2.5 min-[380px]:px-3 pr-9 min-[380px]:pr-11 text-[12px] min-[380px]:text-[13px] text-gray-800 outline-none transition focus:border-[#2e86dc] focus:ring-2 focus:ring-[#2e86dc]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 min-[380px]:right-3 top-1/2 -translate-y-1/2 text-[#2f73c9] transition hover:text-[#1554a0]"
            >
              {showPassword ? (
                <svg className="h-4 w-4 min-[380px]:h-5 min-[380px]:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 3l18 18" />
                  <path d="M10.5 10.5a2.1 2.1 0 0 0 3 3" />
                  <path d="M9.9 5.2A10 10 0 0 1 12 5c5 0 8.5 4 9.5 7a12 12 0 0 1-2.2 3.8" />
                  <path d="M6.3 6.3A11.2 11.2 0 0 0 2.5 12c1 3 4.5 7 9.5 7 1.2 0 2.3-.2 3.3-.6" />
                </svg>
              ) : (
                <svg className="h-4 w-4 min-[380px]:h-5 min-[380px]:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirmar Contraseña */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[11px] min-[380px]:text-[12px] font-medium text-[#2f73c9]">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-[#d7d9df] bg-white px-2.5 min-[380px]:px-3 pr-9 min-[380px]:pr-11 text-[12px] min-[380px]:text-[13px] text-gray-800 outline-none transition focus:border-[#2e86dc] focus:ring-2 focus:ring-[#2e86dc]/15"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 min-[380px]:right-3 top-1/2 -translate-y-1/2 text-[#2f73c9] transition hover:text-[#1554a0]"
            >
              {showConfirmPassword ? (
                <svg className="h-4 w-4 min-[380px]:h-5 min-[380px]:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 3l18 18" />
                  <path d="M10.5 10.5a2.1 2.1 0 0 0 3 3" />
                  <path d="M9.9 5.2A10 10 0 0 1 12 5c5 0 8.5 4 9.5 7a12 12 0 0 1-2.2 3.8" />
                  <path d="M6.3 6.3A11.2 11.2 0 0 0 2.5 12c1 3 4.5 7 9.5 7 1.2 0 2.3-.2 3.3-.6" />
                </svg>
              ) : (
                <svg className="h-4 w-4 min-[380px]:h-5 min-[380px]:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] min-[380px]:text-[12px] text-red-600">
            {error}
          </div>
        )}

        {/* Botón Registrarse */}
        <button
          type="submit"
          disabled={
  isLoading ||
  validandoInvitacion ||
  !invitacionValida
}
          className="mt-3 min-[480px]:mt-4 h-[38px] min-[380px]:h-[42px] min-[480px]:h-[45px] w-full rounded-[8px] bg-[#1554ad] text-[12px] min-[380px]:text-[13px] font-bold text-white shadow-sm transition hover:bg-[#0d4697] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "REGISTRANDO..." : "REGISTRARSE"}
        </button>

      </form>
    </div>
  );
}
