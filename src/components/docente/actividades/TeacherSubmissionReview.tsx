"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Props = { courseId: number; activityId: number; studentId: number };
type Submission = {
  entrega_id: number | null; numero_intento: number | null; estado: string | null;
  entregada_en: string | null; comentario: string | null; nota: number | null;
  retroalimentacion: string | null; matricula_id: number; alumno_id: number;
  alumno: string; archivo_id: number | null; nombre_archivo: string | null;
  tamano_bytes: number | null;
};
export default function TeacherSubmissionReview({ courseId, activityId, studentId }: Props) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [maxGrade, setMaxGrade] = useState(20);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try {
      const r = await fetch(`${API_URL}/actividades/docente/${courseId}/${activityId}/alumno/${studentId}`, { credentials: "include", cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "No se pudo cargar la entrega.");
      setSubmission(d.entrega);
      setMaxGrade(Number(d.actividad?.puntaje_maximo ?? 20));
      setGrade(d.entrega?.nota == null ? "" : String(d.entrega.nota));
      setFeedback(d.entrega?.retroalimentacion ?? "");
    } catch (e) { setError(e instanceof Error ? e.message : "Error al cargar la entrega."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [courseId, activityId, studentId]);
  async function save() {
    if (!submission?.entrega_id) return;
    const n = Number(grade);
    if (grade.trim() === "" || !Number.isFinite(n) || n < 0 || n > maxGrade) {
      setError(`Introduce una nota entre 0 y ${maxGrade}.`); return;
    }
    setSaving(true); setError(""); setMessage("");
    try {
      const r = await fetch(`${API_URL}/actividades/docente/${courseId}/${activityId}/entregas/${submission.entrega_id}/calificacion`, {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota: n, retroalimentacion: feedback }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "No se pudo guardar la calificación.");
      setMessage("Calificación guardada correctamente.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error guardando la nota."); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="p-8">Cargando entrega...</div>;
  if (!submission) return <div className="p-8">No se encontró la entrega.</div>;
  return <div className="min-h-screen px-3 py-4 lg:px-5"><div className="mx-auto max-w-[1080px]">
    <Link href={`/docente/cursos/${courseId}/actividades/${activityId}`} className="mb-4 inline-block rounded bg-[#3186d8] px-3 py-2 text-sm text-white">← Volver a entregas</Link>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-xl bg-white p-6 shadow-sm"><h1 className="text-xl font-bold text-[#3186d8]">{submission.alumno}</h1><p className="mt-2 text-sm text-gray-500">Intento {submission.numero_intento} · {submission.entregada_en ? new Date(submission.entregada_en).toLocaleString("es-PE") : ""}</p>
        <h2 className="mt-6 font-semibold text-gray-800">Documento entregado</h2>
        {submission.nombre_archivo && submission.archivo_id ? <a href={`${API_URL}/actividades/archivo/${submission.archivo_id}`} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded border border-blue-300 px-4 py-3 text-sm text-blue-700 underline">Descargar {submission.nombre_archivo}</a> : <p className="mt-2 text-sm text-gray-500">El estudiante no adjuntó un archivo.</p>}
        {submission.comentario && <><h2 className="mt-6 font-semibold text-gray-800">Comentario del estudiante</h2><p className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-700">{submission.comentario}</p></>}
      </section>
      <aside className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-[#3186d8]">Calificar entrega</h2>
        {error && <p role="alert" className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mt-3 rounded bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        <label className="mt-4 block text-sm font-medium text-gray-700">Nota (máximo {maxGrade})</label><input type="number" min={0} max={maxGrade} step="0.1" value={grade} onChange={e=>setGrade(e.target.value)} className="mt-2 w-full rounded border border-gray-300 p-2 text-gray-800"/>
        <label className="mt-4 block text-sm font-medium text-gray-700">Retroalimentación</label><textarea rows={5} maxLength={5000} value={feedback} onChange={e=>setFeedback(e.target.value)} className="mt-2 w-full rounded border border-gray-300 p-3 text-sm text-gray-800" placeholder="Comentarios para el estudiante"/>
        <button disabled={saving} onClick={save} className="mt-4 w-full rounded bg-[#3186d8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar calificación"}</button>
      </aside>
    </div>
  </div></div>;
}
