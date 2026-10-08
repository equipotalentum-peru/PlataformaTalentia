export type ChatRole =
  | "Docente"
  | "Estudiante";

export type ChatCourse = {
  id: string;
  initials: string;
  nombre: string;
  codigo: string;
  miembros: number;
};

export type ChatContact = {
  id: number;
  initials: string;
  name: string;
  role: ChatRole;
  unread: boolean;
};

export type ChatMessage = {
  id: number;
  sender: "me" | "other";

  text?: string;

  file?: {
    id: number;
    name: string;
    size: string;
    downloadUrl: string;
  };

  time: string;
};