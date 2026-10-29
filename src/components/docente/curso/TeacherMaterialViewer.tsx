"use client";

import Link from "next/link";
import TeacherContentNavigation from "./TeacherContentNavigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import ContentViewer from "@/components/common/contenido/ContentViewer";
import type { ContentType } from "@/data/courseContents";

type Material = {
  id: string; titulo: string; tipo: string; orden: number;
  rutaArchivo: string | null; nombreArchivo: string | null; urlEnlace: string | null;
  numeroModulo: number; tituloModulo: string; numeroContenido: number;
};
type Module = { numero: number; titulo: string; contenidos: Omit<Material, "numeroModulo" | "tituloModulo" | "numeroContenido">[] };
const types: Record<string, ContentType> = { pdf: "pdf", pptx: "ppt", docx: "word", xls: "excel", xlsx: "excel", video: "video" };

function href(courseId: number, item: Material) {
  const path = item.tipo === "actividad" ? "actividades" : item.tipo === "evaluacion" ? "evaluaciones" : "contenido";
  return `/docente/cursos/${courseId}/${path}/${item.id}${item.tipo === "evaluacion" ? "/seguimiento" : ""}`;
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
    <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      <Link href={`/docente/cursos/${courseId}`} className="app-back-link">
          <span aria-hidden="true">{"<"}</span>

        Volver a cursos
      </Link>
      {data && <span className="min-w-0 text-[14px] text-talentia-primary">Módulo {data.content.numeroModulo}: {data.content.tituloModulo}{" > "}{data.content.numeroModulo}.{data.content.numeroContenido} {data.content.titulo}</span>}
    </div>
    {error ? <p role="alert" className="text-sm text-talentia-danger">{error}</p> : !data ? <p role="status">Cargando contenido...</p> : <>
      {data.content.tipo === "enlace" && data.content.urlEnlace ? <a href={data.content.urlEnlace} target="_blank" rel="noopener noreferrer" className="text-sm text-talentia-blue underline">{data.content.titulo}</a> :
        <ContentViewer title={data.content.titulo} type={types[data.content.tipo] ?? "pdf"} file={data.file} downloadName={data.content.nombreArchivo} />}
      <TeacherContentNavigation courseId={courseId} previousHref={data.previous} nextHref={data.next} />
    </>}
  </div></div>;
}
