"use client";

import { useState } from "react";

import {
  chatContacts,
  messagesByContact,
  type ChatMessage,
} from "@/data/chat";

import ChatContactList from "./ChatContactList";
import ChatComposer from "./ChatComposer";
import ChatFileMessage from "./ChatFileMessage";
import ChatMessageComponent from "./ChatMessage";

type Props = {
  cursoId: string;
};

export default function ChatConversation({
  cursoId,
}: Props) {
  const [selectedContact, setSelectedContact] =
    useState(1);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "Todos" | "Sin leer" | "Leídos"
  >("Todos");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<Record<number, ChatMessage[]>>(
      messagesByContact
    );

  const sendMessage = () => {
    const text = message.trim();

    if (!text) {
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: "me",
      text,
      time: new Date().toLocaleTimeString(
        "es-PE",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
    };

    setMessages((current) => ({
      ...current,
      [selectedContact]: [
        ...(current[selectedContact] ?? []),
        newMessage,
      ],
    }));

    setMessage("");
  };

  const selectedUser =
    chatContacts.find(
      (item) =>
        item.id === selectedContact
    );

  return (
    <main className="min-h-screen bg-[#eef2f8] p-2 lg:p-3">

      <div className="flex h-[calc(100vh-24px)] w-full overflow-hidden rounded-lg border border-[#d4d9e2] bg-white">

        <ChatContactList
          contacts={chatContacts}
          selectedContact={selectedContact}
          search={search}
          filter={filter}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSelect={setSelectedContact}
        />

        <section className="flex min-w-0 flex-1 flex-col">

          <header className="flex items-center gap-4 border-b border-gray-300 px-5 py-3">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#11b7b8] text-[13px] font-semibold text-white">
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

          <div className="flex-1 overflow-y-auto bg-white px-6 py-6">

            <div className="space-y-3">

              {(messages[selectedContact] ?? []).map(
                (item) =>
                  item.file ? (
                    <ChatFileMessage
                      key={item.id}
                      message={item}
                    />
                  ) : (
                    <ChatMessageComponent
                      key={item.id}
                      message={item}
                    />
                  )
              )}

            </div>

          </div>

          <ChatComposer
            value={message}
            onChange={setMessage}
            onSend={sendMessage}
          />

        </section>

      </div>

    </main>
  );
}