"use client";

import { useEffect, useMemo, useState } from "react";
import ForumHeader from "@/components/common/foros/ForumHeader";
import ForumList from "@/components/common/foros/ForumList";
import ForumFormModal, { type ForumFormValues } from "./ForumFormModal";
import type { TeacherForum } from "@/data/teacher-forums";
import { forumRequest, mapForum, type ForumRecord } from "@/lib/servicio-foros";

type Filter = "Todos" | "Publicados" | "Borradores" | "Cerrados";

function payload(values: ForumFormValues) {
  return { titulo: values.title, descripcion: values.description, fecha_cierre: values.closeDate || null,
    permitir_respuestas_estudiantes: values.allowStudentReplies,
    mostrar_respuestas_despues_participar: values.showRepliesAfterParticipation, estado: values.status };
}

export default function TeacherForumList({ courseId, ofertaId }: { courseId: number; ofertaId: string }) {
  const [forums, setForums] = useState<TeacherForum[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("Todos");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editForum, setEditForum] = useState<TeacherForum | null>(null);
  const [cargando, setCargando] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await forumRequest<{ foros: ForumRecord[] }>(`/ofertas/${ofertaId}/docente`, { signal: controller.signal });
        if (!controller.signal.aborted) { setForums(data.foros.map(mapForum)); setError(""); }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "No se pudieron cargar los foros.");
      } finally { if (!controller.signal.aborted) setCargando(false); }
    }
    void load();
    return () => controller.abort();
  }, [ofertaId, revision]);

  const filtered = useMemo(() => forums.filter(forum =>
    `${forum.title} ${forum.description}`.toLowerCase().includes(search.trim().toLowerCase()) &&
    (filter === "Todos" || forum.status === ({ Publicados: "Publicado", Borradores: "Borrador", Cerrados: "Cerrado" } as const)[filter])
  ), [forums, search, filter]);
  const counts = { Todos: forums.length, Publicados: forums.filter(f => f.status === 'Publicado').length,
    Borradores: forums.filter(f => f.status === 'Borrador').length, Cerrados: forums.filter(f => f.status === 'Cerrado').length };

  async function save(values: ForumFormValues) {
    if (saving) return;
    setSaving(true); setFormError("");
    try {
      await forumRequest(editForum ? `/${editForum.id}` : "", {
        method: editForum ? "PUT" : "POST",
        body: JSON.stringify({ ...payload(values), curso_id: courseId, oferta_curso_id: ofertaId }),
      });
      setEditForum(null); setCreateOpen(false); setRevision(value => value + 1);
    } catch (error) { setFormError(error instanceof Error ? error.message : "No se pudo guardar el foro."); }
    finally { setSaving(false); }
  }

  async function action(forum: TeacherForum, kind: "Duplicar" | "Ocultar" | "Cerrar" | "Publicar" | "Eliminar") {
    if (saving) return;
    if (kind === "Eliminar" && !window.confirm("¿Eliminar este foro y todas sus respuestas?")) return;
    setSaving(true); setError(""); setMenuOpen(null);
    try {
      if (kind === "Eliminar") await forumRequest(`/${forum.id}?cursoId=${courseId}`, { method: "DELETE" });
      else {
        const values: ForumFormValues = { title: kind === "Duplicar" ? `Copia de ${forum.title}` : forum.title,
          description: forum.description, closeDate: kind === "Duplicar" ? "" : forum.closeDate ?? "",
          allowStudentReplies: forum.allowStudentReplies, showRepliesAfterParticipation: forum.showRepliesAfterParticipation,
          status: kind === "Duplicar" ? "Borrador" : kind === "Ocultar" ? "Oculto" : kind === "Cerrar" ? "Cerrado" : "Publicado" };
        await forumRequest(kind === "Duplicar" ? "" : `/${forum.id}`, {
          method: kind === "Duplicar" ? "POST" : "PUT",
          body: JSON.stringify({ ...payload(values), curso_id: courseId, oferta_curso_id: ofertaId }),
        });
      }
      setRevision(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo actualizar el foro."); }
    finally { setSaving(false); }
  }

  const editValues = useMemo(() => editForum ? { title: editForum.title, description: editForum.description,
    closeDate: editForum.closeDate ?? "", allowStudentReplies: editForum.allowStudentReplies,
    showRepliesAfterParticipation: editForum.showRepliesAfterParticipation, status: editForum.status } : undefined, [editForum]);

  return <>
    <ForumHeader search={search} onSearchChange={setSearch} action={
      <button type="button" disabled={cargando || saving} onClick={() => { setFormError(""); setCreateOpen(true); }}
        className="flex h-9 items-center justify-center gap-2 rounded-md bg-talentia-action px-4 text-[10px] font-semibold text-white disabled:opacity-50">
        <span className="text-[16px] leading-none">+</span>Crear Foro
      </button>} />
    <div className="my-2 flex flex-wrap gap-2">{(['Todos', 'Publicados', 'Borradores', 'Cerrados'] as Filter[]).map(item =>
      <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-1.5 text-[10px] font-medium ${filter === item ? 'bg-talentia-action text-white' : 'bg-talentia-surface text-talentia-primary'}`}>{item} ({counts[item]})</button>)}</div>
    {error && <p role="alert" className="text-[11px] text-talentia-danger">{error} <button onClick={() => setRevision(value => value + 1)} className="underline">Reintentar</button></p>}
    {cargando ? <p role="status" className="text-[11px] text-talentia-primary">Cargando foros...</p> :
      <ForumList forums={filtered} courseId={courseId} basePath="docente" renderMeta={forum =>
        <div className="hidden text-right text-[10px] text-talentia-primary md:block"><div>{forum.repliesCount} {forum.repliesCount === 1 ? "respuesta" : "respuestas"}</div>
          <div className="mt-1">{forum.status === 'Publicado' ? `${forum.date}, ${forum.time}` : forum.status}</div></div>}
        renderActions={forum => <div className="relative">
          <button type="button" disabled={saving} onClick={() => setMenuOpen(current => current === forum.id ? null : forum.id)}
            className="flex h-8 w-7 items-center justify-center rounded-md text-talentia-blue hover:bg-talentia-hover" aria-label="Acciones del foro" aria-expanded={menuOpen === forum.id}>⋮</button>
          {menuOpen === forum.id && <div className="absolute right-0 top-9 z-30 w-[125px] overflow-hidden rounded-md border border-talentia-border bg-talentia-surface shadow-lg">
            <button type="button" onClick={() => { setFormError(""); setEditForum(forum); setMenuOpen(null); }} className="block w-full px-3 py-2 text-left text-[10px] hover:bg-talentia-hover">Editar</button>
            {(['Duplicar', 'Ocultar', ...(forum.status === 'Publicado' ? ['Cerrar'] : ['Publicar']), 'Eliminar'] as const).map(kind =>
              <button key={kind} type="button" onClick={() => void action(forum, kind as 'Duplicar' | 'Ocultar' | 'Cerrar' | 'Publicar' | 'Eliminar')}
                className={`block w-full px-3 py-2 text-left text-[10px] hover:bg-talentia-hover ${kind === 'Eliminar' ? 'text-talentia-danger' : 'text-talentia-primary'}`}>{kind}</button>)}
          </div>}
        </div>} />}
    {!cargando && !error && filtered.length === 0 && <div className="rounded-lg bg-talentia-surface px-5 py-10 text-center text-[11px] text-talentia-muted">No hay foros que coincidan con la búsqueda.</div>}
    {(createOpen || editForum) && <ForumFormModal key={editForum?.id ?? 'create'} open mode={editForum ? 'edit' : 'create'} initialValues={editValues}
      onClose={() => { if (!saving) { setCreateOpen(false); setEditForum(null); setFormError(""); } }}
      onSubmit={save} saving={saving} error={formError} />}
  </>;
}
