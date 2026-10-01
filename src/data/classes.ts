export type ClassStatus =
  | "Finalizada"
  | "Próxima"
  | "Programada"
  | "En curso"
  | "Cancelada";

export type ClassSession = {
  id: number;
  numero: string;
  tema: string;
  fecha: string;
  horario: string;
  estado: ClassStatus;
  docente: string;
  zoomUrl?: string;
  recordingUrl?: string;
};

export const classSessions: ClassSession[] = [
  {
    id: 1,
    numero: "01",
    tema: "Introducción a las TIC",
    fecha: "Lun, 7 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
    docente: "Prof. Gloria Rocha",
    recordingUrl: "#",
  },
  {
    id: 2,
    numero: "02",
    tema: "Herramientas de productividad",
    fecha: "Lun, 14 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
    docente: "Prof. Gloria Rocha",
    recordingUrl: "#",
  },
  {
    id: 3,
    numero: "03",
    tema: "Colaboración en la nube",
    fecha: "Lun, 21 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
    docente: "Prof. Gloria Rocha",
    recordingUrl: "#",
  },
  {
    id: 4,
    numero: "04",
    tema: "Seguridad digital",
    fecha: "Lun, 28 de sep. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
    docente: "Prof. Gloria Rocha",
    recordingUrl: "#",
  },
  {
    id: 5,
    numero: "05",
    tema: "Comunicación digital",
    fecha: "Lun, 5 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Finalizada",
    docente: "Prof. Gloria Rocha",
    recordingUrl: "#",
  },
  {
    id: 6,
    numero: "06",
    tema: "Gestión y organización de la información",
    fecha: "Lun, 7 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Próxima",
    docente: "Prof. Gloria Rocha",
    zoomUrl: "#",
  },
  {
    id: 7,
    numero: "07",
    tema: "Herramientas de creación de contenido",
    fecha: "Lun, 12 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Programada",
    docente: "Prof. Gloria Rocha",
  },
  {
    id: 8,
    numero: "08",
    tema: "Inteligencia artificial aplicada",
    fecha: "Lun, 19 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Programada",
    docente: "Prof. Gloria Rocha",
  },
  {
    id: 9,
    numero: "09",
    tema: "Proyecto final",
    fecha: "Lun, 26 de oct. de 2026",
    horario: "10:00 – 11:30 (GTM-5)",
    estado: "Programada",
    docente: "Prof. Gloria Rocha",
  },
];