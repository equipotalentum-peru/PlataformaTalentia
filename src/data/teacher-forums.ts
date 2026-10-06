import { forums, type Forum } from "./forums";

export type TeacherForumStatus =
  | "Publicado"
  | "Borrador"
  | "Cerrado"
  | "Oculto";

export type TeacherForum = Forum & {
  status: TeacherForumStatus;
  closeDate?: string;
  allowStudentReplies: boolean;
  showRepliesAfterParticipation: boolean;
  views: number;
};

const settings: Record<
  string,
  Omit<
    TeacherForum,
    keyof Forum
  >
> = {
  presentacion: {
    status: "Publicado",
    closeDate: "25/09/2026",
    allowStudentReplies: true,
    showRepliesAfterParticipation: true,
    views: 12,
  },

  tic: {
    status: "Publicado",
    allowStudentReplies: true,
    showRepliesAfterParticipation: true,
    views: 25,
  },

  productividad: {
    status: "Publicado",
    allowStudentReplies: true,
    showRepliesAfterParticipation: true,
    views: 10,
  },

  nube: {
    status: "Borrador",
    allowStudentReplies: true,
    showRepliesAfterParticipation: true,
    views: 9,
  },
};

export const teacherForums: TeacherForum[] =
  forums.map((forum) => ({
    ...forum,
    ...(settings[forum.id] ?? {
      status: "Publicado" as const,
      allowStudentReplies: true,
      showRepliesAfterParticipation: true,
      views: 0,
    }),
  }));
