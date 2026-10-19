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
};

export default function ContentViewer({
  title,
  type,
  file,
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