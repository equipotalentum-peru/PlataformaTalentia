"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { forumRequest, type ForumContext } from "@/lib/servicio-foros";
import TeacherForumList from "@/components/docente/foros/TeacherForumList";
import StudentForumList from "./StudentForumList";
import ConnectedForumDetail from "./ConnectedForumDetail";
import CourseHeader from "@/components/common/curso/CourseHeader";
import CourseTabs from "@/components/common/curso/CourseTabs";

export default function ForumCourse({ courseId, role, forumId }: {
  courseId: number; role: "alumno" | "docente"; forumId?: string;
}) {
  const [context, setContext] = useState<ForumContext | null>(null);
  const [error, setError] = useState("");
  const [ofertaId, setOfertaId] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await forumRequest<ForumContext>(`/cursos/${courseId}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (data.usuario.rol !== (role === "docente" ? "Docente" : "Estudiante")) {
          throw new Error("La sesión no corresponde a esta vista.");
        }
        setContext(data);
        if (data.ofertas.length === 1) setOfertaId(String(data.ofertas[0].oferta_curso_id));
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "No se pudo cargar el curso.");
      }
    }
    void load();
    return () => controller.abort();
  }, [courseId, role]);

  const base = `/${role}/cursos/${courseId}`;
  return (
    <div className="min-h-screen px-3 py-4 lg:px-4">
      <div className="mx-auto max-w-[1000px]">
        <Link href={forumId ? `${base}/foro` : `/${role}/cursos`}
          className="app-back-link mb-2">
          <span aria-hidden="true">{"<"}</span>

          {forumId ? "Volver a Foro" : "Volver a cursos"}
        </Link>
        {error ? <p role="alert" className="p-4 text-sm text-talentia-danger">{error}</p> : !context ?
          <p role="status" className="p-4 text-sm text-talentia-primary">Cargando curso...</p> : <>
            <CourseHeader
              courseId={courseId}
              nombre={context.curso.nombre}
              imagen={context.curso.imagen}
              fetchIfMissing={false}
            />
            <CourseTabs role={role} courseId={courseId} active="foro" />
            <div className="mt-2 space-y-2">
              {!forumId && context.ofertas.length > 1 && <label className="flex items-center gap-2 text-[11px] text-talentia-primary">
                Oferta del curso
                <select value={ofertaId} onChange={event => setOfertaId(event.target.value)} className="rounded-md border border-talentia-border bg-talentia-surface p-2">
                  <option value="" disabled>Selecciona una oferta</option>
                  {context.ofertas.map(oferta => <option key={oferta.oferta_curso_id} value={String(oferta.oferta_curso_id)}>Oferta {oferta.oferta_curso_id} - {oferta.estado}</option>)}
                </select>
              </label>}
              {forumId ? <ConnectedForumDetail courseId={courseId} forumId={forumId} /> : ofertaId ? role === "docente" ?
                <TeacherForumList key={ofertaId} courseId={courseId} ofertaId={ofertaId} /> :
                <StudentForumList key={ofertaId} courseId={courseId} ofertaId={ofertaId} /> : null}
            </div>
          </>}
      </div>
    </div>
  );
}
