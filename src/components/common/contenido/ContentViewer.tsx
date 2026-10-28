"use client";

import dynamic from "next/dynamic";
import type { ContentType } from "@/data/courseContents";
import ViewerToolbar from "./ViewerToolbar";

const PdfViewer = dynamic(
  () => import("./PdfViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-talentia-border text-talentia-primary">
        Cargando visor PDF...
      </div>
    ),
  }
);

const PptViewer = dynamic(
  () => import("./PptViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-talentia-border text-talentia-primary">
        Cargando presentación...
      </div>
    ),
  }
);

const DocxViewer = dynamic(
  () => import("./DocxViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-talentia-border text-talentia-primary">
        Cargando documento...
      </div>
    ),
  }
);

type ContentViewerProps = {
  title: string;
  type: ContentType;
  file?: string;
  downloadName?: string | null;
};

export default function ContentViewer({
  title,
  type,
  file,
  downloadName,
}: ContentViewerProps) {
  if (!file) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-talentia-border text-talentia-primary">
        Este contenido no tiene un archivo asociado.
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <PdfViewer
        title={title}
        file={file}
      />
    );
  }

  if (type === "ppt") {
    return (
      <PptViewer
        title={title}
        file={file}
      />
    );
  }

  if (type === "word") {
    return (
      <DocxViewer
        title={title}
        file={file}
      />
    );
  }

  
  if (type === "excel") {
    return (
      <div className="w-full">
        <ViewerToolbar title={title} type="excel" file={file} downloadName={downloadName} />
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 bg-talentia-border px-6 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#e1f5e8]">
            <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
              <path d="M21 4h17l7 7v32H21z" fill="#e8f5e9" stroke="#107c41" strokeWidth="1.5" />
              <path d="M38 4v7h7" fill="#c8e6c9" stroke="#107c41" strokeWidth="1.5" />
              <path d="M4 13h24v26H4z" fill="#107c41" />
              <path d="M9 19h4l3 5 3-5h4l-5 7 5 7h-4l-3-5-3 5H9l5-7z" fill="#fff" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-talentia-primary">Hoja de cálculo lista para descargar</p>
          <p className="max-w-md text-sm text-talentia-muted">Descarga el archivo para abrirlo con Excel u otra aplicación compatible. La plataforma no muestra una vista previa de hojas de cálculo.</p>
        </div>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="w-full">
        <ViewerToolbar
          title={title}
          type="video"
          file={file}
        />

        <div className="bg-talentia-border p-7">
          <video
            controls
            preload="metadata"
            className="mx-auto max-h-[560px] w-full max-w-[900px] bg-black"
          >
            <source src={file} />
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[500px] items-center justify-center bg-talentia-border text-talentia-primary">
      No hay un visor disponible para este contenido.
    </div>
  );
}