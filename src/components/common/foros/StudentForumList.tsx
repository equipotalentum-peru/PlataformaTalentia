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
      <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-1.5 text-[10px] font-medium ${filter === item ? 'bg-[#3186d8] text-white' : 'bg-white text-gray-700'}`}>{item}</button>)}</div>
    {error && <p role="alert" className="text-[11px] text-red-600">{error} <button className="underline" onClick={() => setRevision(value => value + 1)}>Reintentar</button></p>}
    {loading ? <p role="status" className="text-[11px] text-gray-600">Cargando foros...</p> :
      <ForumList forums={forums} courseId={courseId} basePath="alumno" renderMeta={forum =>
        <div className="hidden text-right text-[11px] text-gray-700 sm:block"><div>{forum.repliesCount} {forum.repliesCount === 1 ? "respuesta" : "respuestas"}</div><p className="mt-1 text-[10px] text-gray-600">{forum.date}, {forum.time}{forum.status === 'Cerrado' ? ' · Cerrado' : ''}</p></div>} />}
    {!loading && !error && !forums.length && <div className="rounded-lg bg-white px-5 py-10 text-center text-[11px] text-gray-500">No se encontraron foros.</div>}
  </>;
}
