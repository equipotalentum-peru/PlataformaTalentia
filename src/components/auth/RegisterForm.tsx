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
  const [rolInvitado, setRolInvitado] = useState("Estudiante");

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
setRolInvitado(data.rol ?? "Estudiante");

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
            empresaAliada: rolInvitado === "Estudiante"
              ? formData.empresaAliada.trim() || null
              : null,
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
    <div className="w-full text-[13px] text-talentia-primary">
      {/* Título adaptable */}
      <h1 className="text-[15px] font-bold tracking-normal text-talentia-primary text-center mb-3 min-[480px]:mb-5 min-[1100px]:mb-6">
        REGISTRO
      </h1>

      <form onSubmit={handleSubmit} className="space-y-2.5 min-[380px]:space-y-3 min-[480px]:space-y-4">
        {/* Nombres */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Nombre Completo
          </label>
          <input
            type="text"
  name="nombres"
  value={formData.nombres}
  readOnly
  required
  className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-border/50 px-3 text-talentia-muted cursor-not-allowed"
          />
        </div>

      

        <div>
          <label htmlFor="registro-dni" className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            DNI
          </label>
          <input
            id="registro-dni"
  name="dni"
  value={formData.dni}
  readOnly
  type="text"
  className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-border/50 px-3 text-talentia-muted cursor-not-allowed"
          />
        </div>

        {rolInvitado === "Estudiante" && (
        <div>
          <label htmlFor="registro-empresa" className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
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
  className={`h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border px-3 text-[13px] outline-none ${
    tipoAlumnoInvitado === "Externo"
      ? "bg-talentia-border/50 text-talentia-disabled-text cursor-not-allowed"
      : "bg-talentia-surface text-talentia-primary focus:border-talentia-blue"
  }`}
          />
        </div>

        )}

        {/* Usuario */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Usuario
          </label>
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            required
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-surface autofill:shadow-[inset_0_0_0_1000px_white] px-2.5 min-[380px]:px-3 text-[13px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
          />
        </div>

        <div>
          <label htmlFor="registro-genero" className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Género
          </label>
          <select
            id="registro-genero"
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-surface px-2.5 min-[380px]:px-3 text-[13px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
          >
            <option value="" disabled>Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div>
          <label htmlFor="registro-telefono" className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Teléfono
          </label>
          <input
            id="registro-telefono"
  name="telefono"
  value={formData.telefono}
  onChange={handleChange}
  readOnly={rolInvitado === "Estudiante"}
  required
  maxLength={20}
  type="tel"
  className={`h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border px-3 ${rolInvitado === "Estudiante" ? "bg-talentia-border/50 text-talentia-muted cursor-not-allowed" : "bg-talentia-surface text-talentia-primary"}`}
          />
        </div>

        <div>
          <label htmlFor="registro-fecha-nacimiento" className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Fecha de nacimiento
          </label>
          <input
            id="registro-fecha-nacimiento"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
            type="date"
            autoComplete="bday"
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-surface px-2.5 min-[380px]:px-3 text-[13px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
          />
        </div>

        <div>
          <label htmlFor="registro-direccion" className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Dirección
          </label>
          <input
            id="registro-direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            type="text"
            autoComplete="street-address"
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-surface autofill:shadow-[inset_0_0_0_1000px_white] px-2.5 min-[380px]:px-3 text-[13px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
          />
        </div>

        {/* Correo electrónico */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
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
            className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-border/50 px-2.5 min-[380px]:px-3 text-[13px] text-talentia-muted outline-none cursor-not-allowed"
          />
        </div>

        {/* Contraseña */}
        <div>
          <label className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-surface px-2.5 min-[380px]:px-3 pr-9 min-[380px]:pr-11 text-[13px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 min-[380px]:right-3 top-1/2 -translate-y-1/2 text-talentia-blue transition hover:text-talentia-primary"
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
          <label className="mb-0.5 min-[480px]:mb-1 block text-[13px] font-medium text-talentia-blue">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="h-[36px] min-[380px]:h-[38px] min-[480px]:h-[40px] w-full rounded-[7px] border border-talentia-border bg-talentia-surface px-2.5 min-[380px]:px-3 pr-9 min-[380px]:pr-11 text-[13px] text-talentia-primary outline-none transition focus:border-talentia-blue focus:ring-2 focus:ring-talentia-blue/15"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 min-[380px]:right-3 top-1/2 -translate-y-1/2 text-talentia-blue transition hover:text-talentia-primary"
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
          <div className="rounded-md border border-talentia-danger/20 bg-talentia-danger-bg px-2.5 py-1.5 text-[13px] text-talentia-danger">
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
          className="mt-3 min-[480px]:mt-4 h-[38px] min-[380px]:h-[42px] min-[480px]:h-[45px] w-full rounded-[8px] bg-talentia-action text-[13px] font-bold text-white shadow-sm transition hover:bg-talentia-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "REGISTRANDO..." : "REGISTRARSE"}
        </button>

      </form>
    </div>
  );
}
