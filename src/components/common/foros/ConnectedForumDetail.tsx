"use client";

import { useEffect, useState } from "react";
import { forumRequest, mapReplies, initials, type ForumDetailData } from "@/lib/servicio-foros";
import ForumDetail from "./ForumDetail";

export default function ConnectedForumDetail({ courseId, forumId }: { courseId: number; forumId: string }) {
  const [data, setData] = useState<ForumDetailData | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const value = await forumRequest<ForumDetailData>(`/${forumId}?cursoId=${courseId}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setData(value); setError(""); }
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "No se pudo cargar el foro."); }
    }
    void load();
    return () => controller.abort();
  }, [forumId, courseId, revision]);

  async function reply(contenido: string, padre: number | null) {
    await forumRequest(`/${forumId}/respuestas`, {
      method: "POST", body: JSON.stringify({ curso_id: courseId, contenido, respuesta_padre_id: padre }),
    });
    setRevision(value => value + 1);
  }
  if (error) return <p role="alert" className="text-[11px] text-red-600">{error} <button onClick={() => setRevision(value => value + 1)} className="underline">Reintentar</button></p>;
  if (!data) return <p role="status" className="text-[11px] text-gray-600">Cargando participaciones...</p>;
  return <ForumDetail title={data.foro.titulo} description={data.foro.descripcion ?? ""}
    replies={mapReplies(data.respuestas)} onSubmitReply={reply} canReply={data.puede_responder}
    repliesVisible={data.respuestas_visibles} currentInitials={initials(data.usuario.nombre)}
    participationNotice={!data.foro.permitir_respuestas_estudiantes ? 'Este foro no permite la participación de estudiantes.' : undefined}
    readOnlyMessage={data.foro.estado === 'Borrador' ? 'Este foro es un borrador.' : data.foro.estado === 'Oculto' ? 'Este foro está oculto.' : 'Este foro no admite nuevas respuestas.'} />;
}
