"use client";

import { useEffect, useMemo, useState } from "react";
import { forumRequest, mapForum, type ForumRecord } from "@/lib/servicio-foros";
import ForumHeader from "./ForumHeader";
import ForumList from "./ForumList";

export default function StudentForumList({ courseId, ofertaId }: { courseId: number; ofertaId: string }) {
  const [records, setRecords] = useState<ForumRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState('Todos');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await forumRequest<{ foros: ForumRecord[] }>(`/ofertas/${ofertaId}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setRecords(data.foros); setError(""); }
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los foros.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [ofertaId, revision]);
  const forums = useMemo(() => records.filter(record =>
    `${record.titulo} ${record.descripcion ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()) &&
    (filter === 'Todos' || (filter === 'Respondidos' ? record.participo : !record.participo))
  ).map(mapForum), [records, search, filter]);
  return <>
    <ForumHeader search={search} onSearchChange={setSearch} />
    <div className="flex flex-wrap gap-2">{['Todos', 'Sin responder', 'Respondidos'].map(item =>
      <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-1.5 text-[14px] font-medium ${filter === item ? 'bg-talentia-action text-white' : 'bg-talentia-surface text-talentia-primary'}`}>{item}</button>)}</div>
    {error && <p role="alert" className="text-[14px] text-talentia-danger">{error} <button className="underline" onClick={() => setRevision(value => value + 1)}>Reintentar</button></p>}
    {loading ? <p role="status" className="text-[14px] text-talentia-primary">Cargando foros...</p> :
      <ForumList forums={forums} courseId={courseId} basePath="alumno" renderMeta={forum =>
        <div className="student-forum-meta hidden text-right text-[12px] text-talentia-primary sm:block"><div>{forum.repliesCount} {forum.repliesCount === 1 ? "respuesta" : "respuestas"}</div><p className="mt-1 text-[12px] text-talentia-primary">{forum.date}, {forum.time}{forum.status === 'Cerrado' ? ' · Cerrado' : ''}</p></div>} />}
    {!loading && !error && !forums.length && <div className="rounded-lg bg-talentia-surface px-5 py-10 text-center text-[14px] text-talentia-muted">No se encontraron foros.</div>}
  </>;
}
