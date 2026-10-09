"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import ContentViewer from "@/components/common/contenido/ContentViewer";
import type { ContentType } from "@/data/courseContents";

type Material = {
  id: string; titulo: string; tipo: string; orden: number;
  rutaArchivo: string | null; urlEnlace: string | null;
  numeroModulo: number; tituloModulo: string; numeroContenido: number;
};
type Module = { numero: number; titulo: string; contenidos: Omit<Material, "numeroModulo" | "tituloModulo" | "numeroContenido">[] };
const types: Record<string, ContentType> = { pdf: "pdf", pptx: "ppt", docx: "word", video: "video" };

function href(courseId: number, item: Material) {
  const path = item.tipo === "actividad" ? "actividades" : item.tipo === "evaluacion" ? "evaluaciones" : "contenido";
  return `/docente/cursos/${courseId}/${path}/${item.id}`;
}

export default function TeacherMaterialViewer({ courseId, contentId }: { courseId: number; contentId: number }) {
  const [data, setData] = useState<{ content: Material; file?: string; previous?: string; next?: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let file = "";
    async function load() {
      try {
        const options = { credentials: "include" as const, signal: controller.signal };
        const response = await fetch(`${API_URL}/cursos/${courseId}/modulos`, options);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? "No se pudo cargar el contenido.");
        const materials: Material[] = (result.modulos as Module[]).flatMap(module => [...module.contenidos].sort((a, b) => a.orden - b.orden).map((item, index) => ({
          ...item, numeroModulo: module.numero, tituloModulo: module.titulo, numeroContenido: index + 1,
        })));
        const content = materials.find(item => Number(item.id) === contentId);
        if (!content) throw new Error("Este contenido no pertenece al curso o no está disponible.");
        const navigation = materials.filter(item => item.tipo !== "enlace");
        const index = navigation.findIndex(item => Number(item.id) === contentId);
        if (content.rutaArchivo && types[content.tipo]) {
          const responseFile = await fetch(`${API_URL}/cursos/${courseId}/contenidos/${contentId}/archivo`, options);
          if (!responseFile.ok) throw new Error("No se pudo abrir el archivo asociado a este contenido.");
          const blob = await responseFile.blob();
          if (controller.signal.aborted) return;
          file = URL.createObjectURL(blob);
        }
        if (!controller.signal.aborted) setData({ content, file: file || undefined,
          previous: index > 0 ? href(courseId, navigation[index - 1]) : undefined,
          next: index >= 0 && index < navigation.length - 1 ? href(courseId, navigation[index + 1]) : undefined });
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "No se pudo cargar el contenido.");
      }
    }
    void load();
    return () => { controller.abort(); if (file) URL.revokeObjectURL(file); };
  }, [courseId, contentId]);

  return <div className="min-h-screen px-4 py-4 lg:px-5"><div className="mx-auto max-w-[1000px]">
    <div className="mb-3 flex min-w-0 items-center gap-3">
      <Link href={`/docente/cursos/${courseId}`} className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-gray-700 transition hover:text-[#3186d8]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        Volver a cursos
      </Link>
      {data && <span className="min-w-0 truncate text-[11px] text-gray-700">Módulo {data.content.numeroModulo}: {data.content.tituloModulo}{" > "}{data.content.numeroModulo}.{data.content.numeroContenido} {data.content.titulo}</span>}
    </div>
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : !data ? <p role="status">Cargando contenido...</p> : <>
      {data.content.tipo === "enlace" && data.content.urlEnlace ? <a href={data.content.urlEnlace} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3186d8] underline">{data.content.titulo}</a> :
        <ContentViewer title={data.content.titulo} type={types[data.content.tipo] ?? "pdf"} file={data.file} />}
      <div className="mt-5 flex items-center justify-between gap-4">
        {data.previous ? <Link href={data.previous} className="rounded border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">Anterior</Link> : <span />}
        {data.next ? <Link href={data.next} className="rounded bg-[#3186d8] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#2777c1]">Siguiente</Link> : <span />}
      </div>
    </>}
  </div></div>;
}
