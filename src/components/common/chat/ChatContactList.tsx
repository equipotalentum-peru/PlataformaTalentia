"use client";

import { useMemo } from "react";
import type { ChatContact } from "@/data/chat";

import ChatContactItem from "./ChatContactItem";
import ChatFilters from "./ChatFilters";

type Filter = "Todos" | "Sin leer" | "Leídos";

type Props = {
  courseName: string;
  contacts: ChatContact[];
  selectedContact: number;
  search: string;
  filter: Filter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: Filter) => void;
  onSelect: (id: number) => void;
};

export default function ChatContactList({
  courseName,
  contacts,
  selectedContact,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onSelect,
}: Props) {
  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        !term ||
        contact.name
          .toLowerCase()
          .includes(term);

      const matchesFilter =
        filter === "Todos" ||
        (filter === "Sin leer" &&
          contact.unread) ||
        (filter === "Leídos" &&
          !contact.unread);

      return matchesSearch && matchesFilter;
    });
  }, [contacts, search, filter]);

  return (
    <aside className="flex w-[255px] shrink-0 flex-col border-r border-gray-300 bg-white">
      <div className="border-b border-gray-300 px-4 py-4">

        <h1 className="text-[25px] font-semibold text-[#18407c]">
          {courseName}
        </h1>

        <p className="mt-1 text-[11px] text-gray-700">
          Comunícate con tus compañeros y docentes.
        </p>

        <div className="mt-3 flex h-9 items-center rounded-md border border-gray-300 px-3">

          <svg
            viewBox="0 0 24 24"
            className="mr-2 h-4 w-4 text-[#1f61b4]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Buscar por nombre"
            className="w-full bg-transparent text-[10px] outline-none"
          />

        </div>

        <div className="mt-3">
          <ChatFilters
            value={filter}
            onChange={onFilterChange}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <ChatContactItem
            key={contact.id}
            contact={contact}
            selected={
              contact.id === selectedContact
            }
            onSelect={onSelect}
          />
        ))}

        {!filteredContacts.length && (
          <p className="p-8 text-center text-[11px] text-gray-500">
            No se encontraron contactos.
          </p>
        )}
      </div>
    </aside>
  );
}