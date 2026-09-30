"use client";

import Link from "next/link";
import { useState } from "react";

const chats = [
  {
    id: "herramientas-tic",
    initials: "GR",
    nombre: "Herramientas TIC",
    codigo: "HER001",
    miembros: 21,
  },
  {
    id: "psicologia",
    initials: "MT",
    nombre: "Psicología",
    codigo: "PSI001",
    miembros: 20,
  },
  {
    id: "matematicas",
    initials: "CM",
    nombre: "Matemáticas",
    codigo: "MAT001",
    miembros: 50,
  },
  {
    id: "programacion",
    initials: "LR",
    nombre: "Programación",
    codigo: "PRO001",
    miembros: 40,
  },
  {
    id: "algoritmos",
    initials: "DS",
    nombre: "Algoritmos",
    codigo: "ALGO001",
    miembros: 30,
  },
];

export default function ChatPage() {
  const [search, setSearch] = useState("");

  const filteredChats = chats.filter((chat) =>
    `${chat.nombre} ${chat.codigo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen px-3 py-2 lg:px-4">
      <div className="mx-auto h-[calc(100vh-16px)] max-w-[1000px] overflow-hidden rounded-lg border border-[#d4d9e2] bg-white">

        {/* CABECERA */}
        <div className="border-b border-gray-300 px-5 py-5">
          <h1 className="text-[27px] font-semibold leading-none text-[#18407c]">
            Chat
          </h1>

          <p className="mt-1 text-[12px] text-gray-700">
            Comunícate con tus compañeros y docentes.
          </p>

          {/* BUSCAR CURSOS */}
          <div className="mt-2 flex h-8 w-[240px] items-center rounded-md border border-gray-300 px-2.5">
            <svg
              className="mr-2 h-4 w-4 text-[#1f61b4]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Buscar cursos"
              className="w-full bg-transparent text-[11px] outline-none placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* LISTA */}
        <div className="overflow-y-auto">
          {filteredChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/alumno/chat/${chat.id}`}
              className="flex min-h-[75px] items-center justify-between border-b border-gray-300 px-6 transition hover:bg-[#f5f8fc]"
            >
              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2f80d8] text-[13px] font-semibold text-white">
                  {chat.initials}
                </div>

                <div>
                  <h2 className="text-[14px] font-bold text-gray-900">
                    {chat.nombre}
                  </h2>

                  <p className="mt-1 text-[11px] text-gray-600">
                    {chat.codigo}
                  </p>
                </div>
              </div>

              <span className="text-[11px] text-gray-700">
                {chat.miembros} miembros
              </span>
            </Link>
          ))}

          {filteredChats.length === 0 && (
            <div className="px-6 py-10 text-center text-[12px] text-gray-500">
              No se encontraron cursos.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}