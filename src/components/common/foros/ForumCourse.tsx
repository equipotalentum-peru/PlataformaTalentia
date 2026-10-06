"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { forumRequest, type ForumContext } from "@/lib/servicio-foros";
import TeacherForumList from "@/components/docente/foros/TeacherForumList";
import StudentForumList from "./StudentForumList";
import ConnectedForumDetail from "./ConnectedForumDetail";
import styles from "./ForumCourse.module.css";

export default function ForumCourse({ courseId, role, forumId }: {
  courseId: number; role: "alumno" | "docente"; forumId?: string;
}) {
  const [context, setContext] = useState<ForumContext | null>(null);
  const [error, setError] = useState("");
  const [ofertaId, setOfertaId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div className={`${styles.course} min-h-screen px-3 py-4 lg:px-4`} data-menu-open={menuOpen}>
      {menuOpen && <button type="button" className="fixed inset-0 z-30 bg-black/40 md:hidden" aria-label="Cerrar navegación" onClick={() => setMenuOpen(false)} />}
      <button type="button" className="fixed right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 md:hidden" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} title={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        <span className="flex w-4 flex-col gap-1" aria-hidden="true"><span className="h-0.5 bg-current" /><span className="h-0.5 bg-current" /><span className="h-0.5 bg-current" /></span>
      </button>
      <div className="mx-auto max-w-[1000px]">
        <Link href={forumId ? `${base}/foro` : `/${role}/cursos`}
          className="mb-2 flex min-h-6 w-fit items-center gap-2 text-[12px] font-medium text-gray-700 hover:text-[#3186d8]">
          <span className="mx-1 h-2 w-2 shrink-0 rotate-45 border-b-2 border-l-2" aria-hidden="true" />
          {forumId ? "Volver a Foro" : "Volver a cursos"}
        </Link>
        {error ? <p role="alert" className="p-4 text-sm text-red-600">{error}</p> : !context ?
          <p role="status" className="p-4 text-sm text-gray-600">Cargando curso...</p> : <>
            <div className="relative min-h-[150px] overflow-hidden rounded-t-xl bg-gray-700">
              {context.curso.imagen && <img src={context.curso.imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-black/20" />
              <h1 className="relative px-5 pb-7 pt-16 text-[24px] font-bold leading-tight text-white sm:text-[32px] break-words">{context.curso.nombre}</h1>
            </div>
            <nav className="flex flex-wrap border-b border-gray-500 bg-[#eef2f8]" aria-label="Secciones del curso">
              {[['', 'Contenido de curso'], ['/clases', 'Clases'], ['/foro', 'Foro'], ['/anuncios', 'Anuncios'],
                ...(role === 'docente' ? [['/asistencia', 'Asistencia']] : [])].map(([path, label]) => (
                <Link key={label} href={`${base}${path}`} className={`px-3 py-2 text-[12px] text-gray-700 ${path === '/foro' ? 'border-b-[3px] border-black font-medium' : 'hover:text-black'}`}>{label}</Link>
              ))}
            </nav>
            <div className="mt-2 space-y-2">
              {!forumId && context.ofertas.length > 1 && <label className="flex items-center gap-2 text-[11px] text-gray-700">
                Oferta del curso
                <select value={ofertaId} onChange={event => setOfertaId(event.target.value)} className="rounded-md border border-gray-300 bg-white p-2">
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
