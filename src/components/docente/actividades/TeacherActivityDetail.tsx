"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import RubricDetails, { type RubricInfo } from "@/components/common/curso/RubricDetails";

type Student = {
  alumno_id: number; matricula_id: number; alumno: string;
  entrega_id: number | null; numero_intento: number | null; estado: string | null;
  entregada_en: string | null; nota: number | null; archivo_id: number | null;
  nombre_archivo: string | null;
};
type Props = { courseId: number; activityId: number; previousSectionHref?: string; nextSectionHref?: string };
export default function TeacherActivityDetail({ courseId, activityId, previousSectionHref, nextSectionHref }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [title, setTitle] = useState("Actividad");
  const [description, setDescription] = useState("");
  const [maxGrade, setMaxGrade] = useState(20);
  const [graded, setGraded] = useState(true);
  const [rubrica, setRubrica] = useState<RubricInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
    try {
      const r = await fetch(`${API_URL}/actividades/docente/${courseId}/${activityId}`, { credentials: "include", cache: "no-store" });
      const d = await r.json();
      if (!active) return;
      if (!r.ok) throw new Error(d.message || "No se pudieron cargar las entregas.");
      setStudents(d.alumnos ?? []);
      setTitle(d.actividad?.titulo ?? "Actividad");
      setDescription(d.actividad?.descripcion ?? "");
      setMaxGrade(Number(d.actividad?.puntaje_maximo ?? 20));
      setGraded(d.actividad?.calificada !== false);
      setRubrica(d.rubrica ?? null);
    } catch (e) { if (active) setError(e instanceof Error ? e.message : "Error al cargar."); }
    finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [courseId, activityId]);
  const submitted = students.filter(s => Boolean(s.entrega_id)).length;
  if (loading) return <div className="p-8">Cargando entregas...</div>;
  return <div className="min-h-screen px-3 py-4 lg:px-5"><div className="mx-auto max-w-[1080px]">
    <div className="mb-4"><Link href={`/docente/cursos/${courseId}`} className="rounded-md bg-[#3186d8] px-3 py-2 text-sm text-white">← Volver al curso</Link></div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-[#3186d8]">{title}</h1><p className="mt-2 text-sm text-gray-700">{description}</p>
        <RubricDetails rubrica={rubrica} courseId={courseId} contentId={activityId} />
        {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="my-4 flex gap-2 text-xs"><span className="rounded-full bg-green-100 px-3 py-1 text-green-800">{submitted} entregadas</span><span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{students.length-submitted} pendientes</span></div>
        <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Alumno</th><th className="p-3">Estado</th><th className="p-3">Documento</th><th className="p-3">Nota</th><th className="p-3">Acción</th></tr></thead>
          <tbody>{students.map(s => <tr key={s.matricula_id} className="border-t border-gray-200"><td className="p-3 font-medium text-gray-800">{s.alumno}</td><td className="p-3"><span className={`rounded px-2 py-1 text-xs ${s.entrega_id ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{s.estado ?? "Pendiente"}</span></td><td className="p-3">{s.nombre_archivo ?? "—"}</td><td className="p-3">{graded ? `${s.nota ?? "—"} / ${maxGrade}` : "Sin calificación"}</td><td className="p-3">{s.entrega_id ? <Link className="font-semibold text-blue-700 underline" href={`/docente/cursos/${courseId}/actividades/${activityId}/alumno/${s.alumno_id}`}>{graded ? "Revisar y calificar" : "Revisar entrega"}</Link> : <span className="text-gray-400">Pendiente</span>}</td></tr>)}</tbody>
        </table></div>
      </section>
      <aside className="rounded-xl bg-white p-5 shadow-sm"><h2 className="font-bold text-[#3186d8]">Resumen</h2><p className="mt-4 text-sm text-gray-700">Estudiantes matriculados: {students.length}</p><p className="mt-2 text-sm text-gray-700">Entregas recibidas: {submitted}</p><p className="mt-2 text-sm text-gray-700">Pendientes: {students.length-submitted}</p></aside>
    </div>
    <div className="mt-5 flex justify-between">{previousSectionHref ? <Link href={previousSectionHref} className="rounded border px-4 py-2">← Anterior</Link> : <span/>}{nextSectionHref ? <Link href={nextSectionHref} className="rounded bg-[#3186d8] px-4 py-2 text-white">Siguiente →</Link> : <span/>}</div>
  </div></div>;
}
