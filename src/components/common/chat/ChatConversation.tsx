"use client";

import { useCallback, useEffect, useRef, useState, } from "react";
import type { ChatContact, ChatMessage, } from "@/data/chat";
import { API_URL } from "@/lib/api";
import ChatContactList from "./ChatContactList";
import ChatComposer from "./ChatComposer";
import ChatFileMessage from "./ChatFileMessage";
import ChatMessageComponent from "./ChatMessage";
import { crearChatSocket, type ChatSocket, type ChatMensajeNuevo, } from "@/lib/chat-socket";

type Props = {
  cursoId: string;
};

export default function ChatConversation({
  cursoId,
}: Props) {
  const courseId =
    Number(cursoId);

  const [
    courseName,
    setCourseName,
  ] = useState("");

  const [contacts, setContacts] =
    useState<ChatContact[]>([]);

  const [
    selectedContact,
    setSelectedContact,
  ] = useState<number>(0);

  /* Solo móvil/tablet: alterna entre la lista de contactos y la conversación */
  const [showChat, setShowChat] = useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<
      "Todos" | "Sin leer" | "Leídos"
    >("Todos");

  const [message, setMessage] =
    useState("");

  const [loadingContacts, setLoadingContacts] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending,] = useState(false);

  const socketRef = useRef<ChatSocket | null>(null);

  const mensajesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedContactRef = useRef(selectedContact);

  useEffect(() => {
    selectedContactRef.current =
      selectedContact;
  }, [
    selectedContact,
  ]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, [messages]);

  const cargarContactos =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            `${API_URL}/chat/cursos/${courseId}/contactos`,
            {
              credentials:
                "include",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudieron cargar los contactos."
          );
        }

        setCourseName(
          data.curso?.nombre ??
            ""
        );

        const nuevosContactos =
          Array.isArray(
            data.contactos
          )
            ? data.contactos
            : [];

        setContacts(
          nuevosContactos
        );

        setSelectedContact(
          (actual) => {
            if (
              nuevosContactos.some(
                (contacto: ChatContact) =>
                  contacto.id ===
                  actual
              )
            ) {
              return actual;
            }

            return (
              nuevosContactos[0]?.id ??
              0
            );
          }
        );
      } catch (error) {
        console.error(
          error
        );
      } finally {
        setLoadingContacts(
          false
        );
      }
    }, [courseId]);

  const cargarMensajes =
    useCallback(async () => {
      if (
        !selectedContact
      ) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(
          true
        );

        const response =
          await fetch(
            `${API_URL}/chat/cursos/${courseId}/contactos/${selectedContact}/mensajes`,
            {
              credentials:
                "include",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudieron cargar los mensajes."
          );
        }

        setMessages(
          Array.isArray(
            data.mensajes
          )
            ? data.mensajes
            : []
        );

        setContacts(
          (actual) =>
            actual.map(
              (contacto) =>
                contacto.id ===
                selectedContact
                  ? {
                      ...contacto,
                      unread:
                        false,
                    }
                  : contacto
            )
        );
      } catch (error) {
        console.error(
          error
        );
      } finally {
        setLoadingMessages(
          false
        );
      }
    }, [
      courseId,
      selectedContact,
    ]);

  useEffect(() => {
    void cargarContactos();
  }, [cargarContactos]);

  useEffect(() => {
    if (
      !selectedContact
    ) {
      setMessages([]);
      return;
    }

    void cargarMensajes();

    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit(
        "chat:unirse",
        {
          cursoId: courseId,
          contactoId: selectedContact,
        },
        (response) => {
          if (!response.ok) {
            console.error(
              response.message ??
                "No se pudo entrar a la conversación."
            );
          }
        }
      );
    }

    return () => {
      socket?.emit(
        "chat:salir",
        {
          cursoId: courseId,
          contactoId:
            selectedContact,
        }
      );
    };
  }, [
    courseId,
    selectedContact,
    cargarMensajes,
  ]);

  useEffect(() => {
    const socket = crearChatSocket();
    socketRef.current = socket;

    const manejarMensajeNuevo = (payload: ChatMensajeNuevo) => {
      if (Number(payload.cursoId) !== courseId) {
        return;
      }

      const remitenteId = Number(payload.remitenteId);
      const contactoActual = selectedContactRef.current;
      const nuevoMensaje: ChatMessage = {
        id: Number(payload.mensaje.id),

        sender:
          remitenteId ===
          contactoActual
            ? "other"
            : "me",

        text:
          payload.mensaje
            .tipo === "Texto"
            ? payload.mensaje
                .contenido ??
              undefined
            : undefined,

        file:
          payload.mensaje
            .file,

        time:
          payload.mensaje
            .enviadoEn,
      };

      /*
      * Si el mensaje pertenece a la
      * conversación que estoy viendo,
      * lo agregamos inmediatamente.
      */
      if (
        remitenteId ===
        contactoActual
      ) {
        setMessages(
          (actual) => {
            const yaExiste =
              actual.some(
                (item) =>
                  item.id === nuevoMensaje.id
              );

            if (yaExiste) {
              return actual;
            }

            return [
              ...actual,
              nuevoMensaje,
            ];
          }
        );

        /*
        * Como el usuario está viendo
        * la conversación, queda leída.
        */
        void fetch(
          `${API_URL}/chat/cursos/${courseId}/contactos/${contactoActual}/leido`,
          {
            method: "POST",
            credentials:
              "include",
          }
        );

        setContacts(
          (actual) =>
            actual.map(
              (contacto) =>
                contacto.id ===
                contactoActual
                  ? {
                      ...contacto,
                      unread:
                        false,
                    }
                  : contacto
            )
        );

        return;
      }

      /*
      * Si llega de otra conversación,
      * activamos el indicador "sin leer".
      */
      setContacts(
        (actual) =>
          actual.map(
            (contacto) =>
              contacto.id ===
              remitenteId
                ? {
                    ...contacto,
                    unread:
                      true,
                  }
                : contacto
          )
      );
    };

    const manejarMensajeEditado = (payload: {
      cursoId: number;
      mensajeId: number;
      contenido: string;
      editadoEn: string;
    }) => {
      if (Number(payload.cursoId) !== courseId) return;

      setMessages((actual) =>
        actual.map((mensaje) =>
          mensaje.id === Number(payload.mensajeId)
            ? {
                ...mensaje,
                text: payload.contenido,
                edited: true,
              }
            : mensaje
        )
      );
    };

    const manejarMensajeEliminado = (payload: {
      cursoId: number;
      mensajeId: number;
    }) => {
      if (Number(payload.cursoId) !== courseId) return;

      setMessages((actual) =>
        actual.map((mensaje) =>
          mensaje.id === Number(payload.mensajeId)
            ? {
                ...mensaje,
                text: undefined,
                file: undefined,
                edited: false,
                deleted: true,
              }
            : mensaje
        )
      );
    };

    const manejarActualizacionContactos = (payload: {
      cursoId: number;
    }) => {
      if (Number(payload.cursoId) !== courseId) return;

      void cargarContactos();
    };

    const manejarNotificacion = (payload: {
      cursoId: number;
      remitenteId: number;
      destinatarioId: number;
      mensajeId: number;
    }) => {
      if (Number(payload.cursoId) !== courseId) {
        return;
      }

      const remitenteId = Number(payload.remitenteId);

      // Si estamos viendo a quien escribió, no debe quedar sin leer.
      if (remitenteId === selectedContactRef.current) {
        return;
      }

      setContacts((actual) =>
        actual.map((contacto) =>
          contacto.id === remitenteId
            ? {
                ...contacto,
                unread: true,
              }
            : contacto
        )
      );
    };

    socket.on(
      "chat:mensaje:notificacion",
      manejarNotificacion
    );

    socket.on(
      "chat:mensaje:nuevo",
      manejarMensajeNuevo
    );

    socket.on(
      "chat:mensaje:editado",
      manejarMensajeEditado
    );

    socket.on(
      "chat:mensaje:eliminado",
      manejarMensajeEliminado
    );

    socket.on(
      "chat:contactos:actualizar",
      manejarActualizacionContactos
    );

    socket.on(
      "connect",
      () => {
        console.log(
          "Socket.IO conectado."
        );

        /*
        * Si ya hay una conversación
        * seleccionada, entramos a ella.
        */
        if (
          selectedContactRef.current
        ) {
          socket.emit(
            "chat:unirse",
            {
              cursoId,
              contactoId:
                selectedContactRef.current,
            }
          );
        }
      }
    );

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "Socket.IO desconectado:",
          reason
        );
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Error conectando Socket.IO:",
          error.message
        );
      }
    );

    return () => {
      socket.off(
        "chat:mensaje:nuevo",
        manejarMensajeNuevo
      );

      socket.off(
        "chat:mensaje:notificacion",
        manejarNotificacion
      );

      socket.off(
        "chat:mensaje:editado",
        manejarMensajeEditado
      );

      socket.off(
        "chat:mensaje:eliminado",
        manejarMensajeEliminado
      );

      socket.off(
        "chat:contactos:actualizar",
        manejarActualizacionContactos
      );

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [courseId, cargarContactos]);

  const sendMessage =
    async () => {
      const text =
        message.trim();

      if (
        !text ||
        !selectedContact ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);

        const response =
          await fetch(
            `${API_URL}/chat/cursos/${courseId}/contactos/${selectedContact}/mensajes`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials:
                "include",

              body: JSON.stringify({
                contenido:
                  text,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ??
              "No se pudo enviar el mensaje."
          );
        }

        setMessages(
          (actual) => [
            ...actual,
            data.mensaje,
          ]
        );

        setMessage("");
      } catch (error) {
        console.error(
          error
        );
      } finally {
        setSending(false);
      }
    };

  const sendFile = async (file: File) => {
    if (!selectedContact || sending) {
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();

      formData.append("archivo", file);

      const response = await fetch(`${API_URL}/chat/cursos/${courseId}/contactos/${selectedContact}/adjuntos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "No se pudo enviar el archivo."
        );
      }

      setMessages((actual) => [
          ...actual,
          data.mensaje,
        ]
      );
    } catch (error) {
      console.error(
        error
      );
    } finally {
      setSending(false);
    }
  };

  const selectedUser = contacts.find((item) => item.id === selectedContact);

  const editarMensaje = async (
    mensajeId: number,
    contenido: string
  ) => {
    if (!selectedContact) return;

    const response = await fetch(
      `${API_URL}/chat/cursos/${courseId}/contactos/${selectedContact}/mensajes/${mensajeId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ contenido }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ?? "No se pudo editar el mensaje."
      );
    }

    setMessages((actual) =>
      actual.map((mensaje) =>
        mensaje.id === mensajeId
          ? {
              ...mensaje,
              text: data.mensaje.text,
              edited: true,
            }
          : mensaje
      )
    );
  };

  const eliminarMensaje = async (
    mensajeId: number
  ) => {
    if (!selectedContact) return;

    const confirmado = window.confirm(
      "¿Seguro que deseas eliminar este mensaje?"
    );

    if (!confirmado) return;

    const response = await fetch(
      `${API_URL}/chat/cursos/${courseId}/contactos/${selectedContact}/mensajes/${mensajeId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));

      throw new Error(
        data.message ?? "No se pudo eliminar el mensaje."
      );
    }

    setMessages((actual) =>
      actual.map((mensaje) =>
        mensaje.id === mensajeId
          ? {
              ...mensaje,
              text: undefined,
              file: undefined,
              edited: false,
              deleted: true,
            }
          : mensaje
      )
    );
  };

  return (
    <main className="min-h-screen bg-[#eef2f8] p-2 lg:p-3">
      <div className="flex h-[calc(100vh-24px)] w-full overflow-hidden rounded-lg border border-[#d4d9e2] bg-white">

        {loadingContacts ? (
          <div className="flex w-full items-center justify-center text-[12px] text-gray-500">
            Cargando chat...
          </div>
        ) : (
          <>
            <ChatContactList
              courseName={
                courseName
              }
              contacts={contacts}
              selectedContact={
                selectedContact
              }
              search={search}
              filter={filter}
              onSearchChange={
                setSearch
              }
              onFilterChange={
                setFilter
              }
              onSelect={(id) => {
                setSelectedContact(id);
                setShowChat(true);
              }}
              className={
                showChat
                  ? "hidden min-[861px]:flex"
                  : "flex"
              }
            />

            <section
              className={`${
                showChat
                  ? "flex"
                  : "hidden min-[861px]:flex"
              } min-w-0 flex-1 flex-col`}
            >

              <header className="flex items-center gap-3 border-b border-gray-300 px-3 py-3 sm:gap-4 sm:px-5">

                <button
                  type="button"
                  onClick={() => setShowChat(false)}
                  aria-label="Volver a contactos"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#18407c] hover:bg-gray-100 min-[861px]:hidden"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#11b7b8] text-[13px] font-semibold text-white sm:h-14 sm:w-14">
                  {selectedUser?.initials}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-[14px] font-bold text-gray-900">
                    {
                      selectedUser?.name
                    }
                  </h2>

                  <p className="text-[11px] text-gray-600">
                    {
                      selectedUser?.role
                    }
                  </p>
                </div>

              </header>

              <div className="flex-1 overflow-y-auto bg-white px-3 py-4 sm:px-6 sm:py-6">

                {loadingMessages ? (
                  <p className="text-[11px] text-gray-400">
                    Cargando mensajes...
                  </p>
                ) : (
                  <div className="space-y-3">

                    {messages.map(
                      (item) =>
                        item.file ? (
                          <ChatFileMessage
                            key={item.id}
                            message={item}
                            onDelete={eliminarMensaje}
                          />
                        ) : (
                          <ChatMessageComponent
                            key={item.id}
                            message={item}
                            onEdit={editarMensaje}
                            onDelete={eliminarMensaje}
                          />
                        )
                    )}

                    {!messages.length && (
                      <p className="pt-10 text-center text-[11px] text-gray-400">
                        No hay mensajes todavía.
                      </p>
                    )}

                    <div
                      ref={mensajesEndRef}
                      className="h-px"
                    />
                  </div>
                )}

              </div>

              <ChatComposer
                value={message}
                onChange={
                  setMessage
                }
                onSend={
                  sendMessage
                }
                onSendFile={
                  sendFile
                }
              />

            </section>
          </>
        )}

      </div>
    </main>
  );
}