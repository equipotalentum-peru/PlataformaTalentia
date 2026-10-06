import type { TeacherForum, TeacherForumStatus } from "@/data/teacher-forums";
import type { ForumReply } from "@/data/forums";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type ForumContext = {
  usuario: { id: string; rol: string; nombre: string };
  curso: { id: string; nombre: string; imagen: string | null; codigo: string };
  ofertas: { oferta_curso_id: string; estado: string }[];
};

export type ForumRecord = {
  id: string;
  titulo: string;
  descripcion: string | null;
  autor_nombre: string;
  respuestas_total: number;
  creado_en: string;
  estado: TeacherForumStatus;
  fecha_cierre: string | null;
  permitir_respuestas_estudiantes: boolean;
  mostrar_respuestas_despues_participar: boolean;
  participo: boolean;
  oferta_curso_id: string;
};

export type ReplyRecord = {
  id: string;
  autor_nombre: string;
  respuesta_padre_id: string | null;
  contenido: string;
  creado_en: string;
};

export type ForumDetailData = {
  foro: ForumRecord;
  respuestas: ReplyRecord[];
  usuario: ForumContext["usuario"];
  respuestas_visibles: boolean;
  puede_responder: boolean;
};

export async function forumRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/foros${path}`, {
    ...options, credentials: "include", cache: "no-store",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? "No se pudo procesar el foro.");
  return data as T;
}

export function initials(nombre: string) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase();
}

export function closeDate(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function mapForum(foro: ForumRecord): TeacherForum {
  return {
    id: String(foro.id), title: foro.titulo, description: foro.descripcion ?? "",
    author: foro.autor_nombre, initials: initials(foro.autor_nombre),
    repliesCount: Number(foro.respuestas_total), replies: [], views: 0,
    date: new Date(foro.creado_en).toLocaleDateString("es-PE", { timeZone: "America/Lima" }),
    time: new Date(foro.creado_en).toLocaleTimeString("es-PE", {
      timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hour12: false,
    }),
    status: foro.estado, closeDate: closeDate(foro.fecha_cierre),
    allowStudentReplies: foro.permitir_respuestas_estudiantes,
    showRepliesAfterParticipation: foro.mostrar_respuestas_despues_participar,
  };
}

export function mapReplies(rows: ReplyRecord[]): ForumReply[] {
  const nodes = new Map<string, ForumReply>();
  for (const row of rows) nodes.set(String(row.id), {
    id: Number(row.id), author: row.autor_nombre, initials: initials(row.autor_nombre),
    date: new Date(row.creado_en).toLocaleString("es-PE", { timeZone: "America/Lima" }),
    content: row.contenido, replies: [],
  });
  const roots: ForumReply[] = [];
  for (const row of rows) {
    const node = nodes.get(String(row.id))!;
    const parent = row.respuesta_padre_id ? nodes.get(String(row.respuesta_padre_id)) : undefined;
    if (parent) parent.replies!.push(node);
    else roots.push(node);
  }
  return roots;
}
