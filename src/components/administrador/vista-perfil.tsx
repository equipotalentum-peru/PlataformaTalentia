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
    idioma: "Español, Perú",
    zonaHoraria: "(UTC-5) Lima",
    tema: "Clara",
    direccion: "Av. Alfredo Mendiola 2000 Independencia, Lima",
    telefono: "987654321",
  });

  return (
    <div className="w-full space-y-6">
      {/* Título */}
      <h1 className="text-3xl font-extrabold text-[#0F2851] tracking-tight">
        Mi perfil
      </h1>

      {/* Encabezado de Usuario con Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#3B82F6] text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
            AT
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 bg-white border border-gray-200 text-[#0F2851] p-1.5 rounded-full shadow-sm hover:bg-gray-50 transition"
            title="Cambiar foto"
          >
            📷
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-[#0F2851]">
            {perfil.nombreCompleto}
          </h2>
          <p className="text-sm font-semibold text-[#64748B]">
            {perfil.username}
          </p>
          <span className="inline-block bg-[#3B82F6] text-white text-xs font-bold px-3 py-1 rounded-lg">
            {perfil.rol}
          </span>
        </div>
      </div>

      {/* Sección 1: Información básica */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
        <div className="flex items-center gap-2 mb-4 text-[#3B82F6] font-extrabold text-sm">
          👤 <span>Información básica</span>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="font-extrabold text-[#0F2851]">Nombre completo</span>
            <span className="md:col-span-2 font-semibold text-[#64748B]">
              {perfil.nombreCompleto}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="font-extrabold text-[#0F2851]">
              Dirección de correo electronico
            </span>
            <span className="md:col-span-2 font-semibold text-[#64748B]">
              {perfil.correo}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="font-extrabold text-[#0F2851]">ID de administrador</span>
            <span className="md:col-span-2 font-semibold text-[#64748B]">
              {perfil.idAdministrador}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Secciones Medias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sección 2: Información adicional */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-[#3B82F6] font-extrabold text-sm">
              📄 <span>Información adicional</span>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-[#3B82F6] border border-[#3B82F6] px-3 py-1 rounded-xl hover:bg-blue-50 transition"
            >
              ✏️ Editar
            </button>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-[#0F2851]">Fecha de nacimiento</span>
              <span className="font-semibold text-[#64748B]">
                {perfil.fechaNacimiento}
              </span>
            </div>
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-[#0F2851]">Genero</span>
              <span className="font-semibold text-[#64748B]">{perfil.genero}</span>
            </div>
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-[#0F2851]">Nacionalidad</span>
              <span className="font-semibold text-[#64748B]">{perfil.nacionalidad}</span>
            </div>
          </div>
        </div>

        {/* Sección 3: Configuración del sistema */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-[#3B82F6] font-extrabold text-sm">
              ⚙️ <span>Configuración del sistema</span>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-[#3B82F6] border border-[#3B82F6] px-3 py-1 rounded-xl hover:bg-blue-50 transition"
            >
              ✏️️ Editar
            </button>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-[#0F2851]">Idioma</span>
              <span className="font-semibold text-[#64748B]">{perfil.idioma}</span>
            </div>
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-[#0F2851]">Zona horaria</span>
              <span className="font-semibold text-[#64748B]">{perfil.zonaHoraria}</span>
            </div>
            <div className="grid grid-cols-2 py-3">
              <span className="font-extrabold text-[#0F2851]">Tema</span>
              <span className="font-semibold text-[#64748B]">{perfil.tema}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 4: Información de contacto */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-[#3B82F6] font-extrabold text-sm">
            📞 <span>Información de contacto</span>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-[#3B82F6] border border-[#3B82F6] px-3 py-1 rounded-xl hover:bg-blue-50 transition"
          >
            ✏️ Editar
          </button>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 py-3">
            <span className="font-extrabold text-[#0F2851]">Dirección</span>
            <span className="font-semibold text-[#64748B]">{perfil.direccion}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 py-3">
            <span className="font-extrabold text-[#0F2851]">Número de telefono</span>
            <span className="font-semibold text-[#64748B]">{perfil.telefono}</span>
          </div>
        </div>
      </div>
    </div>
  );
}