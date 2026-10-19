"use client";

import React, { useState } from "react";

export default function VistaPerfil() {
  const [perfil] = useState({
    nombreCompleto: "Admin Talentum",
    username: "atalentum",
    rol: "Administrador",
    correo: "atalentum@talentia.edu.pe",
    idAdministrador: "1234567890",
    fechaNacimiento: "24 de octubre del 2000",
    genero: "Masculino",
    nacionalidad: "Peruana",
    direccion: "Av. Alfredo Mendiola 2000 Independencia, Lima",
    telefono: "987654321",
  });

  return (
    <div className="w-full space-y-6">
      {/* Título */}
      <h1 className="text-3xl font-extrabold text-talentia-primary tracking-tight">
        Mi perfil
      </h1>

      {/* Encabezado de Usuario con Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-talentia-action text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
            AT
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 bg-talentia-surface border border-talentia-border text-talentia-primary p-1.5 rounded-full shadow-sm hover:bg-talentia-hover transition"
            title="Cambiar foto"
          >
            📷
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-talentia-primary">
            {perfil.nombreCompleto}
          </h2>
          <p className="text-sm font-semibold text-talentia-muted">
            {perfil.username}
          </p>
          <span className="inline-block bg-talentia-action text-white text-xs font-bold px-3 py-1 rounded-lg">
            {perfil.rol}
          </span>
        </div>
      </div>

      {/* Sección 1: Información básica */}
      <div className="bg-talentia-surface rounded-3xl p-6 shadow-sm border border-talentia-border/80">
        <div className="flex items-center gap-2 mb-4 text-talentia-blue font-extrabold text-sm">
          👤 <span>Información básica</span>
        </div>

        <div className="divide-y divide-talentia-border text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="font-extrabold text-talentia-primary">Nombre completo</span>
            <span className="md:col-span-2 font-semibold text-talentia-muted">
              {perfil.nombreCompleto}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="font-extrabold text-talentia-primary">
              Dirección de correo electronico
            </span>
            <span className="md:col-span-2 font-semibold text-talentia-muted">
              {perfil.correo}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="font-extrabold text-talentia-primary">ID de administrador</span>
            <span className="md:col-span-2 font-semibold text-talentia-muted">
              {perfil.idAdministrador}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Secciones Medias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sección 2: Información adicional */}
        <div className="bg-talentia-surface rounded-3xl p-6 shadow-sm border border-talentia-border/80">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-talentia-blue font-extrabold text-sm">
              📄 <span>Información adicional</span>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-talentia-blue border border-talentia-blue px-3 py-1 rounded-xl hover:bg-talentia-hover transition"
            >
              ✏️ Editar
            </button>
          </div>

          <div className="divide-y divide-talentia-border text-xs">
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-talentia-primary">Fecha de nacimiento</span>
              <span className="font-semibold text-talentia-muted">
                {perfil.fechaNacimiento}
              </span>
            </div>
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-talentia-primary">Genero</span>
              <span className="font-semibold text-talentia-muted">{perfil.genero}</span>
            </div>
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-talentia-primary">Nacionalidad</span>
              <span className="font-semibold text-talentia-muted">{perfil.nacionalidad}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sección 4: Información de contacto */}
      <div className="bg-talentia-surface rounded-3xl p-6 shadow-sm border border-talentia-border/80 max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-talentia-blue font-extrabold text-sm">
            📞 <span>Información de contacto</span>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-talentia-blue border border-talentia-blue px-3 py-1 rounded-xl hover:bg-talentia-hover transition"
          >
            ✏️ Editar
          </button>
        </div>

        <div className="divide-y divide-talentia-border text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 py-3">
            <span className="font-extrabold text-talentia-primary">Dirección</span>
            <span className="font-semibold text-talentia-muted">{perfil.direccion}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 py-3">
            <span className="font-extrabold text-talentia-primary">Número de telefono</span>
            <span className="font-semibold text-talentia-muted">{perfil.telefono}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
