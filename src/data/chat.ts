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
    name: string;
    size: string;
  };
  time: string;
};

export const chatCourses: ChatCourse[] = [
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
    nombre: "Programacion",
    codigo: "PRO001",
    miembros: 40,
  },
  {
    id: "algoritmos",
    initials: "DS",
    nombre: "Algoritmos",
    codigo: "ALG0001",
    miembros: 30,
  },
];

export const chatContacts: ChatContact[] = [
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

export const messagesByContact: Record<
  number,
  ChatMessage[]
> = {
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
};