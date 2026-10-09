import { io, type Socket, } from "socket.io-client";
import { API_URL, } from "@/lib/api";

export type ChatMensajeNuevo = {
  cursoId: number;
  ofertaCursoId: number;
  remitenteId: number;
  destinatarioId: number;
  mensaje: {
    id: number;
    tipo: string;
    contenido:
      | string
      | null;
    enviadoEn: string;
    file?: {
      id: number;
      name: string;
      size: string;
      downloadUrl: string;
    };
  };
};

export type ChatServerToClientEvents = {
  "chat:mensaje:nuevo": (
    payload: ChatMensajeNuevo
  ) => void;

  "chat:mensaje:notificacion": (payload: {
      cursoId: number;
      remitenteId: number;
      destinatarioId: number;
      mensajeId: number;
  }) => void;

  "chat:mensaje:editado": (payload: {
      cursoId: number;
      mensajeId: number;
      contenido: string;
      editadoEn: string;
  }) => void;

  "chat:mensaje:eliminado": (payload: {
      cursoId: number;
      mensajeId: number;
  }) => void;

  "chat:contactos:actualizar": (payload: {
      cursoId: number;
  }) => void;

  "chat:error": (
    payload: {
      message: string;
    }
  ) => void;
};

export type ChatClientToServerEvents = {
  "chat:unirse": (
    data: {
      cursoId: number;
      contactoId: number;
    },
    callback?: (
      response: {
        ok: boolean;
        message?: string;
      }
    ) => void
  ) => void;

  "chat:salir": (
    data: {
      cursoId: number;
      contactoId: number;
    }
  ) => void;
};

export type ChatSocket = Socket<
  ChatServerToClientEvents,
  ChatClientToServerEvents
>;

const SOCKET_URL =
  API_URL.replace(
    /\/api\/?$/,
    ""
  );

export function crearChatSocket() {
  return io(
    SOCKET_URL,
    {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts:
        Infinity,
      reconnectionDelay: 1000,
    }
  );
}