"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Contact = {
  id: number;
  initials: string;
  name: string;
  role: "Docente" | "Estudiante";
  unread: boolean;
};

type Message = {
  id: number;
  sender: "me" | "other";
  text?: string;
  file?: {
    name: string;
    size: string;
  };
  time: string;
};

const contacts: Contact[] = [
  {
    id: 1,
    initials: "GR",
    name: "Prof. Gloria Rocha",
    role: "Docente",
    unread: false,
  },
  {
    id: 2,
    initials: "MT",
    name: "María Torres Sánchez",
    role: "Estudiante",
    unread: true,
  },
  {
    id: 3,
    initials: "CM",
    name: "Carlos Mendoza",
    role: "Estudiante",
    unread: false,
  },
  {
    id: 4,
    initials: "LR",
    name: "Lucía Ramirez",
    role: "Estudiante",
    unread: true,
  },
  {
    id: 5,
    initials: "DS",
    name: "Diego Salazar",
    role: "Estudiante",
    unread: false,
  },
  {
    id: 6,
    initials: "VC",
    name: "Valeria Castillo",
    role: "Estudiante",
    unread: false,
  },
  {
    id: 7,
    initials: "JP",
    name: "Jorge Perez",
    role: "Estudiante",
    unread: true,
  },
  {
    id: 8,
    initials: "RG",
    name: "Ronaldo Gamarra",
    role: "Estudiante",
    unread: false,
  },
];

const messagesByContact: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      sender: "other",
      text: "Hola Mateo, ¿Podrías reenviarme tu informe por este medio?",
      time: "10:31",
    },
    {
      id: 2,
      sender: "me",
      text: "Por supuesto profesora.",
      time: "10:33",
    },
    {
      id: 3,
      sender: "me",
      file: {
        name: "Informe Herramientas TIC.pdf",
        size: "1.2 MB",
      },
      time: "10:34",
    },
  ],
  2: [
    {
      id: 4,
      sender: "other",
      text: "Hola, ¿ya terminaste la actividad del módulo 2?",
      time: "11:12",
    },
    {
      id: 5,
      sender: "me",
      text: "Todavía no, pero estoy terminándola.",
      time: "11:16",
    },
  ],
};

export default function ChatConversationPage() {
  const [selectedContact, setSelectedContact] = useState(1);
  const [contactSearch, setContactSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [filter, setFilter] = useState<"Todos" | "Sin leer" | "Leídos">(
    "Todos"
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(messagesByContact);

  const selectedUser = contacts.find(
    (contact) => contact.id === selectedContact
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch = `${contact.name} ${contact.role}`
        .toLowerCase()
        .includes(contactSearch.toLowerCase());

      if (filter === "Sin leer") {
        return matchesSearch && contact.unread;
      }

      if (filter === "Leídos") {
        return matchesSearch && !contact.unread;
      }

      return matchesSearch;
    });
  }, [contactSearch, filter]);

  const sendMessage = () => {
    const text = message.trim();

    if (!text) return;

    setMessages((current) => ({
      ...current,
      [selectedContact]: [
        ...(current[selectedContact] ?? []),
        {
          id: Date.now(),
          sender: "me",
          text,
          time: new Date().toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    }));

    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[#eef2f8] px-2 py-2 lg:px-3">
        <div className="mx-auto flex h-[calc(100vh-16px)] w-full max-w-[1000px] overflow-hidden rounded-lg border border-[#d4d9e2] bg-white">

        {/* COLUMNA IZQUIERDA */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-gray-300">

          {/* ENCABEZADO */}
          <div className="border-b border-gray-300 px-5 py-5">

            <div className="flex items-center gap-2">
              <Link
                href="/alumno/chat"
                className="text-[20px] text-gray-800"
              >
                ←
              </Link>

              <h1 className="text-[25px] font-semibold leading-none text-[#18407c]">
                Herramientas TIC
              </h1>
            </div>

            <p className="mt-1 text-[11px] text-gray-700">
              Comunícate con tus compañeros y docentes.
            </p>

            {/* BUSCAR PERSONA */}
            <div className="mt-2 flex h-8 items-center rounded-md border border-gray-300 px-2.5">
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
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
                type="text"
                placeholder="Buscar por nombre"
                className="w-full bg-transparent text-[10px] outline-none placeholder:text-gray-500"
              />
            </div>

            {/* FILTROS */}
            <div className="mt-2 flex gap-2">
              {(["Todos", "Sin leer", "Leídos"] as const).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-full px-3 py-1 text-[10px] font-medium transition ${
                      filter === item
                        ? "bg-[#3186d8] text-white"
                        : "border border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          {/* CONTACTOS */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map((contact) => {
              const active = contact.id === selectedContact;

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedContact(contact.id)}
                  className={`flex w-full items-center gap-4 border-b border-gray-200 px-5 py-3 text-left transition ${
                    active
                      ? "bg-[#9357ef]"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3186d8] text-[11px] font-semibold text-white">
                    {contact.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[12px] font-bold ${
                        active ? "text-black" : "text-gray-900"
                      }`}
                    >
                      {contact.name}
                    </p>

                    <p
                      className={`mt-0.5 text-[10px] ${
                        active
                          ? "text-black"
                          : "text-gray-600"
                      }`}
                    >
                      {contact.role}
                    </p>
                  </div>

                  {contact.unread && !active && (
                    <span className="h-2 w-2 rounded-full bg-[#3186d8]" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* CONVERSACIÓN */}
        <section className="flex min-w-0 flex-1 flex-col">

          {/* CABECERA */}
          <header className="flex items-center gap-4 border-b border-gray-300 px-5 py-3">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3186d8] text-[13px] font-semibold text-white">
              {selectedUser?.initials}
            </div>

            <div>
              <h2 className="text-[14px] font-bold text-gray-900">
                {selectedUser?.name}
              </h2>

              <p className="text-[11px] text-gray-600">
                {selectedUser?.role}
              </p>
            </div>
          </header>

          {/* MENSAJES */}
          <div className="flex-1 overflow-y-auto bg-[#f3f5f8] px-5 py-6">

            <div className="space-y-3">
              {(messages[selectedContact] ?? []).map(
                (item) => (
                  <div
                    key={item.id}
                    className={`flex ${
                      item.sender === "me"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {item.file ? (
                      <div className="max-w-[340px] rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#ef5350] text-white">
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M6 2h9l3 3v17H6z" />
                              <path d="M14 2v4h4" />
                            </svg>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-gray-800">
                              {item.file.name}
                            </p>

                            <p className="text-[10px] text-gray-400">
                              {item.file.size}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="ml-auto text-[#3186d8]"
                            aria-label="Descargar archivo"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[520px] rounded-lg border px-3 py-2 ${
                          item.sender === "me"
                            ? "border-gray-300 bg-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <p className="text-[11px] leading-relaxed text-gray-800">
                          {item.text}
                        </p>

                        <p className="mt-1 text-right text-[8px] text-gray-400">
                          {item.time}
                        </p>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* ESCRIBIR */}
          <div className="border-t border-gray-300 px-5 py-3">
            <div className="flex items-center gap-2">

              <button
                type="button"
                aria-label="Adjuntar archivo"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" />
                </svg>
              </button>

              <input
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
                type="text"
                placeholder="Escribe un mensaje"
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-[11px] outline-none focus:border-[#3186d8]"
              />

              <button
                type="button"
                onClick={sendMessage}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3186d8] text-white transition hover:bg-[#2777c1]"
                aria-label="Enviar mensaje"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m5 12 14-7-4 7 4 7-14-7Z" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}