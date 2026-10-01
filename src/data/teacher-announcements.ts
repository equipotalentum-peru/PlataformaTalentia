import type { Announcement } from "./announcements";

export type TeacherAnnouncementStatus =
  | "Publicado"
  | "Borrador"
  | "Oculto";

export type TeacherAnnouncement = Announcement & {
  status: TeacherAnnouncementStatus;
  views: number;
};

export const teacherAnnouncements: TeacherAnnouncement[] = [
  {
    id: 1,
    title: "Cambio de horario para la semana 9",
    date: "Mar, 22 de oct. de 2026, 14:57",
    content:
      "Buenas tardes chicos, este foro es para conocernos mejor. Por favor me hacen una bibliografía suya. Además, les informamos que la sesión correspondiente a la semana 9 tendrá un cambio de horario. Revisen la nueva programación antes de la próxima clase.",
    read: true,
    status: "Publicado",
    views: 12,
  },
  {
    id: 2,
    title: "Participación en el foro",
    date: "Mar, 14 de oct. de 2026, 03:00",
    content:
      "Se les recuerda participar en el foro del módulo y compartir tus ideas con tus compañeros. Tu participación forma parte de las actividades del curso. Recuerden revisar las respuestas de sus compañeros y aportar comentarios que ayuden a enriquecer la discusión.",
    read: true,
    status: "Publicado",
    views: 25,
  },
  {
    id: 3,
    title: "Cambio de actividad para esta semana",
    date: "Mar, 1 de oct. de 2026, 09:59",
    content:
      "Estimados estudiantes, debido a un ajuste en la planificación del curso, la actividad correspondiente a esta semana tendrá una modificación. Revisen las nuevas indicaciones y la fecha actualizada de entrega dentro del módulo correspondiente.",
    read: true,
    status: "Publicado",
    views: 10,
  },
  {
    id: 4,
    title: "Material complementario disponible",
    date: "Mar, 16 de sep. de 2026, 16:47",
    content:
      "Estimados estudiantes, he agregado un nuevo material complementario en el módulo 3: Colaboración en la nube. El recurso contiene algunos ejemplos y recomendaciones adicionales que pueden utilizar para reforzar los contenidos vistos durante las clases.",
    read: true,
    status: "Publicado",
    views: 9,
  },
];